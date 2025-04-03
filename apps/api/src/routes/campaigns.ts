import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const campaignSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  type: z.enum(['POINTS_MULTIPLIER', 'BONUS_POINTS', 'SPECIAL_REWARD']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  rules: z.record(z.any()),
  rewards: z.record(z.any()),
  loyaltyProgramId: z.string().cuid(),
  targetTierIds: z.array(z.string().cuid()).optional(),
  isActive: z.boolean().default(true),
});

export async function campaignRoutes(fastify: FastifyInstance) {
  // Get all campaigns for a loyalty program
  fastify.get('/campaigns', {
    schema: {
      tags: ['campaigns'],
      description: 'Get all campaigns for a loyalty program',
      querystring: {
        type: 'object',
        required: ['loyaltyProgramId'],
        properties: {
          loyaltyProgramId: { type: 'string' },
          includeInactive: { type: 'boolean' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { loyaltyProgramId, includeInactive = false } = request.query as { 
      loyaltyProgramId: string;
      includeInactive?: boolean;
    };

    try {
      const campaigns = await prisma.campaign.findMany({
        where: {
          loyaltyProgramId,
          ...(includeInactive ? {} : { isActive: true }),
        },
        include: {
          targetTiers: true,
          participants: {
            include: {
              member: {
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
            }
          }
        },
        orderBy: {
          startDate: 'desc',
        },
      });

      return reply.send(campaigns);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      return reply.code(500).send({
        error: 'Failed to fetch campaigns',
      });
    }
  });

  // Create a new campaign
  fastify.post('/campaigns', {
    schema: {
      tags: ['campaigns'],
      description: 'Create a new campaign',
      body: {
        type: 'object',
        required: ['name', 'type', 'startDate', 'endDate', 'rules', 'rewards', 'loyaltyProgramId'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 100 },
          description: { type: 'string' },
          type: { type: 'string', enum: ['POINTS_MULTIPLIER', 'BONUS_POINTS', 'SPECIAL_REWARD'] },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          rules: { type: 'object' },
          rewards: { type: 'object' },
          loyaltyProgramId: { type: 'string' },
          targetTierIds: { type: 'array', items: { type: 'string' } },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    const data = campaignSchema.parse(request.body);

    try {
      const campaign = await prisma.campaign.create({
        data: {
          ...data,
          targetTiers: data.targetTierIds ? {
            connect: data.targetTierIds.map(id => ({ id }))
          } : undefined
        },
        include: {
          targetTiers: true,
          participants: true,
        }
      });

      return reply.code(201).send(campaign);
    } catch (error) {
      console.error('Failed to create campaign:', error);
      return reply.code(500).send({
        error: 'Failed to create campaign',
      });
    }
  });

  // Update a campaign
  fastify.patch('/campaigns/:id', {
    schema: {
      tags: ['campaigns'],
      description: 'Update a campaign',
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
          type: { type: 'string', enum: ['POINTS_MULTIPLIER', 'BONUS_POINTS', 'SPECIAL_REWARD'] },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          rules: { type: 'object' },
          rewards: { type: 'object' },
          targetTierIds: { type: 'array', items: { type: 'string' } },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = campaignSchema.partial().parse(request.body);

    try {
      const campaign = await prisma.campaign.update({
        where: { id },
        data: {
          ...data,
          targetTiers: data.targetTierIds ? {
            set: data.targetTierIds.map(id => ({ id }))
          } : undefined
        },
        include: {
          targetTiers: true,
          participants: true,
        }
      });

      return reply.send(campaign);
    } catch (error) {
      console.error('Failed to update campaign:', error);
      return reply.code(500).send({
        error: 'Failed to update campaign',
      });
    }
  });

  // Delete a campaign
  fastify.delete('/campaigns/:id', {
    schema: {
      tags: ['campaigns'],
      description: 'Delete a campaign',
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
      await prisma.campaign.delete({
        where: { id },
      });

      return reply.code(204).send();
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      return reply.code(500).send({
        error: 'Failed to delete campaign',
      });
    }
  });

  // Add participant to campaign
  fastify.post('/campaigns/:id/participants', {
    schema: {
      tags: ['campaigns'],
      description: 'Add a participant to a campaign',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['memberId'],
        properties: {
          memberId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { memberId } = request.body as { memberId: string };

    try {
      const participant = await prisma.campaignParticipant.create({
        data: {
          campaignId: id,
          memberId,
          joinedAt: new Date(),
        },
        include: {
          member: {
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
        }
      });

      return reply.code(201).send(participant);
    } catch (error) {
      console.error('Failed to add campaign participant:', error);
      return reply.code(500).send({
        error: 'Failed to add campaign participant',
      });
    }
  });

  // Remove participant from campaign
  fastify.delete('/campaigns/:id/participants/:participantId', {
    schema: {
      tags: ['campaigns'],
      description: 'Remove a participant from a campaign',
      params: {
        type: 'object',
        required: ['id', 'participantId'],
        properties: {
          id: { type: 'string' },
          participantId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { participantId } = request.params as { participantId: string };

    try {
      await prisma.campaignParticipant.delete({
        where: { id: participantId },
      });

      return reply.code(204).send();
    } catch (error) {
      console.error('Failed to remove campaign participant:', error);
      return reply.code(500).send({
        error: 'Failed to remove campaign participant',
      });
    }
  });

  // Get campaign participants
  fastify.get('/campaigns/:id/participants', {
    schema: {
      tags: ['campaigns'],
      description: 'Get all participants of a campaign',
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
      const participants = await prisma.campaignParticipant.findMany({
        where: {
          campaignId: id,
        },
        include: {
          member: {
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
          joinedAt: 'desc',
        },
      });

      return reply.send(participants);
    } catch (error) {
      console.error('Failed to fetch campaign participants:', error);
      return reply.code(500).send({
        error: 'Failed to fetch campaign participants',
      });
    }
  });
} 