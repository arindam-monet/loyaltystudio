import { FastifyInstance } from 'fastify';
import { prisma } from '../db/index.js';
import os from 'os';

interface HealthStatus {
  status: 'ok' | 'error' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    redis: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
  };
  system: {
    memory: {
      total: number;
      free: number;
      used: number;
      usedPercentage: number;
    };
    cpu: {
      cores: number;
      loadAvg: number[];
    };
  };
}

export async function healthRoutes(fastify: FastifyInstance) {
  // Detailed health check endpoint
  fastify.get('/health/detailed', {
    schema: {
      description: 'Get detailed health status of the API',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'error', 'degraded'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            environment: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok', 'error'] },
                    latency: { type: 'number' },
                    error: { type: 'string' },
                  },
                },
                redis: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok', 'error'] },
                    latency: { type: 'number' },
                    error: { type: 'string' },
                  },
                },
              },
            },
            system: {
              type: 'object',
              properties: {
                memory: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    free: { type: 'number' },
                    used: { type: 'number' },
                    usedPercentage: { type: 'number' },
                  },
                },
                cpu: {
                  type: 'object',
                  properties: {
                    cores: { type: 'number' },
                    loadAvg: { type: 'array', items: { type: 'number' } },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const healthStatus: HealthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.0.1',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: 'ok',
        },
        redis: {
          status: 'ok',
        },
      },
      system: {
        memory: {
          total: Math.round(os.totalmem() / (1024 * 1024)),
          free: Math.round(os.freemem() / (1024 * 1024)),
          used: Math.round((os.totalmem() - os.freemem()) / (1024 * 1024)),
          usedPercentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
        },
        cpu: {
          cores: os.cpus().length,
          loadAvg: os.loadavg(),
        },
      },
    };

    // Check database connection
    try {
      const startTime = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      const endTime = performance.now();
      healthStatus.services.database.latency = Math.round(endTime - startTime);
    } catch (error) {
      healthStatus.services.database.status = 'error';
      healthStatus.services.database.error = error instanceof Error ? error.message : 'Unknown error';
      healthStatus.status = 'error';
    }

    // Check Redis connection
    try {
      const startTime = performance.now();
      // Use get with a test key instead of ping since ping might not be available
      await fastify.cache.get('health-check');
      const endTime = performance.now();
      healthStatus.services.redis.latency = Math.round(endTime - startTime);
    } catch (error) {
      healthStatus.services.redis.status = 'error';
      healthStatus.services.redis.error = error instanceof Error ? error.message : 'Unknown error';

      // If Redis is down but database is up, mark as degraded instead of error
      if (healthStatus.services.database.status === 'ok') {
        healthStatus.status = 'degraded';
      } else {
        healthStatus.status = 'error';
      }
    }

    // Set appropriate status code
    if (healthStatus.status === 'error') {
      reply.code(500);
    } else if (healthStatus.status === 'degraded') {
      reply.code(200); // Still return 200 for degraded as the API can still function
    }

    return healthStatus;
  });

  // Simple health check endpoint (for load balancers and simple monitoring)
  fastify.get('/health/simple', {
    schema: {
      description: 'Get simple health status of the API',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'error'] },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;

      // Check Redis connection
      await fastify.cache.get('health-check');

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      reply.code(500);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}
