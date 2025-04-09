import { FastifyPluginAsync, FastifyRequest } from 'fastify';
// No need for Prisma in this simplified version

// Extend the FastifyRequest type to include merchantId
declare module 'fastify' {
  interface FastifyRequest {
    merchantId?: string;
  }
}

export const merchantAuthorizationPlugin: FastifyPluginAsync = async (fastify) => {
  console.log('MERCHANT MIDDLEWARE: Plugin registered');

  // Decorate the request object with a merchantId property
  fastify.decorateRequest('merchantId', '');

  // Create a simple middleware function that just logs the request and sets the merchant ID
  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    console.log('MERCHANT MIDDLEWARE: Request received for path:', request.url);
    console.log('MERCHANT MIDDLEWARE: Headers:', JSON.stringify(request.headers));

    // Extract merchant ID from header
    const merchantId = request.headers['x-merchant-id'] as string;
    console.log('MERCHANT MIDDLEWARE: Merchant ID from header:', merchantId);

    // Set the merchant ID on the request object
    if (merchantId) {
      request.merchantId = merchantId;
      console.log(`MERCHANT MIDDLEWARE: Merchant ID set to: ${merchantId}`);
    }
  });
};
