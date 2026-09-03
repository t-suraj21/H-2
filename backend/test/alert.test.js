import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { PriceAlert } from '../src/models/PriceAlert.js';
import { alertEvaluationService } from '../src/services/alert/AlertEvaluationService.js';

// Helper for making HTTP requests to in-memory test server
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

const runAlertTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting HL² Price Alert System Test Suite');
  console.log('======================================================\n');

  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const testEmail = `alert_test_${Date.now()}@example.com`;
  let authToken = null;
  let userId = null;
  let testProduct = null;
  let activeAlertId = null;

  try {
    // -------------------------------------------------------------
    // Setup: Create test user and product
    // -------------------------------------------------------------
    const regRes = await request(
      server,
      { path: '/api/auth/register', method: 'POST' },
      { name: 'Alert Tester', email: testEmail, password: 'SecurePassword123!' }
    );
    assert.equal(regRes.status, 201);
    authToken = regRes.body.data.token;
    userId = regRes.body.data.user._id || regRes.body.data.user.id;

    testProduct = await Product.create({
      name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
      brand: 'Sony',
      model: 'WH-1000XM5',
      category: 'Headphones',
      image: 'https://example.com/sony.jpg',
      lowestRecordedPrice: 24999,
      highestRecordedPrice: 29990,
    });

    // -------------------------------------------------------------
    // Test 1: Reject unauthorized request without token
    // -------------------------------------------------------------
    console.log('Test 1: Reject unauthorized request without token');
    const unauthRes = await request(server, { path: '/api/alerts', method: 'GET' });
    assert.equal(unauthRes.status, 401);
    console.log(' Passed: Correctly blocked unauthorized access with HTTP 401\n');

    // -------------------------------------------------------------
    // Test 2: Create Price Alert (targetPrice: ₹22,000, currentPrice: ₹24,999 -> ACTIVE)
    // -------------------------------------------------------------
    console.log('Test 2: Create active price drop alert (Target: ₹22,000)');
    const createRes = await request(
      server,
      {
        path: '/api/alerts',
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      },
      {
        productId: testProduct._id.toString(),
        targetPrice: 22000,
        notificationChannels: { push: true, email: true },
      }
    );

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.success, true);
    assert.equal(createRes.body.data.targetPrice, 22000);
    assert.equal(createRes.body.data.status, 'ACTIVE');
    assert.equal(createRes.body.data.triggered, false);
    activeAlertId = createRes.body.data._id || createRes.body.data.id;
    console.log(' Passed: Alert created with status "ACTIVE" for target ₹22,000 (HTTP 201)\n');

    // -------------------------------------------------------------
    // Test 3: Alert Evaluation - Price drops to ₹23,000 (Above target ₹22,000 -> Does NOT trigger)
    // -------------------------------------------------------------
    console.log('Test 3: Alert Evaluation - Price drops to ₹23,000 (Above target ₹22,000)');
    const evalRes1 = await alertEvaluationService.evaluateAlertsForProduct(
      testProduct._id.toString(),
      23000
    );

    assert.equal(evalRes1.evaluatedCount, 1);
    assert.equal(evalRes1.triggeredCount, 0, 'Price ₹23,000 should NOT trigger target ₹22,000');

    const alertDoc1 = await PriceAlert.findById(activeAlertId);
    assert.equal(alertDoc1.status, 'ACTIVE');
    assert.equal(alertDoc1.triggered, false);
    console.log(' Passed: Alert remains ACTIVE when price (₹23,000) > target (₹22,000)\n');

    // -------------------------------------------------------------
    // Test 4: Alert Evaluation - Price drops to ₹21,999 (At/Below target ₹22,000 -> TRIGGERS)
    // -------------------------------------------------------------
    console.log('Test 4: Alert Evaluation - Price drops to ₹21,999 (Below target ₹22,000 -> TRIGGERS)');
    const evalRes2 = await alertEvaluationService.evaluateAlertsForProduct(
      testProduct._id.toString(),
      21999
    );

    assert.equal(evalRes2.evaluatedCount, 1);
    assert.equal(evalRes2.triggeredCount, 1, 'Price ₹21,999 MUST trigger target ₹22,000');
    assert.equal(evalRes2.triggeredAlerts[0].triggeredPrice, 21999);
    assert.equal(evalRes2.triggeredAlerts[0].savings, 1);

    const alertDoc2 = await PriceAlert.findById(activeAlertId);
    assert.equal(alertDoc2.status, 'TRIGGERED');
    assert.equal(alertDoc2.triggered, true);
    assert.equal(alertDoc2.triggeredPrice, 21999);
    assert.ok(alertDoc2.triggeredAt instanceof Date);
    console.log(' Passed: Alert successfully TRIGGERED (status: TRIGGERED, triggeredPrice: ₹21,999)\n');

    // -------------------------------------------------------------
    // Test 5: Immediate Trigger on Creation if already below target
    // -------------------------------------------------------------
    console.log('Test 5: Immediate trigger when target price (₹30,000) >= current price (₹24,999)');
    const createHighRes = await request(
      server,
      {
        path: '/api/alerts',
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      },
      {
        productId: testProduct._id.toString(),
        targetPrice: 30000,
      }
    );

    assert.equal(createHighRes.status, 201);
    assert.equal(createHighRes.body.data.status, 'TRIGGERED');
    assert.equal(createHighRes.body.data.triggered, true);
    console.log(' Passed: Correctly identified immediately met target price on creation\n');

    // -------------------------------------------------------------
    // Test 6: Retrieve User Price Alerts (GET /api/alerts)
    // -------------------------------------------------------------
    console.log('Test 6: Retrieve all alerts for user (GET /api/alerts)');
    const getRes = await request(server, {
      path: '/api/alerts',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.success, true);
    assert.equal(getRes.body.data.length, 2);
    assert.equal(getRes.body.data[0].title, 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones');
    console.log(' Passed: Retrieved populated list of user alerts with target prices and status\n');

    // -------------------------------------------------------------
    // Test 7: Delete Price Alert (DELETE /api/alerts/:id)
    // -------------------------------------------------------------
    console.log('Test 7: Delete price alert (DELETE /api/alerts/:id)');
    const delRes = await request(server, {
      path: `/api/alerts/${activeAlertId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.success, true);

    const checkDel = await PriceAlert.findById(activeAlertId);
    assert.equal(checkDel, null);
    console.log(' Passed: Price alert deleted successfully\n');

    // -------------------------------------------------------------
    // Test 8: Background Scheduler Architecture Test (evaluateAllActiveAlerts)
    // -------------------------------------------------------------
    console.log('Test 8: Background Worker evaluation architecture (evaluateAllActiveAlerts)');
    const bulkEval = await alertEvaluationService.evaluateAllActiveAlerts();
    assert.ok(typeof bulkEval.totalEvaluated === 'number');
    assert.ok(typeof bulkEval.totalTriggered === 'number');
    console.log(` Passed: Bulk evaluation service evaluated ${bulkEval.totalEvaluated} alerts successfully\n`);

    console.log('======================================================');
    console.log('🎉 ALL PRICE ALERT SYSTEM TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } finally {
    await User.deleteMany({ email: testEmail });
    if (testProduct) await Product.findByIdAndDelete(testProduct._id);
    if (userId) await PriceAlert.deleteMany({ user: userId });
    server.close();
  }
};

runAlertTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Price Alert test execution failed:', err);
  process.exit(1);
});
