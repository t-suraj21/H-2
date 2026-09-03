import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Watchlist } from '../src/models/Watchlist.js';

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

const runWatchlistTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting HL² Watchlist Engine Test Suite');
  console.log('======================================================\n');

  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const testEmail = `watchlist_test_${Date.now()}@example.com`;
  let authToken = null;
  let userId = null;
  let testProduct = null;
  let watchlistId = null;

  try {
    // -------------------------------------------------------------
    // Setup: Create test user and product
    // -------------------------------------------------------------
    const regRes = await request(
      server,
      { path: '/api/auth/register', method: 'POST' },
      { name: 'Watchlist Tester', email: testEmail, password: 'SecurePassword123!' }
    );
    assert.equal(regRes.status, 201);
    authToken = regRes.body.data.token;
    userId = regRes.body.data.user._id || regRes.body.data.user.id;

    testProduct = await Product.create({
      name: 'Sony WH-1000XM5 Noise Canceling Headphones',
      brand: 'Sony',
      model: 'WH-1000XM5',
      category: 'Headphones & Audio',
      image: 'https://example.com/sony.jpg',
      lowestRecordedPrice: 24999,
      highestRecordedPrice: 29990,
    });

    // -------------------------------------------------------------
    // Test 1: Unauthorized access without JWT token
    // -------------------------------------------------------------
    console.log('Test 1: Reject unauthorized request without token');
    const unauthRes = await request(server, { path: '/api/watchlist', method: 'GET' });
    assert.equal(unauthRes.status, 401);
    console.log(' Passed: Correctly blocked unauthorized access with HTTP 401\n');

    // -------------------------------------------------------------
    // Test 2: Add Product to Watchlist (POST /api/watchlist)
    // -------------------------------------------------------------
    console.log('Test 2: Add product to user watchlist');
    const addRes = await request(
      server,
      {
        path: '/api/watchlist',
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      },
      {
        productId: testProduct._id.toString(),
        targetPrice: 22999,
        notes: 'Buy when drops below ₹23,000',
      }
    );

    assert.equal(addRes.status, 201);
    assert.equal(addRes.body.success, true);
    assert.equal(addRes.body.data.targetPrice, 22999);
    watchlistId = addRes.body.data._id || addRes.body.data.id;
    console.log(' Passed: Product added to watchlist with target price ₹22,999 (HTTP 201)\n');

    // -------------------------------------------------------------
    // Test 3: Graceful Duplicate Handling (POST /api/watchlist with same product)
    // -------------------------------------------------------------
    console.log('Test 3: Gracefully handle duplicate watchlist addition');
    const dupRes = await request(
      server,
      {
        path: '/api/watchlist',
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      },
      {
        productId: testProduct._id.toString(),
        targetPrice: 21999, // Updated target price
      }
    );

    assert.equal(dupRes.status, 200, 'Duplicate must return 200 instead of 500/11000 error');
    assert.equal(dupRes.body.success, true);
    assert.equal(dupRes.body.data.targetPrice, 21999);
    console.log(' Passed: Duplicate entry handled gracefully; target price updated to ₹21,999 (HTTP 200)\n');

    // -------------------------------------------------------------
    // Test 4: Get User Watchlist (GET /api/watchlist)
    // -------------------------------------------------------------
    console.log('Test 4: Retrieve user watched products');
    const getRes = await request(server, {
      path: '/api/watchlist',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.success, true);
    assert.equal(getRes.body.data.length, 1);
    assert.equal(getRes.body.data[0].title, 'Sony WH-1000XM5 Noise Canceling Headphones');
    assert.equal(getRes.body.data[0].currentPrice, 24999);
    assert.equal(getRes.body.data[0].lowestRecordedPrice, 24999);
    assert.equal(getRes.body.data[0].targetPrice, 21999);
    console.log(' Passed: Successfully retrieved populated watchlist with current & target prices\n');

    // -------------------------------------------------------------
    // Test 5: Remove Product from Watchlist (DELETE /api/watchlist/:id)
    // -------------------------------------------------------------
    console.log('Test 5: Remove product from watchlist');
    const delRes = await request(server, {
      path: `/api/watchlist/${watchlistId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.success, true);

    // Verify empty list
    const verifyRes = await request(server, {
      path: '/api/watchlist',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(verifyRes.body.data.length, 0);
    console.log(' Passed: Product successfully removed from watchlist\n');

    console.log('======================================================');
    console.log('🎉 ALL WATCHLIST ENGINE TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } finally {
    // Cleanup test records
    await User.deleteMany({ email: testEmail });
    if (testProduct) await Product.findByIdAndDelete(testProduct._id);
    if (userId) await Watchlist.deleteMany({ user: userId });
    server.close();
  }
};

runWatchlistTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Watchlist test execution failed:', err);
  process.exit(1);
});
