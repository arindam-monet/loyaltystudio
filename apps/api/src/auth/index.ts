import fp from 'fastify-plugin';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';

interface AuthUser {
  id: string;
  email: string;
  tenantId: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
}

declare module 'fastify' {
  interface FastifyInstance {
    supabase: SupabaseClient<any, 'public', any>;
  }
  interface FastifyRequest {
    user: AuthUser;
  }
}

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/health',
  '/docs',
  '/docs/',
  '/docs/openapi.json',
  '/debug/openapi',
  '/docs/assets',
  '/docs/assets/',
  '/docs/assets/*',
  '/openapi.json',
  '/docs/static',
  '/docs/static/*',
  '/favicon.ico',
  '/auth/register',
  '/auth/login',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-session',
  '/demo-requests',  // Allow public access to demo requests
  '/api/demo-requests' // Allow public access to demo requests with /api prefix
];

export const authPlugin = fp(async (fastify: FastifyInstance) => {
  // Initialize Supabase client
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
        // Note: redirectTo is set in individual auth operations
      }
    }
  );

  console.log(`Supabase client initialized with URL: ${env.SUPABASE_URL}`);

  // Decorate fastify with supabase client
  fastify.decorate('supabase', supabase);

  // Add auth middleware
  fastify.addHook('preHandler', async (request, reply) => {
    // Debug logging for auth middleware
    console.log('Auth middleware processing request:', {
      url: request.url,
      method: request.method,
      headers: request.headers
    });

    // Skip auth for public paths
    if (PUBLIC_PATHS.some(path => request.url.startsWith(path))) {
      console.log('Skipping auth for public path:', request.url);
      return;
    }

    // Skip auth for OPTIONS requests (CORS preflight)
    if (request.method === 'OPTIONS') {
      console.log('Skipping auth for OPTIONS request');
      return;
    }

    // Skip auth for favicon.ico
    if (request.url === '/favicon.ico') {
      console.log('Skipping auth for favicon.ico');
      return reply.code(404).send();
    }

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      console.log('No authorization header for:', request.url);
      return reply.code(401).send({ error: 'No authorization header' });
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user || !user.email) {
        console.log('Invalid token for:', request.url);
        return reply.code(401).send({ error: 'Invalid token' });
      }

      // Get user data with role information from your database
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          role: true,
        },
      });

      if (!userData) {
        console.log('User data not found for:', request.url);
        console.log('Checking user metadata in Supabase:', user.user_metadata);

        // Get the role from Supabase metadata
        const userRole = user.user_metadata?.role?.toUpperCase() || 'USER';
        console.log(`User role from Supabase metadata: ${userRole}`);

        // Get the role from the database
        const dbRole = await prisma.role.findFirst({
          where: { name: userRole },
        });

        if (!dbRole) {
          console.error(`Role ${userRole} not found in database`);
          return reply.code(500).send({ error: `System configuration error: ${userRole} role not found` });
        }

        // Get tenant ID from Supabase metadata
        const tenantId = user.user_metadata?.tenant_id;
        if (!tenantId) {
          console.error('Tenant ID not found in user metadata');
          return reply.code(401).send({ error: 'Tenant ID not found in user metadata' });
        }

        // Verify the tenant exists
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
        });

        if (!tenant) {
          console.error(`Tenant with ID ${tenantId} not found`);
          return reply.code(401).send({ error: `Tenant with ID ${tenantId} not found` });
        }

        console.log(`User exists in Supabase but not in database. Creating user record with role ${userRole} and tenant ${tenant.name}...`);

        // Create the user in the database
        try {
          const newUserData = await prisma.user.create({
            data: {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email.split('@')[0],
              roleId: dbRole.id,
              emailVerified: true,
              isApproved: true,
              status: 'APPROVED',
              tenantId: tenantId,
            },
            include: {
              role: true,
            },
          });

          console.log('Created user in database:', newUserData.id);

          // Use the newly created user data
          request.user = {
            id: newUserData.id,
            email: newUserData.email,
            tenantId: newUserData.tenantId,
            role: {
              id: newUserData.role.id,
              name: newUserData.role.name,
              description: newUserData.role.description || undefined,
            },
          };

          return; // Continue with the request
        } catch (createError) {
          console.error('Failed to create user in database:', createError);
          return reply.code(500).send({ error: 'Failed to create user record' });
        }
      }

      if (!userData.role) {
        console.log('User role not found for:', request.url);
        return reply.code(401).send({ error: 'User role not found' });
      }

      // Add user to request with additional data
      request.user = {
        id: user.id,
        email: user.email,
        tenantId: userData.tenantId,
        role: {
          id: userData.role.id,
          name: userData.role.name,
          description: userData.role.description || undefined,
        },
      };

      console.log('Auth successful for:', request.url, {
        userId: user.id,
        email: user.email,
        tenantId: userData.tenantId,
        role: userData.role.name,
      });
    } catch (error) {
      console.error('Auth error for:', request.url, error);
      return reply.code(401).send({ error: 'Authentication failed' });
    }
  });
});