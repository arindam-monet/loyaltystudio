import { config } from 'dotenv';
import { join } from 'path';
import { z } from 'zod';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'development' ? '.env.local' : '.env';
config({ path: join(process.cwd(), envFile) });

const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3001'),
  API_HOST: z.string().default('0.0.0.0'),
  API_URL: z.string().default('http://localhost:3001'),
  
  // Database Configuration
  DATABASE_URL: z.string(),
  DIRECT_URL: z.string(),
  
  // CORS Configuration
  CORS_ORIGIN: z.string().default('*'),
  
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
  DNS_PROVIDER: z.enum(['cloudflare', 'godaddy', 'namecheap']).default('cloudflare'),
  
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
  
  // Redis Configuration
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.string().default('false').transform(s => s === 'true'),
  
  // Trigger.dev Configuration
  TRIGGER_API_KEY: z.string().default('development-key'),
  TRIGGER_API_URL: z.string().default('https://api.trigger.dev'),
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