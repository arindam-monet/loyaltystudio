import { FastifyPluginAsync } from 'fastify';
import { ApiKeyService } from '../services/api-key.js';

export const apiKeyPlugin: FastifyPluginAsync = async (fastify) => {
  // Add preHandler hook to validate API key
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip API key check for non-API routes
    if (!request.url.startsWith('/api/')) {
      return;
    }

    const apiKey = request.headers['x-api-key'] as string;
    if (!apiKey) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'API key is required',
      });
    }

    const startTime = Date.now();
    try {
      const validation = await ApiKeyService.validateKey(apiKey);
      
      if (!validation.isValid) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: validation.error,
        });
      }

      // Add merchant ID to request for route handlers
      request.merchantId = validation.merchantId;
    } finally {
      // Log API usage
      const duration = Date.now() - startTime;
      await ApiKeyService.logUsage(
        apiKey,
        request.url,
        request.method,
        reply.statusCode,
        duration,
        request.ip,
        request.headers['user-agent']
      );
    }
  });
};

// Add type declarations for the request object
declare module 'fastify' {
  interface FastifyRequest {
    merchantId?: string;
  }
} 