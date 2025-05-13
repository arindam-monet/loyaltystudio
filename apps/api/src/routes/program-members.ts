import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { WebhookEventType } from '@prisma/client';
import { webhookService } from '../services/webhook.js';

const prisma = new PrismaClient();

// Schema for API requests
const memberRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  phoneNumber: z.string().optional(),
  externalId: z.string().optional(),
  tierId: z.string().cuid(),
  loyaltyProgramId: z.string().cuid(),
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
        required: ['email', 'tierId', 'loyaltyProgramId'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          phoneNumber: { type: 'string' },
          externalId: { type: 'string' },
          tierId: { type: 'string' },
          loyaltyProgramId: { type: 'string' },
          pointsBalance: { type: 'number', minimum: 0 },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Use the schema for validation
      const requestData = memberRequestSchema.parse(request.body);

      // Check if the tier exists and belongs to the specified loyalty program
      const tier = await prisma.programTier.findUnique({
        where: { id: requestData.tierId },
        include: { loyaltyProgram: true }
      });

      if (!tier) {
        return reply.code(400).send({
          error: 'Tier not found',
          message: 'The specified tier does not exist'
        });
      }

      if (tier.loyaltyProgramId !== requestData.loyaltyProgramId) {
        return reply.code(400).send({
          error: 'Invalid tier',
          message: 'The specified tier does not belong to the specified loyalty program'
        });
      }

      // Check if a member with this email already exists in this program
      const existingMember = await prisma.programMember.findFirst({
        where: {
          AND: [
            { email: { equals: requestData.email } },
            { tier: { loyaltyProgramId: requestData.loyaltyProgramId } }
          ]
        }
      });

      if (existingMember) {
        return reply.code(400).send({
          error: 'Member already exists',
          message: 'A member with this email already exists in this loyalty program'
        });
      }

      // Create the program member
      const member = await prisma.programMember.create({
        data: {
          email: requestData.email,
          name: requestData.name,
          phoneNumber: requestData.phoneNumber,
          externalId: requestData.externalId,
          tierId: requestData.tierId,
          pointsBalance: requestData.pointsBalance,
          metadata: requestData.metadata,
          joinedAt: new Date(),
        },
        include: {
          tier: true,
        }
      });

      // We already have the tier from earlier

      if (tier) {
        // Send webhook asynchronously
        webhookService.sendWebhook(
          tier.loyaltyProgram.merchantId,
          WebhookEventType.member_created,
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
    // Use a more flexible schema for updates
    const data = memberRequestSchema.partial().omit({ email: true, loyaltyProgramId: true }).parse(request.body);

    try {
      // Get original member data for comparison
      const originalMember = await prisma.programMember.findUnique({
        where: { id },
        include: { tier: { include: { loyaltyProgram: true } } }
      });

      if (!originalMember) {
        return reply.code(404).send({
          error: 'Member not found',
          message: 'The specified member does not exist'
        });
      }

      // If changing tier, verify the new tier belongs to the same loyalty program
      if (data.tierId && data.tierId !== originalMember.tierId) {
        const newTier = await prisma.programTier.findUnique({
          where: { id: data.tierId },
          include: { loyaltyProgram: true }
        });

        if (!newTier) {
          return reply.code(400).send({
            error: 'Tier not found',
            message: 'The specified tier does not exist'
          });
        }

        if (newTier.loyaltyProgramId !== originalMember.tier.loyaltyProgramId) {
          return reply.code(400).send({
            error: 'Invalid tier',
            message: 'The new tier must belong to the same loyalty program'
          });
        }
      }

      const member = await prisma.programMember.update({
        where: { id },
        data: {
          name: data.name,
          phoneNumber: data.phoneNumber,
          externalId: data.externalId,
          tierId: data.tierId,
          pointsBalance: data.pointsBalance,
          metadata: data.metadata,
        },
        include: {
          tier: true,
        }
      });

      if (originalMember) {
        const merchantId = originalMember.tier.loyaltyProgram.merchantId;

        // Send member updated webhook
        webhookService.sendWebhook(
          merchantId,
          WebhookEventType.member_updated,
          member
        ).catch(error => request.log.error({ error }, 'Failed to send member updated webhook'));

        // If tier changed, send tier changed webhook
        if (data.tierId && data.tierId !== originalMember.tierId) {
          webhookService.sendWebhook(
            merchantId,
            WebhookEventType.tier_changed,
            {
              memberId: member.id,
              email: member.email,
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
          WebhookEventType.member_deleted,
          {
            id: member.id,
            email: member.email,
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
          tier: true,
        }
      });

      // Create points transaction
      await prisma.pointsTransaction.create({
        data: {
          programMemberId: id,
          amount: points,
          type: 'EARN',
          reason: reason || 'Points added',
          metadata: {
            memberId: id,
            programId: member.tier.loyaltyProgramId
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
          tier: true,
        }
      });

      // Create points transaction
      await prisma.pointsTransaction.create({
        data: {
          programMemberId: id,
          amount: -points,
          type: 'REDEEM',
          reason: reason || 'Points deducted',
          metadata: {
            memberId: id,
            programId: member.tier.loyaltyProgramId
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
      // Check if member exists
      const member = await prisma.programMember.findUnique({
        where: { id }
      });

      if (!member) {
        return reply.code(404).send({
          error: 'Member not found'
        });
      }

      const history = await prisma.pointsTransaction.findMany({
        where: {
          programMemberId: id,
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