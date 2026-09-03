import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend directory and monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const getEnv = (key, defaultValue) => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const nodeEnv = getEnv('NODE_ENV', 'development');
const jwtSecret = getEnv('JWT_SECRET', 'hl2_super_secret_jwt_key_2026_secure_tokens');
const mongoUri = getEnv('MONGO_URI', 'mongodb://localhost:27017/hl2');
const corsOrigin = getEnv('CORS_ORIGIN', '*');

// Strict Production Security Validations
if (nodeEnv === 'production') {
  if (!process.env.JWT_SECRET || jwtSecret === 'hl2_super_secret_jwt_key_2026_secure_tokens') {
    throw new Error('SECURITY FATAL: A strong, unique JWT_SECRET must be configured in production!');
  }
  if (jwtSecret.length < 32) {
    throw new Error('SECURITY FATAL: JWT_SECRET must be at least 32 characters in production!');
  }
  if (corsOrigin === '*') {
    console.warn('[SECURITY WARNING] CORS_ORIGIN is set to "*" in production. Restrict this to authorized domains/apps.');
  }
}

export const config = {
  PORT: Number.parseInt(getEnv('PORT', '5001'), 10),
  NODE_ENV: nodeEnv,
  MONGO_URI: mongoUri,
  CORS_ORIGIN: corsOrigin,
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),
  BCRYPT_SALT_ROUNDS: Number.parseInt(getEnv('BCRYPT_SALT_ROUNDS', '12'), 10),

  // Redis & BullMQ Queue Configuration
  REDIS_HOST: getEnv('REDIS_HOST', '127.0.0.1'),
  REDIS_PORT: Number.parseInt(getEnv('REDIS_PORT', '6379'), 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  QUEUE_CONCURRENCY: Number.parseInt(getEnv('QUEUE_CONCURRENCY', '3'), 10),
  QUEUE_RATE_LIMIT_MAX: Number.parseInt(getEnv('QUEUE_RATE_LIMIT_MAX', '5'), 10),

  // Affiliate & Buy Now Configuration
  AFFILIATE_ENABLED: getEnv('AFFILIATE_ENABLED', 'true') === 'true',
  AFFILIATE_AMAZON_TAG: getEnv('AFFILIATE_AMAZON_TAG', 'hl2app-21'),
  AFFILIATE_FLIPKART_AFFID: getEnv('AFFILIATE_FLIPKART_AFFID', 'hl2app'),
  AFFILIATE_CROMA_TAG: getEnv('AFFILIATE_CROMA_TAG', 'hl2_partner'),
  APP_CAMPAIGN_SOURCE: getEnv('APP_CAMPAIGN_SOURCE', 'hl2_mobile_app'),
};

export default config;
