import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { AuthUser } from '../types/auth.js';

const prisma = new PrismaClient();

const pointsRuleSchema = z.object({
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

export async function pointsRulesRoutes(fastify: FastifyInstance) {
  // Get all points rules for a loyalty program
  fastify.get('/loyalty-programs/:programId/points-rules', {
    schema: {
      description: 'Get all points rules for a loyalty program',
      tags: ['points-rules'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['programId'],
        properties: {
          programId: { type: 'string' }
        }
      }
    },
    handler: async (request: FastifyRequest, reply) => {
      const { programId } = request.params as { programId: string };
      const merchantId = (request.user as AuthUser).merchantId;

      try {
        // First check if the loyalty program exists and belongs to the merchant
        const program = await prisma.loyaltyProgram.findFirst({
          where: {
            id: programId,
            merchantId
          }
        });

        if (!program) {
          return reply.code(404).send({ error: 'Loyalty program not found' });
        }

        // Get all points rules for the loyalty program
        const pointsRules = await prisma.pointsRule.findMany({
          where: {
            loyaltyProgramId: programId
          }
        });

        return pointsRules;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch points rules' });
      }
    }
  });

  // Update points rules for a loyalty program
  fastify.put('/loyalty-programs/:programId/points-rules', {
    schema: {
      description: 'Update points rules for a loyalty program',
      tags: ['points-rules'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['programId'],
        properties: {
          programId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['pointsRules'],
        properties: {
          pointsRules: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'type', 'conditions', 'points'],
              properties: {
                id: { type: 'string' },
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
          }
        }
      }
    },
    handler: async (request: FastifyRequest, reply) => {
      const { programId } = request.params as { programId: string };
      const { pointsRules } = request.body as { pointsRules: any[] };
      const merchantId = (request.user as AuthUser).merchantId;

      try {
        // First check if the loyalty program exists and belongs to the merchant
        const program = await prisma.loyaltyProgram.findFirst({
          where: {
            id: programId,
            merchantId
          }
        });

        if (!program) {
          return reply.code(404).send({ error: 'Loyalty program not found' });
        }

        // Start a transaction to update the points rules
        const result = await prisma.$transaction(async (tx) => {
          // Delete all existing points rules for the loyalty program
          await tx.pointsRule.deleteMany({
            where: {
              loyaltyProgramId: programId
            }
          });

          // Create new points rules
          const newRules = await Promise.all(
            pointsRules.map(rule =>
              tx.pointsRule.create({
                data: {
                  ...rule,
                  loyaltyProgramId: programId
                }
              })
            )
          );

          return newRules;
        });

        return reply.code(200).send(result);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to update points rules' });
      }
    }
  });

  // Create a single points rule
  fastify.post('/loyalty-programs/:programId/points-rules', {
    schema: {
      description: 'Create a points rule for a loyalty program',
      tags: ['points-rules'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['programId'],
        properties: {
          programId: { type: 'string' }
        }
      },
      body: {
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
    handler: async (request: FastifyRequest, reply) => {
      const { programId } = request.params as { programId: string };
      const data = pointsRuleSchema.parse(request.body);
      const merchantId = (request.user as AuthUser).merchantId;

      try {
        // First check if the loyalty program exists and belongs to the merchant
        const program = await prisma.loyaltyProgram.findFirst({
          where: {
            id: programId,
            merchantId
          }
        });

        if (!program) {
          return reply.code(404).send({ error: 'Loyalty program not found' });
        }

        // Create the points rule
        const pointsRule = await prisma.pointsRule.create({
          data: {
            name: data.name,
            description: data.description,
            type: data.type,
            conditions: data.conditions,
            points: data.points,
            maxPoints: data.maxPoints,
            minAmount: data.minAmount,
            categoryRules: data.categoryRules,
            timeRules: data.timeRules,
            metadata: data.metadata,
            isActive: data.isActive,
            loyaltyProgram: {
              connect: {
                id: programId
              }
            }
          }
        });

        return reply.code(201).send(pointsRule);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to create points rule' });
      }
    }
  });

  // Update a single points rule
  fastify.patch('/points-rules/:id', {
    schema: {
      description: 'Update a points rule',
      tags: ['points-rules'],
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
          type: { type: 'string', enum: ['FIXED', 'PERCENTAGE', 'DYNAMIC'] },
          conditions: { type: 'object', additionalProperties: true },
          points: { type: 'number' },
          maxPoints: { type: 'number' },
          minAmount: { type: 'number' },
          categoryRules: { type: 'object', additionalProperties: true },
          timeRules: { type: 'object', additionalProperties: true },
          metadata: { type: 'object', additionalProperties: true },
          isActive: { type: 'boolean' }
        }
      }
    },
    handler: async (request: FastifyRequest, reply) => {
      const { id } = request.params as { id: string };
      const data = pointsRuleSchema.partial().parse(request.body);
      const merchantId = (request.user as AuthUser).merchantId;

      try {
        // First check if the points rule exists and belongs to the merchant
        const pointsRule = await prisma.pointsRule.findFirst({
          where: {
            id,
            loyaltyProgram: {
              merchantId
            }
          },
          include: {
            loyaltyProgram: true
          }
        });

        if (!pointsRule) {
          return reply.code(404).send({ error: 'Points rule not found' });
        }

        // Update the points rule
        const updatedPointsRule = await prisma.pointsRule.update({
          where: {
            id
          },
          data
        });

        return reply.code(200).send(updatedPointsRule);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to update points rule' });
      }
    }
  });

  // Delete a single points rule
  fastify.delete('/points-rules/:id', {
    schema: {
      description: 'Delete a points rule',
      tags: ['points-rules'],
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
        // First check if the points rule exists and belongs to the merchant
        const pointsRule = await prisma.pointsRule.findFirst({
          where: {
            id,
            loyaltyProgram: {
              merchantId
            }
          }
        });

        if (!pointsRule) {
          return reply.code(404).send({ error: 'Points rule not found' });
        }

        // Delete the points rule
        await prisma.pointsRule.delete({
          where: {
            id
          }
        });

        return reply.code(204).send();
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to delete points rule' });
      }
    }
  });
}
