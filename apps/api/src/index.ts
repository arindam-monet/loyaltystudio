import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import fastifyApiReference from '@scalar/fastify-api-reference';
import { authPlugin } from './auth/index.js';
import { authRoutes } from './auth/routes.js';
import { dbPlugin } from './db/index.js';
import { loggerPlugin } from './middleware/logger.js';

const app = fastify({
  logger: false // We'll use our custom logger
});

// Register plugins
app.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
});

// Register custom logger first
app.register(loggerPlugin);

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

// Register routes
app.register(authRoutes);

// Register db plugin
app.register(dbPlugin);

// Health check endpoint
app.get('/health', async () => {
  return { status: 'ok' };
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
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3001');
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