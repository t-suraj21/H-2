import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { priceHistoryService } from '../src/services/history/PriceHistoryService.js';

// Helper for making HTTP requests to in-memory test server
const request = (server, options) => {
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
    req.end();
  });
};

const runPriceHistoryTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting HL² Price History Engine Test Suite');
  console.log('======================================================\n');

  // -------------------------------------------------------------
  // Test 1: Record Price Observation
  // -------------------------------------------------------------
  console.log('Test 1: Record Price Observation');
  const obs = await priceHistoryService.recordPriceObservation({
    productId: 'prod-mock-123',
    retailerId: 'ret-mock-amazon',
    price: 24999,
    mrp: 29990,
    deliveryFee: 0,
    inStock: true,
  });

  assert.equal(obs.price, 24999);
  assert.equal(obs.effectivePrice, 24999);
  assert.equal(obs.inStock, true);
  console.log(' Passed: Successfully recorded price observation\n');

  // -------------------------------------------------------------
  // Test 2: Calculate Metrics (Lowest, Highest, Average, Current)
  // -------------------------------------------------------------
  console.log('Test 2: Calculate Metrics on Historical Observations');
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const sampleTimeline = [
    { timestamp: new Date(now - 30 * dayMs).toISOString(), price: 27999, effectivePrice: 27999 },
    { timestamp: new Date(now - 20 * dayMs).toISOString(), price: 26499, effectivePrice: 26499 },
    { timestamp: new Date(now - 7 * dayMs).toISOString(), price: 23999, effectivePrice: 23999 }, // Lowest
    { timestamp: new Date(now - 2 * dayMs).toISOString(), price: 24999, effectivePrice: 24999 }, // Current
  ];

  const metrics = priceHistoryService.calculateMetrics(sampleTimeline);

  assert.equal(metrics.lowestRecordedPrice, 23999);
  assert.equal(metrics.highestRecordedPrice, 27999);
  assert.equal(metrics.currentPrice, 24999);
  // Average: (27999 + 26499 + 23999 + 24999) / 4 = 103496 / 4 = 25874.00
  assert.equal(metrics.averagePrice, 25874.0);
  assert.equal(metrics.hasSufficientData, true);
  console.log(' Passed: Lowest (₹23,999), Highest (₹27,999), Avg (₹25,874), Current (₹24,999)\n');

  // -------------------------------------------------------------
  // Test 3: Calculate 7-Day, 30-Day, and 90-Day Changes
  // -------------------------------------------------------------
  console.log('Test 3: Calculate 7-Day & 30-Day Price Changes');
  const changes = priceHistoryService.calculatePriceChanges(sampleTimeline, 24999);

  // 7-day change: compare current (24999) to 7 days ago (23999) -> +1000 (+4.2%) UP
  assert.ok(changes.change7d !== null);
  assert.equal(changes.change7d.direction, 'UP');
  assert.equal(changes.change7d.amount, 1000);
  assert.equal(changes.change7d.percentage, 4.2);

  // 30-day change: compare current (24999) to 30 days ago (27999) -> -3000 (-10.7%) DOWN
  assert.ok(changes.change30d !== null);
  assert.equal(changes.change30d.direction, 'DOWN');
  assert.equal(changes.change30d.amount, 3000);
  assert.equal(changes.change30d.percentage, 10.7);
  console.log(' Passed: 7D Change (+₹1,000, +4.2% UP) and 30D Change (-₹3,000, -10.7% DOWN)\n');

  // -------------------------------------------------------------
  // Test 4: Insufficient Historical Data Handling
  // -------------------------------------------------------------
  console.log('Test 4: Insufficient Historical Data Flagging');
  const singlePointTimeline = [
    { timestamp: new Date().toISOString(), price: 24999, effectivePrice: 24999 },
  ];

  const sparseMetrics = priceHistoryService.calculateMetrics(singlePointTimeline);
  const sparseChanges = priceHistoryService.calculatePriceChanges(singlePointTimeline, 24999);

  assert.equal(sparseMetrics.hasSufficientData, false, 'Single point must be flagged as insufficient data');
  assert.equal(sparseChanges.change7d, null);
  assert.equal(sparseChanges.change30d, null);
  assert.equal(sparseChanges.change90d, null);
  console.log(' Passed: Safely returned hasSufficientData: false without hallucinating price deltas\n');

  // -------------------------------------------------------------
  // Test 5: Integration Test GET /api/products/:id/history
  // -------------------------------------------------------------
  console.log('Test 5: Integration Test GET /api/products/:id/history');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    const apiRes = await request(server, {
      path: '/api/products/sony-xm5/history?period=30D',
      method: 'GET',
    });

    assert.equal(apiRes.status, 200);
    assert.equal(apiRes.body.success, true);
    assert.equal(apiRes.body.data.period, '30D');
    assert.ok(apiRes.body.data.timeline.length > 0);
    assert.ok(typeof apiRes.body.data.currentPrice === 'number');
    assert.ok(typeof apiRes.body.data.lowestRecordedPrice === 'number');
    assert.ok(typeof apiRes.body.data.averagePrice === 'number');
    console.log(' Passed: GET /api/products/:id/history returned full timeline with stats\n');

    console.log('======================================================');
    console.log('🎉 ALL PRICE HISTORY ENGINE TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
};

runPriceHistoryTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Price History test execution failed:', err);
  process.exit(1);
});
