import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function verifySuperAdmin() {
  try {
    console.log('Verifying super admin user...');

    // Configuration
    const email = 'superadmin@monet.work';

    // Check if user exists in our database
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        tenant: true
      }
    });

    if (user) {
      console.log('Super admin user found:');
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role?.name}`);
      console.log(`Tenant: ${user.tenant?.name} (${user.tenant?.domain})`);
      console.log(`Status: ${user.status}`);
      console.log(`Approved: ${user.isApproved}`);
      console.log(`Email Verified: ${user.emailVerified}`);
    } else {
      console.log('Super admin user not found!');
    }
  } catch (error) {
    console.error('Error verifying super admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySuperAdmin();
