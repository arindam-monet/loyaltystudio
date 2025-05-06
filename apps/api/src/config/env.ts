import { config } from 'dotenv';
import { join } from 'path';
import { z } from 'zod';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'development' ? '.env.local' : '.env.production';
config({ path: join(process.cwd(), envFile) });

const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3003'),
  API_HOST: z.string().default('0.0.0.0'),
  API_URL: z.string().default('http://localhost:3003'),

  // Database Configuration
  DATABASE_URL: z.string(),
  DIRECT_URL: z.string(),

  // CORS Configuration
  CORS_ORIGIN: z.string()
    .default('http://localhost:3001,http://localhost:3002,http://localhost:3004,http://localhost:3005')
    .transform(origins => {
      // Handle both string and array formats
      if (origins === '*') return '*';

      const originList = origins.split(',').map(origin => origin.trim());

      // Log the configured origins for debugging
      console.log('Configured CORS origins:', originList);

      // In production, ensure we have at least one non-localhost origin
      if (process.env.NODE_ENV === 'production') {
        const productionOrigins = originList.filter(origin =>
          !origin.includes('localhost') && !origin.includes('127.0.0.1')
        );

        if (productionOrigins.length === 0 && origins !== '*') {
          console.warn('Warning: No non-localhost origins configured for CORS in production.');
          console.warn('This may cause CORS errors when accessing the API from remote clients.');
        }
      }

      return originList;
    }),

  // Logging Configuration
  LOG_LEVEL: z.string().default('info'),

  // Domain Configuration
  BASE_DOMAIN: z.string().default('loyaltystudio.local'),
  ALLOWED_SUBDOMAINS: z.string().optional().transform(s => {
    console.log('Raw ALLOWED_SUBDOMAINS:', s);
    if (!s) return ['admin', 'merchant', 'api'];
    const result = s.split(',').map(s => s.trim());
    console.log('Transformed ALLOWED_SUBDOMAINS:', result);
    return result;
  }),

  // DNS Provider Configuration
  DNS_PROVIDER: z.enum(['cloudflare', 'godaddy', 'namecheap', 'none']).default('none'),

  // Cloudflare Configuration
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),

  // GoDaddy Configuration
  GODADDY_API_KEY: z.string().optional(),
  GODADDY_API_SECRET: z.string().optional(),
  GODADDY_DOMAIN: z.string().optional(),

  // Namecheap Configuration
  NAMECHEAP_API_USER: z.string().optional(),
  NAMECHEAP_API_KEY: z.string().optional(),
  NAMECHEAP_DOMAIN: z.string().optional(),

  // Supabase Configuration
  SUPABASE_URL: z.string(),
  SUPABASE_SERVICE_KEY: z.string(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SESSION_EXPIRY: z.string().default('3600').transform(s => parseInt(s, 10)), // Default to 1 hour

  // Redis Configuration
  REDIS_URL: z.string()
    .default('redis://localhost:6379')
    .transform(url => {
      const isDev = process.env.NODE_ENV === 'development';
      // In production, ensure URL is in the correct format for Upstash
      if (!isDev && url.startsWith('redis://')) {
        console.warn('Warning: REDIS_URL starts with redis:// in production. Upstash requires https:// URLs.');
        // We don't auto-correct the URL to avoid silent failures
      } else if (isDev && url.startsWith('https://')) {
        console.warn('Note: Using Upstash Redis URL in development environment');
      }
      return url;
    }),
  REDIS_PASSWORD: z.string()
    .optional()
    .transform(password => {
      // Make password required in production for Upstash Redis
      if (process.env.NODE_ENV === 'production' && !password) {
        console.warn('Warning: REDIS_PASSWORD is not set in production. Upstash Redis requires a token.');
      }
      return password || '';
    }),
  REDIS_TLS: z.string()
    .default('false')
    .transform(s => {
      const isTls = s === 'true';
      // In production with Upstash, TLS should be enabled
      if (process.env.NODE_ENV === 'production' && !isTls) {
        console.warn('Warning: REDIS_TLS is set to false in production. Upstash Redis requires TLS.');
      }
      return isTls;
    }),

  // Trigger.dev Configuration
  TRIGGER_API_KEY: z.string().default('development-key'),
  TRIGGER_API_URL: z.string().default('https://api.trigger.dev'),

  // AI Configuration
  GEMINI_API_KEY: z.string().optional().default(''),

  // Admin Configuration
  ADMIN_EMAIL: z.string().email().default('admin@loyaltystudio.ai'),
  ADMIN_PORTAL_URL: z.string().url().default('http://localhost:3002'),
  MERCHANT_WEB_URL: z.string().url().default('http://localhost:3001'),

  // Email Configuration
  RESEND_API_KEY: z.string().default('re_123456789'),
  EMAIL_FROM: z.string().email().default('noreply@loyaltystudio.ai'),

  // Cal.com Configuration
  CAL_BOOKING_URL: z.string().url().default('https://cal.com/loyaltystudio/demo'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_ANON_KEY',
] as const;

for (const key of requiredEnvVars) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}