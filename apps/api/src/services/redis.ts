// Using require instead of import to avoid TypeScript issues
const Redis = require('ioredis');
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Redis client instance
const redis = new Redis({
  url: env.REDIS_URL,
  password: env.REDIS_PASSWORD,
  tls: env.REDIS_TLS ? {} : undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Redis event handlers
redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

// Cache service class
export class CacheService {
  private static instance: CacheService;
  private readonly defaultTTL = 3600; // 1 hour in seconds

  private constructor() { }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Set a key-value pair in Redis with optional TTL
   */
  async set(key: string, value: string, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await redis.set(key, value, 'EX', ttl);
      logger.debug(`Cache set: ${key}`);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a value from Redis by key
   */
  async get(key: string): Promise<string | null> {
    try {
      const value = await redis.get(key);
      logger.debug(`Cache get: ${key}`);
      return value;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete a key from Redis
   */
  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
      logger.debug(`Cache delete: ${key}`);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all keys from Redis
   */
  async clear(): Promise<void> {
    try {
      await redis.flushall();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error:', error);
      throw error;
    }
  }

  /**
   * Set a key-value pair in Redis with JSON data
   */
  async setJSON<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.set(key, jsonValue, ttl);
      logger.debug(`Cache set JSON: ${key}`);
    } catch (error) {
      logger.error(`Cache set JSON error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a JSON value from Redis by key
   */
  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get JSON error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if a key exists in Redis
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set multiple key-value pairs in Redis
   */
  async mset(entries: Array<{ key: string; value: string; ttl?: number }>): Promise<void> {
    try {
      const pipeline = redis.pipeline();
      for (const { key, value, ttl } of entries) {
        pipeline.set(key, value, 'EX', ttl || this.defaultTTL);
      }
      await pipeline.exec();
      logger.debug(`Cache mset: ${entries.length} entries`);
    } catch (error) {
      logger.error('Cache mset error:', error);
      throw error;
    }
  }

  /**
   * Get multiple values from Redis by keys
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      const values = await redis.mget(keys);
      logger.debug(`Cache mget: ${keys.length} keys`);
      return values;
    } catch (error) {
      logger.error('Cache mget error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const cache = CacheService.getInstance();