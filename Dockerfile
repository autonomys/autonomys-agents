# Stage 1: Build stage
FROM node:20.18.1 AS builder

# The CHARACTER_NAME environment variable is automatically configured during the build process.
# No manual changes are needed - the Docker Compose file will set this correctly for each character instance.
ARG CHARACTER_NAME=character.example

WORKDIR /app

# Install dependencies for build
RUN apt-get update && apt-get install -y \
    python3 make g++ git jq curl openssl \
    libc6-dev libx11-dev libnss3-dev libglib2.0-dev libasound2-dev libxi-dev libxtst-dev \
    && rm -rf /var/lib/apt/lists/*

# Enable corepack for proper Yarn version management
RUN corepack enable

# Copy workspace and package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY tsconfig.json ./
COPY core ./core
COPY scripts ./scripts
# Only copy the specific character folder
COPY characters/${CHARACTER_NAME} ./characters/${CHARACTER_NAME}
COPY certs ./certs

# Install dependencies
RUN yarn install

# Fix line endings for .env files to ensure compatibility across operating systems
RUN find ./characters -name "*.env" -type f -exec sed -i 's/\r$//' {} \; || true

# Generate certificates if they don't exist
RUN mkdir -p certs && \
    if [ ! -f certs/server.cert ] || [ ! -f certs/server.key ]; then \
      echo "Generating self-signed certificates..." && \
      openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
      -keyout certs/server.key -out certs/server.cert -days 365; \
    fi

# Build the project using the workspace setup
RUN yarn workspace @autonomys/agent-core build

# Stage 2: Production stage
FROM node:20.18.1

# Make the build arg available in this stage too
ARG CHARACTER_NAME=character.example

WORKDIR /app

# Create a non-root user to run the application
RUN groupadd -r autonomys && useradd -r -g autonomys -m -d /home/autonomys autonomys

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl jq openssl \
    libc6 libx11-6 libnss3 libglib2.0-0 libasound2 libxi6 libxtst6 \
    && rm -rf /var/lib/apt/lists/*

# Enable corepack for proper Yarn version management
RUN corepack enable

# Copy built files from the root-level dist directory
COPY --from=builder /app/dist ./dist
# Only copy the specific character folder from builder
COPY --from=builder /app/characters/${CHARACTER_NAME} ./characters/${CHARACTER_NAME}
COPY --from=builder /app/certs ./certs
COPY --from=builder /app/scripts ./scripts

# Copy yarn configuration and install dependencies in dist directory
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY --from=builder /app/core/package.json ./dist/package.json
WORKDIR /app/dist
# Create an empty yarn.lock file to mark this as a separate project
RUN touch yarn.lock
# Install dependencies
RUN yarn install
WORKDIR /app

# Fix line endings again to ensure compatibility (in case any changes happened during build)
RUN find ./characters -name "*.env" -type f -exec sed -i 's/\r$//' {} \; || true

# Create directories with secure permissions
RUN mkdir -p logs .cookies && \
    find ./characters -type d -mindepth 1 -maxdepth 1 -exec mkdir -p {}/data {}/logs {}/memories \; && \
    chmod 700 ./.cookies && \
    chmod -R 750 ./characters && \
    chmod -R 755 ./dist && \
    chmod 750 ./logs && \
    chmod 644 ./certs/server.cert && \
    chmod 644 ./certs/server.key

# Set ownership of sensitive directories
RUN chown -R autonomys:autonomys ./.cookies && \
    chown -R autonomys:autonomys ./characters && \
    chown -R autonomys:autonomys ./logs && \
    chown -R autonomys:autonomys ./certs

# Create startup script with security enhancements and improved .env handling
RUN echo '#!/bin/sh\n\
CHARACTER_NAME=${CHARACTER_NAME:-test}\n\
echo "Starting agent with character: $CHARACTER_NAME"\n\
\n\
# Fix any remaining line ending issues in the .env file\n\
if [ -f /app/characters/$CHARACTER_NAME/config/.env ]; then\n\
  sed -i "s/\\r$//" /app/characters/$CHARACTER_NAME/config/.env\n\
fi\n\
\n\
# Load the character configuration\n\
if [ -f /app/characters/$CHARACTER_NAME/config/.env ]; then\n\
  set -a\n\
  . /app/characters/$CHARACTER_NAME/config/.env\n\
  set +a\n\
fi\n\
\n\
# Ensure character directories exist and are properly secured\n\
mkdir -p /app/characters/$CHARACTER_NAME/logs\n\
mkdir -p /app/characters/$CHARACTER_NAME/data\n\
mkdir -p /app/characters/$CHARACTER_NAME/memories\n\
chmod -R 750 /app/characters/$CHARACTER_NAME\n\
chown -R autonomys:autonomys /app/characters/$CHARACTER_NAME\n\
\n\
# Start the application as non-root user\n\
exec su -c "node dist/src/index.js $CHARACTER_NAME" autonomys\n\
' > /app/start.sh && chmod +x /app/start.sh

ENTRYPOINT ["/app/start.sh"]

EXPOSE ${API_PORT:-3010}