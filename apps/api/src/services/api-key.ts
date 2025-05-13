import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import crypto from 'crypto';

const prisma = new PrismaClient();

export class ApiKeyService {
  private static readonly KEY_LENGTH = 32;
  private static readonly DEFAULT_RATE_LIMIT = 100; // requests per minute

  private static readonly PRODUCTION_RATE_LIMIT = 60; // Lower rate limit for production

  /**
   * Generate a new API key for a merchant
   */
  static async generateKey(
    merchantId: string,
    name: string,
    environment: 'test' | 'production' = 'test',
    expiresIn?: number
  ): Promise<string> {
    const key = crypto.randomBytes(this.KEY_LENGTH).toString('hex');

    // Calculate expiration date if provided
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) : null;

    // Set rate limit based on environment
    const rateLimit = environment === 'test' ? this.DEFAULT_RATE_LIMIT : this.PRODUCTION_RATE_LIMIT;

    await prisma.apiKey.create({
      data: {
        key,
        name,
        merchantId,
        environment,
        expiresAt,
        rateLimits: {
          create: {
            window: 60, // 1 minute
            limit: rateLimit,
          },
        },
      },
    });

    return key;
  }

  /**
   * Validate an API key and check rate limits
   */
  static async validateKey(key: string): Promise<{ isValid: boolean; merchantId?: string; error?: string }> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: {
        rateLimits: true,
      },
    });

    if (!apiKey) {
      return { isValid: false, error: 'Invalid API key' };
    }

    if (!apiKey.isActive) {
      return { isValid: false, error: 'API key is inactive' };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { isValid: false, error: 'API key has expired' };
    }

    // Check rate limits
    for (const rateLimit of apiKey.rateLimits) {
      const recentUsage = await prisma.apiKeyUsageLog.count({
        where: {
          apiKeyId: apiKey.id,
          createdAt: {
            gte: new Date(Date.now() - rateLimit.window * 1000),
          },
        },
      });

      if (recentUsage >= rateLimit.limit) {
        return {
          isValid: false,
          error: `Rate limit exceeded. Please try again in ${rateLimit.window} seconds.`
        };
      }
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return { isValid: true, merchantId: apiKey.merchantId };
  }

  /**
   * Log API key usage
   */
  static async logUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    status: number,
    duration: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await prisma.apiKeyUsageLog.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        status,
        duration,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Revoke an API key
   */
  static async revokeKey(key: string): Promise<void> {
    await prisma.apiKey.update({
      where: { key },
      data: { isActive: false },
    });
  }

  /**
   * Get API key usage statistics
   */
  static async getUsageStats(merchantId: string, timeWindow: number = 24 * 60 * 60): Promise<{
    totalRequests: number;
    averageDuration: number;
    successRate: number;
    endpoints: { [key: string]: number };
  }> {
    const startTime = new Date(Date.now() - timeWindow * 1000);

    const logs = await prisma.apiKeyUsageLog.findMany({
      where: {
        apiKey: { merchantId },
        createdAt: { gte: startTime },
      },
    });

    const totalRequests = logs.length;
    const successfulRequests = logs.filter(log => log.status < 400).length;
    const totalDuration = logs.reduce((sum, log) => sum + log.duration, 0);

    const endpointCounts = logs.reduce((acc, log) => {
      acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalRequests,
      averageDuration: totalRequests > 0 ? totalDuration / totalRequests : 0,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      endpoints: endpointCounts,
    };
  }
}

export function generateApiKey(): string {
  // Generate a random 32-byte buffer and convert it to a base64 string
  const buffer = crypto.randomBytes(32);
  return buffer.toString('base64url');
}

export function validateApiKey(key: string): boolean {
  // Check if the key is a valid base64url string
  try {
    // Convert the key back to a buffer to validate it
    Buffer.from(key, 'base64url');
    return true;
  } catch {
    return false;
  }
}

export function hashApiKey(key: string): string {
  // Hash the API key for storage
  return crypto
    .createHash('sha256')
    .update(key)
    .digest('hex');
}