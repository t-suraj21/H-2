import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { SearchHistory } from '../src/models/SearchHistory.js';
import { searchHistoryService } from '../src/services/history/SearchHistoryService.js';

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

const runSearchHistoryTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting HL² Search History Engine Test Suite');
  console.log('======================================================\n');

  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const testEmail = `search_hist_${Date.now()}@example.com`;
  let authToken = null;
  let userId = null;
  let createdSearchId = null;

  try {
    // -------------------------------------------------------------
    // Test 1: Reject Unauthorized Request without Token
    // -------------------------------------------------------------
    console.log('Test 1: Reject Unauthorized Request without Token (HTTP 401)');
    const unauthRes = await request(server, { path: '/api/search-history', method: 'GET' });
    assert.equal(unauthRes.status, 401);
    console.log(' Passed: Blocked unauthorized request with HTTP 401\n');

    // Setup Test User
    const regRes = await request(
      server,
      { path: '/api/auth/register', method: 'POST' },
      { name: 'Search Hist Tester', email: testEmail, password: 'SecurePassword123!' }
    );
    assert.equal(regRes.status, 201);
    authToken = regRes.body.data.token;
    userId = regRes.body.data.user._id || regRes.body.data.user.id;

    // -------------------------------------------------------------
    // Test 2: Record New Search Item (POST /api/search-history)
    // -------------------------------------------------------------
    console.log('Test 2: Record New Search Item (POST /api/search-history)');
    const recordRes = await request(
      server,
      {
        path: '/api/search-history',
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      },
      {
        title: 'Sony WH-1000XM5 Wireless Headphones',
        url: 'https://www.amazon.in/dp/B09XS7JWHH?ref_=tracking_junk',
        retailer: 'Amazon',
        brand: 'Sony',
        category: 'Headphones',
        lowestPrice: 24999,
        image: 'https://example.com/sony.jpg',
      }
    );

    assert.equal(recordRes.status, 201);
    assert.equal(recordRes.body.success, true);
    assert.ok(recordRes.body.data._id);
    createdSearchId = recordRes.body.data._id;
    // Verify sensitive/volatile query params stripped
    assert.ok(!recordRes.body.data.url.includes('ref_='), 'Volatile tracking tokens must be cleaned');
    assert.equal(recordRes.body.data.lowestPrice, 24999);
    console.log(' Passed: Search history entry recorded with clean URL\n');

    // -------------------------------------------------------------
    // Test 3: Upsert Existing Search Item (Update timestamp & price)
    // -------------------------------------------------------------
    console.log('Test 3: Upsert Existing Search Item (Deduplication)');
    const upsertRes = await request(
      server,
      {
        path: '/api/search-history',
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      },
      {
        title: 'Sony WH-1000XM5 (Updated Deal)',
        url: 'https://www.amazon.in/dp/B09XS7JWHH', // Same canonical URL
        retailer: 'Amazon',
        lowestPrice: 21999,
      }
    );

    assert.equal(upsertRes.status, 201);
    const totalCount = await SearchHistory.countDocuments({ user: userId });
    assert.equal(totalCount, 1, 'Upserting same URL should not create duplicate document');
    const updatedDoc = await SearchHistory.findById(createdSearchId);
    assert.equal(updatedDoc.lowestPrice, 21999, 'Lowest price should be updated');
    console.log(' Passed: Duplicate URL upserted cleanly without document proliferation\n');

    // -------------------------------------------------------------
    // Test 4: Retrieve User Recent Searches (GET /api/search-history)
    // -------------------------------------------------------------
    console.log('Test 4: Retrieve User Recent Searches (GET /api/search-history)');
    // Add a second search item
    await request(
      server,
      {
        path: '/api/search-history',
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      },
      {
        title: 'Apple iPhone 17 256GB',
        url: 'https://www.flipkart.com/apple-iphone-17/p/itm12345',
        retailer: 'Flipkart',
        lowestPrice: 79999,
      }
    );

    const getRes = await request(server, {
      path: '/api/search-history?limit=10',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.success, true);
    assert.equal(getRes.body.data.length, 2);
    // Most recent search (iPhone) should be first
    assert.equal(getRes.body.data[0].title, 'Apple iPhone 17 256GB');
    console.log(' Passed: Retrieved recent searches in descending chronological order\n');

    // -------------------------------------------------------------
    // Test 5: Delete Single Search Item (DELETE /api/search-history/:id)
    // -------------------------------------------------------------
    console.log('Test 5: Delete Single Search Item (DELETE /api/search-history/:id)');
    const delOneRes = await request(server, {
      path: `/api/search-history/${createdSearchId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.equal(delOneRes.status, 200);
    assert.equal(delOneRes.body.success, true);
    const countAfterOne = await SearchHistory.countDocuments({ user: userId });
    assert.equal(countAfterOne, 1);
    console.log(' Passed: Individual search item removed successfully\n');

    // -------------------------------------------------------------
    // Test 6: Clear All Search History (DELETE /api/search-history)
    // -------------------------------------------------------------
    console.log('Test 6: Clear All Search History (DELETE /api/search-history)');
    const clearRes = await request(server, {
      path: '/api/search-history',
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.equal(clearRes.status, 200);
    assert.equal(clearRes.body.data.cleared, true);
    const countAfterClear = await SearchHistory.countDocuments({ user: userId });
    assert.equal(countAfterClear, 0);
    console.log(' Passed: Cleared all search history for user\n');

    // -------------------------------------------------------------
    // Test 7: Bounded Limit Trimming (Max 50 items per user)
    // -------------------------------------------------------------
    console.log('Test 7: Bounded Limit Trimming (Insert 55 items -> Caps at 50)');
    const testItems = [];
    for (let i = 1; i <= 55; i++) {
      testItems.push({
        user: userId,
        title: `Product Benchmark #${i}`,
        url: `https://www.amazon.in/dp/B000TEST${i.toString().padStart(4, '0')}`,
        retailer: 'Amazon',
        lowestPrice: 1000 + i,
        searchedAt: new Date(Date.now() - (55 - i) * 60000), // Chronological spacing
      });
    }

    await SearchHistory.insertMany(testItems);
    await searchHistoryService.trimUserHistory(userId);

    const boundedCount = await SearchHistory.countDocuments({ user: userId });
    assert.equal(boundedCount, 50, 'User search history must be strictly capped at 50 items');
    console.log(' Passed: History capped at 50 items; oldest entries trimmed successfully\n');

    console.log('======================================================');
    console.log('🎉 ALL SEARCH HISTORY ENGINE TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } finally {
    await User.deleteMany({ email: testEmail });
    await SearchHistory.deleteMany({ user: userId });
    server.close();
  }
};

runSearchHistoryTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Search History test execution failed:', err);
  process.exit(1);
});
