import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PointsCalculationService } from '../services/points-calculation.js';

const prisma = new PrismaClient();
const pointsService = new PointsCalculationService();

const pointsTransactionSchema = z.object({
  amount: z.number(),
  type: z.enum(['EARN', 'REDEEM', 'ADJUST']),
  reason: z.string(),
  metadata: z.record(z.any()).optional(),
});

const ruleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any(),
  })),
  points: z.number(),
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
    handler: async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const merchantId = request.user.merchantId;

        const balance = await prisma.pointsTransaction.aggregate({
          where: {
            userId,
            merchantId,
          },
          _sum: {
            amount: true,
          },
        });

        const lifetimePoints = await prisma.pointsTransaction.aggregate({
          where: {
            userId,
            merchantId,
            type: 'EARN',
          },
          _sum: {
            amount: true,
          },
        });

        const redeemedPoints = await prisma.pointsTransaction.aggregate({
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
        const member = await prisma.programMember.findFirst({
          where: {
            userId,
            loyaltyProgram: {
              merchantId,
            },
          },
          include: {
            tier: true,
          },
        });

        let nextTierPoints = 0;
        let tierProgress = 0;

        if (member) {
          const tiers = await prisma.programTier.findMany({
            where: {
              loyaltyProgramId: member.loyaltyProgramId,
            },
            orderBy: {
              pointsThreshold: 'asc',
            },
          });

          const currentTierIndex = tiers.findIndex(t => t.id === member.tierId);
          if (currentTierIndex < tiers.length - 1) {
            nextTierPoints = tiers[currentTierIndex + 1].pointsThreshold - member.points;
            tierProgress = (member.points / tiers[currentTierIndex + 1].pointsThreshold) * 100;
          }
        }

        return {
          balance: balance._sum.amount || 0,
          lifetimePoints: lifetimePoints._sum.amount || 0,
          redeemedPoints: Math.abs(redeemedPoints._sum.amount || 0),
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
    handler: async (request, reply) => {
      try {
        const data = pointsTransactionSchema.parse(request.body);
        const userId = request.user.id;
        const merchantId = request.user.merchantId;

        // For REDEEM transactions, check if user has enough points
        if (data.type === 'REDEEM') {
          const balance = await prisma.pointsTransaction.aggregate({
            where: { 
              userId,
              merchantId,
            },
            _sum: { amount: true },
          });

          if ((balance._sum.amount || 0) + data.amount < 0) {
            return reply.code(400).send({ error: 'Insufficient points balance' });
          }
        }

        // Calculate points if it's an EARN transaction
        let finalAmount = data.amount;
        if (data.type === 'EARN') {
          const calculation = await pointsService.calculatePoints({
            userId,
            merchantId,
            amount: data.amount,
            type: data.type,
            metadata: data.metadata,
          });
          finalAmount = calculation.totalPoints;
        }

        const transaction = await prisma.pointsTransaction.create({
          data: {
            ...data,
            amount: finalAmount,
            userId,
            merchantId,
          },
        });

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
    handler: async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const { limit, offset, type } = request.query as { 
          limit: number; 
          offset: number;
          type?: string;
        };
        const merchantId = request.user.merchantId;

        const where: any = { 
          userId,
          merchantId,
        };
        if (type) where.type = type;

        const transactions = await prisma.pointsTransaction.findMany({
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

  // Create points rule
  fastify.post('/points/rules', {
    schema: {
      description: 'Create a points rule',
      tags: ['points'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'conditions', 'points'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          conditions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['field', 'operator', 'value'],
              properties: {
                field: { type: 'string' },
                operator: { 
                  type: 'string',
                  enum: ['equals', 'greaterThan', 'lessThan', 'contains']
                },
                value: { 
                  oneOf: [
                    { type: 'string' },
                    { type: 'number' },
                    { type: 'boolean' },
                    { type: 'array' },
                    { type: 'object' }
                  ]
                }
              }
            }
          },
          points: { type: 'number' },
          metadata: { type: 'object', additionalProperties: true }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            conditions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  operator: { type: 'string' },
                  value: { 
                    oneOf: [
                      { type: 'string' },
                      { type: 'number' },
                      { type: 'boolean' },
                      { type: 'array' },
                      { type: 'object' }
                    ]
                  }
                }
              }
            },
            points: { type: 'number' },
            metadata: { type: 'object' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const data = ruleSchema.parse(request.body);

        const rule = await prisma.pointsRule.create({
          data,
        });

        return reply.code(201).send(rule);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to create points rule' });
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
    handler: async (request, reply) => {
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
          for (const condition of rule.conditions) {
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