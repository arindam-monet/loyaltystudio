// Import the PrismaClient (safe for both dev + prod)
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { env } from '../config/env.js';

// Declare global type for prisma instance
declare global {
  // Need to use any to avoid TypeScript errors with the global variable
  var prisma: any;
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