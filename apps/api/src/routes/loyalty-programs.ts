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
        let merchantId = request.merchantId as string;

        console.log('LOYALTY PROGRAM CREATE ROUTE: Request headers:', JSON.stringify(request.headers));
        console.log('LOYALTY PROGRAM CREATE ROUTE: Merchant ID from request:', merchantId);
        console.log('LOYALTY PROGRAM CREATE ROUTE: Merchant ID from body:', data.merchantId);

        // Extract merchant ID directly from header as a fallback
        const headerMerchantId = request.headers['x-merchant-id'] as string;
        if (!merchantId && headerMerchantId) {
          console.log('LOYALTY PROGRAM CREATE ROUTE: Using merchant ID from header:', headerMerchantId);
          request.merchantId = headerMerchantId;
          merchantId = headerMerchantId;
        }

        // If merchantId is provided in the request body, ensure it matches the one from the header
        if (merchantId && data.merchantId !== merchantId) {
          console.log('LOYALTY PROGRAM CREATE ROUTE: Merchant ID mismatch');
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'Merchant ID in the request body must match the merchant ID in the header'
          });
        }

        // If no merchant ID is provided, return an error
        if (!merchantId && !data.merchantId) {
          console.log('LOYALTY PROGRAM CREATE ROUTE: No merchant ID found');
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'Merchant ID is required. Please select a merchant.'
          });
        }

        // If no merchant ID is provided in the header but is provided in the body, use the one from the body
        if (!merchantId && data.merchantId) {
          console.log('LOYALTY PROGRAM CREATE ROUTE: Using merchant ID from body:', data.merchantId);
          merchantId = data.merchantId;
          request.merchantId = data.merchantId;
        }

        const body = request.body as CreateLoyaltyProgramBody;
        // First create the loyalty program
        const loyaltyProgram = await prisma.loyaltyProgram.create({
          data: {
            name: data.name,
            description: data.description,
            merchantId: data.merchantId,
            settings: data.settings,
            metadata: data.metadata,
            isActive: data.isActive
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
      let merchantId = request.merchantId as string;

      console.log('LOYALTY PROGRAM DETAIL ROUTE: Request headers:', JSON.stringify(request.headers));
      console.log('LOYALTY PROGRAM DETAIL ROUTE: Merchant ID from request:', merchantId);

      // Extract merchant ID directly from header as a fallback
      const headerMerchantId = request.headers['x-merchant-id'] as string;
      if (!merchantId && headerMerchantId) {
        console.log('LOYALTY PROGRAM DETAIL ROUTE: Using merchant ID from header:', headerMerchantId);
        request.merchantId = headerMerchantId;
        merchantId = headerMerchantId;
      }

      if (!merchantId) {
        console.log('LOYALTY PROGRAM DETAIL ROUTE: No merchant ID found');
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Merchant ID is required. Please select a merchant.'
        });
      }

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
      let merchantId = request.merchantId as string;

      console.log('LOYALTY PROGRAMS ROUTE: Request headers:', JSON.stringify(request.headers));
      console.log('LOYALTY PROGRAMS ROUTE: Merchant ID from request:', merchantId);

      // Extract merchant ID directly from header as a fallback
      const headerMerchantId = request.headers['x-merchant-id'] as string;
      if (!merchantId && headerMerchantId) {
        console.log('LOYALTY PROGRAMS ROUTE: Using merchant ID from header:', headerMerchantId);
        request.merchantId = headerMerchantId;
        merchantId = headerMerchantId;
      }

      if (!merchantId) {
        console.log('LOYALTY PROGRAMS ROUTE: No merchant ID found');
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Merchant ID is required. Please select a merchant.'
        });
      }

      try {
        console.log(`Fetching loyalty programs for merchant: ${merchantId}`);

        const loyaltyPrograms = await prisma.loyaltyProgram.findMany({
          where: {
            merchantId,
            ...(includeInactive ? {} : { isActive: true })
          },
          include: {
            merchant: true,
            _count: {
              select: {
                tiers: true,
                rewards: true,
                campaigns: true
              }
            }
          }
        });

        console.log(`Found ${loyaltyPrograms.length} loyalty programs`);
        loyaltyPrograms.forEach(program => {
          console.log(`Program: ${program.id}, Merchant: ${program.merchantId}`);
        });

        // Remove merchant details from the response
        const sanitizedPrograms = loyaltyPrograms.map(program => {
          const { merchant, ...rest } = program;
          return rest;
        });

        return sanitizedPrograms;
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
      let merchantId = request.merchantId as string;
      const data = loyaltyProgramSchema.partial().parse(request.body);

      console.log('LOYALTY PROGRAM UPDATE ROUTE: Request headers:', JSON.stringify(request.headers));
      console.log('LOYALTY PROGRAM UPDATE ROUTE: Merchant ID from request:', merchantId);

      // Extract merchant ID directly from header as a fallback
      const headerMerchantId = request.headers['x-merchant-id'] as string;
      if (!merchantId && headerMerchantId) {
        console.log('LOYALTY PROGRAM UPDATE ROUTE: Using merchant ID from header:', headerMerchantId);
        request.merchantId = headerMerchantId;
        merchantId = headerMerchantId;
      }

      if (!merchantId) {
        console.log('LOYALTY PROGRAM UPDATE ROUTE: No merchant ID found');
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Merchant ID is required. Please select a merchant.'
        });
      }

      try {
        // First check if the loyalty program exists and belongs to the merchant
        const existingProgram = await prisma.loyaltyProgram.findFirst({
          where: {
            id,
            merchantId
          }
        });

        if (!existingProgram) {
          return reply.code(404).send({ error: 'Loyalty program not found' });
        }

        // Update the loyalty program
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
      },
      // Explicitly set body to be optional
      body: {
        type: ['object', 'null'],
        additionalProperties: true
      }
    },
    handler: async (request: FastifyRequest, reply) => {
      // Set CORS headers explicitly for this endpoint
      reply.header('Access-Control-Allow-Origin', '*');
      reply.header('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Handle preflight OPTIONS request
      if (request.method === 'OPTIONS') {
        return reply.code(204).send();
      }

      const { id } = request.params as { id: string };
      let merchantId = request.merchantId as string;

      console.log('LOYALTY PROGRAM DELETE ROUTE: Request headers:', JSON.stringify(request.headers));
      console.log('LOYALTY PROGRAM DELETE ROUTE: Merchant ID from request:', merchantId);

      // Extract merchant ID directly from header as a fallback
      const headerMerchantId = request.headers['x-merchant-id'] as string;
      if (!merchantId && headerMerchantId) {
        console.log('LOYALTY PROGRAM DELETE ROUTE: Using merchant ID from header:', headerMerchantId);
        request.merchantId = headerMerchantId;
        merchantId = headerMerchantId;
      }

      console.log(`Deleting loyalty program: ${id} for merchant: ${merchantId}`);

      if (!merchantId) {
        console.log('LOYALTY PROGRAM DELETE ROUTE: No merchant ID found');
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Merchant ID is required. Please select a merchant.'
        });
      }

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

        // First delete all related data
        // Delete program tiers and their members
        const tiers = await prisma.programTier.findMany({
          where: { loyaltyProgramId: id },
          include: { members: true }
        });

        // Delete program members first
        for (const tier of tiers) {
          if (tier.members.length > 0) {
            await prisma.programMember.deleteMany({
              where: { tierId: tier.id }
            });
          }
        }

        // Delete tiers
        await prisma.programTier.deleteMany({
          where: { loyaltyProgramId: id }
        });

        // Delete points rules
        await prisma.pointsRule.deleteMany({
          where: { loyaltyProgramId: id }
        });

        // Delete rewards (first check for redemptions)
        const rewards = await prisma.reward.findMany({
          where: { loyaltyProgramId: id },
          include: { redemptions: true }
        });

        // Delete reward redemptions first
        for (const reward of rewards) {
          if (reward.redemptions.length > 0) {
            await prisma.rewardRedemption.deleteMany({
              where: { rewardId: reward.id }
            });
          }
        }

        // Delete rewards
        await prisma.reward.deleteMany({
          where: { loyaltyProgramId: id }
        });

        // Delete segments and their members
        const segments = await prisma.segment.findMany({
          where: { loyaltyProgramId: id },
          include: { members: true }
        });

        // Delete segment members first
        for (const segment of segments) {
          if (segment.members.length > 0) {
            await prisma.segmentMember.deleteMany({
              where: { segmentId: segment.id }
            });
          }
        }

        // Delete segments
        await prisma.segment.deleteMany({
          where: { loyaltyProgramId: id }
        });

        // Delete campaigns and their participants
        const campaigns = await prisma.campaign.findMany({
          where: { loyaltyProgramId: id },
          include: { participants: true }
        });

        // Delete campaign participants first
        for (const campaign of campaigns) {
          if (campaign.participants.length > 0) {
            await prisma.campaignParticipant.deleteMany({
              where: { campaignId: campaign.id }
            });
          }
        }

        // Delete campaigns
        await prisma.campaign.deleteMany({
          where: { loyaltyProgramId: id }
        });

        // Finally delete the loyalty program
        await prisma.loyaltyProgram.delete({
          where: { id }
        });

        console.log(`Successfully deleted loyalty program: ${id}`);

        return reply.code(204).send();
      } catch (error) {
        console.error(`Error deleting loyalty program: ${id}`, error);
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to delete loyalty program' });
      }
    }
  });
}