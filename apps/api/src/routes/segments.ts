import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Add interface for authenticated request
interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    tenantId: string;
    role: {
      id: string;
      name: string;
      description?: string;
    };
  };
}

const segmentSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  type: z.enum(['STATIC', 'DYNAMIC', 'HYBRID']),
  criteria: z.record(z.any()),
  isActive: z.boolean().default(true),
  loyaltyProgramId: z.string().cuid(),
});

export async function segmentRoutes(fastify: FastifyInstance) {
  // Get all segments for a loyalty program
  fastify.get('/segments', {
    schema: {
      tags: ['segments'],
      description: 'Get all segments for a loyalty program',
      querystring: {
        type: 'object',
        required: ['loyaltyProgramId'],
        properties: {
          loyaltyProgramId: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { loyaltyProgramId } = request.query as { loyaltyProgramId: string };

    try {
      const segments = await prisma.segment.findMany({
        where: {
          loyaltyProgramId,
        },
        include: {
          members: {
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
          createdAt: 'desc',
        },
      });

      return reply.send(segments);
    } catch (error) {
      console.error('Failed to fetch segments:', error);
      return reply.code(500).send({
        error: 'Failed to fetch segments',
      });
    }
  });

  // Create a new segment
  fastify.post('/segments', {
    schema: {
      tags: ['segments'],
      description: 'Create a new segment',
      body: {
        type: 'object',
        required: ['name', 'type', 'criteria', 'loyaltyProgramId'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 100 },
          description: { type: 'string' },
          type: { type: 'string', enum: ['STATIC', 'DYNAMIC', 'HYBRID'] },
          criteria: { type: 'object' },
          isActive: { type: 'boolean', default: true },
          loyaltyProgramId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const data = segmentSchema.parse(request.body);

    try {
      const segment = await prisma.segment.create({
        data,
        include: {
          members: true
        }
      });

      return reply.code(201).send(segment);
    } catch (error) {
      console.error('Failed to create segment:', error);
      return reply.code(500).send({
        error: 'Failed to create segment',
      });
    }
  });

  // Update a segment
  fastify.patch('/segments/:id', {
    schema: {
      tags: ['segments'],
      description: 'Update a segment',
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
          type: { type: 'string', enum: ['STATIC', 'DYNAMIC', 'HYBRID'] },
          criteria: { type: 'object' },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = segmentSchema.partial().parse(request.body);

    try {
      const segment = await prisma.segment.update({
        where: { id },
        data,
        include: {
          members: true
        }
      });

      return reply.send(segment);
    } catch (error) {
      console.error('Failed to update segment:', error);
      return reply.code(500).send({
        error: 'Failed to update segment',
      });
    }
  });

  // Delete a segment
  fastify.delete('/segments/:id', {
    schema: {
      tags: ['segments'],
      description: 'Delete a segment',
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
      await prisma.segment.delete({
        where: { id },
      });

      return reply.code(204).send();
    } catch (error) {
      console.error('Failed to delete segment:', error);
      return reply.code(500).send({
        error: 'Failed to delete segment',
      });
    }
  });

  // Get segment members
  fastify.get('/segments/:id/members', {
    schema: {
      tags: ['segments'],
      description: 'Get all members of a segment',
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
      const members = await prisma.segmentMember.findMany({
        where: {
          segmentId: id,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        },
        orderBy: {
          joinedAt: 'desc',
        },
      });

      return reply.send(members);
    } catch (error) {
      console.error('Failed to fetch segment members:', error);
      return reply.code(500).send({
        error: 'Failed to fetch segment members',
      });
    }
  });

  // Add member to segment
  fastify.post('/segments/:id/members', {
    schema: {
      tags: ['segments'],
      description: 'Add a member to a segment',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId, metadata } = request.body as { userId: string; metadata?: any };

    try {
      const member = await prisma.segmentMember.create({
        data: {
          segmentId: id,
          userId,
          metadata,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        }
      });

      return reply.code(201).send(member);
    } catch (error) {
      console.error('Failed to add member to segment:', error);
      return reply.code(500).send({
        error: 'Failed to add member to segment',
      });
    }
  });

  // Remove member from segment
  fastify.delete('/segments/:id/members/:userId', {
    schema: {
      tags: ['segments'],
      description: 'Remove a member from a segment',
      params: {
        type: 'object',
        required: ['id', 'userId'],
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id, userId } = request.params as { id: string; userId: string };

    try {
      await prisma.segmentMember.delete({
        where: {
          segmentId_userId: {
            segmentId: id,
            userId,
          },
        },
      });

      return reply.code(204).send();
    } catch (error) {
      console.error('Failed to remove member from segment:', error);
      return reply.code(500).send({
        error: 'Failed to remove member from segment',
      });
    }
  });
} 