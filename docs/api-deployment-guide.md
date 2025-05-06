# API Deployment Guide

This guide provides detailed instructions for deploying the LoyaltyStudio API to Koyeb. It focuses on properly setting up environment variables to ensure the API functions correctly.

## Prerequisites

Before deploying, ensure you have:

1. A Koyeb account
2. The Koyeb CLI installed and configured
3. A PostgreSQL database (e.g., on Neon)
4. A Supabase project
5. An Upstash Redis instance (recommended for production)
6. All required environment variables ready

## Required Environment Variables

The following environment variables are **required** for the API to function properly:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@host:port/database` |
| `DIRECT_URL` | Direct PostgreSQL connection string (for Prisma) | `postgresql://user:password@host:port/database` |
| `SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `https://merchant.loyaltystudio.ai,https://admin.loyaltystudio.ai` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` or `https://your-redis.upstash.io` |

## Optional Environment Variables

These variables have default values but can be customized:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environment mode | `production` | `production` |
| `PORT` | Port to run the API on | `3003` | `3003` |
| `API_HOST` | Host to bind the API to | `0.0.0.0` | `0.0.0.0` |
| `API_URL` | Public URL of the API | `http://localhost:3003` | `https://api.loyaltystudio.ai` |
| `LOG_LEVEL` | Logging verbosity | `info` | `debug`, `info`, `warn`, `error` |
| `REDIS_PASSWORD` | Redis password (required for Upstash) | - | `your-redis-password` |
| `REDIS_TLS` | Whether to use TLS for Redis | `false` | `true` |
| `TRIGGER_API_KEY` | Trigger.dev API key | `development-key` | `your-trigger-api-key` |
| `TRIGGER_API_URL` | Trigger.dev API URL | `https://api.trigger.dev` | `https://api.trigger.dev` |
| `GEMINI_API_KEY` | Google Gemini API key | - | `your-gemini-api-key` |
| `RESEND_API_KEY` | Resend API key | `re_123456789` | `re_your_resend_api_key` |
| `EMAIL_FROM` | Email sender address | `noreply@loyaltystudio.ai` | `support@yourdomain.com` |

## Deployment Steps

### 1. Set Environment Variables Locally

Create a `.env.production` file in the `apps/api` directory with all required variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=3003
API_HOST=0.0.0.0
API_URL=https://your-api-url.koyeb.app

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database

# CORS Configuration
CORS_ORIGIN=https://merchant.yourdomain.com,https://admin.yourdomain.com

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key

# Redis Configuration
REDIS_URL=https://your-redis.upstash.io
REDIS_PASSWORD=your_redis_password
REDIS_TLS=true

# Email Configuration
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
```

### 2. Export Environment Variables for Deployment

Before running the deployment script, export all required environment variables:

```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
export DIRECT_URL="postgresql://user:password@host:port/database"
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your_service_key"
export SUPABASE_ANON_KEY="your_anon_key"
export CORS_ORIGIN="https://merchant.yourdomain.com,https://admin.yourdomain.com"
export REDIS_URL="https://your-redis.upstash.io"
export REDIS_PASSWORD="your_redis_password"
export REDIS_TLS="true"
export API_URL="https://your-api-url.koyeb.app"
```

### 3. Run the Deployment Script

```bash
./scripts/deploy-to-koyeb.sh
```

The script will:
- Validate that all required environment variables are set
- Build the API
- Deploy to Koyeb with all environment variables

### 4. Verify Deployment

After deployment, verify that the API is running correctly:

1. Check the Koyeb dashboard for deployment status
2. Test the API health endpoint: `https://your-api-url.koyeb.app/health/simple`
3. Check the API logs in the Koyeb dashboard for any errors

## Troubleshooting

### Environment Variable Issues

If you see errors related to missing environment variables:

1. Check the Koyeb dashboard to ensure all environment variables are set
2. Verify that the values are correct (no typos or extra spaces)
3. For sensitive values like database URLs and API keys, regenerate them if necessary
4. Redeploy the API with the correct environment variables

### Database Connection Issues

If the API can't connect to the database:

1. Verify that the `DATABASE_URL` and `DIRECT_URL` are correct
2. Ensure that the database is accessible from Koyeb (check network settings)
3. Check if the database requires SSL (add `?sslmode=require` to the connection string)

### CORS Issues

If you're experiencing CORS errors:

1. Ensure that `CORS_ORIGIN` includes all domains that need to access the API
2. For development, you can set `CORS_ORIGIN=*` (not recommended for production)
3. Check that the frontend is using the correct API URL

## Updating Environment Variables

To update environment variables after deployment:

1. Go to the Koyeb dashboard
2. Navigate to your API service
3. Go to the Environment tab
4. Update the variables as needed
5. Save changes and redeploy

## Security Considerations

- Never commit sensitive environment variables to version control
- Use Koyeb's environment variable management for production deployments
- Rotate API keys and passwords regularly
- Use strong, unique passwords for all services
- Consider using a secret management service for production environments
