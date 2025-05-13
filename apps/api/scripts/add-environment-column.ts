import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if the environment column already exists
    const result = await prisma.$queryRaw`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'ApiKey'
      AND column_name = 'environment'
    `;

    if (Array.isArray(result) && result.length === 0) {
      console.log('Adding environment column to ApiKey table...');

      // Add environment field to ApiKey table
      await prisma.$executeRaw`
        ALTER TABLE "ApiKey" ADD COLUMN "environment" TEXT NOT NULL DEFAULT 'test'
      `;

      // Create index for faster queries
      await prisma.$executeRaw`
        CREATE INDEX "ApiKey_environment_idx" ON "ApiKey"("environment")
      `;

      console.log('Environment column added successfully!');
    } else {
      console.log('Environment column already exists.');
    }
  } catch (error) {
    console.error('Error adding environment column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
