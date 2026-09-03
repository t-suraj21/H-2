import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { redisConfig } from '../config/redis.js';
import { config } from '../config/env.js';
import { QUEUE_NAME } from '../queues/priceCheck.queue.js';
import { priceHistoryService } from '../services/history/PriceHistoryService.js';
import { alertEvaluationService } from '../services/alert/AlertEvaluationService.js';
import { urlAnalyzerService } from '../services/urlAnalyzer.service.js';
import { Product } from '../models/Product.js';
import { PriceHistory } from '../models/PriceHistory.js';
import { Retailer } from '../models/Retailer.js';
import { logger } from '../utils/logger.js';

/**
 * Cooldown window in milliseconds for idempotent price observation suppression
 * Suppresses identical consecutive prices within 15 minutes to save storage
 */
const IDEMPOTENT_COOLDOWN_MS = 15 * 60 * 1000;

/**
 * Execute the price check job lifecycle:
 * 1. Fetch latest price via decoupled retailer provider logic
 * 2. Idempotently record price observation (deduplicating identical entries)
 * 3. Evaluate active price alerts
 */
export const processPriceCheckJob = async (job) => {
  const startTime = Date.now();
  const { productId, url, retailer = 'amazon', title, expectedPrice } = job.data;

  logger.info(`[Worker] Processing price check for job #${job.id} (Product: ${productId || title})`);

  let observedPrice = Number(expectedPrice) || 24999;
  let mrp = Math.round(observedPrice * 1.2);
  let resolvedRetailerName = retailer;
  let resolvedRetailerId = null;

  // 1. Decoupled Provider Logic: If URL is provided, fetch via Retailer Adapter
  if (url) {
    try {
      const analyzed = await urlAnalyzerService.analyze(url);
      if (analyzed && analyzed.product) {
        observedPrice = analyzed.product.price || observedPrice;
        mrp = analyzed.product.mrp || mrp;
        resolvedRetailerName = analyzed.retailer?.name || retailer;
      }
    } catch (adapterErr) {
      logger.warn(`[Worker] Retailer adapter fetch warning for URL (${url}): ${adapterErr.message}`);
      // Fall back to expected price or existing DB record
    }
  }

  // 2. Resolve Product and Retailer from MongoDB
  let targetProduct = null;
  if (productId && mongoose.Types.ObjectId.isValid(productId)) {
    targetProduct = await Product.findById(productId);
  }

  if (!targetProduct && title) {
    targetProduct = await Product.findOne({ name: title });
  }

  if (!targetProduct) {
    // Create product record if missing
    targetProduct = await Product.create({
      name: title || 'Tracked Product',
      brand: 'Generic',
      model: 'Standard',
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
      lowestRecordedPrice: observedPrice,
      highestRecordedPrice: mrp,
    });
  }

  // Resolve Retailer Document
  let retailerDoc = await Retailer.findOne({
    slug: (resolvedRetailerName || 'amazon').toLowerCase(),
  });
  if (!retailerDoc) {
    retailerDoc = await Retailer.create({
      name: resolvedRetailerName || 'Amazon',
      slug: (resolvedRetailerName || 'amazon').toLowerCase(),
      websiteUrl: `https://www.${(resolvedRetailerName || 'amazon').toLowerCase()}.in`,
      countryCode: 'IN',
      currency: 'INR',
    });
  }
  resolvedRetailerId = retailerDoc._id;

  // 3. Idempotent Price Update Check (Deduplication)
  const latestObservation = await PriceHistory.findOne({
    product: targetProduct._id,
    retailer: resolvedRetailerId,
  }).sort({ timestamp: -1 });

  let isDeduplicated = false;
  let priceRecord = null;

  if (
    latestObservation &&
    latestObservation.price === observedPrice &&
    Date.now() - new Date(latestObservation.timestamp).getTime() < IDEMPOTENT_COOLDOWN_MS
  ) {
    // Identical price within cooldown window -> Deduplicate & skip redundant insert
    isDeduplicated = true;
    priceRecord = latestObservation;
    logger.info(
      `[Worker] Idempotent price check: Price unchanged (₹${observedPrice}) within 15m. Skipped redundant PriceHistory insert.`
    );
  } else {
    // Record new price observation
    priceRecord = await priceHistoryService.recordPriceObservation({
      productId: targetProduct._id.toString(),
      retailerId: resolvedRetailerId.toString(),
      price: observedPrice,
      effectivePrice: observedPrice,
      mrp,
      inStock: true,
    });
  }

  // 4. Alert Evaluation (Trigger alert when observedPrice <= targetPrice)
  const alertEvaluationResult = await alertEvaluationService.evaluateAlertsForProduct(
    targetProduct._id.toString(),
    observedPrice
  );

  const durationMs = Date.now() - startTime;

  return {
    jobId: job.id,
    productId: targetProduct._id.toString(),
    productTitle: targetProduct.name,
    observedPrice,
    previousPrice: latestObservation ? latestObservation.price : null,
    isDeduplicated,
    triggeredAlertsCount: alertEvaluationResult.triggeredCount,
    evaluatedAlertsCount: alertEvaluationResult.evaluatedCount,
    durationMs,
  };
};

let priceCheckWorker = null;

/**
 * Initialize and start the BullMQ Worker
 */
export const startPriceCheckWorker = () => {
  if (!priceCheckWorker) {
    priceCheckWorker = new Worker(
      QUEUE_NAME,
      processPriceCheckJob,
      {
        connection: redisConfig,
        concurrency: config.QUEUE_CONCURRENCY,
        limiter: {
          max: config.QUEUE_RATE_LIMIT_MAX, // Max 5 jobs per second to protect retailer feeds
          duration: 1000,
        },
      }
    );

    priceCheckWorker.on('completed', (job, result) => {
      logger.info(
        `[Worker] Job #${job.id} completed in ${result.durationMs}ms: ${result.productTitle} @ ₹${result.observedPrice} (Triggered Alerts: ${result.triggeredAlertsCount})`
      );
    });

    priceCheckWorker.on('failed', (job, err) => {
      logger.error(
        `[Worker] Job #${job?.id} failed on attempt ${job?.attemptsMade}/${job?.opts?.attempts}: ${err.message}`
      );
    });

    priceCheckWorker.on('error', (err) => {
      logger.warn(`[Worker] Worker error: ${err.message}`);
    });
  }

  return priceCheckWorker;
};

export const stopPriceCheckWorker = async () => {
  if (priceCheckWorker) {
    await priceCheckWorker.close();
    priceCheckWorker = null;
    logger.info('[Worker] Price check worker stopped gracefully');
  }
};
