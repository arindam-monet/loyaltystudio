import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { DNSProviderFactory } from '../services/dns/index.js';
import { generateSubdomain, isValidSubdomain, isReservedSubdomain, getMerchantDomain } from '../utils/subdomain.js';
import { env } from '../config/env.js';

const prisma = new PrismaClient();
const dnsProvider = DNSProviderFactory.createProvider();

const merchantSchema = z.object({
  name: z.string().min(3).max(100),
  subdomain: z.string().min(3).max(63).optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  tenantId: z.string().uuid(),
});

const brandingSchema = z.object({
  logo: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function merchantRoutes(fastify: FastifyInstance) {
  // Create a new merchant
  fastify.post('/merchants', {
    schema: {
      tags: ['merchants'],
      description: 'Create a new merchant',
      body: {
        type: 'object',
        required: ['name', 'email', 'tenantId'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 100 },
          subdomain: { type: 'string', minLength: 3, maxLength: 63 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          country: { type: 'string' },
          zipCode: { type: 'string' },
          tenantId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        201: {
          description: 'Merchant created successfully',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            subdomain: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const data = merchantSchema.parse(request.body);
      const generatedSubdomain = data.subdomain || generateSubdomain(data.name);

      // Validate subdomain format
      if (!isValidSubdomain(generatedSubdomain)) {
        return reply.code(400).send({
          error: 'Invalid subdomain format. Use only lowercase letters, numbers, and hyphens. Must start and end with a letter or number.',
        });
      }

      // Check if subdomain is reserved
      if (isReservedSubdomain(generatedSubdomain)) {
        return reply.code(400).send({
          error: 'This subdomain is reserved and cannot be used.',
        });
      }

      // Check if subdomain is already taken
      const existingMerchant = await prisma.merchant.findFirst({
        where: { subdomain: generatedSubdomain },
      });

      if (existingMerchant) {
        return reply.code(409).send({
          error: 'This subdomain is already taken.',
        });
      }

      try {
        // Start a transaction to create merchant and DNS record
        const merchant = await prisma.$transaction(async (tx) => {
          // Create merchant
          const newMerchant = await tx.merchant.create({
            data: {
              ...data,
              subdomain: generatedSubdomain,
            },
          });

          // Create DNS record if DNS provider is configured
          try {
            await dnsProvider.createSubdomain(generatedSubdomain);
          } catch (error) {
            // Log the error but don't fail the transaction
            console.error('Failed to create DNS record:', error);
          }

          return newMerchant;
        });

        return reply.code(201).send(merchant);
      } catch (error) {
        console.error('Failed to create merchant:', error);
        return reply.code(500).send({
          error: 'Failed to create merchant.',
        });
      }
    }
  });

  // Update merchant branding
  fastify.patch('/merchants/current', {
    schema: {
      tags: ['merchants'],
      description: 'Update merchant branding',
      body: {
        type: 'object',
        properties: {
          logo: { type: 'string', format: 'uri' },
          primaryColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          secondaryColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }
        }
      },
      response: {
        200: {
          description: 'Merchant branding updated successfully',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            branding: {
              type: 'object',
              properties: {
                logo: { type: 'string' },
                primaryColor: { type: 'string' },
                secondaryColor: { type: 'string' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const data = brandingSchema.parse(request.body);
      const merchantId = request.merchantId;

      if (!merchantId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Merchant ID not found',
        });
      }

      try {
        const merchant = await prisma.merchant.update({
          where: { id: merchantId },
          data: {
            branding: data,
          },
        });

        return reply.send(merchant);
      } catch (error) {
        console.error('Failed to update merchant branding:', error);
        return reply.code(500).send({
          error: 'Failed to update merchant branding.',
        });
      }
    }
  });

  // Delete a merchant
  fastify.delete('/merchants/:id', {
    schema: {
      tags: ['merchants'],
      description: 'Delete a merchant',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        204: {
          description: 'Merchant deleted successfully',
          type: 'null'
        }
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const merchant = await prisma.merchant.findUnique({
          where: { id },
        });

        if (!merchant) {
          return reply.code(404).send({
            error: 'Merchant not found.',
          });
        }

        // Delete merchant and DNS record in a transaction
        await prisma.$transaction(async (tx) => {
          await tx.merchant.delete({
            where: { id },
          });

          // Delete DNS record if merchant has a subdomain
          if (merchant.subdomain) {
            try {
              await dnsProvider.deleteSubdomain(merchant.subdomain);
            } catch (error) {
              // Log the error but don't fail the transaction
              console.error('Failed to delete DNS record:', error);
            }
          }
        });

        return reply.code(204).send();
      } catch (error) {
        console.error('Failed to delete merchant:', error);
        return reply.code(500).send({
          error: 'Failed to delete merchant.',
        });
      }
    }
  });

  // Check subdomain availability
  fastify.get('/merchants/check-subdomain/:subdomain', {
    schema: {
      tags: ['merchants'],
      description: 'Check subdomain availability',
      params: {
        type: 'object',
        required: ['subdomain'],
        properties: {
          subdomain: { type: 'string', minLength: 3, maxLength: 63 }
        }
      },
      response: {
        200: {
          description: 'Subdomain availability status',
          type: 'object',
          properties: {
            available: { type: 'boolean' },
            domain: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { subdomain } = request.params as { subdomain: string };

      // Validate subdomain format
      if (!isValidSubdomain(subdomain)) {
        return reply.code(400).send({
          available: false,
          error: 'Invalid subdomain format.',
        });
      }

      // Check if subdomain is reserved
      if (isReservedSubdomain(subdomain)) {
        return reply.code(400).send({
          available: false,
          error: 'This subdomain is reserved.',
        });
      }

      // Check if subdomain is already taken
      const existingMerchant = await prisma.merchant.findFirst({
        where: { subdomain },
      });

      return reply.send({
        available: !existingMerchant,
        domain: getMerchantDomain(subdomain),
      });
    }
  });

  // Get merchant metrics
  fastify.get('/merchants/metrics', {
    schema: {
      tags: ['merchants'],
      description: 'Get merchant metrics',
      response: {
        200: {
          type: 'object',
          properties: {
            totalMembers: { type: 'number' },
            activeRewards: { type: 'number' },
            monthlyTransactions: { type: 'number' },
            monthlyPointsIssued: { type: 'number' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const merchantId = request.merchantId;

      if (!merchantId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Merchant ID not found',
        });
      }

      try {
        // Get total members with points balances for this merchant
        const totalMembers = await prisma.pointsBalance.count({
          where: {
            merchantId,
          },
        });

        // Get active rewards across all loyalty programs for this merchant
        const activeRewards = await prisma.reward.count({
          where: {
            loyaltyProgram: {
              merchantId,
            },
            isActive: true,
          },
        });

        // Get monthly points calculations
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyCalculations = await prisma.pointsCalculation.count({
          where: {
            merchantId,
            createdAt: {
              gte: startOfMonth,
            },
            status: 'COMPLETED',
          },
        });

        // Get monthly points issued
        const monthlyPointsSum = await prisma.pointsCalculation.aggregate({
          where: {
            merchantId,
            createdAt: {
              gte: startOfMonth,
            },
            status: 'COMPLETED',
          },
          _sum: {
            points: true,
          },
        });

        return reply.send({
          totalMembers,
          activeRewards,
          monthlyTransactions: monthlyCalculations,
          monthlyPointsIssued: monthlyPointsSum._sum.points || 0,
        });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: 'Failed to fetch merchant metrics',
        });
      }
    },
  });
} 