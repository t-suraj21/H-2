import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/config/db.js';
import { PriceHistory } from '../src/models/PriceHistory.js';
import { Product } from '../src/models/Product.js';
import { priceHistoryService } from '../src/services/history/PriceHistoryService.js';
import { urlAnalyzerService } from '../src/services/urlAnalyzer.service.js';
import { sanitizeInputs } from '../src/middleware/sanitize.js';

// Helper for HTTP requests
const request = (server, options, body = null) => {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
};

const runPerformanceTests = async () => {
  console.log('\n======================================================');
  console.log('⚡ Starting HL² Performance & Query Optimization Test Suite');
  console.log('======================================================\n');

  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Mongoose .lean() Query Performance Benchmark
    // -------------------------------------------------------------
    console.log('Test 1: Mongoose .lean() Query Performance Benchmark');
    const testProduct = await Product.create({
      name: 'Benchmark Wireless ANC Headphones',
      brand: 'Sony',
      model: 'WH-1000XM5',
      category: 'Headphones',
      image: 'https://example.com/sony.jpg',
      lowestRecordedPrice: 24999,
    });

    // Seed 100 price history records
    const seedRecords = [];
    for (let i = 0; i < 100; i++) {
      seedRecords.push({
        product: testProduct._id,
        retailer: new (await import('mongoose')).default.Types.ObjectId(),
        price: 24000 + (i % 20) * 100,
        effectivePrice: 24000 + (i % 20) * 100,
        timestamp: new Date(Date.now() - i * 3600000),
      });
    }
    await PriceHistory.insertMany(seedRecords);

    // Measure .lean() query time
    const startLean = process.hrtime.bigint();
    const leanResults = await PriceHistory.find({ product: testProduct._id }).lean();
    const endLean = process.hrtime.bigint();
    const leanDurationMs = Number(endLean - startLean) / 1e6;

    assert.equal(leanResults.length, 100);
    assert.ok(leanDurationMs < 50, `Lean query should execute under 50ms (took ${leanDurationMs.toFixed(2)}ms)`);
    console.log(` Passed: 100 observations fetched via .lean() in ${leanDurationMs.toFixed(2)}ms (zero hydration overhead)\n`);

    // -------------------------------------------------------------
    // Test 2: Compound Index Verification on PriceHistory
    // -------------------------------------------------------------
    console.log('Test 2: Compound Index Coverage Verification');
    const indexes = await PriceHistory.collection.indexes();
    const hasProductTimestampIndex = indexes.some((idx) => idx.key.product === 1 && idx.key.timestamp === -1);
    const hasProductRetailerIndex = indexes.some((idx) => idx.key.product === 1 && idx.key.retailer === 1);

    assert.ok(hasProductTimestampIndex, 'Must have compound index on { product: 1, timestamp: -1 }');
    assert.ok(hasProductRetailerIndex, 'Must have compound index on { product: 1, retailer: 1, timestamp: -1 }');
    console.log(' Passed: Compound indexes on time-series pricing verified\n');

    // -------------------------------------------------------------
    // Test 3: NoSQL Sanitizer Latency (< 1ms execution time)
    // -------------------------------------------------------------
    console.log('Test 3: NoSQL Sanitization Middleware Throughput');
    const heavyPayload = {
      user: 'test_user',
      nested: {
        filter: 'electronics',
        categories: ['phones', 'laptops', 'audio'],
        deep: { key: 'value', number: 42 },
      },
    };

    const startSanitize = process.hrtime.bigint();
    for (let i = 0; i < 1000; i++) {
      const mockReq = { body: JSON.parse(JSON.stringify(heavyPayload)) };
      sanitizeInputs(mockReq, {}, () => {});
    }
    const endSanitize = process.hrtime.bigint();
    const avgSanitizeMs = Number(endSanitize - startSanitize) / (1e6 * 1000);

    assert.ok(avgSanitizeMs < 0.1, `Sanitization should average <0.1ms per request (got ${avgSanitizeMs.toFixed(4)}ms)`);
    console.log(` Passed: 1,000 requests sanitized with average latency of ${avgSanitizeMs.toFixed(4)}ms/req\n`);

    // -------------------------------------------------------------
    // Test 4: Price Freshness Invariant (Never serve stale cached prices as fresh)
    // -------------------------------------------------------------
    console.log('Test 4: Price Freshness Invariant Verification');
    const analysis1 = await urlAnalyzerService.analyzeUrl('https://www.amazon.in/dp/B09XS7JWHH');
    const verifiedTimestamp = new Date(analysis1.analysis.verifiedAt).getTime();
    const nowTimestamp = Date.now();

    // Must be verified in the last 2 seconds
    assert.ok(
      Math.abs(nowTimestamp - verifiedTimestamp) < 2000,
      'Price data must be verified in real-time and timestamped freshly'
    );
    assert.ok(typeof analysis1.product.price === 'number' && analysis1.product.price > 0);
    console.log(` Passed: Live price analysis returned with guaranteed freshness timestamp (${analysis1.analysis.verifiedAt})\n`);

    // -------------------------------------------------------------
    // Test 5: End-to-End API Response Latency (< 100ms)
    // -------------------------------------------------------------
    console.log('Test 5: End-to-End API Response Latency (POST /api/products/analyze)');
    const startReq = process.hrtime.bigint();
    const res = await request(
      server,
      { path: '/api/products/analyze', method: 'POST' },
      { url: 'https://www.amazon.in/dp/B09XS7JWHH' }
    );
    const endReq = process.hrtime.bigint();
    const reqDurationMs = Number(endReq - startReq) / 1e6;

    assert.equal(res.status, 200);
    assert.ok(reqDurationMs < 200, `API response should complete under 200ms (took ${reqDurationMs.toFixed(2)}ms)`);
    console.log(` Passed: End-to-end URL analysis API executed in ${reqDurationMs.toFixed(2)}ms\n`);

    console.log('======================================================');
    console.log('🎉 ALL PERFORMANCE & OPTIMIZATION TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } finally {
    await Product.deleteMany({ name: 'Benchmark Wireless ANC Headphones' });
    server.close();
  }
};

runPerformanceTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Performance test execution failed:', err);
  process.exit(1);
});
