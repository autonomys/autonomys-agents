# Build stage
FROM node:20-alpine as builder

# Set working directory for the workspace root
WORKDIR /workspace

# Enable Corepack to manage Yarn
RUN corepack enable

# Set Yarn configuration
RUN yarn config set enableGlobalCache true
RUN yarn config set nodeLinker node-modules

# Copy workspace files
COPY package.json yarn.lock ./
COPY web-cli/package.json ./web-cli/

# Install dependencies for the workspace
RUN YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install

# Copy web-cli source code
COPY web-cli ./web-cli

# Build the application
WORKDIR /workspace/web-cli
ENV DISABLE_ESLINT_PLUGIN=true
RUN yarn build

# Production stage - using the same node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install serve globally
RUN yarn global add serve

# Copy built assets from builder stage
COPY --from=builder /workspace/web-cli/build ./build

# Copy and set up entrypoint
COPY docker/web-cli/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose default port (will be overridden by PORT env var)
EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
# CMD is now executed by the entrypoint script 