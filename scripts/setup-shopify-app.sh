#!/bin/bash

# Navigate to the Shopify app directory
cd apps/shopify-integration/monet-loyalty-studio

# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Apply migrations
pnpm prisma migrate deploy

# Start the app in development mode
pnpm dev
