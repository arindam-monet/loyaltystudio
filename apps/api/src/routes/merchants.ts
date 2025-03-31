import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { generateSubdomain, validateSubdomain, isSubdomainAvailable } from '../utils/subdomain.js';

const prisma = new PrismaClient();

const merchantSchema = z.object({
  name: z.string(),
  subdomain: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function merchantRoutes(fastify: FastifyInstance) {
  // Create merchant
  fastify.post('/merchants', {
    schema: {
      description: 'Create a new merchant',
      tags: ['merchants'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          subdomain: { type: 'string' },
          metadata: { type: 'object', additionalProperties: true }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            subdomain: { type: 'string' },
            metadata: { type: 'object' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const data = merchantSchema.parse(request.body);
        const tenantId = request.user.tenantId; // From auth middleware

        // Get tenant to access domain
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
        });

        if (!tenant) {
          return reply.code(404).send({ error: 'Tenant not found' });
        }

        // Generate or validate subdomain
        let subdomain = data.subdomain || generateSubdomain(data.name);
        
        // Validate subdomain format
        if (!validateSubdomain(subdomain)) {
          return reply.code(400).send({
            error: 'Invalid subdomain format',
            message: 'Subdomain must be 3-63 characters long, start and end with a letter or number, and can only contain letters, numbers, and hyphens.'
          });
        }

        // Check if subdomain is available
        const isAvailable = await isSubdomainAvailable(subdomain, tenantId);
        if (!isAvailable) {
          return reply.code(400).send({
            error: 'Subdomain already taken',
            message: `The subdomain "${subdomain}" is already in use. Please choose a different one.`
          });
        }

        // Create merchant with subdomain
        const merchant = await prisma.merchant.create({
          data: {
            name: data.name,
            subdomain,
            tenantId,
            metadata: data.metadata,
          },
        });

        return reply.code(201).send(merchant);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to create merchant' });
      }
    },
  });

  // Get all merchants for tenant
  fastify.get('/merchants', {
    schema: {
      description: 'Get all merchants for the current tenant',
      tags: ['merchants'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              domain: { type: 'string' },
              metadata: { type: 'object' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId; // From auth middleware

        const merchants = await prisma.merchant.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
        });

        return merchants;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch merchants' });
      }
    },
  });

  // Get merchant by ID
  fastify.get('/merchants/:id', {
    schema: {
      description: 'Get merchant by ID',
      tags: ['merchants'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            domain: { type: 'string' },
            metadata: { type: 'object' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const tenantId = request.user.tenantId; // From auth middleware

        const merchant = await prisma.merchant.findFirst({
          where: { id, tenantId },
        });

        if (!merchant) {
          return reply.code(404).send({ error: 'Merchant not found' });
        }

        return merchant;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch merchant' });
      }
    },
  });

  // Update merchant
  fastify.put('/merchants/:id', {
    schema: {
      description: 'Update merchant',
      tags: ['merchants'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          domain: { type: 'string' },
          metadata: { type: 'object', additionalProperties: true }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            domain: { type: 'string' },
            metadata: { type: 'object' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const tenantId = request.user.tenantId; // From auth middleware
        const data = merchantSchema.partial().parse(request.body);

        const merchant = await prisma.merchant.update({
          where: { id, tenantId },
          data,
        });

        return merchant;
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to update merchant' });
      }
    },
  });

  // Delete merchant
  fastify.delete('/merchants/:id', {
    schema: {
      description: 'Delete merchant',
      tags: ['merchants'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const tenantId = request.user.tenantId; // From auth middleware

        await prisma.merchant.delete({
          where: { id, tenantId },
        });

        return { message: 'Merchant deleted successfully' };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to delete merchant' });
      }
    },
  });
} 