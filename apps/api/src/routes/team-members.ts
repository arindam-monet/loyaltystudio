import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for invite request
const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
});

export async function teamMembersRoutes(fastify: FastifyInstance) {
  // Get all team members for the current tenant
  fastify.get('/team-members', {
    schema: {
      description: 'Get all team members for the current tenant',
      tags: ['team-members'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string', nullable: true },
              email: { type: 'string' },
              role: { type: 'string' },
              status: { type: 'string' },
              isAdmin: { type: 'boolean' },
              isTenantOwner: { type: 'boolean' },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = request.user;
      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'You must be logged in to view team members',
        });
      }

      // Get all users in the same tenant
      const teamMembers = await prisma.user.findMany({
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Find the earliest admin user (tenant owner)
      const earliestAdmin = await prisma.user.findFirst({
        where: {
          tenantId: user.tenantId,
          role: {
            name: {
              in: ['ADMIN', 'OWNER']
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Get pending invitations to show as team members with 'pending' status
      const pendingInvitations = await prisma.userInvitation.findMany({
        where: {
          tenantId: user.tenantId,
          status: 'PENDING',
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Transform the data to match the expected format
      const formattedMembers = teamMembers.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role?.name.toLowerCase() || 'member',
        status: member.status.toLowerCase(),
        isAdmin: member.role?.name === 'ADMIN' || member.role?.name === 'OWNER',
        isTenantOwner: earliestAdmin?.id === member.id,
      }));

      // Add pending invitations as team members with 'pending' status
      const formattedInvitations = pendingInvitations.map(invitation => ({
        id: `invitation-${invitation.id}`, // Prefix to distinguish from actual users
        name: null,
        email: invitation.email,
        role: invitation.role?.name.toLowerCase() || 'member',
        status: 'pending',
        isAdmin: invitation.role?.name === 'ADMIN' || invitation.role?.name === 'OWNER',
        isTenantOwner: false, // Invitations are never tenant owners
      }));

      // Combine users and pending invitations
      return reply.send([...formattedMembers, ...formattedInvitations]);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      return reply.code(500).send({
        error: 'Failed to fetch team members',
        message: 'An error occurred while fetching team members',
      });
    }
  });

  // Invite a new team member
  fastify.post('/team-members/invite', {
    schema: {
      description: 'Invite a new team member',
      tags: ['team-members'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['email', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          role: { type: 'string' },
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
      const user = request.user;
      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'You must be logged in to invite team members',
        });
      }

      // Check if user has permission to invite team members
      const hasPermission = user.role?.name === 'ADMIN' || user.role?.name === 'OWNER';
      if (!hasPermission) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to invite team members',
        });
      }

      const data = inviteSchema.parse(request.body);

      // Find the role by name
      const roleName = data.role.toUpperCase();
      const role = await prisma.role.findFirst({
        where: {
          name: roleName,
        },
      });

      if (!role) {
        return reply.code(400).send({
          error: 'Invalid role',
          message: 'The specified role does not exist',
        });
      }

      // Forward the request to the invitations endpoint
      // This ensures we use the same invitation logic
      const invitationRequest = {
        ...request,
        body: {
          email: data.email,
          roleId: role.id,
        },
      };

      // Call the invitations endpoint internally
      // We're using the request injection feature of Fastify
      const response = await fastify.inject({
        method: 'POST',
        url: '/invitations',
        headers: {
          'Authorization': request.headers.authorization,
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify({
          email: data.email,
          roleId: role.id,
        }),
      });

      const responseData = JSON.parse(response.payload);

      if (response.statusCode !== 201) {
        return reply.code(response.statusCode).send(responseData);
      }

      return reply.code(201).send(responseData);
    } catch (error) {
      console.error('Failed to invite team member:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Invalid input data',
          details: error.errors,
        });
      }
      return reply.code(500).send({
        error: 'Failed to invite team member',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Remove a team member
  fastify.delete('/team-members/:id', {
    schema: {
      description: 'Remove a team member',
      tags: ['team-members'],
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
      const user = request.user;
      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'You must be logged in to remove team members',
        });
      }

      // Check if user has permission to remove team members
      const hasPermission = user.role?.name === 'ADMIN' || user.role?.name === 'OWNER';
      if (!hasPermission) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to remove team members',
        });
      }

      const { id } = request.params as { id: string };

      // Check if this is an invitation ID (prefixed with 'invitation-')
      if (id.startsWith('invitation-')) {
        const invitationId = id.replace('invitation-', '');

        // Call the invitations endpoint to revoke the invitation
        const response = await fastify.inject({
          method: 'DELETE',
          url: `/invitations/${invitationId}`,
          headers: {
            'Authorization': request.headers.authorization,
          },
        });

        const responseData = JSON.parse(response.payload);

        if (response.statusCode !== 200) {
          return reply.code(response.statusCode).send(responseData);
        }

        return reply.send({
          message: 'Invitation revoked successfully',
        });
      }

      // If not an invitation, it's a user
      // Check if the user exists and is in the same tenant
      const memberToRemove = await prisma.user.findUnique({
        where: { id },
        include: {
          role: true
        }
      });

      if (!memberToRemove) {
        return reply.code(404).send({
          error: 'User not found',
          message: 'The specified user does not exist',
        });
      }

      if (memberToRemove.tenantId !== user.tenantId) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to remove this user',
        });
      }

      // Prevent users from removing themselves
      if (memberToRemove.id === user.id) {
        return reply.code(400).send({
          error: 'Invalid operation',
          message: 'You cannot remove yourself',
        });
      }

      // Check if this is the tenant owner (first admin of the tenant)
      // We identify the tenant owner as the first admin user created for this tenant
      if (memberToRemove.role?.name === 'ADMIN' || memberToRemove.role?.name === 'OWNER') {
        // Find the earliest admin user for this tenant
        const earliestAdmin = await prisma.user.findFirst({
          where: {
            tenantId: user.tenantId,
            role: {
              name: {
                in: ['ADMIN', 'OWNER']
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        });

        // If this is the earliest admin (tenant owner), prevent removal
        if (earliestAdmin && earliestAdmin.id === memberToRemove.id) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'The tenant owner cannot be removed as they are the primary owner of the business account',
          });
        }
      }

      // Delete the user
      await prisma.user.delete({
        where: { id },
      });

      return reply.send({
        message: 'Team member removed successfully',
      });
    } catch (error) {
      console.error('Failed to remove team member:', error);
      return reply.code(500).send({
        error: 'Failed to remove team member',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
