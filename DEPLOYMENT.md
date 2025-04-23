# LoyaltyStudio POC Deployment Guide

This guide outlines the steps to deploy the LoyaltyStudio POC to production using Koyeb for the backend API, Neon for PostgreSQL, and Vercel for the frontend.

## Prerequisites

- [Neon](https://neon.tech) account (free tier)
- [Koyeb](https://koyeb.com) account (free tier)
- [Vercel](https://vercel.com) account (free tier)
- [Supabase](https://supabase.com) account (free tier)
- [GitHub](https://github.com) account

## Step 1: Set Up the Database on Neon

1. Sign up for a Neon account at [neon.tech](https://neon.tech)
2. Create a new project (e.g., "loyaltystudio-poc")
3. Note your connection strings:
   - `DATABASE_URL`: The pooled connection string
   - `DIRECT_URL`: The direct connection string

## Step 2: Set Up Authentication with Supabase

1. Sign up for a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Set up authentication providers (Email, etc.)
4. Note your Supabase credentials:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_ANON_KEY`: Your public anon key
   - `SUPABASE_SERVICE_KEY`: Your service role key

## Step 3: Deploy the API to Koyeb

### Option 1: Using the Standalone Deployment Package

1. Run the deployment script to create a standalone package:
   ```bash
   ./scripts/create-api-deployment.sh
   ```

2. Navigate to the deployment directory:
   ```bash
   cd deploy/api
   ```

3. Deploy to Koyeb using the Koyeb CLI:
   ```bash
   # Install Koyeb CLI if not already installed
   curl -fsSL https://cli.koyeb.com/install.sh | sh

   # Log in to Koyeb
   koyeb login

   # Create a new app
   koyeb app create loyaltystudio-api

   # Deploy the service
   koyeb service create \
     --app loyaltystudio-api \
     --name api \
     --type web \
     --ports 3003:http \
     --routes /:3003 \
     --docker . \
     --env NODE_ENV=production \
     --env PORT=3003 \
     --env DATABASE_URL=your-neon-connection-string \
     --env DIRECT_URL=your-neon-direct-connection-string \
     --env SUPABASE_URL=your-supabase-url \
     --env SUPABASE_SERVICE_KEY=your-supabase-service-key \
     --env SUPABASE_ANON_KEY=your-supabase-anon-key \
     --env CORS_ORIGIN=https://your-merchant-app.vercel.app
   ```

### Option 2: Using Koyeb's GitHub Integration

1. Run the preparation script to create a deployment branch:
   ```bash
   ./scripts/prepare-koyeb-deployment.sh
   ```

2. Go to [Koyeb](https://app.koyeb.com) and create a new app
3. Connect your GitHub repository
4. Select the `koyeb-deployment` branch
5. Configure the build:
   - Name: "loyaltystudio-api"
   - Region: Choose the closest to your target audience
   - Instance Type: Nano (free tier)
   - Build Method: Dockerfile
   - Dockerfile Path: apps/api/Dockerfile
   - Port: 3003

6. Add environment variables:
   - `NODE_ENV`: production
   - `PORT`: 3003
   - `DATABASE_URL`: your-neon-connection-string
   - `DIRECT_URL`: your-neon-direct-connection-string
   - `SUPABASE_URL`: your-supabase-url
   - `SUPABASE_SERVICE_KEY`: your-supabase-service-key
   - `SUPABASE_ANON_KEY`: your-supabase-anon-key
   - `CORS_ORIGIN`: https://your-merchant-app.vercel.app

7. Deploy the service

## Step 4: Deploy the Merchant Web App to Vercel

1. Update the Vercel configuration in `apps/merchant-web/vercel.json`:
   - Replace `https://your-api-url.koyeb.app` with your actual Koyeb API URL
   - Update the Supabase credentials

2. Push your changes to GitHub

3. Go to [Vercel](https://vercel.com) and create a new project
4. Import your GitHub repository
5. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: apps/merchant-web
   - Build Command: (Vercel will use the one from vercel.json)
   - Output Directory: .next
   - Install Command: (Vercel will use the one from vercel.json)

6. Add environment variables (these should match what's in vercel.json):
   - `NEXT_PUBLIC_API_URL`: https://your-api-url.koyeb.app
   - `NEXT_PUBLIC_SUPABASE_URL`: your-supabase-url
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: your-supabase-anon-key

7. Deploy the project

## Step 5: Test the Deployment

1. Test the API:
   - Visit your API URL with a health check endpoint (e.g., `https://your-api-url.koyeb.app/health`)
   - You should see a response indicating the API is running

2. Test the Merchant Web App:
   - Visit your Vercel-deployed merchant web app URL
   - Try to log in using Supabase authentication
   - Verify that the app can communicate with the API

## Troubleshooting

### API Connection Issues
- Verify that your CORS settings are correct
- Check that your environment variables are properly set
- Ensure your Neon database is accessible from Koyeb

### Database Connection Issues
- Check your DATABASE_URL and DIRECT_URL
- Ensure your Neon database IP allowlist includes Koyeb's IP ranges

### Authentication Issues
- Verify your Supabase configuration
- Check that your SUPABASE_URL and keys are correct

## Next Steps

Once your basic deployment is working, you can:

1. **Add monitoring**:
   - Set up basic health checks in Koyeb
   - Configure logging to a service like Logtail or Papertrail

2. **Set up a custom domain**:
   - Configure a custom domain in Vercel for your merchant web app
   - Configure a custom domain in Koyeb for your API
   - Update your CORS settings accordingly

3. **Implement CI/CD**:
   - Set up GitHub Actions for testing before deployment
   - Configure branch-based preview deployments
