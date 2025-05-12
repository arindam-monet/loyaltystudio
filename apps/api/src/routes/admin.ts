import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/index.js';
import { env } from '../config/env.js';
import { generateToken } from '../utils/token.js';
import { generateSubdomain, isValidSubdomain, isReservedSubdomain } from '../utils/subdomain.js';
import { ApiKeyService } from '../services/api-key.js';
import { DNSProviderFactory } from '../services/dns/index.js';

// Define simplified email function directly in this file
// This will be replaced with proper email service function when dependencies are fixed
function sendEmail(options: { to: string | string[], subject: string, text?: string, html?: string }) {
  console.log(`[MOCK EMAIL] To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
  console.log(`[MOCK EMAIL] Subject: ${options.subject}`);
  console.log(`[MOCK EMAIL] Text: ${options.text?.substring(0, 100)}...`);
  return Promise.resolve({ id: `mock-email-${Date.now()}` });
}

// Schema for approving a user
const approveUserSchema = z.object({
  // No additional fields needed for approval
});

// Schema for quick onboarding a new business
const quickOnboardSchema = z.object({
  businessName: z.string().min(2).max(100),
  businessEmail: z.string().email(),
  industry: z.string().optional(),
  adminEmail: z.string().email(),
  adminName: z.string().min(2),
  subdomain: z.string().min(3).max(63).optional(),
  currency: z.string().default("USD"),
  timezone: z.string().default("UTC"),
  branding: z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    primaryTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    logo: z.string().optional(),
    logoUrl: z.string().optional(),
  }).optional(),
});

export async function adminRoutes(fastify: FastifyInstance) {
  // Initialize DNS provider
  const dnsProvider = DNSProviderFactory.createProvider();
  // Approve a user (super-admin only)
  fastify.post('/admin/users/approve/:id', {
    schema: {
      description: 'Approve a user by ID (super-admin only)',
      tags: ['admin'],
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
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string', nullable: true },
                status: { type: 'string' },
                isApproved: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      // Check if user is super-admin
      const currentUser = (request as any).user;
      if (!currentUser || currentUser.role.name !== 'SUPER_ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Only super-admins can approve users',
        });
      }

      const { id } = request.params as { id: string };

      // Get the user to approve
      const userToApprove = await prisma.user.findUnique({
        where: { id },
      });

      if (!userToApprove) {
        return reply.code(404).send({
          error: 'Not found',
          message: 'User not found',
        });
      }

      // Check if user is already approved
      if (userToApprove.isApproved) {
        return reply.code(400).send({
          error: 'Bad request',
          message: 'User is already approved',
        });
      }

      // Get the ADMIN role
      const adminRole = await prisma.role.findFirst({
        where: { name: 'ADMIN' },
      });

      if (!adminRole) {
        return reply.code(500).send({
          error: 'System configuration error',
          message: 'Admin role not found',
        });
      }

      // Update user status and role in our database
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: currentUser.id,
          status: 'APPROVED',
          roleId: adminRole.id, // Set role to ADMIN
        },
        include: {
          tenant: true,
        },
      });

      // Update user metadata in Supabase
      const { error: updateError } = await fastify.supabase.auth.admin.updateUserById(
        id,
        {
          user_metadata: {
            role: 'ADMIN',
            tenant_id: updatedUser.tenantId,
            name: updatedUser.name,
          },
        }
      );

      if (updateError) {
        console.error('Failed to update user metadata in Supabase:', updateError);
        // Continue anyway, as the user is updated in our database
      } else {
        console.log('Updated user metadata in Supabase');
      }

      // In development mode, we'll skip the actual password reset
      if (process.env.NODE_ENV !== 'development') {
        // Generate a password reset token for the user (production mode)
        const { error: resetError } = await fastify.supabase.auth.resetPasswordForEmail(
          updatedUser.email,
          {
            redirectTo: `${env.MERCHANT_WEB_URL}/reset-password`,
          }
        );

        if (resetError) {
          console.error('Failed to generate password reset token:', resetError);
          return reply.code(500).send({
            error: 'Failed to generate password reset token',
            message: resetError.message,
          });
        }
      } else {
        console.log('Development mode: Skipping password reset token generation');
      }

      // Send approval email to user
      await sendEmail({
        to: updatedUser.email,
        subject: 'Your Account Has Been Approved',
        text: `Congratulations ${updatedUser.name || 'Valued Customer'}! Your account has been approved with admin privileges. Set your password here: ${env.MERCHANT_WEB_URL}/reset-password`,
        html: `
          <h1>Your Account Has Been Approved</h1>
          <p>Congratulations ${updatedUser.name || 'Valued Customer'}!</p>
          <p>Your account has been approved with admin privileges. You can now set up merchants and invite other users.</p>
          <p>Please click the button below to set your password:</p>
          <p>
            <a href="${env.MERCHANT_WEB_URL}/reset-password" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Set Password
            </a>
          </p>
        `,
      });

      return reply.send({
        message: 'User approved successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          status: updatedUser.status,
          isApproved: updatedUser.isApproved,
        },
      });
    } catch (error) {
      console.error('Failed to approve user:', error);
      return reply.code(500).send({
        error: 'Failed to approve user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Quick onboard a new business (super-admin only)
  fastify.post('/admin/quick-onboard', {
    schema: {
      description: 'Quickly onboard a new business with a tenant, merchant, admin user, and API keys (super-admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['businessName', 'businessEmail', 'adminEmail', 'adminName'],
        properties: {
          businessName: { type: 'string', minLength: 2, maxLength: 100 },
          businessEmail: { type: 'string', format: 'email' },
          industry: { type: 'string' },
          adminEmail: { type: 'string', format: 'email' },
          adminName: { type: 'string', minLength: 2 },
          subdomain: { type: 'string', minLength: 3, maxLength: 63 },
          currency: { type: 'string', default: 'USD' },
          timezone: { type: 'string', default: 'UTC' },
          branding: {
            type: 'object',
            properties: {
              primaryColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              primaryTextColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              secondaryColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              secondaryTextColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              logo: { type: 'string' },
              logoUrl: { type: 'string' },
            }
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            tenant: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                domain: { type: 'string' }
              }
            },
            merchant: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                subdomain: { type: 'string' },
                email: { type: 'string' }
              }
            },
            admin: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' }
              }
            },
            apiKeys: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  key: { type: 'string' },
                  environment: { type: 'string' }
                }
              }
            },
            loginCredentials: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                password: { type: 'string' },
                loginUrl: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Check if user is super-admin
      const currentUser = (request as any).user;
      if (!currentUser || currentUser.role.name !== 'SUPER_ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Only super-admins can use quick onboarding',
        });
      }

      const data = quickOnboardSchema.parse(request.body);

      // 1. Create a new tenant
      const sanitizedBusinessName = data.businessName.replace(/[^a-zA-Z0-9]/g, '');
      const timestamp = Date.now();
      const domain = `${sanitizedBusinessName.toLowerCase()}-${timestamp}.${env.BASE_DOMAIN}`;

      console.log(`Creating new tenant: "${data.businessName}" with domain: ${domain}`);

      const tenant = await prisma.tenant.create({
        data: {
          name: data.businessName,
          domain,
        },
      });

      console.log(`New tenant created with ID: ${tenant.id}`);

      // 2. Create a merchant under the tenant
      const generatedSubdomain = data.subdomain || generateSubdomain(data.businessName);

      // Validate subdomain format
      if (!isValidSubdomain(generatedSubdomain)) {
        return reply.code(400).send({
          error: 'Invalid subdomain format',
          message: 'Use only lowercase letters, numbers, and hyphens. Must start and end with a letter or number.',
        });
      }

      // Check if subdomain is reserved
      if (isReservedSubdomain(generatedSubdomain)) {
        return reply.code(400).send({
          error: 'Reserved subdomain',
          message: 'This subdomain is reserved and cannot be used.',
        });
      }

      // Check if subdomain is already taken
      const existingMerchant = await prisma.merchant.findFirst({
        where: { subdomain: generatedSubdomain },
      });

      if (existingMerchant) {
        return reply.code(409).send({
          error: 'Subdomain taken',
          message: 'This subdomain is already taken.',
        });
      }

      console.log(`Creating merchant with subdomain: ${generatedSubdomain}`);

      const merchant = await prisma.merchant.create({
        data: {
          name: data.businessName,
          description: `${data.businessName} - Created via quick onboarding`,
          industry: data.industry,
          email: data.businessEmail,
          subdomain: generatedSubdomain,
          currency: data.currency,
          timezone: data.timezone,
          tenantId: tenant.id,
          branding: data.branding || {},
        },
      });

      console.log(`Merchant created with ID: ${merchant.id}`);

      // Create DNS record if DNS provider is configured
      if (dnsProvider) {
        try {
          await dnsProvider.createSubdomain(generatedSubdomain);
          console.log(`DNS record created for subdomain: ${generatedSubdomain}`);
        } catch (error) {
          console.error('Failed to create DNS record:', error);
          // Continue anyway, as this is not critical for the demo
        }
      }

      // 3. Get the ADMIN role
      const adminRole = await prisma.role.findFirst({
        where: { name: 'ADMIN' },
      });

      if (!adminRole) {
        return reply.code(500).send({
          error: 'System configuration error',
          message: 'Admin role not found',
        });
      }

      // 4. Generate a temporary password
      const tempPassword = generateToken(12);

      // 5. Create admin user in Supabase
      const { data: supabaseUser, error: supabaseError } = await fastify.supabase.auth.signUp({
        email: data.adminEmail,
        password: tempPassword,
        options: {
          data: {
            tenant_id: tenant.id,
            role: 'ADMIN',
            name: data.adminName,
          },
        },
      });

      if (supabaseError || !supabaseUser.user) {
        console.error('Failed to create user in Supabase:', supabaseError);
        return reply.code(500).send({
          error: 'Failed to create admin user',
          message: supabaseError?.message || 'Unknown error',
        });
      }

      // 6. Create admin user in our database
      const adminUser = await prisma.user.create({
        data: {
          id: supabaseUser.user.id,
          email: data.adminEmail,
          name: data.adminName,
          tenantId: tenant.id,
          roleId: adminRole.id,
          emailVerified: true,
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: currentUser.id,
          status: 'APPROVED',
        },
      });

      console.log(`Admin user created with ID: ${adminUser.id}`);

      // 7. Generate API keys for the merchant
      const testApiKey = await ApiKeyService.generateKey(
        merchant.id,
        'Test API Key',
        'test'
      );

      const productionApiKey = await ApiKeyService.generateKey(
        merchant.id,
        'Production API Key',
        'production'
      );

      console.log('API keys created for merchant');

      // 8. Generate a password reset token for the admin user
      const { error: resetError } = await fastify.supabase.auth.resetPasswordForEmail(
        data.adminEmail,
        {
          redirectTo: `${env.MERCHANT_WEB_URL}/reset-password`,
        }
      );

      if (resetError) {
        console.warn('Failed to generate password reset token:', resetError);
        // Continue anyway, as we have the temporary password
      }

      // 9. Send welcome email to admin user
      await sendEmail({
        to: data.adminEmail,
        subject: `Welcome to ${data.businessName} on Loyalty Studio`,
        text: `Welcome ${data.adminName}! Your account has been created with admin privileges for ${data.businessName}. Login at ${env.MERCHANT_WEB_URL}/login with email: ${data.adminEmail} and temporary password: ${tempPassword}`,
        html: `
          <h1>Welcome to ${data.businessName} on Loyalty Studio</h1>
          <p>Hello ${data.adminName},</p>
          <p>Your account has been created with admin privileges for ${data.businessName}.</p>
          <p>You can now set up your loyalty program and invite other users.</p>

          <h2>Your Login Credentials</h2>
          <p><strong>Email:</strong> ${data.adminEmail}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p>
            <a href="${env.MERCHANT_WEB_URL}/login" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Login Now
            </a>
          </p>

          <h2>Your API Keys</h2>
          <p><strong>Test API Key:</strong> ${testApiKey}</p>
          <p><strong>Production API Key:</strong> ${productionApiKey}</p>

          <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">For security reasons, we recommend changing your password after your first login.</p>
        `,
      });

      // 10. Return all the created resources
      return reply.code(201).send({
        message: 'Business onboarded successfully',
        tenant: {
          id: tenant.id,
          name: tenant.name,
          domain: tenant.domain,
        },
        merchant: {
          id: merchant.id,
          name: merchant.name,
          subdomain: merchant.subdomain,
          email: merchant.email,
        },
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
        },
        apiKeys: [
          {
            name: 'Test API Key',
            key: testApiKey,
            environment: 'test',
          },
          {
            name: 'Production API Key',
            key: productionApiKey,
            environment: 'production',
          },
        ],
        loginCredentials: {
          email: data.adminEmail,
          password: tempPassword,
          loginUrl: `${env.MERCHANT_WEB_URL}/login`,
        },
      });
    } catch (error) {
      console.error('Failed to onboard business:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Invalid input data',
          details: error.errors,
        });
      }
      return reply.code(500).send({
        error: 'Failed to onboard business',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
