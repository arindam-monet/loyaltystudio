import { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env.js';
import { extractSubdomain, extractTenantDomain } from '../utils/subdomain.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const subdomainPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const host = request.headers.host || '';

    // Skip subdomain check for localhost or IP addresses
    if (host.includes('localhost') || host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return;
    }

    // Extract subdomain and tenant domain
    const subdomain = extractSubdomain(host);
    const tenantDomain = extractTenantDomain(host);

    if (!subdomain || !tenantDomain) {
      return reply.code(400).send({
        error: 'Invalid domain format',
        message: 'Request must include a valid subdomain and tenant domain'
      });
    }

    // Find tenant by domain
    const tenant = await prisma.tenant.findUnique({
      where: { domain: tenantDomain },
    });

    if (!tenant) {
      return reply.code(404).send({
        error: 'Tenant not found',
        message: `No tenant found for domain: ${tenantDomain}`
      });
    }

    // Check if this is a merchant subdomain
    const merchant = await prisma.merchant.findFirst({
      where: {
        subdomain,
        tenantId: tenant.id,
      },
    });

    if (merchant && merchant.subdomain) {
      // This is a merchant-specific request
      request.merchant = {
        id: merchant.id,
        name: merchant.name,
        subdomain: merchant.subdomain,
        tenantId: merchant.tenantId,
      };
      request.tenant = tenant;
      return;
    }

    // Check if this is an allowed system subdomain
    const allowedSubdomains = env.ALLOWED_SUBDOMAINS || ['admin', 'merchant', 'api'];
    if (!allowedSubdomains.includes(subdomain)) {
      return reply.code(400).send({
        error: 'Invalid subdomain',
        message: `Subdomain "${subdomain}" is not allowed. Allowed subdomains: ${allowedSubdomains.join(', ')}`
      });
    }

    // This is a system subdomain request
    request.tenant = tenant;
  });
};

// Add type declarations for the request object
declare module 'fastify' {
  interface FastifyRequest {
    merchant?: {
      id: string;
      name: string;
      subdomain: string;
      tenantId: string;
    };
    tenant?: {
      id: string;
      name: string;
      domain: string;
    };
  }
}