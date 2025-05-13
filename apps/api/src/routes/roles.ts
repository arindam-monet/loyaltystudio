import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;

const prisma = new PrismaClient();

const roleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export async function roleRoutes(fastify: FastifyInstance) {
  // Get all roles
  fastify.get('/roles', {
    schema: {
      description: 'Get all roles',
      tags: ['roles'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              permissions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    resource: { type: 'string' },
                    action: { type: 'string' },
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
        const roles = await prisma.role.findMany({
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        });

        return roles.map(role => ({
          ...role,
          permissions: role.permissions.map(p => p.permission),
        }));
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch roles' });
      }
    },
  });

  // Create role
  fastify.post('/roles', {
    schema: {
      description: 'Create a new role',
      tags: ['roles'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const data = roleSchema.parse(request.body);

        // Check if role already exists
        const existing = await prisma.role.findUnique({
          where: { name: data.name },
        });

        if (existing) {
          return reply.code(400).send({ error: 'Role already exists' });
        }

        const role = await prisma.role.create({
          data: {
            name: data.name,
            description: data.description
          },
        });

        return reply.code(201).send(role);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to create role' });
      }
    },
  });

  // Update role
  fastify.put('/roles/:id', {
    schema: {
      description: 'Update a role',
      tags: ['roles'],
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
          description: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = roleSchema.partial().parse(request.body);

        const role = await prisma.role.update({
          where: { id },
          data,
        });

        return role;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to update role' });
      }
    },
  });

  // Delete role
  fastify.delete('/roles/:id', {
    schema: {
      description: 'Delete a role',
      tags: ['roles'],
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

        // Check if role is assigned to any users
        const usersWithRole = await prisma.user.findFirst({
          where: { roleId: id },
        });

        if (usersWithRole) {
          return reply.code(400).send({ error: 'Cannot delete role that is assigned to users' });
        }

        await prisma.role.delete({
          where: { id },
        });

        return { message: 'Role deleted successfully' };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to delete role' });
      }
    },
  });

  // Get role permissions
  fastify.get('/roles/:id/permissions', {
    schema: {
      description: 'Get all permissions for a role',
      tags: ['roles'],
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
          type: 'array',
          items: {
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
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const permissions = await prisma.permission.findMany({
          where: {
            roles: {
              some: {
                roleId: id,
              },
            },
          },
        });

        return permissions;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch role permissions' });
      }
    },
  });
}