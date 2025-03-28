import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'development' ? '.env.local' : '.env';
config({ path: join(process.cwd(), envFile) });

// Environment variables with type checking
export const env = {
  // Server Configuration
  PORT: process.env.PORT || '3001',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL!,
  DIRECT_URL: process.env.DIRECT_URL!,
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // API Configuration
  API_HOST: process.env.API_HOST || 'localhost',
  API_URL: process.env.API_URL || 'http://localhost:3001',
  
  // Supabase Configuration
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  
  // Redis Configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_TLS: process.env.REDIS_TLS === 'true',
} as const;

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_ANON_KEY',
] as const;

for (const envVar of requiredEnvVars) {
  if (!env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
} 