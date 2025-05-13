import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { WebhookEventType } from '@prisma/client';
import { PointsCalculationService } from '../services/points-calculation.js';
import { webhookService } from '../services/webhook.js';

// Define the AuthUser interface
interface AuthUser {
  id: string;
  email: string;
  tenantId: string;
  merchantId?: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
}

const prisma = new PrismaClient();
const pointsService = new PointsCalculationService();

// Points transaction schema
const pointsTransactionSchema = z.object({
  amount: z.number(),
  type: z.enum(['EARN', 'REDEEM', 'ADJUST']),
  reason: z.string(),
  metadata: z.record(z.any()).optional(),
});

export async function pointsRoutes(fastify: FastifyInstance) {
  // Get points balance for a user
  fastify.get('/points/balance/:userId', {
    schema: {
      description: 'Get points balance for a user',
      tags: ['points'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            balance: { type: 'number' },
            lifetimePoints: { type: 'number' },
            redeemedPoints: { type: 'number' },
            nextTierPoints: { type: 'number' },
            tierProgress: { type: 'number' },
          },
        },
      },
    },
    handler: async (request: FastifyRequest, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const merchantId = (request.user as AuthUser).merchantId;

        if (!merchantId) {
          return reply.code(400).send({ error: 'Merchant ID is required' });
        }

        // Use type assertion for Prisma client to handle custom fields
        const prismaAny = prisma as any;

        const balance = await prismaAny.pointsTransaction.aggregate({
          where: {
            userId,
            merchantId,
          },
          _sum: {
            amount: true,
          },
        });

        const lifetimePoints = await prismaAny.pointsTransaction.aggregate({
          where: {
            userId,
            merchantId,
            type: 'EARN',
          },
          _sum: {
            amount: true,
          },
        });

        const redeemedPoints = await prismaAny.pointsTransaction.aggregate({
          where: {
            userId,
            merchantId,
            type: 'REDEEM',
          },
          _sum: {
            amount: true,
          },
        });

        // Get tier progress
        const member = await prismaAny.programMember.findFirst({
          where: {
            userId,
            loyaltyProgram: {
              merchantId,
            },
          },
          include: {
            tier: true,
            loyaltyProgram: true,
          },
        });

        let nextTierPoints = 0;
        let tierProgress = 0;

        if (member) {
          const tiers = await prisma.programTier.findMany({
            where: {
              loyaltyProgramId: member.loyaltyProgramId || member.loyaltyProgram?.id,
            },
            orderBy: {
              pointsThreshold: 'asc',
            },
          });

          const currentTierIndex = tiers.findIndex(t => t.id === member.tierId);
          if (currentTierIndex >= 0 && currentTierIndex < tiers.length - 1 && tiers[currentTierIndex + 1]) {
            // Use pointsBalance instead of points
            const nextTier = tiers[currentTierIndex + 1];
            const memberPoints = member.pointsBalance || 0;

            if (nextTier && nextTier.pointsThreshold) {
              nextTierPoints = nextTier.pointsThreshold - memberPoints;
              tierProgress = (memberPoints / nextTier.pointsThreshold) * 100;
            }
          }
        }

        return {
          balance: balance?._sum?.amount || 0,
          lifetimePoints: lifetimePoints?._sum?.amount || 0,
          redeemedPoints: Math.abs(redeemedPoints?._sum?.amount || 0),
          nextTierPoints,
          tierProgress,
        };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch points balance' });
      }
    },
  });

  // Create points transaction
  fastify.post('/points/transaction', {
    schema: {
      description: 'Create a points transaction',
      tags: ['points'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['amount', 'type', 'reason'],
        properties: {
          amount: { type: 'number' },
          type: { type: 'string', enum: ['EARN', 'REDEEM', 'ADJUST'] },
          reason: { type: 'string' },
          metadata: { type: 'object', additionalProperties: true }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            amount: { type: 'number' },
            type: { type: 'string' },
            reason: { type: 'string' },
            metadata: { type: 'object' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
    handler: async (request: FastifyRequest, reply) => {
      try {
        const data = pointsTransactionSchema.parse(request.body);
        const userId = request.user.id;
        const merchantId = (request.user as AuthUser).merchantId;

        if (!merchantId) {
          return reply.code(400).send({ error: 'Merchant ID is required' });
        }

        // Use type assertion for Prisma client to handle custom fields
        const prismaAny = prisma as any;

        // For REDEEM transactions, check if user has enough points
        if (data.type === 'REDEEM') {
          const balance = await prismaAny.pointsTransaction.aggregate({
            where: {
              userId,
              merchantId,
            },
            _sum: { amount: true },
          });

          if ((balance?._sum?.amount || 0) + data.amount < 0) {
            return reply.code(400).send({ error: 'Insufficient points balance' });
          }
        }

        // Calculate points if it's an EARN transaction
        let finalAmount = data.amount;
        if (data.type === 'EARN') {
          const calculation = await pointsService.calculatePoints({
            userId,
            merchantId,
            transactionAmount: data.amount, // Use the correct field name
            loyaltyProgramId: data.metadata?.loyaltyProgramId || 'default', // Provide a default or get from metadata
            metadata: data.metadata,
          });
          finalAmount = calculation.totalPoints;
        }

        const transaction = await prismaAny.pointsTransaction.create({
          data: {
            ...data,
            amount: finalAmount,
            userId,
            merchantId,
          },
        });

        // Trigger webhook based on transaction type
        let eventType: WebhookEventType;
        switch (data.type) {
          case 'EARN':
            eventType = WebhookEventType.points_earned;
            break;
          case 'REDEEM':
            eventType = WebhookEventType.points_redeemed;
            break;
          case 'ADJUST':
            eventType = WebhookEventType.points_adjusted;
            break;
          default:
            eventType = WebhookEventType.transaction_created;
        }

        // Send webhook asynchronously (don't await)
        webhookService.sendWebhook(merchantId, eventType, transaction)
          .catch(error => request.log.error({ error }, 'Failed to send webhook'));

        return reply.code(201).send(transaction);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to create points transaction' });
      }
    },
  });

  // Get points transaction history
  fastify.get('/points/transactions/:userId', {
    schema: {
      description: 'Get points transaction history for a user',
      tags: ['points'],
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
          limit: { type: 'number', default: 10 },
          offset: { type: 'number', default: 0 },
          type: { type: 'string', enum: ['EARN', 'REDEEM', 'ADJUST'] },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              amount: { type: 'number' },
              type: { type: 'string' },
              reason: { type: 'string' },
              metadata: { type: 'object' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    handler: async (request: FastifyRequest, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const { limit, offset, type } = request.query as {
          limit: number;
          offset: number;
          type?: string;
        };
        const merchantId = (request.user as AuthUser).merchantId;

        if (!merchantId) {
          return reply.code(400).send({ error: 'Merchant ID is required' });
        }

        // Use type assertion for Prisma client to handle custom fields
        const prismaAny = prisma as any;

        const where: any = {
          userId,
          merchantId,
        };
        if (type) where.type = type;

        const transactions = await prismaAny.pointsTransaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        });

        return transactions;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch transaction history' });
      }
    },
  });

  // Calculate points for an event
  fastify.post('/points/calculate', {
    schema: {
      description: 'Calculate points for an event based on rules',
      tags: ['points'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['eventData'],
        properties: {
          eventData: {
            type: 'object',
            additionalProperties: true
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            points: { type: 'number' },
            matchedRules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  ruleId: { type: 'string' },
                  points: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest, reply) => {
      try {
        const { eventData } = request.body as { eventData: Record<string, any> };

        // Get all active rules
        const rules = await prisma.pointsRule.findMany({
          where: { isActive: true }
        });

        let totalPoints = 0;
        const matchedRules = [];

        // Check each rule against the event data
        for (const rule of rules) {
          let matches = true;
          // Type assertion for rule.conditions
          const conditions = rule.conditions as Array<{
            field: string;
            operator: string;
            value: any;
          }>;

          if (!conditions || !Array.isArray(conditions)) {
            continue; // Skip rules with invalid conditions
          }

          for (const condition of conditions) {
            const value = eventData[condition.field];
            if (!value) {
              matches = false;
              break;
            }

            switch (condition.operator) {
              case 'equals':
                if (value !== condition.value) matches = false;
                break;
              case 'greaterThan':
                if (value <= condition.value) matches = false;
                break;
              case 'lessThan':
                if (value >= condition.value) matches = false;
                break;
              case 'contains':
                if (!value.includes(condition.value)) matches = false;
                break;
              default:
                matches = false;
            }

            if (!matches) break;
          }

          if (matches) {
            totalPoints += rule.points;
            matchedRules.push({
              ruleId: rule.id,
              points: rule.points
            });
          }
        }

        return {
          points: totalPoints,
          matchedRules
        };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to calculate points' });
      }
    }
  });
}