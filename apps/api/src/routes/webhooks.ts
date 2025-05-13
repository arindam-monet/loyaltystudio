import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { WebhookEventType } from '@prisma/client';
import { webhookService } from '../services/webhook.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Type assertion for Prisma client
const prismaAny = prisma as any;

// We'll use request.user.merchantId to get the merchant ID

// Webhook creation schema
// Define webhook event types - these should match the WebhookEventType enum in Prisma
const WebhookEventTypes = Object.values(WebhookEventType);

// We use string literals for webhook event types

const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(WebhookEventTypes as unknown as [string, ...string[]])),
  description: z.string().optional(),
});

// Webhook update schema
const webhookUpdateSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.enum(WebhookEventTypes as unknown as [string, ...string[]])).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Webhook test schema
const webhookTestSchema = z.object({
  eventType: z.enum(WebhookEventTypes as unknown as [string, ...string[]]),
  payload: z.record(z.any()).optional(),
});

// We'll use any type for request to avoid TypeScript issues with Fastify

export async function webhookRoutes(fastify: FastifyInstance) {
  // Create a new webhook
  fastify.post('/webhooks', {
    schema: {
      description: 'Create a new webhook endpoint',
      tags: ['webhooks'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['url', 'events'],
        properties: {
          url: { type: 'string', format: 'uri' },
          events: {
            type: 'array',
            items: {
              type: 'string',
              enum: WebhookEventTypes
            }
          },
          description: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            url: { type: 'string' },
            events: {
              type: 'array',
              items: { type: 'string' }
            },
            description: { type: 'string' },
            secret: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string' }
          }
        }
      }
    },
    handler: async (request: any, reply) => {
      try {
        const data = webhookSchema.parse(request.body);
        const merchantId = request.user.merchantId;

        // Generate webhook secret
        const secret = crypto.randomBytes(32).toString('hex');

        // Use the prismaAny variable
        const webhook = await prismaAny.webhook.create({
          data: {
            merchantId,
            url: data.url,
            events: data.events,
            description: data.description,
            secret
          }
        });

        return reply.code(201).send({
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          description: webhook.description,
          secret, // Only show secret on creation
          isActive: webhook.isActive,
          createdAt: webhook.createdAt
        });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: 'Failed to create webhook',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Get all webhooks for a merchant
  fastify.get('/webhooks', {
    schema: {
      description: 'Get all webhooks for a merchant',
      tags: ['webhooks'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              url: { type: 'string' },
              events: {
                type: 'array',
                items: { type: 'string' }
              },
              description: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' }
            }
          }
        }
      }
    },
    handler: async (request: any, reply) => {
      try {
        const merchantId = request.user.merchantId;

        // Use the prismaAny variable
        const webhooks = await prismaAny.webhook.findMany({
          where: { merchantId },
          orderBy: { createdAt: 'desc' }
        });

        // Don't return the secret
        const sanitizedWebhooks = webhooks.map((webhook: any) => ({
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          description: webhook.description,
          isActive: webhook.isActive,
          createdAt: webhook.createdAt,
          updatedAt: webhook.updatedAt
        }));

        return sanitizedWebhooks;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: 'Failed to fetch webhooks',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Get a specific webhook
  fastify.get('/webhooks/:id', {
    schema: {
      description: 'Get a specific webhook',
      tags: ['webhooks'],
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
            url: { type: 'string' },
            events: {
              type: 'array',
              items: { type: 'string' }
            },
            description: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    },
    handler: async (request: any, reply) => {
      try {
        const { id } = request.params as { id: string };
        const merchantId = request.user.merchantId;

        // Use the prismaAny variable
        const webhook = await prismaAny.webhook.findFirst({
          where: {
            id,
            merchantId
          }
        });

        if (!webhook) {
          return reply.code(404).send({ error: 'Webhook not found' });
        }

        // Don't return the secret
        const sanitizedWebhook = {
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          description: webhook.description,
          isActive: webhook.isActive,
          createdAt: webhook.createdAt,
          updatedAt: webhook.updatedAt
        };

        return sanitizedWebhook;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: 'Failed to fetch webhook',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Update a webhook
  fastify.patch('/webhooks/:id', {
    schema: {
      description: 'Update a webhook',
      tags: ['webhooks'],
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
          url: { type: 'string', format: 'uri' },
          events: {
            type: 'array',
            items: {
              type: 'string',
              enum: WebhookEventTypes
            }
          },
          description: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            url: { type: 'string' },
            events: {
              type: 'array',
              items: { type: 'string' }
            },
            description: { type: 'string' },
            isActive: { type: 'boolean' },
            updatedAt: { type: 'string' }
          }
        }
      }
    },
    handler: async (request: any, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = webhookUpdateSchema.parse(request.body);
        const merchantId = request.user.merchantId;

        // Check if webhook exists and belongs to merchant
        // Use the prismaAny variable
        const existingWebhook = await prismaAny.webhook.findFirst({
          where: {
            id,
            merchantId
          }
        });

        if (!existingWebhook) {
          return reply.code(404).send({ error: 'Webhook not found' });
        }

        // Update webhook
        // Use the prismaAny variable
        const webhook = await prismaAny.webhook.update({
          where: { id },
          data
        });

        // Don't return the secret
        const sanitizedWebhook = {
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          description: webhook.description,
          isActive: webhook.isActive,
          updatedAt: webhook.updatedAt
        };

        return sanitizedWebhook;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: 'Failed to update webhook',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Delete a webhook
  fastify.delete('/webhooks/:id', {
    schema: {
      description: 'Delete a webhook',
      tags: ['webhooks'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    },
    handler: async (request: any, reply) => {
      try {
        const { id } = request.params as { id: string };
        const merchantId = request.user.merchantId;

        // Check if webhook exists and belongs to merchant
        // Use the prismaAny variable
        const existingWebhook = await prismaAny.webhook.findFirst({
          where: {
            id,
            merchantId
          }
        });

        if (!existingWebhook) {
          return reply.code(404).send({ error: 'Webhook not found' });
        }

        // Delete webhook
        // Use the prismaAny variable
        await prismaAny.webhook.delete({
          where: { id }
        });

        return reply.code(204).send();
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: 'Failed to delete webhook',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Regenerate webhook secret
  fastify.post('/webhooks/:id/regenerate-secret', {
    schema: {
      description: 'Regenerate webhook secret',
      tags: ['webhooks'],
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
            secret: { type: 'string' }
          }
        }
      }
    },
    handler: async (request: any, reply) => {
      try {
        const { id } = request.params as { id: string };
        const merchantId = request.user.merchantId;

        // Check if webhook exists and belongs to merchant
        // Use the prismaAny variable
        const existingWebhook = await prismaAny.webhook.findFirst({
          where: {
            id,
            merchantId
          }
        });

        if (!existingWebhook) {
          return reply.code(404).send({ error: 'Webhook not found' });
        }

        // Generate new secret
        const secret = crypto.randomBytes(32).toString('hex');

        // Update webhook
        // Use the prismaAny variable
        await prismaAny.webhook.update({
          where: { id },
          data: { secret }
        });

        return { id, secret };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: 'Failed to regenerate webhook secret',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Test a webhook
  fastify.post('/webhooks/:id/test', {
    schema: {
      description: 'Test a webhook by sending a test event',
      tags: ['webhooks'],
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
        required: ['eventType'],
        properties: {
          eventType: {
            type: 'string',
            enum: WebhookEventTypes
          },
          payload: {
            type: 'object',
            additionalProperties: true
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            statusCode: { type: 'number' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request: any, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { eventType, payload = { test: true } } = webhookTestSchema.parse(request.body);
        const merchantId = request.user.merchantId;

        // Check if webhook exists and belongs to merchant
        // Use the prismaAny variable
        const existingWebhook = await prismaAny.webhook.findFirst({
          where: {
            id,
            merchantId
          }
        });

        if (!existingWebhook) {
          return reply.code(404).send({ error: 'Webhook not found' });
        }

        // Add test flag to payload
        const testPayload = {
          ...payload,
          _test: true,
          _timestamp: new Date().toISOString()
        };

        // Deliver test webhook
        const result = await webhookService.deliverWebhook(id, eventType as WebhookEventType, testPayload);

        if (result.success) {
          return {
            success: true,
            statusCode: result.statusCode,
            message: 'Test webhook delivered successfully'
          };
        } else {
          return {
            success: false,
            statusCode: result.statusCode || 500,
            message: result.error || 'Failed to deliver test webhook'
          };
        }
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: 'Failed to test webhook',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Get webhook delivery logs
  fastify.get('/webhooks/:id/logs', {
    schema: {
      description: 'Get webhook delivery logs',
      tags: ['webhooks'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 10 },
          offset: { type: 'number', default: 0 },
          successful: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            logs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  eventType: { type: 'string' },
                  statusCode: { type: 'number' },
                  successful: { type: 'boolean' },
                  attempts: { type: 'number' },
                  error: { type: 'string' },
                  createdAt: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request: any, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { limit = 10, offset = 0, successful } = request.query as {
          limit?: number;
          offset?: number;
          successful?: boolean;
        };
        const merchantId = request.user.merchantId;

        // Check if webhook exists and belongs to merchant
        // Use the prismaAny variable
        const existingWebhook = await prismaAny.webhook.findFirst({
          where: {
            id,
            merchantId
          }
        });

        if (!existingWebhook) {
          return reply.code(404).send({ error: 'Webhook not found' });
        }

        // Build where clause
        const where: any = { webhookId: id };
        if (successful !== undefined) {
          where.successful = successful;
        }

        // Get total count
        // Use the prismaAny variable
        const total = await prismaAny.webhookDeliveryLog.count({ where });

        // Get logs
        const logs = await prismaAny.webhookDeliveryLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            eventType: true,
            statusCode: true,
            successful: true,
            attempts: true,
            error: true,
            createdAt: true
          }
        });

        return { total, logs };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: 'Failed to fetch webhook logs',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });
}
