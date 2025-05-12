import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
const envPath = path.join(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log(`Environment file ${envPath} not found. Using process environment variables.`);
}

// Configure logger based on environment
const logger = {
  info: (message: string) => {
    if (process.env.SEED_LOG_LEVEL !== 'silent') {
      console.log(`[INFO] ${message}`);
    }
  },
  error: (message: string, error?: any) => {
    if (process.env.SEED_LOG_LEVEL !== 'silent') {
      console.error(`[ERROR] ${message}`, error || '');
    }
  },
  warn: (message: string) => {
    if (process.env.SEED_LOG_LEVEL !== 'silent' && process.env.SEED_LOG_LEVEL !== 'error') {
      console.warn(`[WARN] ${message}`);
    }
  },
  debug: (message: string) => {
    if (process.env.SEED_LOG_LEVEL === 'debug') {
      console.debug(`[DEBUG] ${message}`);
    }
  }
};

// Environment-specific configuration
const seedConfig = {
  // Default tenant configuration
  tenant: {
    name: process.env.DEFAULT_TENANT_NAME || 'LoyaltyStudio',
    domain: process.env.DEFAULT_TENANT_DOMAIN || 'loyaltystudio.app',
  },
  // Super admin configuration
  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@monet.work',
    password: process.env.SUPER_ADMIN_PASSWORD || 'Test@1234',
    name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
  },
  // Role definitions
  roles: [
    { name: 'SUPER_ADMIN', description: 'Super Administrator with full access' },
    { name: 'ADMIN', description: 'Administrator with tenant-level access' },
    { name: 'USER', description: 'Regular user with limited access' },
  ],
  // Permission definitions
  permissions: {
    user: ['create', 'read', 'update', 'delete'],
    role: ['create', 'read', 'update', 'delete'],
    permission: ['create', 'read', 'update'],
  },
};

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Supabase client for user creation
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Check if Supabase credentials are available
const supabaseAvailable = supabaseUrl && supabaseServiceKey;
const supabase = supabaseAvailable
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Create default roles
 */
async function createRoles() {
  logger.info('Creating default roles...');

  const roles = await Promise.all(
    seedConfig.roles.map((role: { name: string; description: string }) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: {
          name: role.name,
          description: role.description,
        },
      })
    )
  );

  logger.debug(`Created ${roles.length} roles`);
  return {
    superAdminRole: roles.find((r: any) => r.name === 'SUPER_ADMIN')!,
    adminRole: roles.find((r: any) => r.name === 'ADMIN')!,
    userRole: roles.find((r: any) => r.name === 'USER')!,
  };
}

/**
 * Create default permissions
 */
