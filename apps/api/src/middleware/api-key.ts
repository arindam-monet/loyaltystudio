import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { validateApiKey } from '../services/api-key.js';

const prisma = new PrismaClient();

declare module 'fastify' {
  interface FastifyRequest {
    merchantId?: string;
  }
}

export const apiKeyPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', async (request, reply) => {
    // Only validate API keys for /api/ routes
    if (!request.url.startsWith('/api/')) {
      return;
    }

    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'API key is required',
      });
    }

    // Validate API key format
    if (!validateApiKey(apiKey as string)) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid API key format',
      });
    }

    try {
      // Find the API key and check if it's active
      const key = await prisma.apiKey.findFirst({
        where: {
          key: apiKey,
          isActive: true,
        },
      });

      if (!key) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or inactive API key',
        });
      }

      // Add merchant ID to request
      request.merchantId = key.merchantId;

      // Log API usage
      await prisma.apiKeyUsageLog.create({
        data: {
          apiKeyId: key.id,
          endpoint: request.url,
          method: request.method,
          status: reply.statusCode,
          duration: 0, // We'll update this in onResponse hook
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to validate API key',
      });
    }
  });
};