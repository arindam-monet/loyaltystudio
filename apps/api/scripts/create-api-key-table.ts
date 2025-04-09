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
    
    const tableExistsResult = tableExists as any;
    const exists = tableExistsResult[0]?.exists === true;
    
    if (exists) {
      console.log('ApiKey table already exists, skipping creation');
      return;
    }
    
    console.log('Creating ApiKey table...');
    
    // Create the ApiKey table
    await prisma.$executeRaw`
      CREATE TABLE "ApiKey" (
        "id" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "merchantId" TEXT NOT NULL,
        "lastUsedAt" TIMESTAMP(3),
        "expiresAt" TIMESTAMP(3),
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "environment" TEXT NOT NULL DEFAULT 'test',
        
        CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
      )
    `;
    
    // Create indexes
    await prisma.$executeRaw`CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key")`;
    await prisma.$executeRaw`CREATE INDEX "ApiKey_merchantId_idx" ON "ApiKey"("merchantId")`;
    await prisma.$executeRaw`CREATE INDEX "ApiKey_key_idx" ON "ApiKey"("key")`;
    await prisma.$executeRaw`CREATE INDEX "ApiKey_environment_idx" ON "ApiKey"("environment")`;
    
    // Create foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_merchantId_fkey"
      FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    `;
    
    console.log('ApiKey table created successfully!');
    
    // Create ApiKeyRateLimit table if it doesn't exist
    const rateLimitTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'ApiKeyRateLimit'
      ) as exists
    `;
    
    const rateLimitTableExistsResult = rateLimitTableExists as any;
    const rateLimitExists = rateLimitTableExistsResult[0]?.exists === true;
    
    if (!rateLimitExists) {
      console.log('Creating ApiKeyRateLimit table...');
      
      await prisma.$executeRaw`
        CREATE TABLE "ApiKeyRateLimit" (
          "id" TEXT NOT NULL,
          "apiKeyId" TEXT NOT NULL,
          "window" INTEGER NOT NULL,
          "limit" INTEGER NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          
          CONSTRAINT "ApiKeyRateLimit_pkey" PRIMARY KEY ("id")
        )
      `;
      
      await prisma.$executeRaw`CREATE UNIQUE INDEX "ApiKeyRateLimit_apiKeyId_window_key" ON "ApiKeyRateLimit"("apiKeyId", "window")`;
      await prisma.$executeRaw`CREATE INDEX "ApiKeyRateLimit_apiKeyId_idx" ON "ApiKeyRateLimit"("apiKeyId")`;
      
      await prisma.$executeRaw`
        ALTER TABLE "ApiKeyRateLimit" ADD CONSTRAINT "ApiKeyRateLimit_apiKeyId_fkey"
        FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `;
      
      console.log('ApiKeyRateLimit table created successfully!');
    }
    
    // Create ApiKeyUsageLog table if it doesn't exist
    const usageLogTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'ApiKeyUsageLog'
      ) as exists
    `;
    
    const usageLogTableExistsResult = usageLogTableExists as any;
    const usageLogExists = usageLogTableExistsResult[0]?.exists === true;
    
    if (!usageLogExists) {
      console.log('Creating ApiKeyUsageLog table...');
      
      await prisma.$executeRaw`
        CREATE TABLE "ApiKeyUsageLog" (
          "id" TEXT NOT NULL,
          "apiKeyId" TEXT NOT NULL,
          "endpoint" TEXT NOT NULL,
          "method" TEXT NOT NULL,
          "status" INTEGER NOT NULL,
          "duration" INTEGER NOT NULL,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "ApiKeyUsageLog_pkey" PRIMARY KEY ("id")
        )
      `;
      
      await prisma.$executeRaw`CREATE INDEX "ApiKeyUsageLog_apiKeyId_idx" ON "ApiKeyUsageLog"("apiKeyId")`;
      await prisma.$executeRaw`CREATE INDEX "ApiKeyUsageLog_createdAt_idx" ON "ApiKeyUsageLog"("createdAt")`;
      
      await prisma.$executeRaw`
        ALTER TABLE "ApiKeyUsageLog" ADD CONSTRAINT "ApiKeyUsageLog_apiKeyId_fkey"
        FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `;
      
      console.log('ApiKeyUsageLog table created successfully!');
    }
    
  } catch (error) {
    console.error('Error creating ApiKey table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
