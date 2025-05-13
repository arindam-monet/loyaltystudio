import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prismaPkg from '@prisma/client';
const { PrismaClient, WebhookEventType } = prismaPkg;
import { webhookService } from '../services/webhook.js';

const prisma = new PrismaClient();

const campaignSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  type: z.enum(['POINTS_MULTIPLIER', 'BONUS_POINTS', 'SPECIAL_REWARD']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  conditions: z.record(z.any()).optional(),
  rewards: z.record(z.any()).optional(),
  loyaltyProgramId: z.string(),
  isActive: z.boolean().default(true),
});

export async function campaignRoutes(fastify: FastifyInstance) {
  // Get all campaigns for a loyalty program
  fastify.get('/campaigns', {
    schema: {
      tags: ['campaigns'],
      description: 'Get all campaigns for a loyalty program',
      querystring: {
        type: 'object',
        required: ['loyaltyProgramId'],
        properties: {
          loyaltyProgramId: { type: 'string' },
          includeInactive: { type: 'boolean' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { loyaltyProgramId, includeInactive = false } = request.query as {
      loyaltyProgramId: string;
      includeInactive?: boolean;
    };

    try {
      const campaigns = await prisma.campaign.findMany({
        where: {
          loyaltyProgramId,
          ...(includeInactive ? {} : { isActive: true }),
        },
        include: {
          participants: {
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
          startDate: 'desc',
        },
      });

      return reply.send(campaigns);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      return reply.code(500).send({
        error: 'Failed to fetch campaigns',
      });
    }
  });

  // Create a new campaign
  fastify.post('/campaigns', {
    schema: {
      tags: ['campaigns'],
      description: 'Create a new campaign',
      body: {
        type: 'object',
        required: ['name', 'type', 'startDate', 'loyaltyProgramId'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 100 },
          description: { type: 'string' },
          type: { type: 'string', enum: ['POINTS_MULTIPLIER', 'BONUS_POINTS', 'SPECIAL_REWARD'] },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          conditions: { type: 'object' },
          rewards: { type: 'object' },
          loyaltyProgramId: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    const data = campaignSchema.parse(request.body);

    try {
      // Get the loyalty program to get the merchant ID
      const loyaltyProgram = await prisma.loyaltyProgram.findUnique({
        where: { id: data.loyaltyProgramId },
        select: { merchantId: true }
      });

      if (!loyaltyProgram) {
        return reply.code(404).send({
          error: 'Loyalty program not found'
        });
      }

      const campaign = await prisma.campaign.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          startDate: data.startDate,
          endDate: data.endDate,
          conditions: data.conditions,
          rewards: data.rewards,
          isActive: data.isActive,
          loyaltyProgram: {
            connect: { id: data.loyaltyProgramId }
          }
        },
        include: {
          participants: true,
          loyaltyProgram: true
        }
      });

      // Send webhook for campaign created
      webhookService.sendWebhook(
        loyaltyProgram.merchantId,
        WebhookEventType.campaign_started,
        campaign
      ).catch(error => console.error('Failed to send campaign created webhook:', error));

      return reply.code(201).send(campaign);
    } catch (error) {
      console.error('Failed to create campaign:', error);
      return reply.code(500).send({
        error: 'Failed to create campaign',
      });
    }
  });

  // Update a campaign
  fastify.patch('/campaigns/:id', {
    schema: {
      tags: ['campaigns'],
      description: 'Update a campaign',
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
          type: { type: 'string', enum: ['POINTS_MULTIPLIER', 'BONUS_POINTS', 'SPECIAL_REWARD'] },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          conditions: { type: 'object' },
          rewards: { type: 'object' },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = campaignSchema.partial().parse(request.body);

    try {
      // Get the existing campaign to check if status changed
      const existingCampaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          loyaltyProgram: true
        }
      });

      if (!existingCampaign) {
        return reply.code(404).send({
          error: 'Campaign not found'
        });
      }

      const campaign = await prisma.campaign.update({
        where: { id },
        data,
        include: {
          participants: true,
          loyaltyProgram: true
        }
      });

      // Check if campaign status changed
      if (data.isActive !== undefined && data.isActive !== existingCampaign.isActive) {
        // Send webhook for campaign status change
        webhookService.sendWebhook(
          existingCampaign.loyaltyProgram.merchantId,
          data.isActive ? WebhookEventType.campaign_started : WebhookEventType.campaign_ended,
          campaign
        ).catch(error => console.error(`Failed to send campaign ${data.isActive ? 'started' : 'ended'} webhook:`, error));
      } else {
        // Send webhook for campaign updated
        webhookService.sendWebhook(
          existingCampaign.loyaltyProgram.merchantId,
          WebhookEventType.campaign_updated,
          campaign
        ).catch(error => console.error('Failed to send campaign updated webhook:', error));
      }

      return reply.send(campaign);
    } catch (error) {
      console.error('Failed to update campaign:', error);
      return reply.code(500).send({
        error: 'Failed to update campaign',
      });
    }
  });

  // Delete a campaign
  fastify.delete('/campaigns/:id', {
    schema: {
      tags: ['campaigns'],
      description: 'Delete a campaign',
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
      // Get the campaign to get the merchant ID
      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          loyaltyProgram: true
        }
      });

      if (!campaign) {
        return reply.code(404).send({
          error: 'Campaign not found'
        });
      }

      // Store merchant ID and campaign info for webhook
      const merchantId = campaign.loyaltyProgram.merchantId;
      const campaignInfo = {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        deletedAt: new Date().toISOString()
      };

      await prisma.campaign.delete({
        where: { id },
      });

      // Send webhook for campaign deleted
      webhookService.sendWebhook(
        merchantId,
        WebhookEventType.campaign_ended,
        campaignInfo
      ).catch(error => console.error('Failed to send campaign deleted webhook:', error));

      return reply.code(204).send();
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      return reply.code(500).send({
        error: 'Failed to delete campaign',
      });
    }
  });

  // Add participant to campaign
  fastify.post('/campaigns/:id/participants', {
    schema: {
      tags: ['campaigns'],
      description: 'Add a participant to a campaign',
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
          userId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.body as { userId: string };

    try {
      const participant = await prisma.campaignParticipant.create({
        data: {
          campaignId: id,
          userId,
          status: 'ELIGIBLE',
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

      return reply.code(201).send(participant);
    } catch (error) {
      console.error('Failed to add campaign participant:', error);
      return reply.code(500).send({
        error: 'Failed to add campaign participant',
      });
    }
  });

  // Remove participant from campaign
  fastify.delete('/campaigns/:id/participants/:participantId', {
    schema: {
      tags: ['campaigns'],
      description: 'Remove a participant from a campaign',
      params: {
        type: 'object',
        required: ['id', 'participantId'],
        properties: {
          id: { type: 'string' },
          participantId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { participantId } = request.params as { participantId: string };

    try {
      await prisma.campaignParticipant.delete({
        where: { id: participantId },
      });

      return reply.code(204).send();
    } catch (error) {
      console.error('Failed to remove campaign participant:', error);
      return reply.code(500).send({
        error: 'Failed to remove campaign participant',
      });
    }
  });

  // Get campaign participants
  fastify.get('/campaigns/:id/participants', {
    schema: {
      tags: ['campaigns'],
      description: 'Get all participants of a campaign',
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
      const participants = await prisma.campaignParticipant.findMany({
        where: {
          campaignId: id,
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
          createdAt: 'desc',
        },
      });

      return reply.send(participants);
    } catch (error) {
      console.error('Failed to fetch campaign participants:', error);
      return reply.code(500).send({
        error: 'Failed to fetch campaign participants',
      });
    }
  });
}