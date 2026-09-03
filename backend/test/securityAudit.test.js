import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/config/db.js';
import { config } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { generateToken, verifyToken } from '../src/utils/jwt.js';
import { hashPassword, comparePassword } from '../src/utils/password.js';
import { affiliateUrlService } from '../src/services/affiliate/AffiliateUrlService.js';
import { logger } from '../src/utils/logger.js';
import { createRateLimiter } from '../src/middleware/rateLimiter.js';

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

const runSecurityAuditTests = async () => {
  console.log('\n======================================================');
  console.log('🔒 Starting HL² Comprehensive Security Audit Test Suite');
  console.log('======================================================\n');

  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const testEmail = `sec_audit_${Date.now()}@hl2.app`;

  try {
    // -------------------------------------------------------------
    // Test 1: JWT Algorithm Hardening & Tampering Protection
    // -------------------------------------------------------------
    console.log('Test 1: JWT Algorithm Hardening & Tampering Protection');
    const validToken = generateToken({ userId: '12345', email: 'test@hl2.app', role: 'user' });
    const decoded = verifyToken(validToken);
    assert.equal(decoded.userId, '12345');

    // Reject forged token with 'none' algorithm
    const forgedNoneToken = jwt.sign({ userId: 'admin' }, '', { algorithm: 'none' });
    assert.throws(() => {
      verifyToken(forgedNoneToken);
    });

    // Reject token signed with incorrect secret
    const forgedSecretToken = jwt.sign({ userId: 'admin' }, 'wrong_secret_key', { algorithm: 'HS256' });
    assert.throws(() => {
      verifyToken(forgedSecretToken);
    });
    console.log(' Passed: Token algorithm strictly enforced; forged & "none" tokens rejected\n');

    // -------------------------------------------------------------
    // Test 2: Password Hashing & Salt Verification (Bcrypt >= 12 Rounds)
    // -------------------------------------------------------------
    console.log('Test 2: Password Hashing & Salt Rounds Verification');
    const plain = 'SuperSecureP@ssw0rd2026!';
    const hashed = await hashPassword(plain);

    assert.ok(hashed.startsWith('$2a$12$') || hashed.startsWith('$2b$12$'), 'Must use bcrypt with 12 rounds');
    assert.notEqual(hashed, plain);
    assert.equal(await comparePassword(plain, hashed), true);
    assert.equal(await comparePassword('WrongPassword!', hashed), false);
    console.log(' Passed: Bcrypt salted hashing with 12 rounds verified\n');

    // -------------------------------------------------------------
    // Test 3: Sensitive Data Sanitization (User Password Hash Omission)
    // -------------------------------------------------------------
    console.log('Test 3: Sensitive Data Sanitization (Password Omission)');
    const regRes = await request(
      server,
      { path: '/api/auth/register', method: 'POST' },
      { name: 'Security User', email: testEmail, password: 'SecurePassword123!' }
    );

    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.data.user.password, undefined, 'Password field must never be exposed');
    assert.equal(regRes.body.data.user.__v, undefined);
    console.log(' Passed: User password hash completely omitted in API responses\n');

    // -------------------------------------------------------------
    // Test 4: NoSQL Injection Sanitization Middleware
    // -------------------------------------------------------------
    console.log('Test 4: NoSQL Injection Operator Sanitization');
    const nosqlRes = await request(
      server,
      { path: '/api/auth/login', method: 'POST' },
      {
        email: { $gt: '' }, // NoSQL query injection attempt
        password: { $gt: '' },
      }
    );

    assert.equal(nosqlRes.status, 400); // Should fail validation because object was stripped of $ operators
    console.log(' Passed: Prohibited MongoDB operators ($ and .) recursively sanitized\n');

    // -------------------------------------------------------------
    // Test 5: Open Redirect & Malicious Protocol Blocking
    // -------------------------------------------------------------
    console.log('Test 5: Open Redirect & Malicious Protocol Blocking');
    const jsUrl = affiliateUrlService.generateDestinationUrl('javascript:alert(1)', 'Amazon');
    assert.equal(jsUrl.destinationUrl, '', 'javascript: protocol must be blocked');

    const dataUrl = affiliateUrlService.generateDestinationUrl('data:text/html,<script>alert(1)</script>', 'Amazon');
    assert.equal(dataUrl.destinationUrl, '', 'data: protocol must be blocked');

    const buyNowRes = await request(
      server,
      { path: '/api/products/buy-now', method: 'POST' },
      { url: 'javascript:alert(1)', retailer: 'Amazon' }
    );
    assert.equal(buyNowRes.body.data.destinationUrl, '');
    console.log(' Passed: Malicious non-HTTP protocols blocked from destination URL generation\n');

    // -------------------------------------------------------------
    // Test 6: Rate Limiter Token Bucket Protection
    // -------------------------------------------------------------
    console.log('Test 6: Rate Limiter Token Bucket Protection');
    const testLimiter = createRateLimiter({
      windowMs: 5000,
      maxRequests: 3,
      message: 'Rate limit test reached',
    });

    const mockReq = { ip: '192.168.1.100', headers: { 'x-test-ratelimit': 'true' } };
    let blockTriggered = false;
    const mockRes = {
      setHeader: () => {},
      status: (code) => ({
        json: (data) => {
          if (code === 429) blockTriggered = true;
          return data;
        },
      }),
    };

    // 3 allowed hits
    testLimiter(mockReq, mockRes, () => {});
    testLimiter(mockReq, mockRes, () => {});
    testLimiter(mockReq, mockRes, () => {});
    // 4th hit should be blocked
    testLimiter(mockReq, mockRes, () => {});
    assert.equal(blockTriggered, true, 'Rate limiter must block excess requests with HTTP 429');
    console.log(' Passed: Rate limiter throttles excess requests with HTTP 429\n');

    // -------------------------------------------------------------
    // Test 7: Sensitive Data Redaction in Logging
    // -------------------------------------------------------------
    console.log('Test 7: Sensitive Data Redaction in Logging');
    const logOutput = logger.formatMessage('info', 'User Login Action', {
      email: 'user@hl2.app',
      password: 'PlainTextPassword123!',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      authorization: 'Bearer super_secret_token',
    });

    assert.ok(!logOutput.includes('PlainTextPassword123!'), 'Password must be redacted');
    assert.ok(!logOutput.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), 'Token must be redacted');
    assert.ok(!logOutput.includes('super_secret_token'), 'Authorization must be redacted');
    assert.ok(logOutput.includes('[REDACTED]'), 'Redaction placeholder must be present');
    console.log(' Passed: Sensitive fields automatically masked in logs\n');

    // -------------------------------------------------------------
    // Test 8: Security Headers (Helmet Protection)
    // -------------------------------------------------------------
    console.log('Test 8: Security Headers (Helmet Protection)');
    const rootRes = await request(server, { path: '/', method: 'GET' });
    assert.ok(rootRes.headers['x-dns-prefetch-control'], 'X-DNS-Prefetch-Control header should be set');
    assert.ok(rootRes.headers['x-content-type-options'], 'X-Content-Type-Options header should be set');
    assert.ok(rootRes.headers['x-frame-options'], 'X-Frame-Options header should be set');
    console.log(' Passed: Helmet security headers verified on HTTP responses\n');

    console.log('======================================================');
    console.log('🎉 ALL SECURITY AUDIT TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } finally {
    await User.deleteMany({ email: testEmail });
    server.close();
  }
};

runSecurityAuditTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Security audit test execution failed:', err);
  process.exit(1);
});
