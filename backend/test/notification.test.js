import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { PriceAlert } from '../src/models/PriceAlert.js';
import { NotificationLog } from '../src/models/NotificationLog.js';
import { notificationService, MockPushProvider } from '../src/services/notification/index.js';
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

const runNotificationTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting HL² Price-Drop Notification System Test Suite');
  console.log('======================================================\n');

  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const testEmail = `notify_test_${Date.now()}@example.com`;
  let authToken = null;
  let userId = null;
  let testProduct = null;
  let testAlert = null;
  const mockProvider = new MockPushProvider();
  notificationService.setProvider(mockProvider);

  try {
    // Setup test user and product
    const regRes = await request(
      server,
      { path: '/api/auth/register', method: 'POST' },
      { name: 'Notify Tester', email: testEmail, password: 'SecurePassword123!' }
    );
    assert.equal(regRes.status, 201);
    authToken = regRes.body.data.token;
    userId = regRes.body.data.user._id || regRes.body.data.user.id;

    testProduct = await Product.create({
      name: 'Sony WH-1000XM5',
      brand: 'Sony',
      model: 'WH-1000XM5',
      category: 'Headphones',
      image: 'https://example.com/sony.jpg',
      lowestRecordedPrice: 24999,
      highestRecordedPrice: 29990,
    });

    testAlert = await PriceAlert.create({
      user: userId,
      product: testProduct._id,
      targetPrice: 22000,
      status: 'ACTIVE',
      triggered: false,
    });

    // -------------------------------------------------------------
    // Test 1: Verify Notification Content Template & Formatting
    // -------------------------------------------------------------
    console.log('Test 1: Verify Notification Content Template & Formatting');
    const { title, body } = notificationService.formatPriceDropMessage({
      productName: 'Sony WH-1000XM5',
      currentPrice: 21999,
      targetPrice: 22000,
      retailerName: 'Amazon',
    });

    assert.equal(title, 'Price Drop Alert');
    assert.ok(body.includes('Sony WH-1000XM5'), 'Body must include product name');
    assert.ok(body.includes('₹21,999'), 'Body must include formatted current price');
    assert.ok(body.includes('₹22,000'), 'Body must include formatted target price');
    assert.ok(body.includes('Amazon'), 'Body must include retailer name');
    console.log(` Passed: Formatted message successfully:\n   Title: "${title}"\n   Body: "${body.replace('\n', ' ')}"\n`);

    // -------------------------------------------------------------
    // Test 2: Register Device Push Token (POST /api/notifications/register-token)
    // -------------------------------------------------------------
    console.log('Test 2: Register Device Push Token (POST /api/notifications/register-token)');
    const tokenRes = await request(
      server,
      {
        path: '/api/notifications/register-token',
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      },
      {
        token: 'ExponentPushToken[mock_device_token_12345]',
        platform: 'ios',
        deviceId: 'device-iphone-15-pro',
      }
    );

    assert.equal(tokenRes.status, 200);
    assert.equal(tokenRes.body.success, true);
    assert.equal(tokenRes.body.data.tokensCount, 1);

    const userInDb = await User.findById(userId);
    assert.equal(userInDb.pushTokens.length, 1);
    assert.equal(userInDb.pushTokens[0].token, 'ExponentPushToken[mock_device_token_12345]');
    console.log(' Passed: Mobile push token registered successfully on User profile\n');

    // -------------------------------------------------------------
    // Test 3: Alert Trigger Dispatches Push Notification
    // -------------------------------------------------------------
    console.log('Test 3: Alert Trigger Dispatches Push Notification (Price: ₹21,999 <= Target: ₹22,000)');
    mockProvider.clearHistory();

    const evalResult = await alertEvaluationService.evaluateAlertsForProduct(
      testProduct._id.toString(),
      21999,
      { retailer: 'Amazon' }
    );

    assert.equal(evalResult.triggeredCount, 1);
    assert.equal(mockProvider.getHistory().length, 1, 'Mock push provider must receive 1 push notification');

    const sentPush = mockProvider.getHistory()[0];
    assert.equal(sentPush.title, 'Price Drop Alert');
    assert.ok(sentPush.body.includes('₹21,999'));
    assert.equal(sentPush.data.targetPrice, 22000);

    const logInDb = await NotificationLog.findOne({ user: userId, alert: testAlert._id });
    assert.ok(logInDb, 'NotificationLog must be persisted in database');
    assert.equal(logInDb.currentPrice, 21999);
    assert.equal(logInDb.status, 'SENT');
    console.log(' Passed: Push notification delivered via provider and recorded in NotificationLog\n');

    // -------------------------------------------------------------
    // Test 4: Duplicate Notification Suppression
    // -------------------------------------------------------------
    console.log('Test 4: Duplicate Notification Suppression for Identical Price Drop');
    const initialLogCount = await NotificationLog.countDocuments({ user: userId });

    const duplicateDispatch = await notificationService.sendPriceDropAlert({
      alertId: testAlert._id,
      productId: testProduct._id,
      productName: 'Sony WH-1000XM5',
      currentPrice: 21999, // Same price already notified
      targetPrice: 22000,
      retailerName: 'Amazon',
      userId,
    });

    assert.equal(duplicateDispatch.isDuplicate, true, 'Subsequent trigger must be flagged as duplicate');
    assert.equal(mockProvider.getHistory().length, 1, 'Provider must NOT receive second duplicate push');

    const finalLogCount = await NotificationLog.countDocuments({ user: userId });
    assert.equal(initialLogCount, finalLogCount, 'Duplicate notification should not create duplicate SENT log');
    console.log(' Passed: Duplicate notification successfully suppressed\n');

    // -------------------------------------------------------------
    // Test 5: Retrieve Notification History (GET /api/notifications/history)
    // -------------------------------------------------------------
    console.log('Test 5: Retrieve Notification History (GET /api/notifications/history)');
    const histRes = await request(server, {
      path: '/api/notifications/history',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.equal(histRes.status, 200);
    assert.equal(histRes.body.success, true);
    assert.ok(Array.isArray(histRes.body.data));
    assert.equal(histRes.body.data.length, 1);
    assert.equal(histRes.body.data[0].title, 'Price Drop Alert');
    assert.equal(histRes.body.data[0].currentPrice, 21999);
    console.log(' Passed: Retrieved notification delivery history for user\n');

    // -------------------------------------------------------------
    // Test 6: Pluggable Provider Swap Test
    // -------------------------------------------------------------
    console.log('Test 6: Pluggable Provider Swap Test');
    class CustomVendorProvider {
      constructor() {
        this.name = 'custom_vendor';
      }
      async sendPushNotification(msg) {
        return { success: true, vendor: 'custom_vendor', title: msg.title };
      }
    }
    const customProvider = new CustomVendorProvider();
    notificationService.setProvider(customProvider);
    assert.equal(notificationService.provider.name, 'custom_vendor');
    notificationService.setProvider(mockProvider); // Revert
    console.log(' Passed: Pluggable provider dynamically changed without code alteration\n');

    // -------------------------------------------------------------
    // Test 7: Unauthorized Request Rejection
    // -------------------------------------------------------------
    console.log('Test 7: Reject Unauthorized Request (GET /api/notifications/history without token)');
    const unauthRes = await request(server, { path: '/api/notifications/history', method: 'GET' });
    assert.equal(unauthRes.status, 401);
    console.log(' Passed: Unauthorized access correctly rejected with HTTP 401\n');

    console.log('======================================================');
    console.log('🎉 ALL NOTIFICATION SYSTEM TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } finally {
    await User.deleteMany({ email: testEmail });
    if (testProduct) {
      await Product.findByIdAndDelete(testProduct._id);
      await PriceAlert.deleteMany({ product: testProduct._id });
      await NotificationLog.deleteMany({ product: testProduct._id });
    }
    server.close();
  }
};

runNotificationTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Notification test execution failed:', err);
  process.exit(1);
});
