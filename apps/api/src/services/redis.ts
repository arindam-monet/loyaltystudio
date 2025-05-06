import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { Redis as UpstashRedis } from '@upstash/redis';
// Import Redis from ioredis
import { Redis as IORedis } from 'ioredis';

// Interface for Redis client to ensure consistent methods regardless of implementation
interface RedisClient {
  set(key: string, value: string, options?: any): Promise<any>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  flushAll(): Promise<string>;
  multi(): any;
  mGet(keys: string[]): Promise<(string | null)[]>;
  on(event: string, callback: (data: any) => void): any;
  incrby(key: string, increment: number): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

// Redis client instance
let redis: RedisClient;

// Factory function to create the appropriate Redis client based on environment
function createRedisClient(): RedisClient {
  const isDevelopment = env.NODE_ENV === 'development';

  logger.info(`Initializing Redis client for ${env.NODE_ENV} environment`);

  if (isDevelopment) {
    // Use ioredis for local development
    logger.info('Using ioredis for local development');
    const client = new IORedis(env.REDIS_URL);

    // Set up event handlers
    client.on('connect', () => {
      logger.info('Connected to Redis (ioredis)');
    });

    client.on('error', (error: Error) => {
      logger.error('Redis connection error (ioredis):', error.message);
    });

    client.on('close', () => {
      logger.warn('Redis connection closed (ioredis)');
    });

    // Create adapter to match our interface
    const adapter: RedisClient = {
      set: async (key: string, value: string, options?: any) => {
        if (options?.EX) {
          return client.set(key, value, 'EX', options.EX);
        }
        return client.set(key, value);
      },
      get: client.get.bind(client),
      del: client.del.bind(client),
      exists: client.exists.bind(client),
      flushAll: client.flushall.bind(client),
      multi: client.multi.bind(client),
      mGet: client.mget.bind(client),
      on: client.on.bind(client),
      incrby: client.incrby.bind(client),
      expire: client.expire.bind(client)
    };

    return adapter;
  } else {
    // Use Upstash Redis for production
    logger.info('Using Upstash Redis for production');

    // Validate Upstash Redis URL format
    if (!env.REDIS_URL.startsWith('https://')) {
      logger.error('[Upstash Redis] The URL must start with https://. Received:', env.REDIS_URL);
      throw new Error('Invalid Upstash Redis URL format. Must start with https://');
    }

    // Validate token is provided
    if (!env.REDIS_PASSWORD) {
      logger.error('[Upstash Redis] The \'token\' property is missing or undefined in your Redis config.');
      throw new Error('Missing Upstash Redis token. Please set REDIS_PASSWORD environment variable.');
    }

    const client = new UpstashRedis({
      url: env.REDIS_URL,
      token: env.REDIS_PASSWORD
    });

    // Create adapter to match our interface
    const adapter: RedisClient = {
      set: async (key: string, value: string, options?: any) => {
        if (options?.EX) {
          return client.set(key, value, { ex: options.EX });
        }
        return client.set(key, value);
      },
      get: client.get.bind(client),
      del: client.del.bind(client),
      exists: async (key: string) => {
        const result = await client.exists(key);
        return result ? 1 : 0;
      },
      flushAll: async () => {
        await client.flushall();
        return 'OK';
      },
      multi: () => {
        // Upstash doesn't have a direct multi equivalent, so we create a simple implementation
        const commands: Array<() => Promise<any>> = [];
        return {
          set: (key: string, value: string, options?: any) => {
            commands.push(() => adapter.set(key, value, options));
            return this;
          },
          exec: async () => {
            return Promise.all(commands.map(cmd => cmd()));
          }
        };
      },
      mGet: async (keys: string[]) => {
        return client.mget(...keys);
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      on: (event: string, callback: (data: any) => void) => {
        // Upstash doesn't support events, so we just log and return
        logger.debug(`Event '${event}' registered but not supported in Upstash Redis`);
        return client;
      },
      incrby: async (key: string, increment: number) => {
        const result = await client.incrby(key, increment);
        return Number(result);
      },
      expire: async (key: string, seconds: number) => {
        const result = await client.expire(key, seconds);
        return result ? 1 : 0;
      }
    };

    // Log connection
    logger.info('Connected to Upstash Redis');

    return adapter;
  }
}

// Initialize Redis client
try {
  redis = createRedisClient();
  logger.info('Redis client initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Redis:', error);
  // Create a mock Redis client as fallback
  redis = createMockRedisClient();
}

// Create a mock Redis client for fallback
function createMockRedisClient(): RedisClient {
  logger.warn('Using mock Redis client - data will not be persisted!');

  const mockStorage = new Map<string, string>();

  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    set: async (key: string, value: string, options?: any) => {
      // Ignore options in mock implementation
      mockStorage.set(key, value);
      return 'OK';
    },
    get: async (key: string) => mockStorage.get(key) || null,
    del: async (key: string) => {
      return mockStorage.delete(key) ? 1 : 0;
    },
    exists: async (key: string) => mockStorage.has(key) ? 1 : 0,
    flushAll: async () => {
      mockStorage.clear();
      return 'OK';
    },
    multi: () => {
      const commands: Array<() => Promise<any>> = [];
      return {
        set: (key: string, value: string, options?: any) => {
          // Ignore options in mock implementation
          commands.push(() => Promise.resolve(mockStorage.set(key, value)));
          return this;
        },
        exec: async () => {
          return Promise.all(commands.map(cmd => cmd()));
        }
      };
    },
    mGet: async (keys: string[]) => {
      return keys.map(key => mockStorage.get(key) || null);
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    on: (event: string, callback: (data: any) => void) => {
      // No-op for mock client
      return {};
    },
    incrby: async (key: string, increment: number) => {
      const currentValue = mockStorage.get(key);
      const newValue = (currentValue ? parseInt(currentValue, 10) : 0) + increment;
      mockStorage.set(key, newValue.toString());
      return newValue;
    },
    expire: async (key: string, seconds: number) => {
      // Mock implementation doesn't actually expire keys
      return mockStorage.has(key) ? 1 : 0;
    }
  };
}

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
      await redis.set(key, value, { EX: ttl });
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
      await redis.flushAll();
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
      // Create a multi command
      const multi = redis.multi();

      // Add each set command to the multi
      for (const { key, value, ttl } of entries) {
        multi.set(key, value, { EX: ttl || this.defaultTTL });
      }

      // Execute all commands
      await multi.exec();
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
      const values = await redis.mGet(keys);
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