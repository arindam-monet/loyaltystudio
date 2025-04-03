import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const memberSchema = z.object({
  userId: z.string().cuid(),
  loyaltyProgramId: z.string().cuid(),
  tierId: z.string().cuid().optional(),
  points: z.number().min(0).default(0),
  metadata: z.record(z.any()).optional(),
});

export async function programMemberRoutes(fastify: FastifyInstance) {
  // Get all members of a loyalty program
  fastify.get('/program-members', {
    schema: {
      tags: ['program-members'],
      description: 'Get all members of a loyalty program',
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
      const members = await prisma.programMember.findMany({
        where: {
          loyaltyProgramId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          },
          tier: true,
        },
        orderBy: {
          points: 'desc',
        },
      });

      return reply.send(members);
    } catch (error) {
      console.error('Failed to fetch program members:', error);
      return reply.code(500).send({
        error: 'Failed to fetch program members',
      });
    }
  });

  // Add a member to a loyalty program
  fastify.post('/program-members', {
    schema: {
      tags: ['program-members'],
      description: 'Add a member to a loyalty program',
      body: {
        type: 'object',
        required: ['userId', 'loyaltyProgramId'],
        properties: {
          userId: { type: 'string' },
          loyaltyProgramId: { type: 'string' },
          tierId: { type: 'string' },
          points: { type: 'number', minimum: 0 },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    const data = memberSchema.parse(request.body);

    try {
      const member = await prisma.programMember.create({
        data: {
          ...data,
          joinedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          },
          tier: true,
        }
      });

      return reply.code(201).send(member);
    } catch (error) {
      console.error('Failed to add program member:', error);
      return reply.code(500).send({
        error: 'Failed to add program member',
      });
    }
  });

  // Update a member
  fastify.patch('/program-members/:id', {
    schema: {
      tags: ['program-members'],
      description: 'Update a program member',
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
          tierId: { type: 'string' },
          points: { type: 'number', minimum: 0 },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = memberSchema.partial().parse(request.body);

    try {
      const member = await prisma.programMember.update({
        where: { id },
        data,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          },
          tier: true,
        }
      });

      return reply.send(member);
    } catch (error) {
      console.error('Failed to update program member:', error);
      return reply.code(500).send({
        error: 'Failed to update program member',
      });
    }
  });

  // Remove a member from a loyalty program
  fastify.delete('/program-members/:id', {
    schema: {
      tags: ['program-members'],
      description: 'Remove a member from a loyalty program',
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
      await prisma.programMember.delete({
        where: { id },
      });

      return reply.code(204).send();
    } catch (error) {
      console.error('Failed to remove program member:', error);
      return reply.code(500).send({
        error: 'Failed to remove program member',
      });
    }
  });

  // Add points to a member
  fastify.post('/program-members/:id/points', {
    schema: {
      tags: ['program-members'],
      description: 'Add points to a program member',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['points'],
        properties: {
          points: { type: 'number', minimum: 0 },
          reason: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { points, reason } = request.body as { points: number; reason?: string };

    try {
      const member = await prisma.programMember.update({
        where: { id },
        data: {
          points: {
            increment: points
          },
          pointsHistory: {
            create: {
              points,
              type: 'EARNED',
              reason: reason || 'Points added',
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          },
          tier: true,
        }
      });

      return reply.send(member);
    } catch (error) {
      console.error('Failed to add points to member:', error);
      return reply.code(500).send({
        error: 'Failed to add points to member',
      });
    }
  });

  // Deduct points from a member
  fastify.post('/program-members/:id/deduct-points', {
    schema: {
      tags: ['program-members'],
      description: 'Deduct points from a program member',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['points'],
        properties: {
          points: { type: 'number', minimum: 0 },
          reason: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { points, reason } = request.body as { points: number; reason?: string };

    try {
      const member = await prisma.programMember.update({
        where: { id },
        data: {
          points: {
            decrement: points
          },
          pointsHistory: {
            create: {
              points: -points,
              type: 'REDEEMED',
              reason: reason || 'Points deducted',
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          },
          tier: true,
        }
      });

      return reply.send(member);
    } catch (error) {
      console.error('Failed to deduct points from member:', error);
      return reply.code(500).send({
        error: 'Failed to deduct points from member',
      });
    }
  });

  // Get member's points history
  fastify.get('/program-members/:id/points-history', {
    schema: {
      tags: ['program-members'],
      description: 'Get points history for a program member',
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
      const history = await prisma.pointsHistory.findMany({
        where: {
          memberId: id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return reply.send(history);
    } catch (error) {
      console.error('Failed to fetch points history:', error);
      return reply.code(500).send({
        error: 'Failed to fetch points history',
      });
    }
  });
} 