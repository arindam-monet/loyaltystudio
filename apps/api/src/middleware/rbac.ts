import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyRequest {
    hasPermission: (resource: string, action: string) => Promise<boolean>;
    hasRole: (roleName: string) => boolean;
    routeConfig?: {
      permissions?: Array<{ resource: string; action: string }>;
    };
  }
}

export const rbacPlugin = fp(async (fastify: FastifyInstance) => {
  const prisma = new PrismaClient();

  // Helper function to check if user has a specific role
  fastify.decorateRequest('hasRole', function(this: FastifyRequest, roleName: string): boolean {
    return this.user?.role?.name === roleName;
  });

  // Helper function to check if user has a specific permission
  fastify.decorateRequest('hasPermission', async function(
    this: FastifyRequest,
    resource: string,
    action: string
  ): Promise<boolean> {
    if (!this.user?.role?.id) return false;

    // Super admin has all permissions
    if (this.user.role.name === 'SUPER_ADMIN') return true;

    // Check if user has the required permission
    const permission = await prisma.permission.findFirst({
      where: {
        resource,
        action,
      },
      include: {
        roles: {
          where: {
            roleId: this.user.role.id,
          },
        },
      },
    });

    return (permission?.roles?.length ?? 0) > 0;
  });

  // Middleware to check permissions for routes
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip permission check for public routes
    if (request.url.startsWith('/health') || request.url.startsWith('/docs')) {
      return;
    }

    // Get required permissions from route config
    const requiredPermissions = request.routeConfig?.permissions;
    if (!requiredPermissions) return;

    // Check each required permission
    for (const { resource, action } of requiredPermissions) {
      const hasPermission = await request.hasPermission(resource, action);
      if (!hasPermission) {
        return reply.code(403).send({
          error: 'Insufficient permissions',
          message: `You do not have permission to ${action} ${resource}`,
        });
      }
    }
  });
}); 