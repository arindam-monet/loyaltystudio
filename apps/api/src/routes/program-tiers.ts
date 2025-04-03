import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { TierEvaluationService } from '../services/tier-evaluation.js';

const prisma = new PrismaClient();
const tierService = new TierEvaluationService();

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

      // Evaluate all members for potential tier changes
      const members = await prisma.programMember.findMany({
        where: {
          tier: {
            loyaltyProgramId: data.loyaltyProgramId
          }
        },
      });

      for (const member of members) {
        await tierService.updateMemberTier(member.userId, data.loyaltyProgramId);
      }

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

      // Evaluate all members for potential tier changes
      const members = await prisma.programMember.findMany({
        where: {
          tier: {
            loyaltyProgramId: tier.loyaltyProgramId
          }
        },
      });

      for (const member of members) {
        await tierService.updateMemberTier(member.userId, tier.loyaltyProgramId);
      }

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
      const tier = await prisma.programTier.findUnique({
        where: { id },
        include: {
          members: true,
        },
      });

      if (!tier) {
        return reply.code(404).send({
          error: 'Tier not found',
        });
      }

      // Move members to the next lower tier or remove tier assignment
      for (const member of tier.members) {
        const tiers = await prisma.programTier.findMany({
          where: {
            loyaltyProgramId: tier.loyaltyProgramId,
            pointsThreshold: {
              lt: tier.pointsThreshold,
            },
          },
          orderBy: {
            pointsThreshold: 'desc',
          },
        });

        const newTierId = tiers[0]?.id || undefined;

        await prisma.programMember.update({
          where: { id: member.id },
          data: { tierId: newTierId },
        });
      }

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

  // Get tier progress for a member
  fastify.get('/program-tiers/:id/progress/:userId', {
    schema: {
      tags: ['program-tiers'],
      description: 'Get tier progress for a member',
      params: {
        type: 'object',
        required: ['id', 'userId'],
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id, userId } = request.params as { id: string; userId: string };

    try {
      const tier = await prisma.programTier.findUnique({
        where: { id },
      });

      if (!tier) {
        return reply.code(404).send({
          error: 'Tier not found',
        });
      }

      const progress = await tierService.getTierProgress(userId, tier.loyaltyProgramId);

      return reply.send(progress);
    } catch (error) {
      console.error('Failed to fetch tier progress:', error);
      return reply.code(500).send({
        error: 'Failed to fetch tier progress',
      });
    }
  });
} 