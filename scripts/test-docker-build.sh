#!/bin/bash

# Exit on error
set -e

echo "Testing optimized Docker build for API..."

# Navigate to the project root
cd "$(dirname "$0")/.."

# Build the Docker image using the optimized Dockerfile
echo "Building Docker image..."
docker build -t loyaltystudio-api:test -f apps/api/Dockerfile.optimized .

# Create a test container
echo "Creating test container..."
docker run --name loyaltystudio-api-test -d -p 3003:3003 \
  -e NODE_ENV=production \
  -e PORT=3003 \
  -e DATABASE_URL="postgresql://user:password@host.docker.internal:5432/loyaltystudio" \
  -e DIRECT_URL="postgresql://user:password@host.docker.internal:5432/loyaltystudio" \
  -e SUPABASE_URL="your-supabase-url" \
  -e SUPABASE_SERVICE_KEY="your-supabase-service-key" \
  -e SUPABASE_ANON_KEY="your-supabase-anon-key" \
  -e CORS_ORIGIN="*" \
  loyaltystudio-api:test

echo "Test container started. Checking logs..."
docker logs loyaltystudio-api-test

echo "Container is running. You can access the API at http://localhost:3003"
echo "To check the health endpoint, run: curl http://localhost:3003/health/simple"
echo "To stop and remove the test container, run: docker rm -f loyaltystudio-api-test"
