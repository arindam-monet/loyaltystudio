FROM node:20-alpine

WORKDIR /app

# Copy package.json files for workspace setup
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/schemas/package.json ./packages/schemas/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/schemas ./packages/schemas/
COPY apps/api ./apps/api/

# Generate Prisma client
WORKDIR /app/apps/api
RUN pnpm prisma generate

# Build the application
RUN pnpm build

# Expose the port
EXPOSE 3003

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3003

# Start the application
CMD ["node", "dist/index.js"]
