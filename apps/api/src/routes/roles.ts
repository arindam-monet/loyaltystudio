import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const roleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export async function roleRoutes(fastify: FastifyInstance) {
  // Create role
  fastify.post('/roles', {
    schema: {
      description: 'Create a new role',
      tags: ['roles'],
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
    config: {
      permissions: [
        { resource: 'role', action: 'create' },
      ],
    },
  }, async (request, reply) => {
    const role = roleSchema.parse(request.body);
    
    try {
      const created = await prisma.role.create({
        data: role,
      });
      
      return reply.code(201).send(created);
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to create role' });
    }
  });

  // List roles
  fastify.get('/roles', {
    schema: {
      description: 'List all roles',
      tags: ['roles'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
      },
    },
    config: {
      permissions: [
        { resource: 'role', action: 'read' },
      ],
    },
  }, async (request, reply) => {
    try {
      const roles = await prisma.role.findMany();
      return roles;
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch roles' });
    }
  });

  // Get role by ID
  fastify.get('/roles/:id', {
    schema: {
      description: 'Get a role by ID',
      tags: ['roles'],
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
                  description: { type: 'string' },
                  resource: { type: 'string' },
                  action: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    config: {
      permissions: [
        { resource: 'role', action: 'read' },
      ],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const role = await prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
      
      if (!role) {
        return reply.code(404).send({ error: 'Role not found' });
      }
      
      return {
        ...role,
        permissions: role.permissions.map(rp => rp.permission),
      };
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch role' });
    }
  });

  // Update role
  fastify.put('/roles/:id', {
    schema: {
      description: 'Update a role',
      tags: ['roles'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['name'],
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
    config: {
      permissions: [
        { resource: 'role', action: 'update' },
      ],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const role = roleSchema.parse(request.body);
    
    try {
      const updated = await prisma.role.update({
        where: { id },
        data: role,
      });
      
      return updated;
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to update role' });
    }
  });

  // Delete role
  fastify.delete('/roles/:id', {
    schema: {
      description: 'Delete a role',
      tags: ['roles'],
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
    config: {
      permissions: [
        { resource: 'role', action: 'delete' },
      ],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      await prisma.role.delete({
        where: { id },
      });
      
      return { message: 'Role deleted successfully' };
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to delete role' });
    }
  });
} 