import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { verify } from 'jsonwebtoken';
import { logger } from '../utils/logger';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      email: string;
      tenantId: string;
      role: string;
    };
    tenantId: string;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Register JWT verification decorator
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
        id: string;
        email: string;
        tenantId: string;
        role: string;
      };

      request.user = decoded;
      request.tenantId = decoded.tenantId;

      logger.debug(`Authenticated user ${decoded.email} for tenant ${decoded.tenantId}`);
    } catch (error) {
      logger.error('Authentication error:', error);
      return reply.status(401).send({ error: 'Invalid token' });
    }
  });

  // Register role-based access control decorator
  fastify.decorate('requireRole', (roles: string[]) => {
    return async (request: any, reply: any) => {
      if (!roles.includes(request.user.role)) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }
    };
  });
};

export default fp(authPlugin, {
  name: 'auth',
  fastify: '4.x'
}); 