import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { affiliateUrlService, AffiliateUrlService } from '../src/services/affiliate/index.js';
import { priceComparisonEngine } from '../src/services/comparison/PriceComparisonEngine.js';

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

const runBuyNowTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting HL² Buy Now Architecture Test Suite');
  console.log('======================================================\n');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Amazon Affiliate URL Generation
    // -------------------------------------------------------------
    console.log('Test 1: Amazon Affiliate URL Generation (Tag & ascsubtag)');
    const amazonUrl = 'https://www.amazon.in/dp/B09XS7JWHH?th=1';
    const amazonRes = affiliateUrlService.generateDestinationUrl(amazonUrl, 'Amazon', {
      userId: 'user_12345',
      productId: 'prod_999',
    });

    assert.equal(amazonRes.isAffiliate, true);
    assert.equal(amazonRes.retailer, 'Amazon');
    assert.ok(amazonRes.destinationUrl.includes('tag=hl2app-21'), 'Must include Amazon affiliate tag');
    assert.ok(amazonRes.destinationUrl.includes('ascsubtag='), 'Must include Amazon subtracking tag');
    assert.ok(amazonRes.destinationUrl.includes('linkCode=ll1'), 'Must include linkCode');
    assert.ok(amazonRes.destinationUrl.includes('/dp/B09XS7JWHH'), 'Must preserve original product path');
    console.log(` Passed: Generated Amazon destination URL:\n   ${amazonRes.destinationUrl}\n`);

    // -------------------------------------------------------------
    // Test 2: Flipkart Affiliate URL Generation
    // -------------------------------------------------------------
    console.log('Test 2: Flipkart Affiliate URL Generation (affid & affExtParam1)');
    const flipkartUrl = 'https://www.flipkart.com/sony-wh-1000xm5-bluetooth-headset/p/itm12345';
    const flipkartRes = affiliateUrlService.generateDestinationUrl(flipkartUrl, 'Flipkart', {
      userId: 'user_12345',
    });

    assert.equal(flipkartRes.isAffiliate, true);
    assert.equal(flipkartRes.retailer, 'Flipkart');
    assert.ok(flipkartRes.destinationUrl.includes('affid=hl2app'), 'Must include Flipkart affid');
    assert.ok(flipkartRes.destinationUrl.includes('affExtParam1='), 'Must include Flipkart tracking subId');
    console.log(` Passed: Generated Flipkart destination URL:\n   ${flipkartRes.destinationUrl}\n`);

    // -------------------------------------------------------------
    // Test 3: Croma / Generic Partner UTM Tracking
    // -------------------------------------------------------------
    console.log('Test 3: Croma Partner UTM Tracking');
    const cromaUrl = 'https://www.croma.com/sony-wh-1000xm5-headphones/p/250000';
    const cromaRes = affiliateUrlService.generateDestinationUrl(cromaUrl, 'Croma');

    assert.equal(cromaRes.isAffiliate, true);
    assert.equal(cromaRes.retailer, 'Croma');
    assert.ok(cromaRes.destinationUrl.includes('utm_source=hl2_partner'));
    assert.ok(cromaRes.destinationUrl.includes('utm_medium=app_referral'));
    console.log(` Passed: Generated Croma partner destination URL:\n   ${cromaRes.destinationUrl}\n`);

    // -------------------------------------------------------------
    // Test 4: Disabled Affiliate Mode Fallback
    // -------------------------------------------------------------
    console.log('Test 4: Disabled Affiliate Mode Fallback (Clean URL with safe UTM tags)');
    const disabledService = new AffiliateUrlService({
      enabled: false,
      defaultCampaignSource: 'hl2_test',
      retailers: {},
      defaultTracking: { utm_source: 'hl2', utm_medium: 'price_comparison' },
    });

    const fallbackRes = disabledService.generateDestinationUrl(amazonUrl, 'Amazon');
    assert.equal(fallbackRes.isAffiliate, false);
    assert.ok(!fallbackRes.destinationUrl.includes('tag='), 'Must not include affiliate tag when disabled');
    assert.ok(fallbackRes.destinationUrl.includes('utm_source=hl2'), 'Must include safe default UTM source');
    console.log(` Passed: Safe canonical fallback destination URL:\n   ${fallbackRes.destinationUrl}\n`);

    // -------------------------------------------------------------
    // Test 5: PriceComparisonEngine Automatic Destination Enrichment
    // -------------------------------------------------------------
    console.log('Test 5: PriceComparisonEngine Automatic Destination Enrichment');
    const compResult = priceComparisonEngine.compare(
      { title: 'Sony WH-1000XM5', brand: 'Sony', model: 'WH-1000XM5' },
      [
        { retailer: 'Amazon', price: 24999, url: 'https://www.amazon.in/dp/B09XS7JWHH', available: true },
        { retailer: 'Flipkart', price: 25499, url: 'https://www.flipkart.com/sony-xm5/p/itm123', available: true },
        { retailer: 'Croma', price: 26999, url: 'https://www.croma.com/sony-xm5/p/250', available: true },
      ]
    );

    assert.ok(compResult.lowest.destinationUrl.includes('tag=hl2app-21'));
    assert.equal(compResult.lowest.isAffiliate, true);
    assert.equal(compResult.offers.length, 3);
    for (const offer of compResult.offers) {
      assert.ok(offer.destinationUrl, 'Every compared offer must have destinationUrl');
      assert.ok(offer.url, 'Every compared offer must have raw canonical url');
    }
    console.log(' Passed: PriceComparisonEngine enriched all offers with destination URLs\n');

    // -------------------------------------------------------------
    // Test 6: API Integration POST /api/products/buy-now
    // -------------------------------------------------------------
    console.log('Test 6: API Integration POST /api/products/buy-now');
    const apiRes = await request(
      server,
      { path: '/api/products/buy-now', method: 'POST' },
      {
        url: 'https://www.amazon.in/dp/B09XS7JWHH',
        retailer: 'Amazon',
        productId: 'prod_123',
      }
    );

    assert.equal(apiRes.status, 200);
    assert.equal(apiRes.body.success, true);
    assert.ok(apiRes.body.data.destinationUrl.includes('tag=hl2app-21'));
    assert.equal(apiRes.body.data.isAffiliate, true);
    console.log(' Passed: POST /api/products/buy-now returned authorized destination URL\n');

    // -------------------------------------------------------------
    // Test 7: Validation Error when URL is Missing
    // -------------------------------------------------------------
    console.log('Test 7: Validation Error when URL is Missing');
    const badRes = await request(
      server,
      { path: '/api/products/buy-now', method: 'POST' },
      { retailer: 'Amazon' }
    );
    assert.equal(badRes.status, 400);
    console.log(' Passed: Rejected missing URL with HTTP 400\n');

    console.log('======================================================');
    console.log('🎉 ALL BUY NOW ARCHITECTURE TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
};

runBuyNowTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Buy Now test execution failed:', err);
  process.exit(1);
});
