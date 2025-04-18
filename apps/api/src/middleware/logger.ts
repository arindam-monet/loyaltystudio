import fp from 'fastify-plugin';
import pino from 'pino';
import pinoPretty from 'pino-pretty';

const logger = pino(
  pinoPretty({
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  })
);

export const loggerPlugin = fp(async (fastify) => {
  fastify.decorate('logger', logger);

  // Add request logging
  fastify.addHook('onRequest', async (request, reply) => {
    request.log = logger.child({
      requestId: request.id,
      method: request.method,
      url: request.url,
      headers: request.headers,
      query: request.query,
      params: request.params,
      body: request.body,
    });
  });

  // Add response logging
  fastify.addHook('onResponse', async (request, reply) => {
    request.log.info({
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    }, 'Request completed');
  });

  // Add error logging
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error({
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
    }, 'Request failed');
    reply.send(error);
  });
});

export { logger }; 