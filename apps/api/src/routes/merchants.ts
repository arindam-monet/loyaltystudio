import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { DNSProviderFactory } from '../services/dns/index.js';
import { DNSProvider } from '../services/dns/types.js';
import { generateSubdomain, isValidSubdomain, isReservedSubdomain, getMerchantDomain } from '../utils/subdomain.js';

const prisma = new PrismaClient();
// Create DNS provider with error handling
let dnsProvider: DNSProvider;
try {
  dnsProvider = DNSProviderFactory.createProvider();
} catch (error) {
  console.error('Failed to initialize DNS provider:', error);
  // The factory should now handle this case and return a mock provider
  dnsProvider = DNSProviderFactory.createProvider(); // Try again, should get mock provider
}

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

const merchantSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  subdomain: z.string().min(3).max(63).optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  currency: z.string().default("USD"),
  timezone: z.string().default("UTC"),
  tenantId: z.string().cuid(),
  branding: z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    primaryTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    accentTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    logo: z.string().url().optional(),
    logoUrl: z.string().url().optional()
  }).optional(),
});

const brandingSchema = z.object({
  logo: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  timezone: z.string().optional(),
});

// Extended branding schema to include text colors
const extendedBrandingSchema = z.object({
  logo: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  primaryTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional().or(z.literal('')),
  timezone: z.string().optional(),
});

