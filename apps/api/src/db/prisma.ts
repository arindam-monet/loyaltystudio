// Import the PrismaClient dynamically
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
import { logger } from '../middleware/logger.js';

// Declare global type for prisma instance
declare global {
  var prisma: typeof PrismaClient | undefined;
}

// Create a singleton instance of PrismaClient
const prisma = globalThis.prisma || new PrismaClient();

// In development, we want to use a global variable to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Add event listeners for logging
prisma.$on('query', (e: any) => {
  logger.debug({
    query: e.query,
    duration: e.duration,
    timestamp: new Date().toISOString(),
  }, 'Database Query');
});

prisma.$on('error', (e: any) => {
  logger.error({
    message: e.message,
    timestamp: new Date().toISOString(),
    target: e.target,
  }, 'Database Error');
});

prisma.$on('info', (e: any) => {
  logger.info({
    message: e.message,
    timestamp: new Date().toISOString(),
    target: e.target,
  }, 'Database Info');
});

prisma.$on('warn', (e: any) => {
  logger.warn({
    message: e.message,
    timestamp: new Date().toISOString(),
    target: e.target,
  }, 'Database Warning');
});

export { prisma };