async function createPermissions() {
  logger.info('Creating default permissions...');

  const permissionPromises = [];

  // Create permissions for each resource and action
  for (const [resource, actions] of Object.entries(seedConfig.permissions)) {
    for (const action of actions as string[]) {
      permissionPromises.push(
        prisma.permission.upsert({
          where: { resource_action: { resource, action } },
          update: {},
          create: {
            name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource.charAt(0).toUpperCase() + resource.slice(1)}`,
            description: `Can ${action} ${resource} information`,
            resource,
            action,
          },
        })
      );
    }
  }

  const permissions = await Promise.all(permissionPromises);
  logger.debug(`Created ${permissions.length} permissions`);

  return permissions;
}

/**
 * Assign permissions to roles
 */
async function assignPermissionsToRoles(roles: {
  superAdminRole: any,
  adminRole: any,
  userRole: any
}, permissions: any[]) {
  logger.info('Assigning permissions to roles...');

  // Assign all permissions to SUPER_ADMIN role
  await Promise.all(
    permissions.map(permission =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roles.superAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: roles.superAdminRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // Assign limited permissions to ADMIN role
  const adminPermissions = permissions.filter(
    p => p.resource === 'user' || (p.resource === 'role' && p.action === 'read')
  );
  await Promise.all(
    adminPermissions.map(permission =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roles.adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: roles.adminRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // Assign minimal permissions to USER role
  const userPermissions = permissions.filter(
    p => p.resource === 'user' && p.action === 'read'
  );
  await Promise.all(
    userPermissions.map(permission =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roles.userRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: roles.userRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  logger.debug('Permissions assigned to roles successfully');
}

/**
 * Create default tenant
 */
async function createDefaultTenant() {
  logger.info('Creating default tenant...');

  const defaultTenant = await prisma.tenant.upsert({
    where: { domain: seedConfig.tenant.domain },
    update: {},
    create: {
      name: seedConfig.tenant.name,
      domain: seedConfig.tenant.domain,
    },
  });

  logger.debug(`Created default tenant: ${defaultTenant.name}`);
  return defaultTenant;
}

/**
 * Create or update super admin user
 */
async function createSuperAdminUser(defaultTenant: any, superAdminRole: any) {
  logger.info('Creating or updating super admin user...');

  const superAdminEmail = seedConfig.superAdmin.email;
  const superAdminPassword = seedConfig.superAdmin.password;

  // Check if the user already exists in the database
  const existingUser = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingUser) {
    let userId;

    if (supabase) {
      try {
        logger.info('Creating super admin user in Supabase...');

        // First check if the user already exists in Supabase by listing users and filtering
        const { data: userData, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          logger.error('Failed to list users:', listError.message);
          userId = randomUUID(); // Fallback to a random UUID
        } else {
          // Find the user by email
          const existingUser = userData?.users?.find(user => user.email === superAdminEmail);

          if (existingUser) {
            logger.info('User already exists in Supabase, using existing ID');
            userId = existingUser.id;

            // Update the user's password
            await supabase.auth.admin.updateUserById(userId, {
              password: superAdminPassword,
              email_confirm: true,
            });
          } else {
            // Create new user in Supabase
            const { data: newUser, error } = await supabase.auth.admin.createUser({
              email: superAdminEmail,
              password: superAdminPassword,
              email_confirm: true,
              user_metadata: {
                name: seedConfig.superAdmin.name,
                role: 'SUPER_ADMIN',
                tenant_id: defaultTenant.id,
              },
            });

            if (error) {
              logger.error('Failed to create user in Supabase:', error);
              userId = randomUUID(); // Fallback to a random UUID if Supabase fails
            } else {
              userId = newUser.user.id;
              logger.debug(`Created super admin in Supabase with ID: ${userId}`);
            }
          }
        }
      } catch (error) {
        logger.error('Error with Supabase operations:', error);
        userId = randomUUID(); // Fallback to a random UUID
      }
    } else {
      logger.warn('Supabase credentials not available, using random UUID for user');
      userId = randomUUID();
    }

    // Create the user in our database
    await prisma.user.create({
      data: {
        id: userId,
        email: superAdminEmail,
        name: seedConfig.superAdmin.name,
        tenantId: defaultTenant.id,
        roleId: superAdminRole.id,
        emailVerified: true,
        isApproved: true,
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    logger.info('Created super admin user in database');
  } else {
    logger.info('Super admin user already exists in database, updating role');

    // Update the existing user to ensure they have the super admin role
    await prisma.user.update({
      where: { email: superAdminEmail },
      data: {
        roleId: superAdminRole.id,
        emailVerified: true,
        isApproved: true,
        status: 'APPROVED',
      },
    });
  }
}

/**
 * Main seed function
 */
async function main() {
  logger.info('Starting database seed...');

  try {
    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async () => {
      // Create roles
      const roles = await createRoles();

      // Create permissions
      const permissions = await createPermissions();

      // Assign permissions to roles
      await assignPermissionsToRoles(roles, permissions);

      // Create default tenant
      const defaultTenant = await createDefaultTenant();

      // Create super admin user
      await createSuperAdminUser(defaultTenant, roles.superAdminRole);
    });

    logger.info('Seed completed successfully');
  } catch (error) {
    logger.error('Transaction failed, rolling back changes:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    logger.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (supabase) {
      // Close Supabase connection if it exists
      // No explicit close method, but we can set it to null
      (global as any).supabase = null;
    }
  });