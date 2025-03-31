import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class ApiKeyService {
  private static readonly KEY_LENGTH = 32;
  private static readonly DEFAULT_RATE_LIMIT = 100; // requests per minute

  /**
   * Generate a new API key for a merchant
   */
  static async generateKey(merchantId: string, name: string): Promise<string> {
    const key = crypto.randomBytes(this.KEY_LENGTH).toString('hex');
    
    await prisma.apiKey.create({
      data: {
        key,
        name,
        merchantId,
        rateLimits: {
          create: {
            window: 60, // 1 minute
            limit: this.DEFAULT_RATE_LIMIT,
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