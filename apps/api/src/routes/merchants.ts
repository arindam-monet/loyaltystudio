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

export default async function merchantRoutes(app: FastifyInstance) {
  // Create a new merchant
  app.post('/merchants', async (request, reply) => {
    const data = merchantSchema.parse(request.body);
    let subdomain = data.subdomain || generateSubdomain(data.name);

    // Validate subdomain format
    if (!isValidSubdomain(subdomain)) {
      return reply.code(400).send({
        error: 'Invalid subdomain format. Use only lowercase letters, numbers, and hyphens. Must start and end with a letter or number.',
      });
    }

    // Check if subdomain is reserved
    if (isReservedSubdomain(subdomain)) {
      return reply.code(400).send({
        error: 'This subdomain is reserved and cannot be used.',
      });
    }

    // Check if subdomain is already taken
    const existingMerchant = await prisma.merchant.findFirst({
      where: { subdomain },
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
            subdomain,
          },
        });

        // Create DNS record if DNS provider is configured
        try {
          await dnsProvider.createSubdomain(subdomain);
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
  });

  // Delete a merchant
  app.delete('/merchants/:id', async (request, reply) => {
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
  });

  // Check subdomain availability
  app.get('/merchants/check-subdomain/:subdomain', async (request, reply) => {
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
  });
} 