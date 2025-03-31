import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generates a URL-friendly subdomain from a merchant name
 */
export function generateSubdomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validates if a subdomain is available for a tenant
 */
export async function isSubdomainAvailable(subdomain: string, tenantId: string): Promise<boolean> {
  const existingMerchant = await prisma.merchant.findFirst({
    where: {
      subdomain,
      tenantId,
    },
  });

  return !existingMerchant;
}

/**
 * Validates subdomain format
 */
export function validateSubdomain(subdomain: string): boolean {
  // Must be between 3 and 63 characters
  if (subdomain.length < 3 || subdomain.length > 63) {
    return false;
  }

  // Must start and end with a letter or number
  if (!/^[a-z0-9]|[a-z0-9]$/i.test(subdomain)) {
    return false;
  }

  // Can only contain letters, numbers, and hyphens
  // Hyphens cannot be consecutive
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(subdomain);
}

/**
 * Gets the full domain for a merchant
 */
export function getMerchantDomain(subdomain: string, tenantDomain: string): string {
  return `${subdomain}.${tenantDomain}`;
}

/**
 * Extracts subdomain from a host
 */
export function extractSubdomain(host: string): string | null {
  const parts = host.split('.');
  if (parts.length < 2) return null;
  return parts[0];
}

/**
 * Extracts tenant domain from a host
 */
export function extractTenantDomain(host: string): string | null {
  const parts = host.split('.');
  if (parts.length < 2) return null;
  return parts.slice(1).join('.');
} 