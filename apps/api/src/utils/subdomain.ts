import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

const prisma = new PrismaClient();

/**
 * Validates if a subdomain string meets the required format
 * @param subdomain - The subdomain to validate
 * @returns boolean indicating if the subdomain is valid
 */
export function isValidSubdomain(subdomain: string): boolean {
  // Only allow lowercase letters, numbers, and hyphens
  // Must start and end with a letter or number
  // Length between 3 and 63 characters
  const subdomainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
  return subdomainRegex.test(subdomain);
}

/**
 * Generates a subdomain from a merchant name
 * @param name - The merchant name to generate a subdomain from
 * @returns A valid subdomain string
 */
export function generateSubdomain(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Checks if a subdomain is reserved
 * @param subdomain - The subdomain to check
 * @returns boolean indicating if the subdomain is reserved
 */
export function isReservedSubdomain(subdomain: string): boolean {
  const reservedSubdomains = [
    'www',
    'api',
    'admin',
    'app',
    'dashboard',
    'portal',
    'auth',
    'login',
    'register',
    'signup',
    'signin',
    'support',
    'help',
    'docs',
    'documentation',
    'blog',
    'status',
    'test',
    'demo',
    ...env.ALLOWED_SUBDOMAINS.split(','),
  ];
  return reservedSubdomains.includes(subdomain.toLowerCase());
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
 * @param subdomain - The merchant's subdomain
 * @returns The full domain string
 */
export function getMerchantDomain(subdomain: string): string {
  return `${subdomain}.${env.BASE_DOMAIN}`;
}

/**
 * Extracts the subdomain from a full domain
 * @param domain - The full domain
 * @returns The subdomain string or null if no subdomain
 */
export function extractSubdomain(domain: string): string | null {
  const parts = domain.split('.');
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