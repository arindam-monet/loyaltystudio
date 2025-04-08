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
// Custom function to add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Schema for creating an invitation
const createInvitationSchema = z.object({
  email: z.string().email(),
  roleId: z.string(),
});

// Schema for accepting an invitation
const acceptInvitationSchema = z.object({
  token: z.string(),
  name: z.string().min(2),
  password: z.string().min(6),
});

export async function invitationRoutes(fastify: FastifyInstance) {
  // Create an invitation (admin or team owner only)
  fastify.post('/invitations', {
    schema: {
      description: 'Create a new user invitation',
      tags: ['invitations'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['email', 'roleId'],
        properties: {
          email: { type: 'string', format: 'email' },
          roleId: { type: 'string' },
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
      const user = (request as any).user;
      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'You must be logged in to create an invitation',
        });
      }

      // Check if user has permission to create invitations
      const hasPermission = user.role.name === 'ADMIN' || user.role.name === 'OWNER';
      if (!hasPermission) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to create invitations',
        });
      }

      const data = createInvitationSchema.parse(request.body);

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

      // Check if there's an existing invitation for this email
      const existingInvitation = await prisma.userInvitation.findFirst({
        where: {
          email: data.email,
          status: 'PENDING',
        },
      });

      if (existingInvitation) {
        return reply.code(400).send({
          error: 'Invitation already exists',
          message: 'An invitation has already been sent to this email',
        });
      }

      // Get the role
      const role = await prisma.role.findUnique({
        where: { id: data.roleId },
      });

      if (!role) {
        return reply.code(400).send({
          error: 'Invalid role',
          message: 'The specified role does not exist',
        });
      }

      // Generate invitation token
      const token = generateToken(32);
      const expiresAt = addDays(new Date(), 7); // Invitation expires in 7 days

      // Create invitation
      const invitation = await prisma.userInvitation.create({
        data: {
          email: data.email,
          invitedById: user.id,
          token,
          roleId: data.roleId,
          tenantId: user.tenantId,
          expiresAt,
        },
      });

      // Send invitation email
      const inviteUrl = `${env.MERCHANT_WEB_URL}/accept-invitation?token=${token}`;
      await sendEmail({
        to: data.email,
        subject: 'You have been invited to join Loyalty Studio',
        text: `You have been invited to join Loyalty Studio. Please click the following link to accept the invitation: ${inviteUrl}`,
        html: `
          <h1>You have been invited to join Loyalty Studio</h1>
          <p>You have been invited to join Loyalty Studio as a ${role.name.toLowerCase()}.</p>
          <p>Please click the button below to accept the invitation:</p>
          <p>
            <a href="${inviteUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Accept Invitation
            </a>
          </p>
          <p>This invitation will expire in 7 days.</p>
          <p>If you have any questions, please contact the person who invited you.</p>
        `,
      });

      return reply.code(201).send({
        id: invitation.id,
        message: 'Invitation sent successfully',
      });
    } catch (error) {
      console.error('Failed to create invitation:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Invalid input data',
          details: error.errors,
        });
      }
      return reply.code(500).send({
        error: 'Failed to create invitation',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get all invitations for the current tenant
  fastify.get('/invitations', {
    schema: {
      description: 'Get all invitations for the current tenant',
      tags: ['invitations'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              expiresAt: { type: 'string', format: 'date-time' },
              role: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              invitedBy: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string', nullable: true },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'You must be logged in to view invitations',
        });
      }

      // Check if user has permission to view invitations
      const hasPermission = user.role.name === 'ADMIN' || user.role.name === 'OWNER';
      if (!hasPermission) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to view invitations',
        });
      }

      const invitations = await prisma.userInvitation.findMany({
        where: {
          tenantId: user.tenantId,
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          invitedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return reply.send(invitations);
    } catch (error) {
      console.error('Failed to get invitations:', error);
      return reply.code(500).send({
        error: 'Failed to get invitations',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Revoke an invitation
  fastify.delete('/invitations/:id', {
    schema: {
      description: 'Revoke an invitation',
      tags: ['invitations'],
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
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'You must be logged in to revoke an invitation',
        });
      }

      // Check if user has permission to revoke invitations
      const hasPermission = user.role.name === 'ADMIN' || user.role.name === 'OWNER';
      if (!hasPermission) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to revoke invitations',
        });
      }

      const { id } = request.params as { id: string };

      // Get the invitation
      const invitation = await prisma.userInvitation.findUnique({
        where: { id },
      });

      if (!invitation) {
        return reply.code(404).send({
          error: 'Not found',
          message: 'Invitation not found',
        });
      }

      // Check if invitation belongs to the user's tenant
      if (invitation.tenantId !== user.tenantId) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to revoke this invitation',
        });
      }

      // Update invitation status
      await prisma.userInvitation.update({
        where: { id },
        data: {
          status: 'REVOKED',
        },
      });

      return reply.send({
        message: 'Invitation revoked successfully',
      });
    } catch (error) {
      console.error('Failed to revoke invitation:', error);
      return reply.code(500).send({
        error: 'Failed to revoke invitation',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Verify invitation token
  fastify.get('/invitations/verify', {
    schema: {
      description: 'Verify an invitation token',
      tags: ['invitations'],
      querystring: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            email: { type: 'string' },
            role: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
            tenant: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { token } = request.query as { token: string };

      // Get the invitation
      const invitation = await prisma.userInvitation.findFirst({
        where: {
          token,
          status: 'PENDING',
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!invitation) {
        return reply.send({
          valid: false,
          message: 'Invalid or expired invitation token',
        });
      }

      return reply.send({
        valid: true,
        email: invitation.email,
        role: invitation.role,
        tenant: invitation.tenant,
      });
    } catch (error) {
      console.error('Failed to verify invitation:', error);
      return reply.code(500).send({
        error: 'Failed to verify invitation',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Accept an invitation
  fastify.post('/invitations/accept', {
    schema: {
      description: 'Accept an invitation',
      tags: ['invitations'],
      body: {
        type: 'object',
        required: ['token', 'name', 'password'],
        properties: {
          token: { type: 'string' },
          name: { type: 'string', minLength: 2 },
          password: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string', nullable: true },
                tenantId: { type: 'string' },
                role: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const data = acceptInvitationSchema.parse(request.body);

      // Get the invitation
      const invitation = await prisma.userInvitation.findFirst({
        where: {
          token: data.token,
          status: 'PENDING',
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          role: true,
          tenant: true,
        },
      });

      if (!invitation) {
        return reply.code(400).send({
          error: 'Invalid invitation',
          message: 'Invalid or expired invitation token',
        });
      }

      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: invitation.email },
      });

      if (existingUser) {
        return reply.code(400).send({
          error: 'User already exists',
          message: 'A user with this email already exists',
        });
      }

      // Create user in Supabase
      const { data: supabaseUser, error: supabaseError } = await fastify.supabase.auth.signUp({
        email: invitation.email,
        password: data.password,
        options: {
          data: {
            tenant_id: invitation.tenantId,
            role: invitation.role.name.toLowerCase(),
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
      const user = await prisma.user.create({
        data: {
          id: supabaseUser.user.id,
          email: invitation.email,
          name: data.name,
          tenantId: invitation.tenantId,
          roleId: invitation.roleId,
          emailVerified: true,
          isApproved: true,
          status: 'APPROVED',
        },
        include: {
          role: true,
        },
      });

      // Update invitation status
      await prisma.userInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          invitedUserId: user.id,
        },
      });

      // Sign in the user
      const { data: signInData, error: signInError } = await fastify.supabase.auth.signInWithPassword({
        email: invitation.email,
        password: data.password,
      });

      if (signInError) {
        console.error('Failed to sign in after accepting invitation:', signInError);
        return reply.code(500).send({
          error: 'Failed to sign in',
          message: signInError.message,
        });
      }

      return reply.send({
        message: 'Invitation accepted successfully',
        token: signInData.session?.access_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Invalid input data',
          details: error.errors,
        });
      }
      return reply.code(500).send({
        error: 'Failed to accept invitation',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
