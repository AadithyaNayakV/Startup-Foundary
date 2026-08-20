# ==============================================================================
# Startup Foundry Frontend Dockerfile (Next.js 14 App Router)
# ==============================================================================

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Enable telemetry opt-out
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package manifests and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code
COPY . .

# Expose Next.js server port
EXPOSE 3000

# Default development command (supports hot-reloading with volume mounts)
# For production build container: RUN npm run build && CMD ["npm", "start"]
CMD ["npm", "run", "dev"]
