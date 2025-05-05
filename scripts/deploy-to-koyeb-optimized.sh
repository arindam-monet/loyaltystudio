#!/bin/bash

# Exit on error
set -e

echo "Deploying API to Koyeb using optimized Dockerfile..."

# Check if Koyeb CLI is installed
if ! command -v koyeb &> /dev/null; then
    echo "Koyeb CLI not found. Installing..."
    curl -fsSL https://cli.koyeb.com/install.sh | sh
fi

# Ensure we're logged in
echo "Checking Koyeb login status..."
koyeb whoami || (echo "Please login to Koyeb first with: koyeb login" && exit 1)

# Deploy to Koyeb
echo "Deploying to Koyeb..."
koyeb app create loyaltystudio-api

# Create a service using the optimized Dockerfile
koyeb service create \
  --app loyaltystudio-api \
  --name api \
  --type web \
  --ports 3003:http \
  --routes /:3003 \
  --docker . \
  --dockerfile apps/api/Dockerfile.optimized \
  --env NODE_ENV=production \
  --env PORT=3003 \
  --env DATABASE_URL=$DATABASE_URL \
  --env DIRECT_URL=$DIRECT_URL \
  --env SUPABASE_URL=$SUPABASE_URL \
  --env SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY \
  --env SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  --env CORS_ORIGIN=$CORS_ORIGIN

echo "Deployment initiated. Check the Koyeb dashboard for status."
echo "You can monitor the deployment with: koyeb service get api -a loyaltystudio-api"
