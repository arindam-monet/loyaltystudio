import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Initialize Supabase client for user creation
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Check if Supabase credentials are available
const supabaseAvailable = supabaseUrl && supabaseServiceKey;
const supabase = supabaseAvailable
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

async function main() {
  // Create default roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Super Administrator with full access',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator with tenant-level access',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Regular user with limited access',
    },
  });

  // Create default permissions
  const permissions = await Promise.all([
    // User permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'user', action: 'create' } },
      update: {},
      create: {
        name: 'Create User',
        description: 'Can create new users',
        resource: 'user',
        action: 'create',
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'user', action: 'read' } },
      update: {},
      create: {
        name: 'Read User',
        description: 'Can read user information',
        resource: 'user',
        action: 'read',
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'user', action: 'update' } },
      update: {},
      create: {
        name: 'Update User',
        description: 'Can update user information',
        resource: 'user',
        action: 'update',
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'user', action: 'delete' } },
      update: {},
      create: {
        name: 'Delete User',
        description: 'Can delete users',
        resource: 'user',
        action: 'delete',
      },
    }),

    // Role permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'role', action: 'create' } },
      update: {},
      create: {
        name: 'Create Role',
        description: 'Can create new roles',
        resource: 'role',
        action: 'create',
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'role', action: 'read' } },
      update: {},
      create: {
        name: 'Read Role',
        description: 'Can read role information',
        resource: 'role',
        action: 'read',
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'role', action: 'update' } },
      update: {},
      create: {
        name: 'Update Role',
        description: 'Can update role information',
        resource: 'role',
        action: 'update',
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'role', action: 'delete' } },
      update: {},
      create: {
        name: 'Delete Role',
        description: 'Can delete roles',
        resource: 'role',
        action: 'delete',
      },
    }),

    // Permission permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'permission', action: 'create' } },
      update: {},
      create: {
        name: 'Create Permission',
        description: 'Can create new permissions',
        resource: 'permission',
        action: 'create',
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'permission', action: 'read' } },
      update: {},
      create: {
        name: 'Read Permission',
        description: 'Can read permission information',
        resource: 'permission',
        action: 'read',
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'permission', action: 'update' } },
      update: {},
      create: {
        name: 'Update Permission',
        description: 'Can update permission information',
        resource: 'permission',
        action: 'update',
      },
    }),
  ]);

  // Assign all permissions to SUPER_ADMIN role
  await Promise.all(
    permissions.map(permission =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
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
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
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
            roleId: userRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // Create a default tenant for the super admin
  const defaultTenant = await prisma.tenant.upsert({
    where: { domain: 'loyaltystudio.app' },
    update: {},
    create: {
      name: 'LoyaltyStudio',
      domain: 'loyaltystudio.app',
    },
  });

  // Create super admin user
  const superAdminEmail = 'superadmin@monet.work';
  const superAdminPassword = 'Test@1234';

  // Check if the user already exists in the database
  const existingUser = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingUser) {
    let userId;

    if (supabase) {
      try {
        console.log('Creating super admin user in Supabase...');

        // First check if the user already exists in Supabase by listing users and filtering
        const { data: userData, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          console.error('Failed to list users:', listError.message);
          userId = randomUUID(); // Fallback to a random UUID
        } else {
          // Find the user by email
          const existingUser = userData?.users?.find(user => user.email === superAdminEmail);

          if (existingUser) {
            console.log('User already exists in Supabase, using existing ID');
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
                name: 'Super Admin',
                role: 'SUPER_ADMIN',
                tenant_id: defaultTenant.id,
              },
            });

            if (error) {
              console.error('Failed to create user in Supabase:', error);
              userId = randomUUID(); // Fallback to a random UUID if Supabase fails
            } else {
              userId = newUser.user.id;
              console.log('Created super admin in Supabase with ID:', userId);
            }
          }
        }
      } catch (error) {
        console.error('Error with Supabase operations:', error);
        userId = randomUUID(); // Fallback to a random UUID
      }
    } else {
      console.log('Supabase credentials not available, using random UUID for user');
      userId = randomUUID();
    }

    // Create the user in our database
    await prisma.user.create({
      data: {
        id: userId,
        email: superAdminEmail,
        name: 'Super Admin',
        tenantId: defaultTenant.id,
        roleId: superAdminRole.id,
        emailVerified: true,
        isApproved: true,
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    console.log('Created super admin user in database');
  } else {
    console.log('Super admin user already exists in database, updating role');

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

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
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