import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  tenantId: z.string(),
  roleId: z.string().optional()
});

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
      description: 'Register a new user',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password', 'name', 'tenantId'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string' },
          tenantId: { type: 'string' },
          roleId: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
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
    const { email, password, name, tenantId, roleId } = registerSchema.parse(request.body);
    
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      // Get default role (USER) if no role is specified
      const finalRoleId = roleId || await prisma.role.findFirst({
        where: { name: 'USER' },
      }).then(role => role?.id);

      if (!finalRoleId) {
        return reply.code(500).send({ error: 'Default role not found' });
      }

      // Create user in Supabase
      const { data: supabaseUser, error: supabaseError } = await fastify.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            tenant_id: tenantId,
            role: 'user'
          }
        }
      });

      if (supabaseError) {
        return reply.code(400).send({ error: supabaseError.message });
      }

      // Create user in our database
      const user = await prisma.user.create({
        data: {
          id: supabaseUser.user?.id,
          email,
          name,
          tenantId,
          roleId: finalRoleId
        },
        include: {
          role: true
        }
      });

      return reply.code(201).send({
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
      return reply.code(500).send({ error: 'Registration failed' });
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
      const { error } = await fastify.supabase.auth.signOut();
      
      if (error) {
        return reply.code(500).send({ error: error.message });
      }

      return { message: 'Logged out successfully' };
    } catch (error) {
      return reply.code(500).send({ error: 'Logout failed' });
    }
  });
} 