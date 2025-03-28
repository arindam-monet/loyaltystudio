import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function userRoutes(fastify: FastifyInstance) {
  // Get user profile
  fastify.get('/users/me', {
    schema: {
      description: 'Get current user profile',
      tags: ['users'],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            tenantId: { type: 'string' },
            role: {
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
    },
    config: {
      permissions: [
        { resource: 'user', action: 'read' },
      ],
    },
  }, async (request, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Transform permissions array
      const { role, ...userWithoutRole } = user;
      const transformedUser = {
        ...userWithoutRole,
        role: {
          ...role,
          permissions: role.permissions.map(rp => rp.permission),
        },
      };

      return transformedUser;
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch user profile' });
    }
  });
} 