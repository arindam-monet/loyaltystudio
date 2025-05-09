// Import the PrismaClient
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

// Declare global type for prisma instance
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a singleton instance of PrismaClient with explicit DATABASE_URL
const prisma = globalThis.prisma || new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

// Log the database URL being used (without showing the full URL for security)
console.log(`Initializing Prisma with DATABASE_URL: ${env.DATABASE_URL.substring(0, 20)}...`);

// In development, we want to use a global variable to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export { prisma };