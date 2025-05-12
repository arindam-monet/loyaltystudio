import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { ApiKeyService } from '../services/api-key.js';

const prisma = new PrismaClient();

const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
  environment: z.enum(['test', 'production']).default('test'),
  merchantId: z.string(),
  expiresIn: z.number().optional(),
});

const apiKeyUsageStatsSchema = z.object({
  timeWindow: z.enum(['1h', '24h', '7d', '30d']).optional(),
});

export async function apiKeyRoutes(fastify: FastifyInstance) {
  // Generate new API key
  fastify.post('/api-keys', {
    schema: {
      description: 'Generate a new API key',
      tags: ['api-keys'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'merchantId'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          merchantId: { type: 'string' },
          environment: { type: 'string', enum: ['test', 'production'], default: 'test' },
          expiresIn: { type: 'number', nullable: true }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const data = apiKeySchema.parse(request.body);

        // Get the merchant ID from the request
        const { merchantId } = data;

        // Verify that the merchant exists and belongs to the user's tenant
        const merchant = await prisma.merchant.findFirst({
          where: {
            id: merchantId,
            tenantId: request.user.tenantId
          }
        });

        if (!merchant) {
          return reply.code(404).send({ error: 'Merchant not found or you do not have access to it' });
        }

        // Use the ApiKeyService to generate the key
        const key = await ApiKeyService.generateKey(
          merchantId,
          data.name,
          data.environment,
          data.expiresIn
        );

        // Find the created API key to return its details
        const apiKey = await prisma.apiKey.findFirst({
          where: {
            key,
            merchantId,
          },
          include: {
            merchant: {
              select: {
                name: true
              }
            }
          }
        });

        if (!apiKey) {
          return reply.code(404).send({ error: 'API key not found after creation' });
        }

        // The environment field might not be recognized by TypeScript yet
        // since it was recently added to the schema
        const environment = (apiKey as any).environment || 'test';

        return reply.code(201).send({
          data: {
            key: apiKey.key,
            name: apiKey.name,
            environment: environment,
            merchant: apiKey.merchant.name
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to generate API key' });
      }
    },
  });

  // Revoke API key
  fastify.delete('/api-keys/:key', {
    schema: {
      description: 'Revoke an API key',
      tags: ['api-keys'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['key'],
        properties: {
          key: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        required: ['merchantId'],
        properties: {
          merchantId: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { key } = request.params as { key: string };

        // Get the merchant ID from the request params or query
        const query = request.query as { merchantId?: string };
        const merchantId = query.merchantId;

        if (!merchantId) {
          return reply.code(400).send({ error: 'Merchant ID is required' });
        }

        // Verify that the merchant exists and belongs to the user's tenant
        const merchant = await prisma.merchant.findFirst({
          where: {
            id: merchantId,
            tenantId: request.user.tenantId
          }
        });

        if (!merchant) {
          return reply.code(404).send({ error: 'Merchant not found or you do not have access to it' });
        }

        const apiKey = await prisma.apiKey.findFirst({
          where: {
            key,
            merchantId,
          },
        });

        if (!apiKey) {
          return reply.code(404).send({ error: 'API key not found' });
        }

        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { isActive: false },
        });

        return reply.send({ message: 'API key revoked successfully' });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to revoke API key' });
      }
    },
  });

  // Get all API keys for a merchant
  fastify.get('/api-keys', {
    schema: {
      description: 'Get all API keys for a merchant',
      tags: ['api-keys'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['merchantId'],
        properties: {
          merchantId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  key: { type: 'string' },
                  name: { type: 'string' },
                  environment: { type: 'string' },
                  isActive: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
                  expiresAt: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        // Get the merchant ID from the query
        const query = request.query as { merchantId?: string };
        const merchantId = query.merchantId;

        if (!merchantId) {
          return reply.code(400).send({ error: 'Merchant ID is required' });
        }

        // Verify that the merchant exists and belongs to the user's tenant
        const merchant = await prisma.merchant.findFirst({
          where: {
            id: merchantId,
            tenantId: request.user.tenantId
          }
        });

        if (!merchant) {
          return reply.code(404).send({ error: 'Merchant not found or you do not have access to it' });
        }

        const apiKeys = await prisma.apiKey.findMany({
          where: {
            merchantId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return reply.send({
          data: apiKeys,
        });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch API keys' });
      }
    },
  });

  // Get API key usage stats
  fastify.get('/api-keys/stats', {
    schema: {
      description: 'Get API key usage statistics',
      tags: ['api-keys'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['merchantId'],
        properties: {
          merchantId: { type: 'string' },
          timeWindow: {
            type: 'string',
            enum: ['1h', '24h', '7d', '30d']
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const data = apiKeyUsageStatsSchema.parse(request.query);

        // Get the merchant ID from the request params or query
        const query = request.query as { merchantId?: string };
        const merchantId = query.merchantId;

        if (!merchantId) {
          return reply.code(400).send({ error: 'Merchant ID is required' });
        }

        // Verify that the merchant exists and belongs to the user's tenant
        const merchant = await prisma.merchant.findFirst({
          where: {
            id: merchantId,
            tenantId: request.user.tenantId
          }
        });

        if (!merchant) {
          return reply.code(404).send({ error: 'Merchant not found or you do not have access to it' });
        }

        const apiKeys = await prisma.apiKey.findMany({
          where: { merchantId },
          include: {
            usageLogs: {
              where: {
                createdAt: {
                  gte: getTimeWindowStart(data.timeWindow),
                },
              },
            },
          },
        });

        const stats = apiKeys.map((apiKey) => ({
          key: apiKey.key,
          name: apiKey.name,
          totalRequests: apiKey.usageLogs.length,
          successRate: calculateSuccessRate(apiKey.usageLogs),
          averageResponseTime: calculateAverageResponseTime(apiKey.usageLogs),
        }));

        return reply.send({
          data: stats
        });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch API key stats' });
      }
    },
  });
}

function getTimeWindowStart(timeWindow?: string): Date {
  const now = new Date();
  switch (timeWindow) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to 24h
  }
}

function calculateSuccessRate(logs: any[]): number {
  if (logs.length === 0) return 0;
  const successfulRequests = logs.filter((log) => log.status < 400).length;
  return (successfulRequests / logs.length) * 100;
}

function calculateAverageResponseTime(logs: any[]): number {
  if (logs.length === 0) return 0;
  const totalDuration = logs.reduce((sum, log) => sum + log.duration, 0);
  return totalDuration / logs.length;
}