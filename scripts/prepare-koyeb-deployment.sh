#!/bin/bash

# Exit on error
set -e

# Create a deployment branch
git checkout -b koyeb-deployment

# Build the API
echo "Building the API..."
cd apps/api
pnpm install
pnpm prisma generate
pnpm build

# Create a simplified Dockerfile for Koyeb
cat > Dockerfile << EOF
FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install --production

# Copy application files
COPY dist ./dist
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Expose the port
EXPOSE 3003

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3003

# Start the application
CMD ["node", "dist/index.js"]
EOF

# Create a .dockerignore file
cat > .dockerignore << EOF
node_modules
npm-debug.log
.env
.env.*
!.env.production
EOF

# Commit changes
git add .
git commit -m "Prepare for Koyeb deployment"

# Push to GitHub
git push origin koyeb-deployment

echo "Deployment branch created and pushed to GitHub."
echo "Now go to Koyeb and deploy using the 'koyeb-deployment' branch."
