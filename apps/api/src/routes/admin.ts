import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/index.js';
import { env } from '../config/env.js';
import { generateToken } from '../utils/token.js';

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

// Schema for creating a new auto-approved user
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  tenantId: z.string().optional(), // Optional: if not provided, will create a new tenant
  tenantName: z.string().optional(), // Optional: name for the new tenant
  createNewTenant: z.boolean().optional(), // Optional: force creation of a new tenant
});

export async function adminRoutes(fastify: FastifyInstance) {
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

  // Create a new auto-approved user (super-admin only)
  fastify.post('/admin/users/create', {
    schema: {
      description: 'Create a new auto-approved user (super-admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['email', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 2 },
          tenantId: { type: 'string', description: 'Existing tenant ID (optional if tenantName is provided)' },
          tenantName: { type: 'string', description: 'Name for a new tenant (optional if tenantId is provided)' },
          createNewTenant: { type: 'boolean', description: 'Force creation of a new tenant even if tenantId is provided' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string', nullable: true },
                tenantId: { type: 'string' },
                status: { type: 'string' },
                isApproved: { type: 'boolean' },
              },
            },
            tenant: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                domain: { type: 'string' },
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
          message: 'Only super-admins can create auto-approved users',
        });
      }

      const data = createUserSchema.parse(request.body);

      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return reply.code(400).send({
          error: 'User already exists',
          message: 'A user with this email already exists',
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

      // Determine tenant ID and name
      let tenantId = data.tenantId;
      let tenantName = data.tenantName;

      // If neither tenantId nor tenantName is provided, create a default tenant name based on user's name
      if (!tenantId && !tenantName) {
        tenantName = `${data.name.replace(/\s+/g, '')}'s Organization`;
        console.log(`No tenant information provided. Creating default tenant: "${tenantName}"`);
      }

      // If createNewTenant is true or no tenantId is provided, create a new tenant
      if (data.createNewTenant || !tenantId) {
        // Use provided tenant name or default
        const nameToUse = tenantName || `${data.name.replace(/\s+/g, '')}'s Organization`;

        // Create a new tenant with a unique domain
        const timestamp = Date.now();
        const sanitizedName = nameToUse.toLowerCase().replace(/[^a-z0-9]/g, '');
        const domain = process.env.NODE_ENV === 'development'
          ? `${sanitizedName}-${timestamp}.${env.BASE_DOMAIN}`
          : `${sanitizedName}.${env.BASE_DOMAIN}`;

        console.log(`Creating new tenant: "${nameToUse}" with domain: ${domain}`);

        const newTenant = await prisma.tenant.create({
          data: {
            name: nameToUse,
            domain,
          },
        });

        tenantId = newTenant.id;
        tenantName = nameToUse;

        console.log(`New tenant created with ID: ${tenantId}`);
      } else {
        // Verify the tenant exists
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { id: true, name: true, domain: true }
        });

        if (!tenant) {
          return reply.code(400).send({
            error: 'Bad request',
            message: `Tenant with ID ${tenantId} not found. Please provide a valid tenantId or set createNewTenant=true to create a new tenant.`,
          });
        }

        console.log(`Using existing tenant: "${tenant.name}" (${tenant.domain})`);
        tenantName = tenant.name;
      }

      // Generate a random password
      const tempPassword = generateToken(12);

      // Create user in Supabase
      const { data: supabaseUser, error: supabaseError } = await fastify.supabase.auth.signUp({
        email: data.email,
        password: tempPassword,
        options: {
          data: {
            tenant_id: tenantId,
            role: 'ADMIN', // Use uppercase to match the role names in the database
            name: data.name, // Include the name in the metadata
          },
        },
      });

      if (supabaseError || !supabaseUser.user) {
        console.error('Failed to create user in Supabase:', supabaseError);
        return reply.code(500).send({
          error: 'Failed to create user account',
          message: supabaseError?.message || 'Unknown error',
        });
      }

      // Create user in our database
      const newUser = await prisma.user.create({
        data: {
          id: supabaseUser.user.id,
          email: data.email,
          name: data.name,
          tenantId: tenantId,
          roleId: adminRole.id,
          emailVerified: true,
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: currentUser.id,
          status: 'APPROVED',
        },
      });

      // Generate a password reset token for the user
      // Always generate a password reset token, even in development mode
      console.log(`Generating password reset token for ${data.email} with redirect to ${env.MERCHANT_WEB_URL}/reset-password`);

      const { error: resetError } = await fastify.supabase.auth.resetPasswordForEmail(
        data.email,
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

      console.log('Password reset token generated successfully');

      // Send welcome email to user
      await sendEmail({
        to: data.email,
        subject: 'Welcome to Loyalty Studio',
        text: `Welcome ${data.name}! Your account has been created with admin privileges. Set your password here: ${env.MERCHANT_WEB_URL}/reset-password or login directly at ${env.MERCHANT_WEB_URL}/login with your temporary password: ${tempPassword}`,
        html: `
          <h1>Welcome to Loyalty Studio</h1>
          <p>Hello ${data.name},</p>
          <p>Your account has been created with admin privileges. You can now set up merchants and invite other users.</p>
          <p>You have two options to access your account:</p>

          <h2>Option 1: Set a New Password</h2>
          <p>You'll receive a separate email with a password reset link. Click the button below to set your password:</p>
          <p>
            <a href="${env.MERCHANT_WEB_URL}/reset-password" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Set Password
            </a>
          </p>

          <h2>Option 2: Login Directly</h2>
          <p>You can also login directly with your temporary password:</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p>
            <a href="${env.MERCHANT_WEB_URL}/login" style="display: inline-block; background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Login Now
            </a>
          </p>

          <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">For security reasons, we recommend changing your password after your first login.</p>
        `,
      });

      // Get tenant details for the response
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, domain: true }
      });

      return reply.code(201).send({
        message: 'User created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          tenantId: newUser.tenantId,
          status: newUser.status,
          isApproved: newUser.isApproved,
        },
        tenant: tenant ? {
          id: tenant.id,
          name: tenant.name,
          domain: tenant.domain
        } : null
      });
    } catch (error) {
      console.error('Failed to create user:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Invalid input data',
          details: error.errors,
        });
      }
      return reply.code(500).send({
        error: 'Failed to create user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
