import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const loyaltyProgramSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  merchantId: z.string().cuid(),
  settings: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
});

const defaultPointsRuleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['FIXED', 'PERCENTAGE', 'DYNAMIC']),
  conditions: z.record(z.any()),
  points: z.number(),
  maxPoints: z.number().optional(),
  minAmount: z.number().optional(),
  categoryRules: z.record(z.any()).optional(),
  timeRules: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
});

const defaultRewardSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'EXPERIENCE', 'COUPON']),
  pointsCost: z.number(),
  stock: z.number().optional(),
  validityPeriod: z.number().optional(),
  redemptionLimit: z.number().optional(),
  conditions: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
});

const defaultTierSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  pointsThreshold: z.number(),
  benefits: z.record(z.any()).optional(),
});

interface CreateLoyaltyProgramBody {
  defaultRules?: Array<{
    name: string;
    description?: string;
    type: string;
    conditions: Record<string, any>;
    points: number;
    maxPoints?: number;
    minAmount?: number;
    categoryRules?: Record<string, any>;
    timeRules?: Record<string, any>;
    metadata?: Record<string, any>;
    isActive?: boolean;
  }>;
  defaultRewards?: Array<{
    name: string;
    description: string;
    type: string;
    pointsCost: number;
    stock?: number;
    validityPeriod?: number;
    redemptionLimit?: number;
    conditions?: Record<string, any>;
    metadata?: Record<string, any>;
    isActive?: boolean;
  }>;
  defaultTiers?: Array<{
    name: string;
    description?: string;
    pointsThreshold: number;
    benefits?: Record<string, any>;
  }>;
}

interface AuthUser {
  id: string;
  email: string;
  tenantId: string;
  merchantId: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
}

interface AuthenticatedRequest extends FastifyRequest {
  user: AuthUser;
}

