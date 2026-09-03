import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { AmazonAdapter } from '../src/providers/adapters/AmazonAdapter.js';
import { FlipkartAdapter } from '../src/providers/adapters/FlipkartAdapter.js';
import { CromaAdapter } from '../src/providers/adapters/CromaAdapter.js';
import { urlAnalyzerService } from '../src/services/urlAnalyzer.service.js';

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

const runUrlAnalyzerTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting HL² Product URL Analyzer Test Suite');
  console.log('======================================================\n');

  // -------------------------------------------------------------
  // Unit Test 1: Amazon Adapter Detection & ASIN Extraction
  // -------------------------------------------------------------
  console.log('Unit Test 1: AmazonAdapter URL detection & ASIN extraction');
  const amazonAdapter = new AmazonAdapter();

  assert.equal(
    amazonAdapter.canHandle('https://www.amazon.com/Sony-WH-1000XM5-Wireless-Canceling-Headphones/dp/B09XS7JWHH?ref=deals'),
    true
  );
  assert.equal(
    amazonAdapter.canHandle('https://amazon.in/dp/B0CX23V251'),
    true
  );

  const asin1 = amazonAdapter.extractProductIdentifier('https://www.amazon.com/dp/B09XS7JWHH?ref=sr_1_1');
  assert.deepEqual(asin1, { identifierType: 'ASIN', identifier: 'B09XS7JWHH' });

  const asin2 = amazonAdapter.extractProductIdentifier('https://www.amazon.com/gp/product/B0CX23V251?keywords=macbook');
  assert.deepEqual(asin2, { identifierType: 'ASIN', identifier: 'B0CX23V251' });

  assert.equal(
    amazonAdapter.normalizeUrl('https://www.amazon.com/Sony-Headphones/dp/B09XS7JWHH?ref=deals&tag=affiliate'),
    'https://www.amazon.com/dp/B09XS7JWHH'
  );
  console.log(' Passed: AmazonAdapter accurately extracts ASINs and canonicalizes URLs\n');

  // -------------------------------------------------------------
  // Unit Test 2: Flipkart Adapter Detection & PID Extraction
  // -------------------------------------------------------------
  console.log('Unit Test 2: FlipkartAdapter URL detection & PID extraction');
  const flipkartAdapter = new FlipkartAdapter();

  assert.equal(
    flipkartAdapter.canHandle('https://www.flipkart.com/apple-iphone-15-blue-128-gb/p/itm3316238b9e69d?pid=MOBFWQ6BRGFGG2FD'),
    true
  );

  const fkPid1 = flipkartAdapter.extractProductIdentifier('https://www.flipkart.com/product/p/itm3316238b9e69d?pid=MOBFWQ6BRGFGG2FD&lid=LST');
  assert.deepEqual(fkPid1, { identifierType: 'PID', identifier: 'MOBFWQ6BRGFGG2FD' });

  const fkPid2 = flipkartAdapter.extractProductIdentifier('https://www.flipkart.com/sony-tv/p/itm3316238b9e69d');
  assert.deepEqual(fkPid2, { identifierType: 'FSN', identifier: 'itm3316238b9e69d' });
  console.log(' Passed: FlipkartAdapter accurately extracts PIDs and FSN identifiers\n');

  // -------------------------------------------------------------
  // Unit Test 3: Croma Adapter Detection & Product Code Extraction
  // -------------------------------------------------------------
  console.log('Unit Test 3: CromaAdapter URL detection & Product Code extraction');
  const cromaAdapter = new CromaAdapter();

  assert.equal(
    cromaAdapter.canHandle('https://www.croma.com/dell-inspiron-3520-laptop/p/264332?utm_source=google'),
    true
  );

  const cromaCode = cromaAdapter.extractProductIdentifier('https://www.croma.com/p/264332');
  assert.deepEqual(cromaCode, { identifierType: 'PRODUCT_CODE', identifier: '264332' });

  assert.equal(
    cromaAdapter.normalizeUrl('https://www.croma.com/dell-laptop/p/264332?tracking=123'),
    'https://www.croma.com/p/264332'
  );
  console.log(' Passed: CromaAdapter accurately extracts Product Codes and canonicalizes URLs\n');

  // -------------------------------------------------------------
  // Unit Test 4: UrlAnalyzerService Error Handlers
  // -------------------------------------------------------------
  console.log('Unit Test 4: Error Handling in UrlAnalyzerService');

  // 4a. Invalid URL
  await assert.rejects(
    async () => {
      await urlAnalyzerService.analyzeUrl('not-a-valid-url');
    },
    (err) => err.statusCode === 400 && err.message.includes('Invalid product URL format')
  );
  console.log(' Passed: Rejects invalid non-URL string with HTTP 400');

  // 4b. Unsupported Retailer
  await assert.rejects(
    async () => {
      await urlAnalyzerService.analyzeUrl('https://unsupported-unknown-shop.com/product/123');
    },
    (err) => (err.statusCode === 400 || err.statusCode === 422) && err.message.includes('Unsupported retailer domain')
  );
  console.log(' Passed: Rejects unsupported retailer domain');

  // 4c. Non-product page
  await assert.rejects(
    async () => {
      await urlAnalyzerService.analyzeUrl('https://www.amazon.com/help/customer/display.html');
    },
    (err) => (err.statusCode === 404 || err.statusCode === 422) && err.message.includes('Could not extract a valid product identifier')
  );
  console.log(' Passed: Rejects non-product page\n');

  // -------------------------------------------------------------
  // Integration Tests: End-to-End API (POST /api/products/analyze)
  // -------------------------------------------------------------
  console.log('Integration Test 5: End-to-End POST /api/products/analyze');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    // 5a. Analyze Amazon URL
    console.log('5a: POST /api/products/analyze for Amazon Sony WH-1000XM5');
    const resAmazon = await request(
      server,
      { path: '/api/products/analyze', method: 'POST' },
      { url: 'https://www.amazon.com/dp/B09XS7JWHH?ref=deals&tag=test' }
    );
    assert.equal(resAmazon.status, 200);
    assert.equal(resAmazon.body.success, true);
    assert.equal(resAmazon.body.data.retailer.slug, 'amazon');
    assert.equal(resAmazon.body.data.identifier.value, 'B09XS7JWHH');
    assert.equal(resAmazon.body.data.product.brand, 'Sony');
    assert.equal(resAmazon.body.data.product.price, 328.0);
    assert.ok(resAmazon.body.data.analysis.dealScore > 0);
    console.log(' Passed: Successfully analyzed Amazon product with deal analysis');

    // 5b. Analyze Flipkart URL
    console.log('5b: POST /api/products/analyze for Flipkart iPhone 15');
    const resFlipkart = await request(
      server,
      { path: '/api/products/analyze', method: 'POST' },
      { url: 'https://www.flipkart.com/apple-iphone-15/p/itm123?pid=MOBFWQ6BRGFGG2FD' }
    );
    assert.equal(resFlipkart.status, 200);
    assert.equal(resFlipkart.body.success, true);
    assert.equal(resFlipkart.body.data.retailer.slug, 'flipkart');
    assert.equal(resFlipkart.body.data.identifier.value, 'MOBFWQ6BRGFGG2FD');
    assert.equal(resFlipkart.body.data.product.brand, 'Apple');
    console.log(' Passed: Successfully analyzed Flipkart product');

    // 5c. Analyze Croma URL
    console.log('5c: POST /api/products/analyze for Croma Dell Laptop');
    const resCroma = await request(
      server,
      { path: '/api/products/analyze', method: 'POST' },
      { url: 'https://www.croma.com/p/264332' }
    );
    assert.equal(resCroma.status, 200);
    assert.equal(resCroma.body.success, true);
    assert.equal(resCroma.body.data.retailer.slug, 'croma');
    assert.equal(resCroma.body.data.identifier.value, '264332');
    assert.equal(resCroma.body.data.product.brand, 'Dell');
    console.log(' Passed: Successfully analyzed Croma product');

    console.log('\n======================================================');
    console.log('🎉 ALL PRODUCT URL ANALYZER TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
};

runUrlAnalyzerTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ URL Analyzer test execution failed:', err);
  process.exit(1);
});
