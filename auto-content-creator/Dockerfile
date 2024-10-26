# Base stage for all services
FROM node:20-alpine as base
WORKDIR /app
COPY package.json yarn.lock ./
COPY agents/package.json ./agents/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN yarn install --frozen-lockfile

# Agents build stage
FROM base as agents-build
COPY agents ./agents
COPY tsconfig.base.json ./
RUN yarn workspace @auto-content/agents build

# Backend build stage
FROM base as backend-build
COPY backend ./backend
COPY tsconfig.base.json ./
RUN yarn workspace @auto-content/backend build

# Frontend build stage
FROM base as frontend-build
COPY frontend ./frontend
COPY tsconfig.base.json ./
RUN yarn workspace @auto-content/frontend build

# Agents production stage
FROM node:20-alpine as agents
WORKDIR /app
COPY --from=agents-build /app/agents/dist ./dist
COPY --from=agents-build /app/agents/package.json ./
COPY --from=base /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]

# Backend production stage
FROM node:20-alpine as backend
WORKDIR /app
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/package.json ./
COPY --from=base /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]

# Frontend production stage
FROM node:20-alpine as frontend
WORKDIR /app
COPY --from=frontend-build /app/frontend/dist ./dist
COPY --from=frontend-build /app/frontend/package.json ./
COPY --from=base /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
