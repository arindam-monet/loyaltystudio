import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  resource: z.string(),
  action: z.string(),
});

const rolePermissionSchema = z.object({
  roleId: z.string(),
  permissionId: z.string(),
});

export async function permissionRoutes(fastify: FastifyInstance) {
  // Create permission
  fastify.post('/permissions', {
    schema: {
      description: 'Create a new permission',
      tags: ['permissions'],
      body: {
        type: 'object',
        required: ['name', 'resource', 'action'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          resource: { type: 'string' },
          action: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            resource: { type: 'string' },
            action: { type: 'string' },
          },
        },
      },
    },
    config: {
      permissions: [
        { resource: 'permission', action: 'create' },
      ],
    },
  }, async (request, reply) => {
    const permission = permissionSchema.parse(request.body);
    
    try {
      const created = await prisma.permission.create({
        data: permission,
      });
      
      return reply.code(201).send(created);
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to create permission' });
    }
  });

  // List permissions
  fastify.get('/permissions', {
    schema: {
      description: 'List all permissions',
      tags: ['permissions'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              resource: { type: 'string' },
              action: { type: 'string' },
            },
          },
        },
      },
    },
    config: {
      permissions: [
        { resource: 'permission', action: 'read' },
      ],
    },
  }, async (request, reply) => {
    try {
      const permissions = await prisma.permission.findMany();
      return permissions;
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch permissions' });
    }
  });

  // Assign permission to role
  fastify.post('/permissions/assign', {
    schema: {
      description: 'Assign a permission to a role',
      tags: ['permissions'],
      body: {
        type: 'object',
        required: ['roleId', 'permissionId'],
        properties: {
          roleId: { type: 'string' },
          permissionId: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            roleId: { type: 'string' },
            permissionId: { type: 'string' },
          },
        },
      },
    },
    config: {
      permissions: [
        { resource: 'permission', action: 'update' },
      ],
    },
  }, async (request, reply) => {
    const { roleId, permissionId } = rolePermissionSchema.parse(request.body);
    
    try {
      const assignment = await prisma.rolePermission.create({
        data: {
          roleId,
          permissionId,
        },
      });
      
      return reply.code(201).send(assignment);
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to assign permission' });
    }
  });

  // Remove permission from role
  fastify.delete('/permissions/assign', {
    schema: {
      description: 'Remove a permission from a role',
      tags: ['permissions'],
      body: {
        type: 'object',
        required: ['roleId', 'permissionId'],
        properties: {
          roleId: { type: 'string' },
          permissionId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    config: {
      permissions: [
        { resource: 'permission', action: 'update' },
      ],
    },
  }, async (request, reply) => {
    const { roleId, permissionId } = rolePermissionSchema.parse(request.body);
    
    try {
      await prisma.rolePermission.delete({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
      });
      
      return { message: 'Permission removed from role' };
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to remove permission' });
    }
  });

  // Get role permissions
  fastify.get('/roles/:roleId/permissions', {
    schema: {
      description: 'Get all permissions for a role',
      tags: ['permissions'],
      params: {
        type: 'object',
        required: ['roleId'],
        properties: {
          roleId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              resource: { type: 'string' },
              action: { type: 'string' },
            },
          },
        },
      },
    },
    config: {
      permissions: [
        { resource: 'permission', action: 'read' },
      ],
    },
  }, async (request, reply) => {
    const { roleId } = request.params as { roleId: string };
    
    try {
      const permissions = await prisma.permission.findMany({
        where: {
          roles: {
            some: {
              roleId,
            },
          },
        },
      });
      
      return permissions;
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch role permissions' });
    }
  });
} 