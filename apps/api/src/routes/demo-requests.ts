import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/index.js';
import { env } from '../config/env.js';
import { generateToken } from '../utils/token.js';

// Define simplified email functions directly in this file
// These will be replaced with proper email service functions when dependencies are fixed

// Mock email sending function
function sendEmail(options: { to: string | string[], subject: string, text?: string, html?: string }) {
  console.log(`[MOCK EMAIL] To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
  console.log(`[MOCK EMAIL] Subject: ${options.subject}`);
  console.log(`[MOCK EMAIL] Text: ${options.text?.substring(0, 100)}...`);
  return Promise.resolve({ id: `mock-email-${Date.now()}` });
}

// Send demo request confirmation email
function sendDemoRequestConfirmationEmail(to: string, name: string, calLink: string) {
  return sendEmail({
    to,
    subject: 'Your Demo Request with Loyalty Studio',
    text: `Thank you ${name} for your interest in Loyalty Studio! Schedule your demo here: ${calLink}`,
    html: `<p>Thank you ${name} for your interest! <a href="${calLink}">Schedule your demo</a></p>`
  });
}

// Send admin notification email
function sendAdminNotificationEmail(adminEmail: string, data: any, adminPortalUrl: string) {
  return sendEmail({
    to: adminEmail,
    subject: `New Demo Request: ${data.companyName}`,
    text: `New demo request from ${data.name} at ${data.companyName}. View in admin portal: ${adminPortalUrl}`,
    html: `<p>New demo request from ${data.name} at ${data.companyName}. <a href="${adminPortalUrl}">View in admin portal</a></p>`
  });
}

// Send approval email
function sendApprovalEmail(to: string, name: string, resetPasswordUrl: string) {
  return sendEmail({
    to,
    subject: 'Your Demo Request Has Been Approved',
    text: `Congratulations ${name}! Your demo request has been approved. Set your password here: ${resetPasswordUrl}`,
    html: `<p>Congratulations ${name}! Your demo request has been approved. <a href="${resetPasswordUrl}">Set your password</a></p>`
  });
}

// Send rejection email
function sendRejectionEmail(to: string, name: string, reason?: string) {
  return sendEmail({
    to,
    subject: 'Update on Your Demo Request',
    text: `Thank you for your interest ${name}. Unfortunately, we cannot approve your request at this time. ${reason ? `Reason: ${reason}` : ''}`,
    html: `<p>Thank you for your interest ${name}. Unfortunately, we cannot approve your request at this time. ${reason ? `<br>Reason: ${reason}` : ''}</p>`
  });
}
// Custom function to add days to a date if needed later
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Schema for creating a demo request
const createDemoRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  companyName: z.string().min(2),
  companySize: z.string(),
  industry: z.string(),
  phoneNumber: z.string().optional(),
  jobTitle: z.string().optional(),
  message: z.string().optional(),
});

// Schema for updating a demo request
const updateDemoRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

export async function demoRequestRoutes(fastify: FastifyInstance) {
  // Create a demo request (public endpoint)
  fastify.post('/demo-requests', {
    config: {
      // Mark this route as public (no authentication required)
      public: true
    },
    schema: {
      description: 'Create a new demo request',
      tags: ['demo-requests'],
      body: {
        type: 'object',
        required: ['email', 'name', 'companyName', 'companySize', 'industry'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 2 },
          companyName: { type: 'string', minLength: 2 },
          companySize: { type: 'string' },
          industry: { type: 'string' },
          phoneNumber: { type: 'string' },
          jobTitle: { type: 'string' },
          message: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const data = createDemoRequestSchema.parse(request.body);

      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
        include: { demoRequest: true }
      });

      if (existingUser) {
        // If user already has a demo request, return it
        if (existingUser.demoRequest) {
          return reply.code(200).send({
            id: existingUser.demoRequest.id,
            message: 'You have already submitted a demo request. Our team will contact you soon.',
            status: existingUser.demoRequest.status
          });
        }

        // If user exists but doesn't have a demo request, create one
        const demoRequest = await prisma.demoRequest.create({
          data: {
            userId: existingUser.id,
            companyName: data.companyName,
            companySize: data.companySize,
            industry: data.industry,
            phoneNumber: data.phoneNumber,
            jobTitle: data.jobTitle,
            message: data.message,
          },
        });

        // Send notification email to admins
        await sendAdminNotificationEmail(env.ADMIN_EMAIL, data, env.ADMIN_PORTAL_URL);

        // Send confirmation email to user with Cal.com booking link
        await sendDemoRequestConfirmationEmail(data.email, data.name, env.CAL_BOOKING_URL);

        return reply.code(201).send({
          id: demoRequest.id,
          message: 'Your demo request has been submitted successfully. Our team will contact you soon.',
        });
      }

      // Create a new tenant for the user
      // In development mode, we'll add a timestamp to ensure uniqueness
      const timestamp = Date.now();
      const domain = process.env.NODE_ENV === 'development'
        ? `${data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${timestamp}.${env.BASE_DOMAIN}`
        : `${data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${env.BASE_DOMAIN}`;

      const tenant = await prisma.tenant.create({
        data: {
          name: data.companyName,
          domain,
        },
      });

      // Get the USER role
      const userRole = await prisma.role.findFirst({
        where: { name: 'USER' },
      });

      if (!userRole) {
        return reply.code(500).send({
          error: 'System configuration error: Default role not found',
        });
      }

      // In development mode, we'll skip the actual Supabase user creation
      // and just create a mock user ID
      let userId;

      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Skipping Supabase user creation');
        userId = `dev_${Date.now()}`;
      } else {
        // Create user in Supabase (production mode)
        const { data: supabaseUser, error: supabaseError } = await fastify.supabase.auth.signUp({
          email: data.email,
          password: generateToken(12), // Generate a random password
          options: {
            data: {
              tenant_id: tenant.id,
              role: 'user',
            },
          },
        });

        if (supabaseError || !supabaseUser.user) {
          console.error('Failed to create user in Supabase:', supabaseError);
          return reply.code(500).send({
            error: 'Failed to create user account',
          });
        }

        userId = supabaseUser.user.id;
      }

      // Create user in our database
      const user = await prisma.user.create({
        data: {
          id: userId,
          email: data.email,
          name: data.name,
          tenantId: tenant.id,
          roleId: userRole.id,
          emailVerified: false,
          isApproved: false,
          status: 'PENDING',
        },
      });

      // Create demo request
      const demoRequest = await prisma.demoRequest.create({
        data: {
          userId: user.id,
          companyName: data.companyName,
          companySize: data.companySize,
          industry: data.industry,
          phoneNumber: data.phoneNumber,
          jobTitle: data.jobTitle,
          message: data.message,
        },
      });

      // Send notification email to admins
      await sendAdminNotificationEmail(env.ADMIN_EMAIL, data, env.ADMIN_PORTAL_URL);

      // Send confirmation email to user with Cal.com booking link
      await sendDemoRequestConfirmationEmail(data.email, data.name, env.CAL_BOOKING_URL);

      return reply.code(201).send({
        id: demoRequest.id,
        message: 'Your demo request has been submitted successfully. Our team will contact you soon.',
      });
    } catch (error) {
      console.error('Failed to create demo request:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Invalid input data',
          details: error.errors,
        });
      }
      return reply.code(500).send({
        error: 'Failed to create demo request',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get all demo requests (admin only)
  fastify.get('/demo-requests', {
    schema: {
      description: 'Get all demo requests',
      tags: ['demo-requests'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              companyName: { type: 'string' },
              companySize: { type: 'string' },
              industry: { type: 'string' },
              phoneNumber: { type: 'string', nullable: true },
              jobTitle: { type: 'string', nullable: true },
              message: { type: 'string', nullable: true },
              status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              processedAt: { type: 'string', format: 'date-time', nullable: true },
              processedBy: { type: 'string', nullable: true },
              rejectionReason: { type: 'string', nullable: true },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string', nullable: true },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      // Check if user is admin
      const user = (request as any).user;
      if (!user || user.role.name !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource',
        });
      }

      const demoRequests = await prisma.demoRequest.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return reply.send(demoRequests);
    } catch (error) {
      console.error('Failed to get demo requests:', error);
      return reply.code(500).send({
        error: 'Failed to get demo requests',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get a specific demo request (admin only)
  fastify.get('/demo-requests/:id', {
    schema: {
      description: 'Get a specific demo request',
      tags: ['demo-requests'],
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
            userId: { type: 'string' },
            companyName: { type: 'string' },
            companySize: { type: 'string' },
            industry: { type: 'string' },
            phoneNumber: { type: 'string', nullable: true },
            jobTitle: { type: 'string', nullable: true },
            message: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            processedAt: { type: 'string', format: 'date-time', nullable: true },
            processedBy: { type: 'string', nullable: true },
            rejectionReason: { type: 'string', nullable: true },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string', nullable: true },
                status: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      // Check if user is admin
      const user = (request as any).user;
      if (!user || user.role.name !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource',
        });
      }

      const { id } = request.params as { id: string };

      const demoRequest = await prisma.demoRequest.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              status: true,
            },
          },
        },
      });

      if (!demoRequest) {
        return reply.code(404).send({
          error: 'Not found',
          message: 'Demo request not found',
        });
      }

      return reply.send(demoRequest);
    } catch (error) {
      console.error('Failed to get demo request:', error);
      return reply.code(500).send({
        error: 'Failed to get demo request',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Update a demo request (admin only)
  fastify.patch('/demo-requests/:id', {
    schema: {
      description: 'Update a demo request',
      tags: ['demo-requests'],
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
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['APPROVED', 'REJECTED'] },
          rejectionReason: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      // Check if user is admin
      const user = (request as any).user;
      if (!user || user.role.name !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource',
        });
      }

      const { id } = request.params as { id: string };
      const data = updateDemoRequestSchema.parse(request.body);

      // Get the demo request
      const demoRequest = await prisma.demoRequest.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

      if (!demoRequest) {
        return reply.code(404).send({
          error: 'Not found',
          message: 'Demo request not found',
        });
      }

      // Update the demo request
      const updatedDemoRequest = await prisma.demoRequest.update({
        where: { id },
        data: {
          status: data.status,
          rejectionReason: data.rejectionReason,
          processedAt: new Date(),
          processedBy: user.id,
        },
      });

      // If approved, update the user status and send invitation
      if (data.status === 'APPROVED') {
        // Update user status
        await prisma.user.update({
          where: { id: demoRequest.userId },
          data: {
            isApproved: true,
            approvedAt: new Date(),
            approvedBy: user.id,
            status: 'APPROVED',
          },
        });

        // In development mode, we'll skip the actual password reset
        if (process.env.NODE_ENV !== 'development') {
          // Generate a password reset token for the user (production mode)
          const { error: resetError } = await fastify.supabase.auth.resetPasswordForEmail(
            demoRequest.user.email,
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
        await sendApprovalEmail(
          demoRequest.user.email,
          demoRequest.user.name || 'Valued Customer',
          `${env.MERCHANT_WEB_URL}/reset-password`
        );
      } else if (data.status === 'REJECTED') {
        // Update user status
        await prisma.user.update({
          where: { id: demoRequest.userId },
          data: {
            status: 'REJECTED',
          },
        });

        // Send rejection email to user
        await sendRejectionEmail(
          demoRequest.user.email,
          demoRequest.user.name || 'Valued Customer',
          data.rejectionReason
        );
      }

      return reply.send({
        id: updatedDemoRequest.id,
        message: `Demo request has been ${data.status.toLowerCase()} successfully.`,
      });
    } catch (error) {
      console.error('Failed to update demo request:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Invalid input data',
          details: error.errors,
        });
      }
      return reply.code(500).send({
        error: 'Failed to update demo request',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
