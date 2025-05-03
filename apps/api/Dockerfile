FROM node:20-alpine

WORKDIR /app

# Install global dependencies and pnpm
RUN npm install -g typescript prisma pnpm@10.4.1

# Copy package.json files for workspace setup
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/schemas/package.json ./packages/schemas/
COPY apps/api/package.json ./apps/api/

# Install dependencies using pnpm with workspace support
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/schemas ./packages/schemas/
COPY apps/api ./apps/api/

# Build the TypeScript code
WORKDIR /app/packages/schemas
RUN pnpm build

WORKDIR /app/apps/api
# Generate Prisma client
RUN npx prisma generate
# Build TypeScript
RUN pnpm build

# Expose the port
EXPOSE 3003

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3003

# Start the application using the compiled JavaScript
CMD ["node", "dist/index.js"]
