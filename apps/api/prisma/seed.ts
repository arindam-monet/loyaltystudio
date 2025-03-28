import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 