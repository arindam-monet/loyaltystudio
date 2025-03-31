import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { prisma } from './prisma.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

export const dbPlugin = fp(async (fastify: FastifyInstance) => {
  // Decorate fastify with prisma client
  fastify.decorate('prisma', prisma);

  // Add hook to close prisma connection
  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
});

export { prisma } from './prisma.js'; 