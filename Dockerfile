# Stage 1: Build stage
FROM node:20.18.1 AS builder

# Add the build argument at the top
ARG CHARACTER_NAME=character.example

WORKDIR /app

# Install dependencies for build
RUN apt-get update && apt-get install -y \
    python3 make g++ git jq curl openssl \
    libc6-dev libx11-dev libnss3-dev libglib2.0-dev libasound2-dev libxi-dev libxtst-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy and build source
COPY tsconfig.json tsconfig.node.json ./
COPY src ./src
COPY scripts ./scripts
# Only copy the specific character folder
COPY characters/${CHARACTER_NAME} ./characters/${CHARACTER_NAME}
COPY certs ./certs

# Generate certificates if they don't exist
RUN mkdir -p certs && \
    if [ ! -f certs/server.cert ] || [ ! -f certs/server.key ]; then \
      echo "Generating self-signed certificates..." && \
      openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
      -keyout certs/server.key -out certs/server.cert -days 365; \
    fi

RUN yarn build

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

# Copy package files
COPY package.json yarn.lock ./

# Install only production deps
RUN yarn install

# Copy built files
COPY --from=builder /app/dist ./dist
# Only copy the specific character folder from builder
COPY --from=builder /app/characters/${CHARACTER_NAME} ./characters/${CHARACTER_NAME}
COPY --from=builder /app/certs ./certs
COPY --from=builder /app/scripts ./scripts

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

# Create startup script with security enhancements
RUN echo '#!/bin/sh\n\
CHARACTER_NAME=${CHARACTER_NAME:-test}\n\
echo "Starting agent with character: $CHARACTER_NAME"\n\
\n\
# Load the character configuration\n\
if [ -f /app/characters/$CHARACTER_NAME/config/.env ]; then\n\
  export $(grep -v "^#" /app/characters/$CHARACTER_NAME/config/.env | xargs -0)\n\
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
exec su -c "node dist/index.js $CHARACTER_NAME" autonomys\n\
' > /app/start.sh && chmod +x /app/start.sh

ENTRYPOINT ["/app/start.sh"]

EXPOSE ${API_PORT:-3010}