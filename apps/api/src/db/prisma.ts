import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../middleware/logger.js';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log Prisma events
prisma.$on('query', (e: Prisma.QueryEvent) => {
  logger.debug('Query: ' + e.query);
  logger.debug('Duration: ' + e.duration + 'ms');
});

prisma.$on('error', (e: Prisma.LogEvent) => {
  logger.error('Prisma Error: ' + e.message);
});

prisma.$on('info', (e: Prisma.LogEvent) => {
  logger.info('Prisma Info: ' + e.message);
});

prisma.$on('warn', (e: Prisma.LogEvent) => {
  logger.warn('Prisma Warning: ' + e.message);
});

export default prisma; 