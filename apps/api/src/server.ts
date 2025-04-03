import { FastifyInstance } from 'fastify';
import { programTierRoutes } from './routes/program-tiers';
import { programMemberRoutes } from './routes/program-members';
import { campaignRoutes } from './routes/campaigns';

export async function configureServer(server: FastifyInstance) {
  // Register loyalty program routes
  await server.register(programTierRoutes);
  await server.register(programMemberRoutes);
  await server.register(campaignRoutes);
} 