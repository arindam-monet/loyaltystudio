import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissionSchema = z.object({
  name: z.string(),
  resource: z.string(),
  action: z.string(),
  description: z.string().optional(),
});

const rolePermissionSchema = z.object({
  roleId: z.string(),
  permissionId: z.string(),
});

export async function permissionRoutes(fastify: FastifyInstance) {
  // Get all permissions
  fastify.get('/permissions', {
    schema: {
      description: 'Get all permissions',
      tags: ['permissions'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              resource: { type: 'string' },
              action: { type: 'string' },
              description: { type: 'string' },
              roles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const permissions = await prisma.permission.findMany({
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        });

        return permissions.map(permission => ({
          ...permission,
          roles: permission.roles.map(r => r.role),
        }));
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch permissions' });
      }
    },
  });

  // Create permission
  fastify.post('/permissions', {
    schema: {
      description: 'Create a new permission',
      tags: ['permissions'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'resource', 'action'],
        properties: {
          name: { type: 'string' },
          resource: { type: 'string' },
          action: { type: 'string' },
          description: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            resource: { type: 'string' },
            action: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const data = permissionSchema.parse(request.body);
        
        // Check if permission already exists
        const existing = await prisma.permission.findFirst({
          where: {
            resource: data.resource,
            action: data.action,
          },
        });

        if (existing) {
          return reply.code(400).send({ error: 'Permission already exists' });
        }

        const permission = await prisma.permission.create({
          data,
        });

        return reply.code(201).send(permission);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to create permission' });
      }
    },
  });

  // Update permission
  fastify.put('/permissions/:id', {
    schema: {
      description: 'Update a permission',
      tags: ['permissions'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          resource: { type: 'string' },
          action: { type: 'string' },
          description: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            resource: { type: 'string' },
            action: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = permissionSchema.partial().parse(request.body);

        const permission = await prisma.permission.update({
          where: { id },
          data,
        });

        return permission;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to update permission' });
      }
    },
  });

  // Delete permission
  fastify.delete('/permissions/:id', {
    schema: {
      description: 'Delete a permission',
      tags: ['permissions'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
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
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        await prisma.permission.delete({
          where: { id },
        });

        return { message: 'Permission deleted successfully' };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to delete permission' });
      }
    },
  });

  // Assign permission to role
  fastify.post('/permissions/:id/roles/:roleId', {
    schema: {
      description: 'Assign permission to role',
      tags: ['permissions'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id', 'roleId'],
        properties: {
          id: { type: 'string' },
          roleId: { type: 'string' },
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
    handler: async (request, reply) => {
      try {
        const { id, roleId } = request.params as { id: string; roleId: string };

        await prisma.permissionRole.create({
          data: {
            permissionId: id,
            roleId,
          },
        });

        return { message: 'Permission assigned to role successfully' };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to assign permission to role' });
      }
    },
  });

  // Remove permission from role
  fastify.delete('/permissions/:id/roles/:roleId', {
    schema: {
      description: 'Remove permission from role',
      tags: ['permissions'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id', 'roleId'],
        properties: {
          id: { type: 'string' },
          roleId: { type: 'string' },
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
    handler: async (request, reply) => {
      try {
        const { id, roleId } = request.params as { id: string; roleId: string };

        await prisma.permissionRole.delete({
          where: {
            permissionId_roleId: {
              permissionId: id,
              roleId,
            },
          },
        });

        return { message: 'Permission removed from role successfully' };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to remove permission from role' });
      }
    },
  });
} 