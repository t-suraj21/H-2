import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { config } from '../src/config/env.js';
import { connectDatabase } from '../src/config/db.js';

// Helper function to make HTTP requests against the in-memory test server
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

const runAuthTests = async () => {
  console.log('\n=============================================');
  console.log('🧪 Starting HL² Authentication Test Suite');
  console.log('=============================================\n');

  // Connect to MongoDB test instance
  await connectDatabase();

  // Create Express App & Server
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const testEmail = `test_shopper_${Date.now()}@hl2.app`;
  const testPassword = 'SecurePassword123!';
  let authToken = '';

  try {
    // -------------------------------------------------------------
    // Test 1: Register validation failure (short password)
    // -------------------------------------------------------------
    console.log('Test 1: POST /api/auth/register with invalid password (<8 chars)');
    const res1 = await request(server, { path: '/api/auth/register', method: 'POST' }, {
      name: 'Alex Hunter',
      email: testEmail,
      password: 'short',
    });
    assert.equal(res1.status, 400, `Expected status 400, got ${res1.status}`);
    assert.equal(res1.body.success, false);
    console.log(' Passed: Rejected short password with HTTP 400\n');

    // -------------------------------------------------------------
    // Test 2: Successful Registration
    // -------------------------------------------------------------
    console.log('Test 2: POST /api/auth/register with valid payload');
    const res2 = await request(server, { path: '/api/auth/register', method: 'POST' }, {
      name: 'Alex Hunter',
      email: testEmail,
      password: testPassword,
    });
    assert.equal(res2.status, 201, `Expected status 201, got ${res2.status}`);
    assert.equal(res2.body.success, true);
    assert.ok(res2.body.data.token, 'Token must be present in response');
    assert.equal(res2.body.data.user.email, testEmail);
    assert.equal(res2.body.data.user.password, undefined, 'Password hash MUST NEVER be returned');
    authToken = res2.body.data.token;
    console.log(' Passed: User registered, token issued, password safely omitted\n');

    // -------------------------------------------------------------
    // Test 3: Duplicate Email Registration Failure
    // -------------------------------------------------------------
    console.log('Test 3: POST /api/auth/register with duplicate email');
    const res3 = await request(server, { path: '/api/auth/register', method: 'POST' }, {
      name: 'Alex Impostor',
      email: testEmail,
      password: 'AnotherPassword456!',
    });
    assert.equal(res3.status, 409, `Expected status 409 Conflict, got ${res3.status}`);
    assert.equal(res3.body.success, false);
    console.log(' Passed: Duplicate registration blocked with HTTP 409 Conflict\n');

    // -------------------------------------------------------------
    // Test 4: Login with Wrong Password
    // -------------------------------------------------------------
    console.log('Test 4: POST /api/auth/login with wrong password');
    const res4 = await request(server, { path: '/api/auth/login', method: 'POST' }, {
      email: testEmail,
      password: 'WrongPassword!',
    });
    assert.equal(res4.status, 401, `Expected status 401 Unauthorized, got ${res4.status}`);
    assert.equal(res4.body.success, false);
    console.log(' Passed: Invalid credentials rejected with HTTP 401 Unauthorized\n');

    // -------------------------------------------------------------
    // Test 5: Successful Login
    // -------------------------------------------------------------
    console.log('Test 5: POST /api/auth/login with valid credentials');
    const res5 = await request(server, { path: '/api/auth/login', method: 'POST' }, {
      email: testEmail,
      password: testPassword,
    });
    assert.equal(res5.status, 200, `Expected status 200 OK, got ${res5.status}`);
    assert.equal(res5.body.success, true);
    assert.ok(res5.body.data.token, 'Token must be present');
    assert.equal(res5.body.data.user.email, testEmail);
    assert.equal(res5.body.data.user.password, undefined, 'Password hash MUST NEVER be returned');
    console.log(' Passed: Login successful, token returned, user profile verified\n');

    // -------------------------------------------------------------
    // Test 6: Access Protected /me Endpoint without Token
    // -------------------------------------------------------------
    console.log('Test 6: GET /api/auth/me without authorization header');
    const res6 = await request(server, { path: '/api/auth/me', method: 'GET' });
    assert.equal(res6.status, 401, `Expected status 401, got ${res6.status}`);
    assert.equal(res6.body.success, false);
    console.log(' Passed: Unauthorized request correctly rejected with HTTP 401\n');

    // -------------------------------------------------------------
    // Test 7: Access Protected /me Endpoint with Bearer Token
    // -------------------------------------------------------------
    console.log('Test 7: GET /api/auth/me with Bearer token');
    const res7 = await request(server, {
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    assert.equal(res7.status, 200, `Expected status 200 OK, got ${res7.status}`);
    assert.equal(res7.body.success, true);
    assert.equal(res7.body.data.user.email, testEmail);
    assert.equal(res7.body.data.user.password, undefined);
    console.log(' Passed: Current user profile successfully retrieved via JWT\n');

    console.log('=============================================');
    console.log('🎉 ALL 7 AUTHENTICATION TESTS PASSED PERFECTLY!');
    console.log('=============================================\n');
  } finally {
    // Clean up test user from MongoDB
    try {
      await User.deleteOne({ email: testEmail });
      console.log(' Cleaned up test user record.');
    } catch {
      // ignore
    }
    server.close();
  }
};

runAuthTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
