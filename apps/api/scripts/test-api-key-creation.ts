import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;

const prisma = new PrismaClient();

async function main() {
  try {
    // Get the first merchant
    const merchant = await prisma.merchant.findFirst();

    if (!merchant) {
      console.error('No merchant found');
      return;
    }

    console.log(`Using merchant: ${merchant.name} (${merchant.id})`);

    // Create a test API key
    const apiKey = await prisma.apiKey.create({
      data: {
        key: `test_${Date.now()}`,
        name: 'Test API Key',
        merchantId: merchant.id,
        environment: 'test',
        isActive: true
      }
    });

    console.log('API key created successfully:');
    console.log(apiKey);

    // Get all API keys for the merchant
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        merchantId: merchant.id
      }
    });

    console.log(`Found ${apiKeys.length} API keys for merchant ${merchant.name}:`);
    console.log(apiKeys.map(key => ({
      id: key.id,
      key: key.key,
      name: key.name,
      environment: key.environment,
      isActive: key.isActive
    })));

  } catch (error) {
    console.error('Error testing API key creation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
