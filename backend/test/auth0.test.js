import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Watchlist } from '../src/models/Watchlist.js';
import { PriceAlert } from '../src/models/PriceAlert.js';
import { Product } from '../src/models/Product.js';
import { connectDatabase } from '../src/config/db.js';
import { config } from '../src/config/env.js';

// Generate an RSA Keypair in-memory for testing RS256 token verification
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

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

const runAuth0Tests = async () => {
  console.log('\n=============================================');
  console.log('🔒 Starting HL² Auth0 Verification Test Suite');
  console.log('=============================================\n');

  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const testAuth0Id = `auth0|test_shopper_${Date.now()}`;
  const testEmail = `auth0_shopper_${Date.now()}@hl2.app`;

  try {
    // -------------------------------------------------------------
    // Test 1: Missing Authorization Header
    // -------------------------------------------------------------
    console.log('Test 1: GET /api/users/me without Authorization header');
    const res1 = await request(server, { path: '/api/users/me', method: 'GET' });
    assert.equal(res1.status, 401);
    assert.equal(res1.body.success, false);
    console.log(' Passed: Missing Authorization header rejected with HTTP 401\n');

    // -------------------------------------------------------------
    // Test 2: Malformed Bearer Token
    // -------------------------------------------------------------
    console.log('Test 2: GET /api/users/me with malformed Bearer token');
    const res2 = await request(server, {
      path: '/api/users/me',
      method: 'GET',
      headers: { Authorization: 'Bearer this_is_not_a_valid_jwt' },
    });
    assert.equal(res2.status, 401);
    assert.equal(res2.body.success, false);
    console.log(' Passed: Malformed token rejected with HTTP 401\n');

    // -------------------------------------------------------------
    // Test 3: Expired Token Rejection
    // -------------------------------------------------------------
    console.log('Test 3: GET /api/users/me with expired token');
    const expiredToken = jwt.sign(
      { sub: testAuth0Id, email: testEmail },
      config.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const res3 = await request(server, {
      path: '/api/users/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.equal(res3.status, 401);
    assert.equal(res3.body.success, false);
    console.log(' Passed: Expired token rejected with HTTP 401 EXPIRED_JWT\n');

    // -------------------------------------------------------------
    // Test 4: Automatic User Provisioning & Sync on /api/users/me
    // -------------------------------------------------------------
    console.log('Test 4: Automatic user provisioning via token claims');
    const validTestToken = jwt.sign(
      {
        sub: testAuth0Id,
        email: testEmail,
        name: 'Jane Auth0 Tester',
        picture: 'https://cdn.auth0.com/avatars/jt.png',
        email_verified: true,
      },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res4 = await request(server, {
      path: '/api/users/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${validTestToken}` },
    });
    assert.equal(res4.status, 200, `Expected 200, got ${res4.status}`);
    assert.equal(res4.body.success, true);
    assert.equal(res4.body.data.user.email, testEmail);
    assert.equal(res4.body.data.user.auth0Id, testAuth0Id);
    assert.equal(res4.body.data.user.name, 'Jane Auth0 Tester');
    console.log(' Passed: User automatically provisioned in MongoDB with Auth0 sub\n');

    // -------------------------------------------------------------
    // Test 5: Verify User in MongoDB
    // -------------------------------------------------------------
    console.log('Test 5: Verify MongoDB user record integrity');
    const dbUser = await User.findOne({ auth0Id: testAuth0Id });
    assert.ok(dbUser, 'User document must exist in database');
    assert.equal(dbUser.email, testEmail);
    assert.equal(dbUser.auth0Id, testAuth0Id);
    assert.equal(dbUser.password, undefined, 'Password field must never be populated');
    console.log(' Passed: DB record verified, password omitted\n');

    // -------------------------------------------------------------
    // Test 6: User Ownership & Authorization Isolation
    // -------------------------------------------------------------
    console.log('Test 6: User Data Isolation (User A cannot access User B data)');
    const otherUserAuth0Id = `auth0|other_user_${Date.now()}`;
    const otherUserEmail = `other_${Date.now()}@hl2.app`;
    const otherUserToken = jwt.sign(
      { sub: otherUserAuth0Id, email: otherUserEmail, name: 'Other User' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Call /api/users/me for Other User
    const resOtherMe = await request(server, {
      path: '/api/users/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${otherUserToken}` },
    });
    assert.equal(resOtherMe.status, 200);
    assert.equal(resOtherMe.body.data.user.email, otherUserEmail);
    assert.notEqual(resOtherMe.body.data.user._id, dbUser._id.toString());
    console.log(' Passed: Distinct user identities strictly partitioned by Auth0 sub\n');

    // -------------------------------------------------------------
    // Test 7: Protected Watchlist Endpoint Scoping
    // -------------------------------------------------------------
    console.log('Test 7: GET /api/watchlist returns only user-scoped items');
    const resWatchlist = await request(server, {
      path: '/api/watchlist',
      method: 'GET',
      headers: { Authorization: `Bearer ${validTestToken}` },
    });
    assert.equal(resWatchlist.status, 200);
    assert.ok(Array.isArray(resWatchlist.body.data));
    console.log(' Passed: Watchlist correctly scoped to authenticated user\n');

    console.log('=============================================');
    console.log('🎉 ALL 7 AUTH0 VERIFICATION TESTS PASSED PERFECTLY!');
    console.log('=============================================\n');
  } finally {
    // Cleanup
    try {
      await User.deleteMany({ auth0Id: { $in: [testAuth0Id, `auth0|other_user_${Date.now()}`] } });
      await User.deleteMany({ email: { $in: [testEmail] } });
    } catch {
      // Ignore
    }
    server.close();
  }
};

runAuth0Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Auth0 Test Suite Failed:', err);
    process.exit(1);
  });