export async function loyaltyProgramRoutes(fastify: FastifyInstance) {
  // Create loyalty program with default rules, rewards, and tiers
  fastify.post('/loyalty-programs', {
    schema: {
      description: 'Create a new loyalty program with default rules, rewards, and tiers',
      tags: ['loyalty-programs'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'merchantId'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          merchantId: { type: 'string' },
          settings: { type: 'object', additionalProperties: true },
          metadata: { type: 'object', additionalProperties: true },
          isActive: { type: 'boolean', default: true },
          defaultRules: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'type', 'conditions', 'points'],
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string', enum: ['FIXED', 'PERCENTAGE', 'DYNAMIC'] },
                conditions: { type: 'object', additionalProperties: true },
                points: { type: 'number' },
                maxPoints: { type: 'number' },
                minAmount: { type: 'number' },
                categoryRules: { type: 'object', additionalProperties: true },
                timeRules: { type: 'object', additionalProperties: true },
                metadata: { type: 'object', additionalProperties: true },
                isActive: { type: 'boolean', default: true }
              }
            }
          },
          defaultRewards: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'description', 'type', 'pointsCost'],
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string', enum: ['PHYSICAL', 'DIGITAL', 'EXPERIENCE', 'COUPON'] },
                pointsCost: { type: 'number' },
                stock: { type: 'number' },
                validityPeriod: { type: 'number' },
                redemptionLimit: { type: 'number' },
                conditions: { type: 'object', additionalProperties: true },
                metadata: { type: 'object', additionalProperties: true },
                isActive: { type: 'boolean', default: true }
              }
            }
          },
          defaultTiers: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'pointsThreshold'],
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                pointsThreshold: { type: 'number' },
                benefits: { type: 'object', additionalProperties: true }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const data = loyaltyProgramSchema.parse(request.body);

        const body = request.body as CreateLoyaltyProgramBody;
        // First create the loyalty program
        const loyaltyProgram = await prisma.loyaltyProgram.create({
          data: {
            ...data,
          },
        });

        // Then create related entities with the correct loyaltyProgramId
        if (body.defaultRules && body.defaultRules.length > 0) {
          await prisma.pointsRule.createMany({
            data: body.defaultRules.map(rule => ({
              ...rule,
              loyaltyProgramId: loyaltyProgram.id,
            })),
          });
        }

        if (body.defaultRewards && body.defaultRewards.length > 0) {
          await prisma.reward.createMany({
            data: body.defaultRewards.map(reward => ({
              ...reward,
              loyaltyProgramId: loyaltyProgram.id,
            })),
          });
        }

        if (body.defaultTiers && body.defaultTiers.length > 0) {
          await prisma.programTier.createMany({
            data: body.defaultTiers.map(tier => ({
              ...tier,
              loyaltyProgramId: loyaltyProgram.id,
            })),
          });
        }

        // Fetch the complete loyalty program with related entities
        const completeProgram = await prisma.loyaltyProgram.findUnique({
          where: { id: loyaltyProgram.id },
          include: {
            pointsRules: true,
            rewards: true,
            tiers: true
          }
        });

        return reply.code(201).send(completeProgram);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to create loyalty program' });
      }
    }
  });

  // Get loyalty program details with all related data
  fastify.get('/loyalty-programs/:id', {
    schema: {
      description: 'Get loyalty program details with all related data',
      tags: ['loyalty-programs'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    },
    handler: async (request: FastifyRequest, reply) => {
      const { id } = request.params as { id: string };
      const merchantId = (request.user as AuthUser).merchantId;

      try {
        const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
          where: {
            id,
            merchantId
          },
          include: {
            pointsRules: true,
            rewards: true,
            tiers: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        name: true
                      }
                    }
                  }
                }
              }
            },
            campaigns: true,
            segments: true
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

  // List merchant's loyalty programs with basic info
  fastify.get('/loyalty-programs', {
    schema: {
      description: 'List merchant\'s loyalty programs with basic info',
      tags: ['loyalty-programs'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          includeInactive: { type: 'boolean', default: false }
        }
      }
    },
    handler: async (request: FastifyRequest, reply) => {
      const { includeInactive } = request.query as { includeInactive?: boolean };
      const merchantId = (request.user as AuthUser).merchantId;

      try {
        const loyaltyPrograms = await prisma.loyaltyProgram.findMany({
          where: {
            merchantId,
            ...(includeInactive ? {} : { isActive: true })
          },
          include: {
            _count: {
              select: {
                tiers: true,
                rewards: true,
                campaigns: true
              }
            }
          }
        });

        return loyaltyPrograms;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch loyalty programs' });
      }
    }
  });

  // Update loyalty program settings and metadata
  fastify.patch('/loyalty-programs/:id', {
    schema: {
      description: 'Update loyalty program settings and metadata',
      tags: ['loyalty-programs'],
      security: [{ bearerAuth: [] }],
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
          name: { type: 'string' },
          description: { type: 'string' },
          settings: { type: 'object', additionalProperties: true },
          metadata: { type: 'object', additionalProperties: true },
          isActive: { type: 'boolean' }
        }
      }
    },
    handler: async (request: FastifyRequest, reply) => {
      const { id } = request.params as { id: string };
      const merchantId = (request.user as AuthUser).merchantId;
      const data = loyaltyProgramSchema.partial().parse(request.body);

      try {
        const loyaltyProgram = await prisma.loyaltyProgram.update({
          where: {
            id,
            merchantId
          },
          data
        });

        return reply.send(loyaltyProgram);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to update loyalty program' });
      }
    }
  });

  // Delete loyalty program
  fastify.delete('/loyalty-programs/:id', {
    schema: {
      description: 'Delete a loyalty program',
      tags: ['loyalty-programs'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    },
    handler: async (request: FastifyRequest, reply) => {
      const { id } = request.params as { id: string };
      const merchantId = (request.user as AuthUser).merchantId;

      try {
        // Check if program exists and belongs to merchant
        const program = await prisma.loyaltyProgram.findFirst({
          where: {
            id,
            merchantId
          }
        });

        if (!program) {
          return reply.code(404).send({ error: 'Loyalty program not found' });
        }

        // Delete program and all related data
        await prisma.loyaltyProgram.delete({
          where: { id }
        });

        return reply.code(204).send();
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to delete loyalty program' });
      }
    }
  });
}