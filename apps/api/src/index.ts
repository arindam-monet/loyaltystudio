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
import { merchantAuthorizationPlugin } from './middleware/merchant-association.js';
import { cachePlugin } from './plugins/cache.js';
import { permissionRoutes } from './routes/permissions.js';
import { roleRoutes } from './routes/roles.js';
import { userRoutes } from './routes/users.js';
import { pointsRoutes } from './routes/points.js';
import { pointsRulesRoutes } from './routes/points-rules.js';
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
import { aiProgramGeneratorRoutes } from './routes/ai-program-generator.js';
import { demoRequestRoutes } from './routes/demo-requests.js';
import { invitationRoutes } from './routes/invitations.js';
import { adminRoutes } from './routes/admin.js';
import { healthRoutes } from './routes/health.js';
import { teamMembersRoutes } from './routes/team-members.js';
import { registerJobs } from './trigger/index.js';

const app = fastify({
  logger: {
    level: env.LOG_LEVEL,
  },
});

// Register plugins
app.register(cors, {
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return cb(null, true);
    }

    // If CORS_ORIGIN is '*', allow all origins
      if (env.CORS_ORIGIN === '*') {
      console.log(`CORS: Allowing origin ${origin} because CORS_ORIGIN is set to '*'`);
      return cb(null, true);
    }

    // Check if the origin is in the allowed list
    if (Array.isArray(env.CORS_ORIGIN) && env.CORS_ORIGIN.includes(origin)) {
      console.log(`CORS: Allowing origin ${origin} - found in allowed list`);
      return cb(null, true);
    }

    // If not in the allowed list
    console.error(`CORS: Rejecting origin ${origin} - not in allowed list:`, env.CORS_ORIGIN);
    return cb(new Error(`Origin ${origin} not allowed by CORS`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Merchant-ID'],

  // Add preflight response headers for better debugging
  preflightContinue: false,
  optionsSuccessStatus: 204,
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
    host: 'localhost:3003',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
      { name: 'auth', description: 'Authentication endpoints' },
      { name: 'users', description: 'User management endpoints' },
      { name: 'admin', description: 'Super-admin endpoints' },
      { name: 'health', description: 'Health check endpoints' }
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

// Register merchant authorization plugin
// Make sure it's registered after the auth plugin
console.log('Registering merchant authorization plugin');
app.register(merchantAuthorizationPlugin, { prefix: '' });
console.log('Merchant authorization plugin registered');

// Add a global preHandler hook to log all requests
app.addHook('preHandler', async (request) => {
  console.log('GLOBAL HOOK: Processing request for path:', request.url);
});

// Register routes
app.register(authRoutes);
app.register(permissionRoutes);
app.register(roleRoutes);
app.register(userRoutes);
app.register(pointsRoutes);
app.register(pointsRulesRoutes);
app.register(rewardsRoutes);
app.register(merchantRoutes);
app.register(loyaltyProgramRoutes);
app.register(segmentRoutes);
app.register(programTierRoutes);
app.register(programMemberRoutes);
app.register(campaignRoutes);
app.register(apiKeyRoutes, { prefix: '/api' });
app.register(webhookRoutes);
app.register(aiProgramGeneratorRoutes);
app.register(demoRequestRoutes, { prefix: '/api' });
app.register(invitationRoutes);
app.register(adminRoutes);
app.register(healthRoutes);
app.register(teamMembersRoutes);

// Register db plugin
app.register(dbPlugin);

// Register API key middleware
app.register(apiKeyPlugin);

// Legacy health check endpoint (redirects to the new simple health check)
app.get('/health', async (_, reply) => {
  return reply.redirect('/health/simple');
});

// Serve OpenAPI spec with CORS headers
app.get('/openapi.json', async (_, reply) => {
  console.log('Serving OpenAPI spec');
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
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

    // Register trigger.dev jobs
    registerJobs();

    await app.listen({ port: parseInt(env.PORT), host: env.API_HOST });
    console.log(`Server is running on ${env.API_URL}`);
    console.log(`API Documentation available at ${env.API_URL}/docs`);
    console.log(`Debug OpenAPI spec available at ${env.API_URL}/debug/openapi`);
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