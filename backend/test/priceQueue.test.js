import assert from 'node:assert/strict';
import { connectDatabase } from '../src/config/db.js';
import { Product } from '../src/models/Product.js';
import { PriceHistory } from '../src/models/PriceHistory.js';
import { PriceAlert } from '../src/models/PriceAlert.js';
import { User } from '../src/models/User.js';
import { Retailer } from '../src/models/Retailer.js';
import { DEFAULT_JOB_OPTIONS } from '../src/queues/priceCheck.queue.js';
import { processPriceCheckJob } from '../src/workers/priceCheck.worker.js';
import { config } from '../src/config/env.js';

const runPriceQueueTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting HL² Background Price Queue & Worker Test Suite');
  console.log('======================================================\n');

  await connectDatabase();

  const testEmail = `queue_test_${Date.now()}@example.com`;
  let testUser = null;
  let testProduct = null;
  let testAlert = null;

  try {
    // Setup test records
    testUser = await User.create({
      name: 'Queue Test User',
      email: testEmail,
      password: 'HashedPassword123!',
    });

    testProduct = await Product.create({
      name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
      brand: 'Sony',
      model: 'WH-1000XM5',
      category: 'Headphones',
      image: 'https://example.com/sony.jpg',
      lowestRecordedPrice: 24999,
      highestRecordedPrice: 29990,
    });

    testAlert = await PriceAlert.create({
      user: testUser._id,
      product: testProduct._id,
      targetPrice: 22000,
      status: 'ACTIVE',
      triggered: false,
    });

    // -------------------------------------------------------------
    // Test 1: Verify Exponential Backoff Retry Strategy & Job Options
    // -------------------------------------------------------------
    console.log('Test 1: Verify Exponential Backoff Retry Strategy');
    assert.equal(DEFAULT_JOB_OPTIONS.attempts, 3, 'Jobs must have 3 retry attempts');
    assert.equal(DEFAULT_JOB_OPTIONS.backoff.type, 'exponential', 'Retry strategy must be exponential');
    assert.equal(DEFAULT_JOB_OPTIONS.backoff.delay, 2000, 'Initial backoff delay must be 2000ms');
    assert.ok(DEFAULT_JOB_OPTIONS.removeOnComplete, 'Completed jobs cleanup configuration must exist');
    console.log(' Passed: Exponential backoff (2s, 4s, 8s) & 3 retry attempts verified\n');

    // -------------------------------------------------------------
    // Test 2: Verify Rate Limiting & Concurrency Controls
    // -------------------------------------------------------------
    console.log('Test 2: Verify Rate Limiting & Concurrency Controls');
    assert.ok(config.QUEUE_CONCURRENCY >= 1, 'Concurrency limit must be >= 1');
    assert.ok(config.QUEUE_RATE_LIMIT_MAX >= 1, 'Rate limit max requests must be >= 1');
    console.log(` Passed: Worker configured with concurrency: ${config.QUEUE_CONCURRENCY}, rateLimit: ${config.QUEUE_RATE_LIMIT_MAX} req/s\n`);

    // -------------------------------------------------------------
    // Test 3: Process Initial Price Check Job (Price: ₹24,999)
    // -------------------------------------------------------------
    console.log('Test 3: Process Initial Price Check Job (Price: ₹24,999)');
    const job1 = {
      id: 'job-test-1',
      data: {
        productId: testProduct._id.toString(),
        title: testProduct.name,
        expectedPrice: 24999,
        retailer: 'amazon',
      },
    };

    const result1 = await processPriceCheckJob(job1);

    assert.equal(result1.observedPrice, 24999);
    assert.equal(result1.isDeduplicated, false, 'First price check must write a new price history record');
    assert.equal(result1.triggeredAlertsCount, 0, 'Price ₹24,999 should not trigger target ₹22,000');

    const historyCount1 = await PriceHistory.countDocuments({ product: testProduct._id });
    assert.equal(historyCount1, 1, 'Exactly 1 price history document must be created');
    console.log(' Passed: Successfully recorded initial price observation in PriceHistory\n');

    // -------------------------------------------------------------
    // Test 4: Idempotent Price Update (Duplicate Suppression)
    // -------------------------------------------------------------
    console.log('Test 4: Idempotent Price Update (Duplicate Suppression)');
    const job2 = {
      id: 'job-test-2',
      data: {
        productId: testProduct._id.toString(),
        title: testProduct.name,
        expectedPrice: 24999, // Same price immediately
        retailer: 'amazon',
      },
    };

    const result2 = await processPriceCheckJob(job2);

    assert.equal(result2.isDeduplicated, true, 'Subsequent identical price must be flagged as deduplicated');

    const historyCount2 = await PriceHistory.countDocuments({ product: testProduct._id });
    assert.equal(historyCount2, 1, 'PriceHistory count must remain 1 without redundant entries');
    console.log(' Passed: Redundant identical price observation suppressed (isDeduplicated: true)\n');

    // -------------------------------------------------------------
    // Test 5: Price Drop Job & Alert Triggering (Price drops to ₹21,999)
    // -------------------------------------------------------------
    console.log('Test 5: Price Drop Job & Alert Triggering (Price: ₹21,999 <= Target: ₹22,000)');
    const job3 = {
      id: 'job-test-3',
      data: {
        productId: testProduct._id.toString(),
        title: testProduct.name,
        expectedPrice: 21999, // Changed price -> below target ₹22,000
        retailer: 'amazon',
      },
    };

    const result3 = await processPriceCheckJob(job3);

    assert.equal(result3.observedPrice, 21999);
    assert.equal(result3.isDeduplicated, false, 'Changed price must record a new observation');
    assert.equal(result3.triggeredAlertsCount, 1, 'Price ₹21,999 MUST trigger the target alert');

    const updatedAlert = await PriceAlert.findById(testAlert._id);
    assert.equal(updatedAlert.status, 'TRIGGERED');
    assert.equal(updatedAlert.triggered, true);
    assert.equal(updatedAlert.triggeredPrice, 21999);

    const historyCount3 = await PriceHistory.countDocuments({ product: testProduct._id });
    assert.equal(historyCount3, 2, 'New price observation document successfully recorded');
    console.log(' Passed: Price drop recorded and alert triggered successfully (status: TRIGGERED)\n');

    // -------------------------------------------------------------
    // Test 6: Decoupled Provider Logic with Mock Retailer URL
    // -------------------------------------------------------------
    console.log('Test 6: Decoupled Provider Logic with Retailer URL');
    const job4 = {
      id: 'job-test-4',
      data: {
        productId: testProduct._id.toString(),
        url: 'https://www.amazon.in/dp/B09XS7JWHH',
        title: testProduct.name,
      },
    };

    const result4 = await processPriceCheckJob(job4);
    assert.ok(result4.observedPrice > 0);
    assert.ok(typeof result4.durationMs === 'number');
    console.log(` Passed: Retailer adapter processed in ${result4.durationMs}ms without queue-provider coupling\n`);

    console.log('======================================================');
    console.log('🎉 ALL BACKGROUND QUEUE & WORKER TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } finally {
    if (testUser) await User.findByIdAndDelete(testUser._id);
    if (testProduct) {
      await Product.findByIdAndDelete(testProduct._id);
      await PriceHistory.deleteMany({ product: testProduct._id });
      await PriceAlert.deleteMany({ product: testProduct._id });
    }
  }
};

runPriceQueueTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Price Queue test execution failed:', err);
  process.exit(1);
});
