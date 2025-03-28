import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const loyaltyProgramSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
});

const defaultPointsRuleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'greaterThan', 'lessThan', 'contains']),
    value: z.any(),
  })),
  points: z.number(),
  metadata: z.record(z.any()).optional(),
});

const defaultRewardSchema = z.object({
  name: z.string(),
  description: z.string(),
  pointsCost: z.number(),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'EXPERIENCE']),
  metadata: z.record(z.any()).optional(),
});

export async function loyaltyProgramRoutes(fastify: FastifyInstance) {
  // Create loyalty program with default rules and rewards
  fastify.post('/loyalty-programs', {
    schema: {
      description: 'Create a new loyalty program with default rules and rewards',
      tags: ['loyalty-programs'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          metadata: { type: 'object', additionalProperties: true },
          isActive: { type: 'boolean', default: true },
          defaultRules: {
            type: 'array',
            items: {
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
            }
          },
          defaultRewards: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'description', 'pointsCost', 'type'],
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                pointsCost: { type: 'number' },
                type: { type: 'string', enum: ['PHYSICAL', 'DIGITAL', 'EXPERIENCE'] },
                metadata: { type: 'object', additionalProperties: true }
              }
            }
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            metadata: { type: 'object' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string' },
            rules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  points: { type: 'number' },
                  isActive: { type: 'boolean' }
                }
              }
            },
            rewards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  pointsCost: { type: 'number' },
                  type: { type: 'string' },
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const data = loyaltyProgramSchema.parse(request.body);
        const merchantId = request.user.merchantId; // From auth middleware

        // Create loyalty program with default rules and rewards
        const loyaltyProgram = await prisma.loyaltyProgram.create({
          data: {
            ...data,
            merchantId,
            pointsRules: {
              create: request.body.defaultRules?.map(rule => ({
                name: rule.name,
                description: rule.description,
                conditions: rule.conditions,
                points: rule.points,
                metadata: rule.metadata,
                isActive: true
              })) || []
            },
            rewards: {
              create: request.body.defaultRewards?.map(reward => ({
                name: reward.name,
                description: reward.description,
                pointsCost: reward.pointsCost,
                type: reward.type,
                metadata: reward.metadata,
                isActive: true
              })) || []
            }
          },
          include: {
            pointsRules: true,
            rewards: true
          }
        });

        return reply.code(201).send(loyaltyProgram);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to create loyalty program' });
      }
    }
  });

  // Get loyalty program details
  fastify.get('/loyalty-programs/:id', {
    schema: {
      description: 'Get loyalty program details',
      tags: ['loyalty-programs'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            metadata: { type: 'object' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string' },
            rules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  points: { type: 'number' },
                  isActive: { type: 'boolean' }
                }
              }
            },
            rewards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  pointsCost: { type: 'number' },
                  type: { type: 'string' },
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const merchantId = request.user.merchantId; // From auth middleware

        const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
          where: {
            id,
            merchantId
          },
          include: {
            pointsRules: true,
            rewards: true
          }
        });

        if (!loyaltyProgram) {
          return reply.code(404).send({ error: 'Loyalty program not found' });
        }

        return loyaltyProgram;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch loyalty program' });
      }
    }
  });

  // List merchant's loyalty programs
  fastify.get('/loyalty-programs', {
    schema: {
      description: 'List merchant\'s loyalty programs',
      tags: ['loyalty-programs'],
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
              isActive: { type: 'boolean' },
              createdAt: { type: 'string' }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const merchantId = request.user.merchantId; // From auth middleware

        const loyaltyPrograms = await prisma.loyaltyProgram.findMany({
          where: {
            merchantId
          },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            createdAt: true
          }
        });

        return loyaltyPrograms;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch loyalty programs' });
      }
    }
  });
} 