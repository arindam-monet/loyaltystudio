import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { cache } from '../services/redis.js';

declare module 'fastify' {
  interface FastifyInstance {
    cache: typeof cache;
  }
}

export const cachePlugin = fp(async (fastify: FastifyInstance) => {
  // Decorate fastify with cache service
  fastify.decorate('cache', cache);

  // Add hook to close Redis connection
  fastify.addHook('onClose', async (instance) => {
    // Note: Redis connection is managed by the singleton instance
    // and will be closed when the application shuts down
  });
}); 