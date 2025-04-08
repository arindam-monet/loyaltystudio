import { FastifyInstance } from 'fastify';
import { AIProgramGeneratorService } from '../services/ai-program-generator.js';

export async function aiProgramGeneratorRoutes(fastify: FastifyInstance) {
  const aiProgramGenerator = new AIProgramGeneratorService();

  // Generate a loyalty program with AI
  fastify.post('/ai/generate-loyalty-program', {
    schema: {
      description: 'Generate a loyalty program using AI based on merchant details',
      tags: ['ai', 'loyalty-programs'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['merchantId'],
        properties: {
          merchantId: { type: 'string' },
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            program: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                settings: {
                  type: 'object',
                  properties: {
                    pointsName: { type: 'string' },
                    currency: { type: 'string' },
                    timezone: { type: 'string' },
                  }
                },
                rules: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      type: { type: 'string' },
                      points: { type: 'number' },
                      conditions: { type: 'object' },
                      minAmount: { type: 'number' },
                      maxPoints: { type: 'number' },
                    }
                  }
                },
                tiers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      pointsThreshold: { type: 'number' },
                      benefits: { type: 'object' },
                    }
                  }
                },
                rewards: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      type: { type: 'string' },
                      pointsCost: { type: 'number' },
                      validityPeriod: { type: 'number' },
                      redemptionLimit: { type: 'number' },
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { merchantId } = request.body as { merchantId: string };

        // Check authentication - simplified for now
        // We'll assume the request is authenticated through the API's auth middleware
        // and the user has access to the merchant

        // Generate the loyalty program
        const program = await aiProgramGenerator.generateLoyaltyProgram(merchantId);

        return reply.send({ program });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: 'Failed to generate loyalty program',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });
}
