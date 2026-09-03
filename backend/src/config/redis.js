import { Redis } from 'ioredis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const redisConfig = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy(times) {
    // Retry up to 3 times in development before entering offline mode
    if (times > 3 && config.NODE_ENV === 'test') {
      return null;
    }
    return Math.min(times * 500, 2000);
  },
};

let sharedClient = null;
let isConnected = false;

/**
 * Get or create a shared Redis client instance
 */
export const getRedisClient = () => {
  if (!sharedClient) {
    sharedClient = new Redis(redisConfig);

    sharedClient.on('connect', () => {
      isConnected = true;
      logger.info(`Redis connected successfully to ${config.REDIS_HOST}:${config.REDIS_PORT}`);
    });

    sharedClient.on('error', (err) => {
      isConnected = false;
      logger.warn(`Redis connection warning: ${err.message}. Queues running in resilient mode.`);
    });

    sharedClient.on('close', () => {
      isConnected = false;
      logger.warn('Redis connection closed');
    });
  }

  return sharedClient;
};

export const isRedisConnected = () => isConnected;

export const closeRedisConnection = async () => {
  if (sharedClient) {
    await sharedClient.quit().catch(() => {});
    sharedClient = null;
    isConnected = false;
    logger.info('Redis connection closed gracefully');
  }
};