// Extended merchant schema for updates
const merchantUpdateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  branding: extendedBrandingSchema.optional(),
  industry: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function merchantRoutes(fastify: FastifyInstance) {
  // Get all merchants for a tenant
  fastify.get('/merchants', {
    schema: {
      tags: ['merchants'],
      description: 'Get all merchants for the current tenant',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              industry: { type: 'string' },
              website: { type: 'string' },
              subdomain: { type: 'string' },
              isDefault: { type: 'boolean' },
              branding: {
                type: 'object',
                properties: {
                  logo: { type: 'string' },
                  logoUrl: { type: 'string' },
                  primaryColor: { type: 'string' },
                  primaryTextColor: { type: 'string' },
                  secondaryColor: { type: 'string' },
                  secondaryTextColor: { type: 'string' },
                  accentColor: { type: 'string' },
                  accentTextColor: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const tenantId = authenticatedRequest.user?.tenantId;
    const userRole = authenticatedRequest.user?.role?.name;

    console.log('Merchant request from user:', {
      userId: authenticatedRequest.user?.id,
      email: authenticatedRequest.user?.email,
      tenantId,
      role: userRole
    });

    // Super admins can see all merchants
    if (!tenantId && userRole !== 'SUPER_ADMIN') {
      console.error('Tenant ID not found for non-super admin user');
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Tenant ID not found',
      });
    }

    try {
      // Build the query - super admins can see all merchants
      const whereClause = userRole === 'SUPER_ADMIN' && !tenantId
        ? {} // No filter for super admins
        : { tenantId }; // Filter by tenant ID for regular users

      console.log('Merchant query where clause:', whereClause);

      const merchants = await prisma.merchant.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          tenant: {
            select: {
              name: true,
              domain: true
            }
          }
        }
      });

      console.log(`Found ${merchants.length} merchants`);

      // Log the first merchant's branding data for debugging
      if (merchants.length > 0) {
        console.log('First merchant branding data:', JSON.stringify(merchants[0]?.branding, null, 2));
      }

      return reply.send(merchants);
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
      return reply.code(500).send({
        error: 'Failed to fetch merchants',
      });
    }
  });

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
          description: { type: 'string' },
          industry: { type: 'string' },
          website: { type: 'string' },
          subdomain: { type: 'string', minLength: 3, maxLength: 63 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          country: { type: 'string' },
          zipCode: { type: 'string' },
          currency: { type: 'string', default: "USD" },
          timezone: { type: 'string', default: "UTC" },
          tenantId: { type: 'string', minLength: 25, maxLength: 25 },
          branding: {
            type: 'object',
            properties: {
              primaryColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              primaryTextColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              secondaryColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              secondaryTextColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              accentColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              accentTextColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              logo: { type: 'string', format: 'uri' },
              logoUrl: { type: 'string', format: 'uri' }
            }
          }
        }
      },
      response: {
        201: {
          description: 'Merchant created successfully',
          type: 'object',
          properties: {
            id: { type: 'string', minLength: 25, maxLength: 25 },
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
        // Log the data being used to create the merchant
        console.log('Creating merchant with data:', JSON.stringify(data, null, 2));

        // Start a transaction to create merchant and DNS record
        const merchant = await prisma.$transaction(async (tx) => {
          // Create merchant
          const newMerchant = await tx.merchant.create({
            data: {
              name: data.name,
              description: data.description,
              industry: data.industry,
              website: data.website,
              subdomain: generatedSubdomain,
              email: data.email,
              phone: data.phone,
              address: data.address,
              city: data.city,
              state: data.state,
              country: data.country,
              zipCode: data.zipCode,
              currency: data.currency,
              timezone: data.timezone,
              tenantId: data.tenantId,
              branding: data.branding,
            },
          });

          console.log('Merchant created successfully:', JSON.stringify(newMerchant, null, 2));

          // Create DNS record if DNS provider is configured
          if (dnsProvider) {
            try {
              await dnsProvider.createSubdomain(generatedSubdomain);
              console.log(`DNS record created for subdomain: ${generatedSubdomain}`);
            } catch (error) {
              // Log the error but don't fail the transaction
              console.error('Failed to create DNS record:', error);
            }
          } else {
            console.log(`Skipping DNS record creation for subdomain: ${generatedSubdomain} - No DNS provider available`);
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
      description: 'Update merchant branding and settings',
      body: {
        type: 'object',
        properties: {
          logo: { type: 'string', format: 'uri' },
          primaryColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          secondaryColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          currency: { type: 'string', pattern: '^[A-Z]{3}$' },
          timezone: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Merchant settings updated successfully',
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
            },
            currency: { type: 'string' },
            timezone: { type: 'string' }
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
            currency: data.currency,
            timezone: data.timezone,
          },
        });

        return reply.send(merchant);
      } catch (error) {
        console.error('Failed to update merchant settings:', error);
        return reply.code(500).send({
          error: 'Failed to update merchant settings.',
        });
      }
    }
  });

  // Get merchant by ID
  fastify.get('/merchants/:id', {
    schema: {
      tags: ['merchants'],
      description: 'Get merchant details by ID',
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
            name: { type: 'string' },
            description: { type: 'string' },
            website: { type: 'string' },
            contactEmail: { type: 'string' },
            contactPhone: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                postalCode: { type: 'string' },
                country: { type: 'string' }
              }
            },
            industry: { type: 'string' },
            subdomain: { type: 'string' },
            isDefault: { type: 'boolean' },
            branding: {
              type: 'object',
              properties: {
                logo: { type: 'string' },
                logoUrl: { type: 'string' },
                primaryColor: { type: 'string' },
                primaryTextColor: { type: 'string' },
                secondaryColor: { type: 'string' },
                secondaryTextColor: { type: 'string' },
                accentColor: { type: 'string' },
                accentTextColor: { type: 'string' }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const authenticatedRequest = request as AuthenticatedRequest;
      const tenantId = authenticatedRequest.user?.tenantId;

      if (!tenantId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Tenant ID not found',
        });
      }

      try {
        const merchant = await prisma.merchant.findFirst({
          where: {
            id,
            tenantId,
          },
        });

        if (!merchant) {
          return reply.code(404).send({
            error: 'Merchant not found',
          });
        }

        // Format the response to match the expected structure
        const formattedMerchant = {
          ...merchant,
          // Extract address fields from the merchant object
          address: {
            street: merchant.address || '',
            city: merchant.city || '',
            state: merchant.state || '',
            postalCode: merchant.zipCode || '',
            country: merchant.country || '',
          },
          // Add any additional fields needed by the frontend
          website: '',
          contactEmail: merchant.email,
          contactPhone: merchant.phone || '',
          industry: '',
          isDefault: false, // This would need to be determined based on your business logic
        };

        return reply.send(formattedMerchant);
      } catch (error) {
        console.error('Failed to fetch merchant:', error);
        return reply.code(500).send({
          error: 'Failed to fetch merchant',
        });
      }
    },
  });

  // Update merchant by ID
  fastify.patch('/merchants/:id', {
    schema: {
      tags: ['merchants'],
      description: 'Update merchant details by ID',
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
          website: { type: 'string' },
          contactEmail: { type: 'string', format: 'email' },
          contactPhone: { type: 'string' },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              postalCode: { type: 'string' },
              country: { type: 'string' }
            }
          },
          industry: { type: 'string' },
          isActive: { type: 'boolean' },
          branding: {
            type: 'object',
            properties: {
              logo: { type: 'string' },
              logoUrl: { type: 'string' },
              primaryColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              primaryTextColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              secondaryColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              secondaryTextColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              accentColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              accentTextColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = merchantUpdateSchema.parse(request.body);
      const authenticatedRequest = request as AuthenticatedRequest;
      const tenantId = authenticatedRequest.user?.tenantId;

      if (!tenantId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Tenant ID not found',
        });
      }

      try {
        // First check if the merchant exists and belongs to the tenant
        const existingMerchant = await prisma.merchant.findFirst({
          where: {
            id,
            tenantId,
          },
        });

        if (!existingMerchant) {
          return reply.code(404).send({
            error: 'Merchant not found',
          });
        }

        // Prepare the update data
        const updateData: any = {};

        // Update basic fields
        if (data.name) updateData.name = data.name;
        if (data.description) updateData.description = data.description;

        // Update contact information
        if (data.contactEmail) updateData.email = data.contactEmail;
        if (data.contactPhone) updateData.phone = data.contactPhone;

        // Update address fields
        if (data.address) {
          if (data.address.street) updateData.address = data.address.street;
          if (data.address.city) updateData.city = data.address.city;
          if (data.address.state) updateData.state = data.address.state;
          if (data.address.postalCode) updateData.zipCode = data.address.postalCode;
          if (data.address.country) updateData.country = data.address.country;
        }

        // Update branding
        if (data.branding) {
          // Merge with existing branding to preserve fields not included in the update
          const existingBranding = existingMerchant.branding as Record<string, any> || {};
          updateData.branding = {
            ...existingBranding,
            ...data.branding,
          };
        }

        // Update the merchant
        const updatedMerchant = await prisma.merchant.update({
          where: { id },
          data: updateData,
        });

        return reply.send({
          id: updatedMerchant.id,
          name: updatedMerchant.name,
          updatedAt: updatedMerchant.updatedAt,
        });
      } catch (error) {
        console.error('Failed to update merchant:', error);
        return reply.code(500).send({
          error: 'Failed to update merchant',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
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
          id: { type: 'string' }
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
      const authenticatedRequest = request as AuthenticatedRequest;
      const tenantId = authenticatedRequest.user?.tenantId;

      console.log(`Attempting to delete merchant with ID: ${id}`);

      try {
        // First check if the merchant exists and belongs to the tenant
        const merchant = await prisma.merchant.findFirst({
          where: {
            id,
            ...(tenantId ? { tenantId } : {}),
          },
        });

        if (!merchant) {
          console.error(`Merchant not found with ID: ${id}`);
          return reply.code(404).send({
            error: 'Merchant not found.',
          });
        }

        console.log(`Found merchant to delete: ${merchant.name} (${merchant.id})`);

        // Delete merchant and DNS record in a transaction
        await prisma.$transaction(async (tx) => {
          console.log(`Deleting merchant with ID: ${id}`);
          await tx.merchant.delete({
            where: { id },
          });

          // Delete DNS record if merchant has a subdomain
          if (merchant.subdomain) {
            try {
              console.log(`Deleting subdomain: ${merchant.subdomain}`);
              await dnsProvider.deleteSubdomain(merchant.subdomain);
            } catch (error) {
              // Log the error but don't fail the transaction
              console.error('Failed to delete DNS record:', error);
            }
          }
        });

        console.log(`Successfully deleted merchant with ID: ${id}`);
        return reply.code(204).send();
      } catch (error) {
        console.error(`Failed to delete merchant with ID: ${id}:`, error);
        return reply.code(500).send({
          error: 'Failed to delete merchant.',
          message: error instanceof Error ? error.message : 'Unknown error',
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