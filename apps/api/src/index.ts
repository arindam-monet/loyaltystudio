import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import fastifyApiReference from '@scalar/fastify-api-reference';
import { authPlugin } from './auth/index.js';
import { authRoutes } from './auth/routes.js';
import { dbPlugin } from './db/index.js';
import { loggerPlugin } from './middleware/logger.js';
import { rbacPlugin } from './middleware/rbac.js';
import { subdomainPlugin } from './middleware/subdomain.js';
import { cachePlugin } from './plugins/cache.js';
import { permissionRoutes } from './routes/permissions.js';
import { roleRoutes } from './routes/roles.js';
import { userRoutes } from './routes/users.js';
import { pointsRoutes } from './routes/points.js';
import { rewardsRoutes } from './routes/rewards.js';
import { merchantRoutes } from './routes/merchants.js';
import { loyaltyProgramRoutes } from './routes/loyalty-programs.js';
import { segmentRoutes } from './routes/segments.js';
import { env } from './config/env.js';
import { apiKeyPlugin } from './middleware/api-key.js';
import { apiKeyRoutes } from './routes/api-keys.js';
import { programTierRoutes } from './routes/program-tiers.js';
import { programMemberRoutes } from './routes/program-members.js';
import { campaignRoutes } from './routes/campaigns.js';
import { webhookRoutes } from './routes/webhooks.js';

const app = fastify({
  logger: {
    level: env.LOG_LEVEL,
  },
});

// Register plugins
app.register(cors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
});

// Register custom logger first
app.register(loggerPlugin);

// Register subdomain plugin
app.register(subdomainPlugin);

// Register cache plugin
app.register(cachePlugin);

// Register Swagger for OpenAPI spec generation
app.register(swagger, {
  swagger: {
    info: {
      title: 'Loyaltystudio API Documentation',
      description: 'API documentation for Loyaltystudio Platform',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@loyaltystudio.ai'
      }
    },
    host: process.env.API_URL || 'localhost:3001',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
      { name: 'auth', description: 'Authentication endpoints' },
      { name: 'users', description: 'User management endpoints' }
    ],
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header'
      }
    }
  }
});

// Register Scalar API Reference
app.register(fastifyApiReference, {
  routePrefix: '/docs',
  configuration: {
    theme: 'fastify'
  }
});

// Register auth plugin
app.register(authPlugin);
app.register(rbacPlugin);

// Register routes
app.register(authRoutes);
app.register(permissionRoutes);
app.register(roleRoutes);
app.register(userRoutes);
app.register(pointsRoutes);
app.register(rewardsRoutes);
app.register(merchantRoutes);
app.register(loyaltyProgramRoutes);
app.register(segmentRoutes);
app.register(programTierRoutes);
app.register(programMemberRoutes);
app.register(campaignRoutes);
app.register(apiKeyRoutes);
app.register(webhookRoutes);

// Register db plugin
app.register(dbPlugin);

// Register API key middleware
app.register(apiKeyPlugin);

// Health check endpoint
app.get('/health', async () => {
  try {
    // Check Redis connection
    await app.cache.get('health-check');
    return {
      status: 'ok',
      redis: 'connected'
    };
  } catch (error) {
    return {
      status: 'error',
      redis: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// Serve OpenAPI spec
app.get('/openapi.json', async () => {
  console.log('Serving OpenAPI spec');
  return app.swagger();
});

// Debug endpoint to check OpenAPI spec
app.get('/debug/openapi', async () => {
  console.log('Serving debug OpenAPI spec');
  const spec = app.swagger();
  return spec;
});

// Start server
const start = async () => {
  try {
    console.log('Starting server...');


    await app.listen({ port: parseInt(env.PORT), host: env.API_HOST });
    console.log(`Server is running on ${env.API_URL}`);
    console.log('API Documentation available at http://localhost:3001/docs');
    console.log('Debug OpenAPI spec available at http://localhost:3001/debug/openapi');
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

start();