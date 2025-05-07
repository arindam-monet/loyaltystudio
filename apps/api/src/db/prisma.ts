// Import the PrismaClient
import { PrismaClient } from '@prisma/client/edge.js';

// Declare global type for prisma instance
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a singleton instance of PrismaClient
const prisma = globalThis.prisma || new PrismaClient();

// In development, we want to use a global variable to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export { prisma };