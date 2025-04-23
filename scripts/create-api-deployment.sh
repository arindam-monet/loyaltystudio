#!/bin/bash

# Exit on error
set -e

# Create a deployment directory
echo "Creating deployment directory..."
mkdir -p deploy/api

# Build the API
echo "Building the API..."
cd apps/api
pnpm install
pnpm prisma generate
pnpm build

# Copy necessary files to the deployment directory
echo "Copying files to deployment directory..."
cp -r dist ../../deploy/api/
cp -r prisma ../../deploy/api/
cp package.json ../../deploy/api/
cp .env.production ../../deploy/api/.env

# Create a simplified Dockerfile for Koyeb
cat > ../../deploy/api/Dockerfile << EOF
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
cat > ../../deploy/api/.dockerignore << EOF
node_modules
npm-debug.log
EOF

echo "Deployment package created in deploy/api/"
echo "You can now deploy this directory to Koyeb using the Koyeb CLI or web interface."
