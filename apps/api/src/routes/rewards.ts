import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rewardSchema = z.object({
  name: z.string(),
  description: z.string(),
  pointsCost: z.number(),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'EXPERIENCE']),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  loyaltyProgramId: z.string(),
});

const rewardRedemptionSchema = z.object({
  rewardId: z.string(),
  quantity: z.number().min(1),
  metadata: z.record(z.any()).optional(),
});

export async function rewardsRoutes(fastify: FastifyInstance) {
  // Create reward
  fastify.post('/rewards', {
    schema: {
      description: 'Create a new reward',
      tags: ['rewards'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'description', 'pointsCost', 'type'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          pointsCost: { type: 'number' },
          type: { type: 'string', enum: ['PHYSICAL', 'DIGITAL', 'EXPERIENCE'] },
          metadata: { type: 'object', additionalProperties: true },
          isActive: { type: 'boolean', default: true },
          loyaltyProgramId: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            pointsCost: { type: 'number' },
            type: { type: 'string' },
            metadata: { type: 'object' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const data = rewardSchema.parse(request.body);

        const reward = await prisma.reward.create({
          data: {
            name: data.name,
            description: data.description,
            pointsCost: data.pointsCost,
            type: data.type,
            isActive: data.isActive,
            metadata: data.metadata,
            loyaltyProgram: {
              connect: { id: data.loyaltyProgramId }
            }
          },
        });

        return reply.code(201).send(reward);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to create reward' });
      }
    },
  });

  // Get all rewards
  fastify.get('/rewards', {
    schema: {
      description: 'Get all rewards',
      tags: ['rewards'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          isActive: { type: 'boolean' },
          type: { type: 'string', enum: ['PHYSICAL', 'DIGITAL', 'EXPERIENCE'] },
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
              pointsCost: { type: 'number' },
              type: { type: 'string' },
              metadata: { type: 'object' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { isActive, type } = request.query as { isActive?: boolean; type?: string };

        const where: any = {};
        if (isActive !== undefined) where.isActive = isActive;
        if (type) where.type = type;

        const rewards = await prisma.reward.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });

        return rewards;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch rewards' });
      }
    },
  });

  // Get reward by ID
  fastify.get('/rewards/:id', {
    schema: {
      description: 'Get reward by ID',
      tags: ['rewards'],
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
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            pointsCost: { type: 'number' },
            type: { type: 'string' },
            metadata: { type: 'object' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const reward = await prisma.reward.findUnique({
          where: { id },
        });

        if (!reward) {
          return reply.code(404).send({ error: 'Reward not found' });
        }

        return reward;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch reward' });
      }
    },
  });

  // Update reward
  fastify.put('/rewards/:id', {
    schema: {
      description: 'Update reward',
      tags: ['rewards'],
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
          pointsCost: { type: 'number' },
          type: { type: 'string', enum: ['PHYSICAL', 'DIGITAL', 'EXPERIENCE'] },
          metadata: { type: 'object', additionalProperties: true },
          isActive: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            pointsCost: { type: 'number' },
            type: { type: 'string' },
            metadata: { type: 'object' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = rewardSchema.partial().parse(request.body);

        const reward = await prisma.reward.update({
          where: { id },
          data,
        });

        return reward;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to update reward' });
      }
    },
  });

  // Redeem reward
  fastify.post('/rewards/redeem', {
    schema: {
      description: 'Redeem a reward',
      tags: ['rewards'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['rewardId', 'quantity'],
        properties: {
          rewardId: { type: 'string' },
          quantity: { type: 'number', minimum: 1 },
          metadata: { type: 'object', additionalProperties: true }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            rewardId: { type: 'string' },
            quantity: { type: 'number' },
            pointsCost: { type: 'number' },
            status: { type: 'string' },
            metadata: { type: 'object' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const data = rewardRedemptionSchema.parse(request.body);
        const userId = request.user.id; // From auth middleware

        // Get reward details
        const reward = await prisma.reward.findUnique({
          where: { id: data.rewardId },
        });

        if (!reward) {
          return reply.code(404).send({ error: 'Reward not found' });
        }

        if (!reward.isActive) {
          return reply.code(400).send({ error: 'Reward is not active' });
        }

        const totalPointsCost = reward.pointsCost * data.quantity;

        // Check if user has enough points
        const balance = await prisma.pointsTransaction.aggregate({
          where: { userId },
          _sum: { amount: true },
        });

        if ((balance._sum.amount || 0) < totalPointsCost) {
          return reply.code(400).send({ error: 'Insufficient points balance' });
        }

        // Create redemption record
        const redemption = await prisma.rewardRedemption.create({
          data: {
            userId,
            rewardId: data.rewardId,
            quantity: data.quantity,
            pointsCost: totalPointsCost,
            status: 'PENDING',
            metadata: data.metadata,
          },
        });

        // Create points transaction for redemption
        await prisma.pointsTransaction.create({
          data: {
            userId,
            amount: -totalPointsCost,
            type: 'REDEEM',
            reason: `Redeemed ${data.quantity} ${reward.name}`,
            metadata: {
              redemptionId: redemption.id,
              rewardId: reward.id,
            },
          },
        });

        return reply.code(201).send(redemption);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to redeem reward' });
      }
    },
  });

  // Get user's reward redemptions
  fastify.get('/rewards/redemptions/:userId', {
    schema: {
      description: 'Get user\'s reward redemptions',
      tags: ['rewards'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'CANCELLED'] },
          limit: { type: 'number', default: 10 },
          offset: { type: 'number', default: 0 },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              rewardId: { type: 'string' },
              quantity: { type: 'number' },
              pointsCost: { type: 'number' },
              status: { type: 'string' },
              metadata: { type: 'object' },
              createdAt: { type: 'string' },
              reward: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  type: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const { status, limit, offset } = request.query as { 
          status?: string; 
          limit: number; 
          offset: number; 
        };

        const where: any = { userId };
        if (status) where.status = status;

        const redemptions = await prisma.rewardRedemption.findMany({
          where,
          include: {
            reward: {
              select: {
                id: true,
                name: true,
                description: true,
                type: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        });

        return redemptions;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch redemptions' });
      }
    },
  });

  // Update redemption status
  fastify.put('/rewards/redemptions/:id/status', {
    schema: {
      description: 'Update redemption status',
      tags: ['rewards'],
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
        required: ['status'],
        properties: {
          status: { 
            type: 'string',
            enum: ['PENDING', 'COMPLETED', 'CANCELLED']
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: string };

        const redemption = await prisma.rewardRedemption.update({
          where: { id },
          data: { status },
        });

        return {
          id: redemption.id,
          status: redemption.status,
          updatedAt: redemption.updatedAt,
        };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to update redemption status' });
      }
    },
  });
} 