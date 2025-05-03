FROM node:20-alpine

WORKDIR /app

# Install global dependencies and pnpm
RUN npm install -g typescript prisma ts-node pnpm@10.4.1

# Copy package.json files for workspace setup
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/schemas/package.json ./packages/schemas/
COPY apps/api/package.json ./apps/api/

# Install dependencies using pnpm with workspace support
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/schemas ./packages/schemas/
COPY apps/api ./apps/api/

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Expose the port
EXPOSE 3003

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3003
ENV TS_NODE_TRANSPILE_ONLY=true
ENV TS_NODE_PROJECT=tsconfig.json

# Start the application directly with ts-node (skipping TypeScript checks)
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]
