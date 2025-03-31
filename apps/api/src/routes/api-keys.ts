import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { generateApiKey, validateApiKey } from '../services/api-key.js';

const prisma = new PrismaClient();

const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
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
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const data = apiKeySchema.parse(request.body);
        const merchantId = request.user.merchantId;

        const apiKey = await prisma.apiKey.create({
          data: {
            key: generateApiKey(),
            name: data.name,
            merchantId,
          },
        });

        return reply.code(201).send({
          data: {
            key: apiKey.key,
            name: apiKey.name,
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
      }
    },
    handler: async (request, reply) => {
      try {
        const { key } = request.params as { key: string };
        const merchantId = request.user.merchantId;

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

  // Get API key usage stats
  fastify.get('/api-keys/stats', {
    schema: {
      description: 'Get API key usage statistics',
      tags: ['api-keys'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
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
        const merchantId = request.user.merchantId;

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

        return reply.send(stats);
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