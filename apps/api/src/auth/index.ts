import fp from 'fastify-plugin';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

interface User {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    supabase: SupabaseClient<any, 'public', any>;
  }
  interface FastifyRequest {
    user: User;
  }
}

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/health',
  '/documentation',
  '/documentation/',
  '/documentation/openapi.json',
  '/debug/openapi',
  '/documentation/assets',
  '/documentation/assets/',
  '/documentation/assets/*',
  '/openapi.json'
];

export const authPlugin = fp(async (fastify: FastifyInstance) => {
  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Decorate fastify with supabase client
  fastify.decorate('supabase', supabase);

  // Add auth middleware
  fastify.addHook('preHandler', async (request, reply) => {
    // Debug logging for auth middleware
    console.log('Auth middleware processing request:', request.url);

    // Skip auth for public paths
    if (PUBLIC_PATHS.some(path => request.url.startsWith(path))) {
      console.log('Skipping auth for public path:', request.url);
      return;
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
        return reply.code(401).send({ error: 'Invalid token' });
      }

      // Get user metadata from your database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        return reply.code(401).send({ error: 'User data not found' });
      }

      // Add user to request with additional data
      request.user = {
        id: user.id,
        email: user.email,
        tenantId: userData.tenant_id,
        role: userData.role
      };
    } catch (error) {
      return reply.code(401).send({ error: 'Authentication failed' });
    }
  });
}); 