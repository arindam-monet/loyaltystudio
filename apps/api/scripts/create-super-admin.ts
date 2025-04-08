import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import https from 'https';

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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to verify email using Supabase Admin API
async function verifyEmail(userId: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Extract the hostname and path from the Supabase URL
      if (!supabaseUrl) {
        console.error('Supabase URL is undefined');
        resolve(false);
        return;
      }

      const url = new URL(supabaseUrl);
      const hostname = url.hostname;
      const path = `/auth/v1/user/${userId}/confirm`;

      const options = {
        hostname,
        path,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        }
      };

      const req = https.request(options, (res) => {
        console.log(`Email verification status code: ${res.statusCode}`);
        resolve(res.statusCode === 200);
      });

      req.on('error', (error) => {
        console.error('Failed to verify email:', error);
        resolve(false);
      });

      req.end();
    } catch (error) {
      console.error('Failed to verify email:', error);
      resolve(false);
    }
  });
}

async function createSuperAdmin() {
  try {
    console.log('Creating super admin user...');

    // Configuration
    const email = 'superadmin@monet.work';
    const password = 'Test@1234';
    const name = 'Super Admin';

    // Check if user exists by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    let userId;
    let userExists = false;

    if (userError) {
      console.error('Failed to list users:', userError.message);
    } else if (userData && userData.users) {
      const existingUser = userData.users.find(user => user.email === email);
      if (existingUser) {
        console.log('User already exists in Supabase.');
        userId = existingUser.id;
        userExists = true;
      }
    }

    if (userExists && userId) {
      // Update existing user
      console.log(`Updating existing user with ID: ${userId}`);

      // First, update the user's password
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        userId,
        { password }
      );

      if (passwordError) {
        console.warn('Failed to update password:', passwordError.message);
      } else {
        console.log('Password updated successfully.');
      }

      // Then update the user's metadata and confirm their email
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            name,
            role: 'super_admin'
          },
          email_confirm: true
        }
      );

      if (updateError) {
        console.warn('Failed to update user metadata:', updateError.message);
      } else {
        console.log('User metadata updated successfully.');
      }
    } else {
      // Create new user
      console.log('Creating new user in Supabase...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role: 'super_admin'
        }
      });

      if (createError || !newUser.user) {
        throw new Error(`Failed to create user in Supabase: ${createError?.message || 'Unknown error'}`);
      }

      userId = newUser.user.id;
      console.log(`User created successfully with ID: ${userId}`);
    }

    // Explicitly verify the email using the Supabase Admin API
    console.log('Verifying email...');
    await verifyEmail(userId);

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
