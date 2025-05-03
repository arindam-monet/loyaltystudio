import { FastifyInstance } from 'fastify';
import { programTierRoutes } from './routes/program-tiers.js';
import { programMemberRoutes } from './routes/program-members.js';
import { campaignRoutes } from './routes/campaigns.js';

export async function configureServer(server: FastifyInstance) {
  // Register loyalty program routes
  await server.register(programTierRoutes);
  await server.register(programMemberRoutes);
  await server.register(campaignRoutes);
}