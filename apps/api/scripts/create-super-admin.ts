import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Supabase client setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSuperAdmin() {
  try {
    console.log('Creating super admin user...');

    // Configuration
    const email = 'superadmin@monet.work';
    const password = 'Test@1234';
    const name = 'Super Admin';

    // Try to sign in to check if user exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    let userId;

    if (!signInError && signInData.user) {
      console.log('User already exists in Supabase.');
      userId = signInData.user.id;
    } else {
      // Create user in Supabase
      console.log('Creating user in Supabase...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'super_admin'
          }
        }
      });

      if (signUpError || !signUpData.user) {
        throw new Error(`Failed to create user in Supabase: ${signUpError?.message || 'Unknown error'}`);
      }

      userId = signUpData.user.id;
      console.log('User created in Supabase successfully.');
    }

    // Check if user exists in our database
    const existingDbUser = await prisma.user.findUnique({
      where: { email }
    });

    // Get the SUPER_ADMIN role
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' }
    });

    if (!superAdminRole) {
      throw new Error('SUPER_ADMIN role not found. Please run the seed script first.');
    }

    // Create or update default tenant
    const defaultTenant = await prisma.tenant.upsert({
      where: { domain: 'admin.loyaltystudio.ai' },
      update: {},
      create: {
        name: 'Loyalty Studio Admin',
        domain: 'admin.loyaltystudio.ai'
      }
    });

    // In development mode, we might need to generate a user ID
    if (process.env.NODE_ENV === 'development' && !userId) {
      userId = `dev_${randomUUID()}`;
      console.log(`Development mode: Generated user ID: ${userId}`);
    }

    if (existingDbUser) {
      console.log('User already exists in database. Updating role...');

      // Update existing user
      await prisma.user.update({
        where: { id: existingDbUser.id },
        data: {
          roleId: superAdminRole.id,
          name,
          emailVerified: true,
          isApproved: true,
          status: 'APPROVED'
        }
      });

      console.log('User updated successfully.');
    } else {
      console.log('Creating user in database...');

      // Create user in our database
      await prisma.user.create({
        data: {
          id: userId,
          email,
          name,
          tenantId: defaultTenant.id,
          roleId: superAdminRole.id,
          emailVerified: true,
          isApproved: true,
          status: 'APPROVED'
        }
      });

      console.log('User created in database successfully.');
    }

    console.log('Super admin user created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
