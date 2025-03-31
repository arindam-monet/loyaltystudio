import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '../middleware/logger.js';

// Declare global type for prisma instance
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a singleton instance of PrismaClient
const prismaClientSingleton = () => {
  return new PrismaClient({
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
    // Add connection configuration
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Ensure we only create one instance
export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Log Prisma events with better error handling
const queryHandler = (e: Prisma.QueryEvent) => {
  logger.debug({
    query: e.query,
    duration: e.duration,
    timestamp: new Date().toISOString(),
  }, 'Database Query');
};

const errorHandler = (e: Prisma.LogEvent) => {
  logger.error({
    message: e.message,
    timestamp: new Date().toISOString(),
    target: e.target,
  }, 'Database Error');
};

const infoHandler = (e: Prisma.LogEvent) => {
  logger.info({
    message: e.message,
    timestamp: new Date().toISOString(),
    target: e.target,
  }, 'Database Info');
};

const warnHandler = (e: Prisma.LogEvent) => {
  logger.warn({
    message: e.message,
    timestamp: new Date().toISOString(),
    target: e.target,
  }, 'Database Warning');
};

// Register event handlers
(prisma as any).$on('query', queryHandler);
(prisma as any).$on('error', errorHandler);
(prisma as any).$on('info', infoHandler);
(prisma as any).$on('warn', warnHandler); 