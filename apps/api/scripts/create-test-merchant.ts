import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;

const prisma = new PrismaClient();

async function main() {
  try {
    // Create a test tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        domain: 'test-tenant.com',
      },
    });

    console.log('Created test tenant:', tenant);

    // Create a test merchant
    const merchant = await prisma.merchant.create({
      data: {
        name: 'Test Merchant',
        tenantId: tenant.id,
        email: 'test@example.com',
        currency: 'USD',
        timezone: 'UTC',
      },
    });

    console.log('Created test merchant:', merchant);

    // Create a test API key
    const apiKey = await prisma.apiKey.create({
      data: {
        key: `test_${Date.now()}`,
        name: 'Test API Key',
        merchantId: merchant.id,
        environment: 'test',
        isActive: true,
      },
    });

    console.log('Created test API key:', apiKey);

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
