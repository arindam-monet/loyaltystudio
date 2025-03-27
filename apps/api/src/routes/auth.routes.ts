import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string(),
  tenantId: z.string(),
  role: z.enum(['ADMIN', 'USER', 'MERCHANT'])
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export default async function authRoutes(fastify: FastifyInstance) {
  // Register new user
  fastify.post('/register', {
    schema: {
      body: registerSchema,
      tags: ['Authentication'],
      summary: 'Register a new user'
    }
  }, async (request, reply) => {
    try {
      const data = registerSchema.parse(request.body);
      const result = await authService.register(data);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Login user
  fastify.post('/login', {
    schema: {
      body: loginSchema,
      tags: ['Authentication'],
      summary: 'Login user'
    }
  }, async (request, reply) => {
    try {
      const credentials = loginSchema.parse(request.body);
      const result = await authService.login(credentials);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      if (error instanceof Error) {
        return reply.status(401).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Refresh token
  fastify.post('/refresh', {
    schema: {
      tags: ['Authentication'],
      summary: 'Refresh access token'
    }
  }, async (request, reply) => {
    try {
      const refreshToken = request.headers['x-refresh-token'] as string;
      if (!refreshToken) {
        return reply.status(401).send({ error: 'No refresh token provided' });
      }

      const result = await authService.refreshToken(refreshToken);
      return reply.send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(401).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
} 