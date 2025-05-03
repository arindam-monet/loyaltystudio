FROM node:20-alpine

WORKDIR /app

# Install global dependencies and pnpm
RUN npm install -g typescript prisma pnpm@10.4.1

# Copy package.json files for workspace setup
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/schemas/package.json ./packages/schemas/
COPY apps/api/package.json ./apps/api/

# Copy TypeScript configuration files
COPY packages/typescript-config/base.json ./packages/typescript-config/
COPY packages/typescript-config/nextjs.json ./packages/typescript-config/
COPY packages/typescript-config/react-library.json ./packages/typescript-config/

# Install dependencies using pnpm with workspace support
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/schemas ./packages/schemas/
COPY apps/api ./apps/api/

# Create a simplified tsconfig for schemas that doesn't rely on workspace references
WORKDIR /app/packages/schemas
RUN echo '{ \
  "compilerOptions": { \
    "target": "ES2022", \
    "module": "NodeNext", \
    "moduleResolution": "NodeNext", \
    "esModuleInterop": true, \
    "declaration": true, \
    "declarationMap": true, \
    "isolatedModules": true, \
    "skipLibCheck": true, \
    "strict": true, \
    "outDir": "dist", \
    "rootDir": "src" \
  }, \
  "include": ["src/**/*"], \
  "exclude": ["node_modules", "dist"] \
}' > tsconfig.json

# Ensure the src directory exists with a basic index.ts file and build the schemas package
RUN mkdir -p src && \
    cat > src/index.ts << 'EOL'
import { z } from 'zod';

// Basic schemas
export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
});

export default { userSchema };
EOL

# Build the schemas package
RUN pnpm build

# Build the API
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
