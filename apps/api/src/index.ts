import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import { fastifyApiReference } from '@scalar/fastify-api-reference';
import { logger } from './utils/logger';
import authPlugin from './plugins/auth';
import authRoutes from './routes/auth.routes';

const app = fastify({
  logger: false, // Using custom logger instead
  disableRequestLogging: true // Explicitly disable request logging since we use custom logger
});

// Register CORS
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
});

// Register Swagger for OpenAPI schema generation
await app.register(swagger, {
  openapi: {
    info: {
      title: 'Monet Loyalty Platform API',
      description: 'API documentation for the Monet Headless Loyalty Platform',
      version: '0.0.1'
    },
    servers: [
      {
        url: `http://${process.env.API_HOST || 'localhost'}:${process.env.PORT || 3001}`,
        description: 'Development server'
      }
    ]
  }
});

// Register Scalar API Reference UI
await app.register(fastifyApiReference, {
  routePrefix: '/docs',
  title: 'Monet API Reference',
  description: 'API documentation for the Monet Headless Loyalty Platform',
  theme: {
    primaryColor: '#6366f1' // Indigo color to match the brand
  }
});

// Register auth plugin
await app.register(authPlugin);

// Register routes
await app.register(authRoutes, { prefix: '/api/auth' });

// Health check route
app.get('/health', async () => {
  return { status: 'ok' };
});

// Start the server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await app.listen({ port, host: '0.0.0.0' });
    logger.info(`Server is running on port ${port}`);
  } catch (err) {
    logger.error('Error starting server:', err);
    process.exit(1);
  }
};

start(); 