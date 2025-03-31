import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/index.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  roleId: z.string().optional()
});

// Helper function to create a user session
async function createUserSession(userId: string, token: string, request: any) {
  const deviceInfo = {
    userAgent: request.headers['user-agent'],
    platform: request.headers['sec-ch-ua-platform'],
    mobile: request.headers['sec-ch-ua-mobile'],
    language: request.headers['accept-language']
  };

  return prisma.userSession.create({
    data: {
      userId,
      token,
      deviceInfo,
      ipAddress: request.ip,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  });
}

// Helper function to invalidate user sessions
async function invalidateUserSessions(userId: string) {
  return prisma.userSession.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false }
  });
}

export async function authRoutes(fastify: FastifyInstance) {
  // Login endpoint
  fastify.post('/auth/login', {
    schema: {
      description: 'Authenticate user and return JWT token',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                tenantId: { type: 'string' },
                role: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);
    
    try {
      const { data, error } = await fastify.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return reply.code(401).send({ error: error.message });
      }

      // Get user from our database to include role information
      const user = await prisma.user.findUnique({
        where: { id: data.user?.id },
        include: { role: true }
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found in database' });
      }

      // Create a new session
      await createUserSession(user.id, data.session?.access_token, request);

      return {
        token: data.session?.access_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          role: user.role
        }
      };
    } catch (error) {
      return reply.code(500).send({ error: 'Authentication failed' });
    }
  });

  // Register endpoint
  fastify.post('/auth/register', {
    schema: {
      description: 'Register a new user and create tenant',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string' },
          roleId: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                tenantId: { type: 'string' },
                role: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password, name, roleId } = registerSchema.parse(request.body);
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      // Get default role (USER) if no role is specified
      const defaultRole = await prisma.role.findFirst({
        where: { name: 'USER' }
      });

      if (!defaultRole) {
        console.error('Default USER role not found in database');
        return reply.code(500).send({ error: 'System configuration error: Default role not found' });
      }

      const finalRoleId = roleId || defaultRole.id;

      // Create tenant first with a unique domain
      const baseDomain = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      let domain = `${baseDomain}.loyaltystudio.ai`;
      let counter = 1;

      // Keep trying until we find a unique domain
      while (true) {
        const existingTenant = await prisma.tenant.findUnique({
          where: { domain }
        });

        if (!existingTenant) {
          break;
        }

        domain = `${baseDomain}-${counter}.loyaltystudio.ai`;
        counter++;
      }

      // Create tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: `${name}'s Organization`,
          domain
        }
      }).catch(error => {
        console.error('Failed to create tenant:', error);
        throw new Error('Failed to create tenant');
      });

      // Create user in Supabase
      const { data: supabaseUser, error: supabaseError } = await fastify.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            tenant_id: tenant.id,
            role: 'user'
          }
        }
      });

      if (supabaseError) {
        // Rollback tenant creation if user creation fails
        await prisma.tenant.delete({ where: { id: tenant.id } });
        console.error('Supabase user creation failed:', supabaseError);
        return reply.code(400).send({ error: supabaseError.message });
      }

      if (!supabaseUser.user?.id) {
        // Rollback tenant creation if no user ID returned
        await prisma.tenant.delete({ where: { id: tenant.id } });
        console.error('No user ID returned from Supabase');
        return reply.code(500).send({ error: 'Failed to create user account' });
      }

      // Create user in our database
      const user = await prisma.user.create({
        data: {
          id: supabaseUser.user.id,
          email,
          name,
          tenantId: tenant.id,
          roleId: finalRoleId
        },
        include: {
          role: true
        }
      }).catch(async (error) => {
        console.error('Failed to create user in database:', error);
        // Rollback tenant creation
        await prisma.tenant.delete({ where: { id: tenant.id } });
        throw new Error('Failed to create user in database');
      });

      // Get the session token
      const { data: sessionData, error: sessionError } = await fastify.supabase.auth.getSession();
      
      if (sessionError || !sessionData.session?.access_token) {
        console.error('Failed to get session:', sessionError);
        return reply.code(500).send({ error: 'Failed to create session' });
      }

      // Create a new session
      await createUserSession(user.id, sessionData.session.access_token, request);

      return reply.code(201).send({
        token: sessionData.session.access_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid input data', details: error.errors });
      }
      return reply.code(500).send({ error: 'Registration failed', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Logout endpoint
  fastify.post('/auth/logout', {
    schema: {
      description: 'Logout user and invalidate token',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return reply.code(401).send({ error: 'No token provided' });
      }

      // Get the user from the token
      const { data: { user }, error: userError } = await fastify.supabase.auth.getUser(token);
      
      if (userError || !user) {
        return reply.code(401).send({ error: 'Invalid token' });
      }

      // Invalidate all sessions for the user
      await invalidateUserSessions(user.id);

      // Sign out from Supabase
      const { error: signOutError } = await fastify.supabase.auth.signOut();
      
      if (signOutError) {
        return reply.code(500).send({ error: signOutError.message });
      }

      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      return reply.code(500).send({ error: 'Logout failed' });
    }
  });
} 