import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/config/db.js';
import { config } from '../src/config/env.js';
import { ERROR_CODES } from '../src/errors/errorCodes.js';
import {
  AppError,
  InvalidUrlError,
  UnsupportedRetailerError,
  ProductNotFoundError,
  RetailerProviderError,
  RequestTimeoutError,
  RateLimitError,
} from '../src/errors/AppError.js';

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

const runErrorHandlingTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting HL² Comprehensive Error-Handling Test Suite');
  console.log('======================================================\n');

  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Standardized Error JSON Contract Structure
    // -------------------------------------------------------------
    console.log('Test 1: Standardized Error JSON Contract Structure');
    const res1 = await request(server, { path: '/api/products/analyze', method: 'POST' }, { url: '' });

    assert.equal(res1.status, 400);
    assert.equal(res1.body.success, false);
    assert.ok(res1.body.error, 'Response must contain error object');
    assert.ok(res1.body.error.code, 'Error object must contain code');
    assert.ok(res1.body.error.message, 'Error object must contain message');
    assert.equal(res1.body.error.code, ERROR_CODES.INVALID_PRODUCT_URL);
    assert.ok(!res1.body.stack, 'Stack trace must not be exposed');
    console.log(` Passed: Standardized payload verified:\n   Code: "${res1.body.error.code}" - Message: "${res1.body.error.message}"\n`);

    // -------------------------------------------------------------
    // Test 2: Invalid Product URL Format (INVALID_PRODUCT_URL)
    // -------------------------------------------------------------
    console.log('Test 2: Invalid Product URL Format (INVALID_PRODUCT_URL)');
    const res2 = await request(
      server,
      { path: '/api/products/analyze', method: 'POST' },
      { url: 'not-a-valid-http-url' }
    );

    assert.equal(res2.status, 400);
    assert.equal(res2.body.error.code, ERROR_CODES.INVALID_PRODUCT_URL);
    console.log(' Passed: Malformed URL classified as INVALID_PRODUCT_URL\n');

    // -------------------------------------------------------------
    // Test 3: Unsupported Retailer Domain (UNSUPPORTED_RETAILER)
    // -------------------------------------------------------------
    console.log('Test 3: Unsupported Retailer Domain (UNSUPPORTED_RETAILER)');
    const res3 = await request(
      server,
      { path: '/api/products/analyze', method: 'POST' },
      { url: 'https://www.ebay.com/itm/123456789' }
    );

    assert.equal(res3.status, 400);
    assert.equal(res3.body.error.code, ERROR_CODES.UNSUPPORTED_RETAILER);
    assert.ok(res3.body.error.message.includes('Amazon') && res3.body.error.message.includes('Flipkart'));
    console.log(' Passed: Unsupported domain classified as UNSUPPORTED_RETAILER\n');

    // -------------------------------------------------------------
    // Test 4: Product Identifier Not Found (PRODUCT_NOT_FOUND)
    // -------------------------------------------------------------
    console.log('Test 4: Product Identifier Not Found (PRODUCT_NOT_FOUND)');
    const res4 = await request(
      server,
      { path: '/api/products/analyze', method: 'POST' },
      { url: 'https://www.amazon.in/gp/help/customer/display.html' }
    );

    assert.equal(res4.status, 404);
    assert.equal(res4.body.error.code, ERROR_CODES.PRODUCT_NOT_FOUND);
    console.log(' Passed: Non-product link classified as PRODUCT_NOT_FOUND\n');

    // -------------------------------------------------------------
    // Test 5: Authentication Failure on Protected Endpoint (AUTH_FAILURE)
    // -------------------------------------------------------------
    console.log('Test 5: Authentication Failure on Protected Endpoint (AUTH_FAILURE)');
    const res5 = await request(server, { path: '/api/watchlist', method: 'GET' });

    assert.equal(res5.status, 401);
    assert.equal(res5.body.error.code, ERROR_CODES.AUTH_FAILURE);
    console.log(' Passed: Missing auth token classified as AUTH_FAILURE\n');

    // -------------------------------------------------------------
    // Test 6: Expired JWT Token Handling (EXPIRED_JWT)
    // -------------------------------------------------------------
    console.log('Test 6: Expired JWT Token Handling (EXPIRED_JWT)');
    // Sign an immediately expired token (-10s)
    const expiredToken = jwt.sign(
      { id: '6a99738592f72c585e205a19', email: 'expired@hl2.app' },
      config.JWT_SECRET,
      { expiresIn: '-10s' }
    );

    const res6 = await request(server, {
      path: '/api/watchlist',
      method: 'GET',
      headers: { Authorization: `Bearer ${expiredToken}` },
    });

    assert.equal(res6.status, 401);
    assert.equal(res6.body.error.code, ERROR_CODES.EXPIRED_JWT);
    console.log(' Passed: Expired token classified as EXPIRED_JWT\n');

    // -------------------------------------------------------------
    // Test 7: AppError Subclasses & Status Codes
    // -------------------------------------------------------------
    console.log('Test 7: AppError Subclasses & Status Codes');
    const err1 = new InvalidUrlError();
    assert.equal(err1.statusCode, 400);
    assert.equal(err1.code, ERROR_CODES.INVALID_PRODUCT_URL);

    const err2 = new UnsupportedRetailerError();
    assert.equal(err2.statusCode, 400);
    assert.equal(err2.code, ERROR_CODES.UNSUPPORTED_RETAILER);

    const err3 = new ProductNotFoundError();
    assert.equal(err3.statusCode, 404);
    assert.equal(err3.code, ERROR_CODES.PRODUCT_NOT_FOUND);

    const err4 = new RetailerProviderError();
    assert.equal(err4.statusCode, 502);
    assert.equal(err4.code, ERROR_CODES.RETAILER_PROVIDER_FAILURE);

    const err5 = new RequestTimeoutError();
    assert.equal(err5.statusCode, 504);
    assert.equal(err5.code, ERROR_CODES.REQUEST_TIMEOUT);

    const err6 = new RateLimitError();
    assert.equal(err6.statusCode, 429);
    assert.equal(err6.code, ERROR_CODES.RATE_LIMIT_EXCEEDED);
    console.log(' Passed: All 6 specialized AppError subclasses verified\n');

    // -------------------------------------------------------------
    // Test 8: Zero Sensitive Information or Stack Trace Leakage
    // -------------------------------------------------------------
    console.log('Test 8: Zero Sensitive Information or Stack Trace Leakage');
    const res8 = await request(
      server,
      { path: '/api/auth/login', method: 'POST' },
      { email: 'nonexistent@hl2.app', password: 'wrong' }
    );

    assert.equal(res8.status, 401);
    assert.ok(!JSON.stringify(res8.body).includes('bcrypt'), 'Must not leak cryptographic library details');
    assert.ok(!JSON.stringify(res8.body).includes('node_modules'), 'Must not leak filesystem paths');
    console.log(' Passed: Zero sensitive internals leaked\n');

    console.log('======================================================');
    console.log('🎉 ALL COMPREHENSIVE ERROR-HANDLING TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
};

runErrorHandlingTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Error handling test execution failed:', err);
  process.exit(1);
});
