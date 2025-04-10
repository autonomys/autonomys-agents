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

# Install dependencies
RUN yarn install

# Build the project using the workspace setup
RUN yarn workspace autonomys-agents-core build

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

# Copy built files and scripts - ONLY CODE
COPY --from=builder /app/dist ./dist
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

# Create mount points for credentials and data
RUN mkdir -p logs .cookies && \
    mkdir -p ./characters/${CHARACTER_NAME}/config ./characters/${CHARACTER_NAME}/data ./characters/${CHARACTER_NAME}/logs ./characters/${CHARACTER_NAME}/memories && \
    mkdir -p ./certs && \
    chmod 700 ./.cookies && \
    chmod -R 750 ./characters && \
    chmod 755 ./dist && \
    chmod 750 ./logs && \
    chmod 755 ./certs

# Set initial ownership of mount points
RUN chown -R autonomys:autonomys ./.cookies && \
    chown -R autonomys:autonomys ./characters && \
    chown -R autonomys:autonomys ./logs && \
    chown -R autonomys:autonomys ./certs

# Create startup script with modified permissions handling to respect mounted volumes
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'CHARACTER_NAME=${CHARACTER_NAME:-test}' >> /app/start.sh && \
    echo 'echo "Starting agent with character: $CHARACTER_NAME"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Fix any remaining line ending issues in the .env file' >> /app/start.sh && \
    echo 'if [ -f /app/characters/$CHARACTER_NAME/config/.env ]; then' >> /app/start.sh && \
    echo '  sed -i "s/\r$//" /app/characters/$CHARACTER_NAME/config/.env' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Load the character configuration' >> /app/start.sh && \
    echo 'if [ -f /app/characters/$CHARACTER_NAME/config/.env ]; then' >> /app/start.sh && \
    echo '  set -a' >> /app/start.sh && \
    echo '  . /app/characters/$CHARACTER_NAME/config/.env' >> /app/start.sh && \
    echo '  set +a' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Ensure directories exist but dont modify permissions of mounted volumes' >> /app/start.sh && \
    echo 'mkdir -p /app/characters/$CHARACTER_NAME/logs' >> /app/start.sh && \
    echo 'mkdir -p /app/characters/$CHARACTER_NAME/data' >> /app/start.sh && \
    echo 'mkdir -p /app/characters/$CHARACTER_NAME/memories' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start the application as non-root user' >> /app/start.sh && \
    echo 'exec su -c "node dist/src/index.js $CHARACTER_NAME" autonomys' >> /app/start.sh && \
    chmod +x /app/start.sh

ENTRYPOINT ["/app/start.sh"]

EXPOSE ${API_PORT:-3010}