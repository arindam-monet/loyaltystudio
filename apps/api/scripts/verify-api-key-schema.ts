import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if the ApiKey table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'ApiKey'
      ) as exists
    `;
    
    console.log('ApiKey table exists:', tableExists);
    
    // Check if the environment column exists
    const columnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ApiKey' 
        AND column_name = 'environment'
      ) as exists
    `;
    
    console.log('environment column exists:', columnExists);
    
    // Get the first API key to verify the schema
    const apiKey = await prisma.apiKey.findFirst();
    
    console.log('First API key:', apiKey);
    
  } catch (error) {
    console.error('Error verifying API key schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
