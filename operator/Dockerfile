FROM node:20-slim

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./
COPY contract/package.json contract/
COPY api/package.json api/
COPY cli/package.json cli/
COPY operator/package.json operator/

# Install dependencies
RUN npm install --workspaces --include-workspace-root

# Copy source files
COPY tsconfig.json ./
COPY contract/ contract/
COPY api/ api/
COPY cli/ cli/
COPY operator/ operator/

# Build all workspaces
RUN npm run build

# Set environment defaults
ENV NODE_ENV=production
ENV HEALTH_PORT=8080
ENV POLL_INTERVAL_MS=6000
ENV LOG_LEVEL=info
ENV MAX_CONSECUTIVE_ERRORS=10

EXPOSE 8080

CMD ["node", "operator/dist/index.js"]
