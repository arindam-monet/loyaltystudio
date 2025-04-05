import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { webhookService } from '../services/webhook.js';

const prisma = new PrismaClient();

const memberSchema = z.object({
  userId: z.string().cuid(),
  loyaltyProgramId: z.string().cuid(),
  tierId: z.string().cuid(),
  pointsBalance: z.number().min(0).default(0),
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
          tier: {
            loyaltyProgramId
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
        },
        orderBy: {
          pointsBalance: 'desc',
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
        required: ['userId', 'loyaltyProgramId', 'tierId'],
        properties: {
          userId: { type: 'string' },
          loyaltyProgramId: { type: 'string' },
          tierId: { type: 'string' },
          pointsBalance: { type: 'number', minimum: 0 },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    const data = memberSchema.parse(request.body);

    try {
      const member = await prisma.programMember.create({
        data: {
          userId: data.userId,
          tierId: data.tierId,
          pointsBalance: data.pointsBalance,
          metadata: data.metadata,
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

      // Get merchant ID from tier
      const tier = await prisma.programTier.findUnique({
        where: { id: data.tierId },
        include: { loyaltyProgram: true }
      });

      if (tier) {
        // Send webhook asynchronously
        webhookService.sendWebhook(
          tier.loyaltyProgram.merchantId,
          'member_created',
          member
        ).catch(error => request.log.error({ error }, 'Failed to send member created webhook'));
      }

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
          pointsBalance: { type: 'number', minimum: 0 },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = memberSchema.partial().parse(request.body);

    try {
      // Get original member data for comparison
      const originalMember = await prisma.programMember.findUnique({
        where: { id },
        include: { tier: { include: { loyaltyProgram: true } } }
      });

      const member = await prisma.programMember.update({
        where: { id },
        data: {
          tierId: data.tierId,
          pointsBalance: data.pointsBalance,
          metadata: data.metadata,
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

      if (originalMember) {
        const merchantId = originalMember.tier.loyaltyProgram.merchantId;

        // Send member updated webhook
        webhookService.sendWebhook(
          merchantId,
          'member_updated',
          member
        ).catch(error => request.log.error({ error }, 'Failed to send member updated webhook'));

        // If tier changed, send tier changed webhook
        if (data.tierId && data.tierId !== originalMember.tierId) {
          webhookService.sendWebhook(
            merchantId,
            'tier_changed',
            {
              memberId: member.id,
              userId: member.userId,
              previousTierId: originalMember.tierId,
              newTierId: member.tierId,
              timestamp: new Date().toISOString()
            }
          ).catch(error => request.log.error({ error }, 'Failed to send tier changed webhook'));
        }
      }

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
      // Get member data before deletion
      const member = await prisma.programMember.findUnique({
        where: { id },
        include: { tier: { include: { loyaltyProgram: true } } }
      });

      await prisma.programMember.delete({
        where: { id },
      });

      if (member) {
        // Send webhook asynchronously
        webhookService.sendWebhook(
          member.tier.loyaltyProgram.merchantId,
          'member_deleted',
          {
            id: member.id,
            userId: member.userId,
            tierId: member.tierId,
            deletedAt: new Date().toISOString()
          }
        ).catch(error => request.log.error({ error }, 'Failed to send member deleted webhook'));
      }

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
          pointsBalance: {
            increment: points
          },
          lastActivity: new Date(),
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

      // Create points transaction
      await prisma.pointsTransaction.create({
        data: {
          userId: member.userId,
          amount: points,
          type: 'EARN',
          reason: reason || 'Points added',
          metadata: {
            memberId: id,
            programId: member.tier?.loyaltyProgramId
          }
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
          pointsBalance: {
            decrement: points
          },
          lastActivity: new Date(),
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

      // Create points transaction
      await prisma.pointsTransaction.create({
        data: {
          userId: member.userId,
          amount: points,
          type: 'REDEEM',
          reason: reason || 'Points deducted',
          metadata: {
            memberId: id,
            programId: member.tier?.loyaltyProgramId
          }
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
      const member = await prisma.programMember.findUnique({
        where: { id },
        select: { userId: true }
      });

      if (!member) {
        return reply.code(404).send({
          error: 'Member not found'
        });
      }

      const history = await prisma.pointsTransaction.findMany({
        where: {
          userId: member.userId,
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