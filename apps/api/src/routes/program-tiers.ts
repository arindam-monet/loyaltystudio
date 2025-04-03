import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tierSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  pointsThreshold: z.number().min(0),
  benefits: z.record(z.any()).optional(),
  loyaltyProgramId: z.string().cuid(),
});

export async function programTierRoutes(fastify: FastifyInstance) {
  // Get all tiers for a loyalty program
  fastify.get('/program-tiers', {
    schema: {
      tags: ['program-tiers'],
      description: 'Get all tiers for a loyalty program',
      querystring: {
        type: 'object',
        required: ['loyaltyProgramId'],
        properties: {
          loyaltyProgramId: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { loyaltyProgramId } = request.query as { loyaltyProgramId: string };

    try {
      const tiers = await prisma.programTier.findMany({
        where: {
          loyaltyProgramId,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: {
          pointsThreshold: 'asc',
        },
      });

      return reply.send(tiers);
    } catch (error) {
      console.error('Failed to fetch program tiers:', error);
      return reply.code(500).send({
        error: 'Failed to fetch program tiers',
      });
    }
  });

  // Create a new tier
  fastify.post('/program-tiers', {
    schema: {
      tags: ['program-tiers'],
      description: 'Create a new program tier',
      body: {
        type: 'object',
        required: ['name', 'pointsThreshold', 'loyaltyProgramId'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 100 },
          description: { type: 'string' },
          pointsThreshold: { type: 'number', minimum: 0 },
          benefits: { type: 'object' },
          loyaltyProgramId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const data = tierSchema.parse(request.body);

    try {
      const tier = await prisma.programTier.create({
        data,
        include: {
          members: true
        }
      });

      return reply.code(201).send(tier);
    } catch (error) {
      console.error('Failed to create program tier:', error);
      return reply.code(500).send({
        error: 'Failed to create program tier',
      });
    }
  });

  // Update a tier
  fastify.patch('/program-tiers/:id', {
    schema: {
      tags: ['program-tiers'],
      description: 'Update a program tier',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 100 },
          description: { type: 'string' },
          pointsThreshold: { type: 'number', minimum: 0 },
          benefits: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = tierSchema.partial().parse(request.body);

    try {
      const tier = await prisma.programTier.update({
        where: { id },
        data,
        include: {
          members: true
        }
      });

      return reply.send(tier);
    } catch (error) {
      console.error('Failed to update program tier:', error);
      return reply.code(500).send({
        error: 'Failed to update program tier',
      });
    }
  });

  // Delete a tier
  fastify.delete('/program-tiers/:id', {
    schema: {
      tags: ['program-tiers'],
      description: 'Delete a program tier',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.programTier.delete({
        where: { id },
      });

      return reply.code(204).send();
    } catch (error) {
      console.error('Failed to delete program tier:', error);
      return reply.code(500).send({
        error: 'Failed to delete program tier',
      });
    }
  });

  // Get tier members
  fastify.get('/program-tiers/:id/members', {
    schema: {
      tags: ['program-tiers'],
      description: 'Get all members of a program tier',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const members = await prisma.programMember.findMany({
        where: {
          tierId: id,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        },
        orderBy: {
          joinedAt: 'desc',
        },
      });

      return reply.send(members);
    } catch (error) {
      console.error('Failed to fetch tier members:', error);
      return reply.code(500).send({
        error: 'Failed to fetch tier members',
      });
    }
  });
} 