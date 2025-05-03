import fp from 'fastify-plugin';
// Import the logger from utils to ensure consistency
import { logger } from '../utils/logger.js';

export const loggerPlugin = fp(async (fastify) => {
  fastify.decorate('logger', logger);

  // Add request logging
  fastify.addHook('onRequest', async (request, _reply) => {
    // Create a simple log function for the request
    request.log = {
      info: (msg: string) => logger.info(`[${request.id}] ${msg}`),
      error: (msg: string) => logger.error(`[${request.id}] ${msg}`),
      warn: (msg: string) => logger.warn(`[${request.id}] ${msg}`),
      debug: (msg: string) => logger.debug(`[${request.id}] ${msg}`),
      trace: (msg: string) => logger.trace(`[${request.id}] ${msg}`),
      fatal: (msg: string) => logger.fatal(`[${request.id}] ${msg}`),
      child: () => request.log,
      level: 'info',
      silent: () => { },
    };

    logger.info(`Request: ${request.method} ${request.url}`);
  });

  // Add response logging
  fastify.addHook('onResponse', async (request, reply) => {
    logger.info(`Response: ${request.method} ${request.url} - ${reply.statusCode} in ${reply.elapsedTime || 0}ms`);
  });

  // Add error logging
  fastify.setErrorHandler((error, request, reply) => {
    logger.error(`Error: ${request.method} ${request.url}`, error.message);
    reply.send(error);
  });
});

export { logger };