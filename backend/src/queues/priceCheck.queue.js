import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export const QUEUE_NAME = 'price-check-queue';

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2s, 4s, 8s exponential backoff
  },
  removeOnComplete: {
    count: 500,
    age: 24 * 3600, // Keep completed jobs for 24h
  },
  removeOnFail: {
    count: 200,
    age: 7 * 24 * 3600, // Keep failed jobs for 7 days
  },
};

let priceCheckQueue = null;

/**
 * Initialize or get the Price Check BullMQ Queue
 */
export const getPriceCheckQueue = () => {
  if (!priceCheckQueue) {
    priceCheckQueue = new Queue(QUEUE_NAME, {
      connection: redisConfig,
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });

    priceCheckQueue.on('error', (err) => {
      logger.warn(`Price check queue error: ${err.message}`);
    });
  }

  return priceCheckQueue;
};

/**
 * Enqueue a price checking job for a product
 * @param {object} payload - { productId, url, retailer, title, expectedPrice, targetPrice }
 * @param {object} [options={}] - Custom job options (delay, priority, etc.)
 * @returns {Promise<object>} Enqueued Job details
 */
export const addPriceCheckJob = async (payload, options = {}) => {
  const queue = getPriceCheckQueue();

  const jobId = payload.productId
    ? `price_check_${payload.productId}_${Date.now()}`
    : undefined;

  const job = await queue.add(
    'CHECK_PRICE',
    {
      productId: payload.productId,
      url: payload.url,
      retailer: payload.retailer || 'amazon',
      title: payload.title,
      expectedPrice: payload.expectedPrice,
      targetPrice: payload.targetPrice,
      queuedAt: new Date().toISOString(),
    },
    {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
      jobId,
    }
  );

  logger.info(`Enqueued price check job #${job.id} for product ${payload.productId || payload.title}`);
  return job;
};

/**
 * Enqueue bulk price check jobs (e.g. for scheduled batch refresh)
 * @param {Array<object>} productsList
 * @returns {Promise<Array>}
 */
export const addBulkPriceCheckJobs = async (productsList = []) => {
  const queue = getPriceCheckQueue();

  const jobs = productsList.map((product) => ({
    name: 'CHECK_PRICE',
    data: {
      productId: product.productId || product._id,
      url: product.url,
      retailer: product.retailer,
      title: product.title || product.name,
      expectedPrice: product.currentPrice || product.price,
      queuedAt: new Date().toISOString(),
    },
    opts: {
      ...DEFAULT_JOB_OPTIONS,
    },
  }));

  const addedJobs = await queue.addBulk(jobs);
  logger.info(`Enqueued ${addedJobs.length} bulk price check jobs`);
  return addedJobs;
};

/**
 * Retrieve queue metrics and waiting counts
 */
export const getQueueMetrics = async () => {
  const queue = getPriceCheckQueue();
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    queueName: QUEUE_NAME,
    waiting,
    active,
    completed,
    failed,
    delayed,
    timestamp: new Date().toISOString(),
  };
};

export const closePriceCheckQueue = async () => {
  if (priceCheckQueue) {
    await priceCheckQueue.close();
    priceCheckQueue = null;
  }
};
