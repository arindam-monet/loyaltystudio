#!/bin/bash

# Exit on error
set -e

# Function to check if an environment variable is set
check_env_var() {
  local var_name=$1
  if [ -z "${!var_name}" ]; then
    echo "❌ Error: $var_name is not set. Please set this environment variable before deploying."
    exit 1
  else
    echo "✅ $var_name is set."
  fi
}

# Check required environment variables
echo "Checking required environment variables..."
check_env_var "DATABASE_URL"
check_env_var "DIRECT_URL"
check_env_var "SUPABASE_URL"
check_env_var "SUPABASE_SERVICE_KEY"
check_env_var "SUPABASE_ANON_KEY"
check_env_var "CORS_ORIGIN"
check_env_var "REDIS_URL"

# Set default values for optional variables if not set
if [ -z "$REDIS_PASSWORD" ]; then
  echo "⚠️ Warning: REDIS_PASSWORD is not set. This might cause issues if using Upstash Redis."
fi

if [ -z "$REDIS_TLS" ]; then
  echo "⚠️ Warning: REDIS_TLS is not set. Setting to 'true' for production deployment."
  REDIS_TLS="true"
fi

if [ -z "$API_HOST" ]; then
  echo "⚠️ Warning: API_HOST is not set. Setting to '0.0.0.0'."
  API_HOST="0.0.0.0"
fi

if [ -z "$API_URL" ]; then
  echo "⚠️ Warning: API_URL is not set. Please set this to your public API URL."
  API_URL="https://api.loyaltystudio.ai"
fi

# Check if Koyeb CLI is installed
if ! command -v koyeb &> /dev/null; then
    echo "Koyeb CLI not found. Installing..."
    curl -fsSL https://cli.koyeb.com/install.sh | sh
fi

# Check if user is logged in to Koyeb
echo "Checking Koyeb login status..."
if ! koyeb whoami &> /dev/null; then
  echo "❌ Error: Not logged in to Koyeb. Please run 'koyeb login' first."
  exit 1
fi

# Deploy to Koyeb
echo "Deploying to Koyeb..."
koyeb app create loyaltystudio-api || echo "App already exists, continuing..."

# Create a service using the simplified Dockerfile
echo "Creating Koyeb service..."
koyeb service create \
  --app loyaltystudio-api \
  --name api \
  --type web \
  --ports 3003:http \
  --routes /:3003 \
  --docker . \
  --dockerfile apps/api/Dockerfile.koyeb \
  --env NODE_ENV=production \
  --env PORT=3003 \
  --env API_HOST=$API_HOST \
  --env API_URL=$API_URL \
  --env DATABASE_URL=$DATABASE_URL \
  --env DIRECT_URL=$DIRECT_URL \
  --env SUPABASE_URL=$SUPABASE_URL \
  --env SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY \
  --env SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  --env CORS_ORIGIN=$CORS_ORIGIN \
  --env REDIS_URL=$REDIS_URL \
  --env REDIS_PASSWORD=$REDIS_PASSWORD \
  --env REDIS_TLS=$REDIS_TLS \
  --env LOG_LEVEL=info

echo "✅ Deployment initiated. Check the Koyeb dashboard for status."
echo "You can monitor the deployment with: koyeb service get api -a loyaltystudio-api"
