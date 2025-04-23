#!/bin/bash

# Exit on error
set -e

echo "Building API for production..."

# Navigate to the API directory
cd apps/api

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Generate Prisma client
echo "Generating Prisma client..."
pnpm prisma generate

# Build the application
echo "Building TypeScript code..."
pnpm build

# Create a dist directory for deployment
echo "Creating deployment package..."
mkdir -p deploy

# Copy necessary files to the deployment directory
cp -r dist deploy/
cp -r prisma deploy/
cp package.json deploy/
cp .env.production deploy/.env

echo "API build completed successfully!"
echo "The deployment package is available in apps/api/deploy/"
