#!/bin/bash

# Exit on error
set -e

# Build the API
echo "Building the API..."
./scripts/build-api.sh

# Check if Koyeb CLI is installed
if ! command -v koyeb &> /dev/null; then
    echo "Koyeb CLI not found. Installing..."
    curl -fsSL https://cli.koyeb.com/install.sh | sh
fi

# Deploy to Koyeb
echo "Deploying to Koyeb..."
koyeb app create loyaltystudio-api

# Create a service using the Dockerfile
koyeb service create \
  --app loyaltystudio-api \
  --name api \
  --type web \
  --ports 3003:http \
  --routes /:3003 \
  --docker . \
  --dockerfile apps/api/Dockerfile \
  --env NODE_ENV=production \
  --env PORT=3003 \
  --env DATABASE_URL=$DATABASE_URL \
  --env DIRECT_URL=$DIRECT_URL \
  --env SUPABASE_URL=$SUPABASE_URL \
  --env SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY \
  --env SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  --env CORS_ORIGIN=$CORS_ORIGIN \
  --env REDIS_URL=$REDIS_URL \
  --env REDIS_PASSWORD=$REDIS_PASSWORD \
  --env REDIS_TLS=true

echo "Deployment initiated. Check the Koyeb dashboard for status."
