import { FastifyInstance } from 'fastify';
import { permissionRoutes } from './routes/permissions.js';
import { roleRoutes } from './routes/roles.js';

export async function registerRoutes(app: FastifyInstance) {
  // Register RBAC routes
  await app.register(permissionRoutes);
  await app.register(roleRoutes);
} 