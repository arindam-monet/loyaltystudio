import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantId: z.string()
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
                tenantId: { type: 'string' },
                role: { type: 'string' }
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

      return {
        token: data.session?.access_token,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          tenantId: data.user?.user_metadata?.tenant_id,
          role: data.user?.user_metadata?.role
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
        required: ['email', 'password', 'tenantId'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          tenantId: { type: 'string' }
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
                tenantId: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password, tenantId } = registerSchema.parse(request.body);
    
    try {
      const { data, error } = await fastify.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            tenant_id: tenantId,
            role: 'user'
          }
        }
      });

      if (error) {
        return reply.code(400).send({ error: error.message });
      }

      return reply.code(201).send({
        user: {
          id: data.user?.id,
          email: data.user?.email,
          tenantId: data.user?.user_metadata?.tenant_id,
          role: data.user?.user_metadata?.role
        }
      });
    } catch (error) {
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