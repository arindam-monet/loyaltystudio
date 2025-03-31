import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ApiKeyService } from '../services/api-key.js';

const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
});

export default async function apiKeyRoutes(fastify: FastifyInstance) {
  // Generate new API key
  fastify.post('/api-keys', {
    schema: {
      body: apiKeySchema,
    },
    handler: async (request, reply) => {
      const { name } = request.body as z.infer<typeof apiKeySchema>;
      const merchantId = request.merchantId;

      if (!merchantId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Merchant ID not found',
        });
      }

      const key = await ApiKeyService.generateKey(merchantId, name);

      return {
        success: true,
        data: {
          key,
          name,
        },
      };
    },
  });

  // Revoke API key
  fastify.delete('/api-keys/:key', {
    handler: async (request, reply) => {
      const { key } = request.params as { key: string };
      const merchantId = request.merchantId;

      if (!merchantId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Merchant ID not found',
        });
      }

      await ApiKeyService.revokeKey(key);

      return {
        success: true,
        message: 'API key revoked successfully',
      };
    },
  });

  // Get API key usage statistics
  fastify.get('/api-keys/stats', {
    schema: {
      querystring: z.object({
        timeWindow: z.string().optional(),
      }),
    },
    handler: async (request, reply) => {
      const merchantId = request.merchantId;
      const { timeWindow } = request.query as { timeWindow?: string };

      if (!merchantId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Merchant ID not found',
        });
      }

      const window = timeWindow ? parseInt(timeWindow, 10) : undefined;
      const stats = await ApiKeyService.getUsageStats(merchantId, window);

      return {
        success: true,
        data: stats,
      };
    },
  });
} 