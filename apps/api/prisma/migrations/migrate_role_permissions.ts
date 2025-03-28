import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateRolePermissions() {
  try {
    console.log('Starting migration of role permissions...');

    // Get all existing role permissions
    const rolePermissions = await prisma.rolePermission.findMany();
    console.log(`Found ${rolePermissions.length} role permissions to migrate`);

    // Create new permission roles
    for (const rp of rolePermissions) {
      await prisma.permissionRole.create({
        data: {
          permissionId: rp.permissionId,
          roleId: rp.roleId,
        },
      });
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateRolePermissions(); 