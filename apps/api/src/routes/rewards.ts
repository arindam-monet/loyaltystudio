import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prismaPkg from '@prisma/client';
const { PrismaClient, WebhookEventType } = prismaPkg;
import { webhookService } from '../services/webhook.js';

const prisma = new PrismaClient();

const rewardSchema = z.object({
  name: z.string(),
  description: z.string(),
  pointsCost: z.number(),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'EXPERIENCE', 'COUPON']),
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
        required: ['name', 'description', 'pointsCost', 'type', 'loyaltyProgramId'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          pointsCost: { type: 'number' },
          type: { type: 'string', enum: ['PHYSICAL', 'DIGITAL', 'EXPERIENCE', 'COUPON'] },
          metadata: { type: 'object', additionalProperties: true },
          isActive: { type: 'boolean', default: true },
          loyaltyProgramId: { type: 'string', description: 'ID of the loyalty program this reward belongs to' }
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
        const user = request.user;

        // Verify that the loyalty program exists and belongs to the user's tenant
        const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
          where: {
            id: data.loyaltyProgramId,
            merchant: {
              tenantId: user.tenantId
            }
          },
          include: {
            merchant: true
          }
        });

        if (!loyaltyProgram) {
          return reply.code(404).send({
            error: 'Loyalty program not found',
            message: 'The specified loyalty program does not exist or you do not have access to it'
          });
        }

        // Verify that the merchant ID matches the request's merchant ID if it's set
        if (request.merchantId && loyaltyProgram.merchantId !== request.merchantId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have access to this merchant'
          });
        }

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
          include: {
            loyaltyProgram: true
          }
        });

        // Send webhook asynchronously
        webhookService.sendWebhook(
          loyaltyProgram.merchantId,
          WebhookEventType.reward_created,
          reward
        ).catch(error => request.log.error({ error }, 'Failed to send reward created webhook'));

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
        required: ['loyaltyProgramId'],
        properties: {
          loyaltyProgramId: { type: 'string' },
          isActive: { type: 'boolean' },
          type: { type: 'string', enum: ['PHYSICAL', 'DIGITAL', 'EXPERIENCE', 'COUPON'] },
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
        const { isActive, type, loyaltyProgramId } = request.query as { isActive?: boolean; type?: string; loyaltyProgramId?: string };
        const user = request.user;

        if (!loyaltyProgramId) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'loyaltyProgramId is required'
          });
        }

        // Verify that the loyalty program exists and belongs to the user's tenant
        const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
          where: {
            id: loyaltyProgramId,
            merchant: {
              tenantId: user.tenantId
            }
          }
        });

        if (!loyaltyProgram) {
          return reply.code(404).send({
            error: 'Loyalty program not found',
            message: 'The specified loyalty program does not exist or you do not have access to it'
          });
        }

        // Verify that the merchant ID matches the request's merchant ID if it's set
        if (request.merchantId && loyaltyProgram.merchantId !== request.merchantId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have access to this merchant'
          });
        }

        const where: any = {
          loyaltyProgramId
        };
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
        const user = request.user;

        // Find the reward and include the loyalty program and merchant
        const reward = await prisma.reward.findUnique({
          where: { id },
          include: {
            loyaltyProgram: {
              include: {
                merchant: true
              }
            }
          }
        });

        if (!reward) {
          return reply.code(404).send({ error: 'Reward not found' });
        }

        // Verify that the reward belongs to the user's tenant
        if (reward.loyaltyProgram.merchant.tenantId !== user.tenantId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have access to this reward'
          });
        }

        // Verify that the merchant ID matches the request's merchant ID if it's set
        if (request.merchantId && reward.loyaltyProgram.merchantId !== request.merchantId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have access to this merchant'
          });
        }

        return reward;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch reward' });
      }
    },
  });

  // Delete reward
  fastify.delete('/rewards/:id', {
    schema: {
      description: 'Delete a reward',
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
        204: {
          type: 'null',
          description: 'Reward deleted successfully'
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = request.user;

        // Find the reward and include the loyalty program and merchant
        const existingReward = await prisma.reward.findUnique({
          where: { id },
          include: {
            loyaltyProgram: {
              include: {
                merchant: true
              }
            }
          }
        });

        if (!existingReward) {
          return reply.code(404).send({ error: 'Reward not found' });
        }

        // Verify that the reward belongs to the user's tenant
        if (existingReward.loyaltyProgram.merchant.tenantId !== user.tenantId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have access to this reward'
          });
        }

        // Verify that the merchant ID matches the request's merchant ID if it's set
        if (request.merchantId && existingReward.loyaltyProgram.merchantId !== request.merchantId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have access to this merchant'
          });
        }

        // Store merchant ID for webhook
        const merchantId = existingReward.loyaltyProgram.merchantId;

        // Delete the reward
        await prisma.reward.delete({
          where: { id }
        });

        // Send webhook asynchronously
        webhookService.sendWebhook(
          merchantId,
          WebhookEventType.reward_deleted,
          {
            id,
            name: existingReward.name,
            loyaltyProgramId: existingReward.loyaltyProgramId,
            deletedAt: new Date().toISOString()
          }
        ).catch(error => request.log.error({ error }, 'Failed to send reward deleted webhook'));

        return reply.code(204).send();
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to delete reward' });
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
          type: { type: 'string', enum: ['PHYSICAL', 'DIGITAL', 'EXPERIENCE', 'COUPON'] },
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
        const user = request.user;

        // Find the reward and include the loyalty program and merchant
        const existingReward = await prisma.reward.findUnique({
          where: { id },
          include: {
            loyaltyProgram: {
              include: {
                merchant: true
              }
            }
          }
        });

        if (!existingReward) {
          return reply.code(404).send({ error: 'Reward not found' });
        }

        // Verify that the reward belongs to the user's tenant
        if (existingReward.loyaltyProgram.merchant.tenantId !== user.tenantId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have access to this reward'
          });
        }

        // Verify that the merchant ID matches the request's merchant ID if it's set
        if (request.merchantId && existingReward.loyaltyProgram.merchantId !== request.merchantId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have access to this merchant'
          });
        }

        // If loyaltyProgramId is being updated, verify that the new program belongs to the same merchant
        if (data.loyaltyProgramId && data.loyaltyProgramId !== existingReward.loyaltyProgramId) {
          const newProgram = await prisma.loyaltyProgram.findFirst({
            where: {
              id: data.loyaltyProgramId,
              merchantId: existingReward.loyaltyProgram.merchantId
            }
          });

          if (!newProgram) {
            return reply.code(403).send({
              error: 'Forbidden',
              message: 'Cannot move reward to a loyalty program from a different merchant'
            });
          }
        }

        const reward = await prisma.reward.update({
          where: { id },
          data,
          include: {
            loyaltyProgram: true
          }
        });

        // Send webhook asynchronously
        webhookService.sendWebhook(
          existingReward.loyaltyProgram.merchantId,
          WebhookEventType.reward_updated,
          reward
        ).catch(error => request.log.error({ error }, 'Failed to send reward updated webhook'));

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

        // Get reward details with loyalty program and merchant info
        const reward = await prisma.reward.findUnique({
          where: { id: data.rewardId },
          include: {
            loyaltyProgram: {
              include: {
                merchant: true
              }
            }
          }
        });

        if (!reward) {
          return reply.code(404).send({ error: 'Reward not found' });
        }

        // Verify that the reward belongs to the user's tenant
        if (reward.loyaltyProgram.merchant.tenantId !== request.user.tenantId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have access to this reward'
          });
        }

        // Verify that the merchant ID matches the request's merchant ID if it's set
        if (request.merchantId && reward.loyaltyProgram.merchantId !== request.merchantId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have access to this merchant'
          });
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
          include: {
            reward: true
          }
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

        // Send webhook asynchronously
        webhookService.sendWebhook(
          reward.loyaltyProgram.merchantId,
          WebhookEventType.reward_redeemed,
          {
            redemption,
            reward: {
              id: reward.id,
              name: reward.name,
              description: reward.description,
              type: reward.type,
              pointsCost: reward.pointsCost
            },
            userId: redemption.userId,
            timestamp: new Date().toISOString()
          }
        ).catch(error => request.log.error({ error }, 'Failed to send reward redeemed webhook'));

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

        // Get the user's tenant ID from the authenticated user
        const userTenantId = request.user.tenantId;

        // Build the where clause
        const where: any = { userId };
        if (status) where.status = status;

        // Get all rewards for the user's tenant and merchant (if specified)
        const rewards = await prisma.reward.findMany({
          where: {
            loyaltyProgram: {
              merchant: {
                tenantId: userTenantId,
                ...(request.merchantId ? { id: request.merchantId } : {})
              }
            }
          },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            loyaltyProgram: {
              select: {
                merchant: {
                  select: {
                    id: true,
                    tenantId: true
                  }
                }
              }
            }
          }
        });

        // Get the reward IDs that the user has access to
        const accessibleRewardIds = rewards.map(reward => reward.id);

        // Get redemptions for the accessible rewards
        const redemptions = await prisma.rewardRedemption.findMany({
          where: {
            ...where,
            rewardId: {
              in: accessibleRewardIds
            }
          },
          include: {
            reward: {
              select: {
                id: true,
                name: true,
                description: true,
                type: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
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

        // Get the redemption with reward and loyalty program info
        const existingRedemption = await prisma.rewardRedemption.findUnique({
          where: { id },
          include: {
            reward: {
              include: {
                loyaltyProgram: {
                  include: {
                    merchant: true
                  }
                }
              }
            }
          }
        });

        if (!existingRedemption) {
          return reply.code(404).send({ error: 'Redemption not found' });
        }

        // Verify that the redemption belongs to the user's tenant
        if (existingRedemption.reward.loyaltyProgram.merchant.tenantId !== request.user.tenantId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have access to this redemption'
          });
        }

        // Verify that the merchant ID matches the request's merchant ID if it's set
        if (request.merchantId && existingRedemption.reward.loyaltyProgram.merchantId !== request.merchantId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have access to this merchant'
          });
        }

        // Store previous status for webhook
        const previousStatus = existingRedemption.status;

        // Update the redemption status
        const redemption = await prisma.rewardRedemption.update({
          where: { id },
          data: { status },
        });

        // Send webhook for status change
        webhookService.sendWebhook(
          existingRedemption.reward.loyaltyProgram.merchantId,
          WebhookEventType.reward_redeemed,
          {
            redemption: {
              id: redemption.id,
              status: redemption.status,
              updatedAt: redemption.updatedAt
            },
            reward: {
              id: existingRedemption.reward.id,
              name: existingRedemption.reward.name
            },
            userId: existingRedemption.userId,
            statusChanged: true,
            previousStatus,
            timestamp: new Date().toISOString()
          }
        ).catch(error => request.log.error({ error }, 'Failed to send redemption status updated webhook'));

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