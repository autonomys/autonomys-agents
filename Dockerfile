# Stage 1: Build stage
FROM node:20.18.1 AS builder

WORKDIR /app

# Install dependencies for build
RUN apt-get update && apt-get install -y \
    python3 make g++ git jq curl \
    libc6-dev libx11-dev libnss3-dev libglib2.0-dev libasound2-dev libxi-dev libxtst-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json yarn.lock ./

# RUN jq '.dependencies["@roamhq/wrtc"] = "npm:@roamhq/wrtc-linux-arm64"' package.json > package.json.tmp && \
#     mv package.json.tmp package.json

# Install dependencies
RUN yarn install

# Copy and build source
COPY tsconfig.json tsconfig.node.json ./
COPY src ./src
COPY scripts ./scripts
COPY characters ./characters
COPY certs ./certs

RUN yarn build

# Stage 2: Production stage
FROM node:20.18.1

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl jq \
    libc6 libx11-6 libnss3 libglib2.0-0 libasound2 libxi6 libxtst6 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json yarn.lock ./

# RUN jq '.dependencies["@roamhq/wrtc"] = "npm:@roamhq/wrtc-linux-arm64"' package.json > package.json.tmp && \
#     mv package.json.tmp package.json
# Install only production deps
RUN yarn install

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/characters ./characters
COPY --from=builder /app/certs ./certs

# Create directories
RUN mkdir -p logs .cookies && \
    chmod -R 755 ./dist && \
    chown -R node:node /app

USER node

VOLUME ["/app/characters", "/app/logs", "/app/.cookies"]

CMD ["node", "dist/index.js"]

EXPOSE 3010
