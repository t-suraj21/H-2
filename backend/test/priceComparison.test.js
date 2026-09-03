import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { priceComparisonEngine, PRICE_STATUS } from '../src/services/comparison/PriceComparisonEngine.js';

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

const runPriceComparisonTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting HL² Price Comparison Engine Test Suite');
  console.log('======================================================\n');

  const sampleProduct = {
    title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    brand: 'Sony',
    model: 'WH-1000XM5',
    category: 'Headphones & Audio',
  };

  // -------------------------------------------------------------
  // Test 1: Standard Multi-Store Price Comparison & Metrics
  // -------------------------------------------------------------
  console.log('Test 1: Multi-Store Comparison (Lowest, Highest, Average, Savings)');
  const multiOffers = [
    { retailer: 'Amazon', price: 328.0, mrp: 399.99, deliveryFee: 0, url: 'https://amazon.com/dp/1' },
    { retailer: 'Best Buy', price: 349.99, mrp: 399.99, deliveryFee: 0, url: 'https://bestbuy.com/1' },
    { retailer: 'Walmart', price: 399.99, mrp: 399.99, deliveryFee: 0, url: 'https://walmart.com/1' },
    { retailer: 'B&H Photo', price: 338.0, mrp: 399.99, deliveryFee: 0, url: 'https://bhphoto.com/1' },
  ];

  const res1 = priceComparisonEngine.compare(sampleProduct, multiOffers);

  assert.equal(res1.lowest.retailer, 'Amazon');
  assert.equal(res1.lowest.effectivePrice, 328.0);
  assert.equal(res1.highest.retailer, 'Walmart');
  assert.equal(res1.highest.effectivePrice, 399.99);

  // Expected Average = (328 + 349.99 + 399.99 + 338) / 4 = 353.995 -> 354.00
  assert.equal(res1.averagePrice, 354.0);

  // Expected Savings = 399.99 - 328.0 = 71.99
  assert.equal(res1.savings, 71.99);

  // Expected Savings % = (71.99 / 399.99) * 100 = 18.0%
  assert.equal(res1.savingsPercentage, 18.0);

  assert.equal(res1.offers[0].retailer, 'Amazon', 'Offers must be sorted ascending by price');
  assert.equal(res1.offers[res1.offers.length - 1].retailer, 'Walmart');
  console.log(' Passed: Lowest ($328.00), Highest ($399.99), Avg ($354.00), Savings ($71.99, 18.0%)\n');

  // -------------------------------------------------------------
  // Test 2: Effective Price Calculation with Delivery Fees & Discounts
  // -------------------------------------------------------------
  console.log('Test 2: Reliable Effective Price Calculation');
  const offerWithDelivery = {
    retailer: 'Store A',
    price: 299.0,
    deliveryFee: 15.0, // Effective = 314.00
  };
  const offerFreeDelivery = {
    retailer: 'Store B',
    price: 305.0,
    deliveryFee: 0.0, // Effective = 305.00
  };

  const res2 = priceComparisonEngine.compare(sampleProduct, [offerWithDelivery, offerFreeDelivery]);

  // Store B ($305.00) is cheaper effective price than Store A ($299 + $15 = $314.00)
  assert.equal(res2.lowest.retailer, 'Store B');
  assert.equal(res2.lowest.effectivePrice, 305.0);
  assert.equal(res2.highest.retailer, 'Store A');
  assert.equal(res2.highest.effectivePrice, 314.0);
  console.log(' Passed: Factored verified delivery fee into effective price order (Store B $305.00 < Store A $314.00)\n');

  // -------------------------------------------------------------
  // Test 3: Out-of-Stock / Unavailable Retailer Isolation
  // -------------------------------------------------------------
  console.log('Test 3: Unavailable Retailer Isolation');
  const offersWithOOS = [
    { retailer: 'Active Store 1', price: 350.0, availability: true },
    { retailer: 'Active Store 2', price: 380.0, availability: true },
    { retailer: 'Out Of Stock Store', price: 199.0, availability: false }, // OOS fake cheap price
  ];

  const res3 = priceComparisonEngine.compare(sampleProduct, offersWithOOS);

  // Lowest MUST NOT be the out-of-stock store with $199
  assert.equal(res3.lowest.retailer, 'Active Store 1');
  assert.equal(res3.lowest.effectivePrice, 350.0);
  assert.equal(res3.unavailableRetailers.length, 1);
  assert.equal(res3.unavailableRetailers[0].retailer, 'Out Of Stock Store');
  assert.equal(res3.availableRetailers.length, 2);
  console.log(' Passed: Out-of-stock price ($199.00) safely isolated from active purchasing lowest price\n');

  // -------------------------------------------------------------
  // Test 4: Pricing Status Classifications (VERIFIED, STALE, ESTIMATED, UNAVAILABLE)
  // -------------------------------------------------------------
  console.log('Test 4: Pricing Status Classifications');

  // 4a. Fresh Verified Price (checked 1 hour ago)
  const freshOffer = {
    price: 320,
    lastChecked: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  };
  assert.equal(priceComparisonEngine.determinePriceStatus(freshOffer), PRICE_STATUS.VERIFIED);

  // 4b. Stale Price (checked 48 hours ago)
  const staleOffer = {
    price: 320,
    lastChecked: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  };
  assert.equal(priceComparisonEngine.determinePriceStatus(staleOffer, 24), PRICE_STATUS.STALE);

  // 4c. Estimated Price
  const estimatedOffer = {
    price: 320,
    isEstimated: true,
  };
  assert.equal(priceComparisonEngine.determinePriceStatus(estimatedOffer), PRICE_STATUS.ESTIMATED);

  // 4d. Unavailable
  const unavailableOffer = {
    price: 320,
    availability: false,
  };
  assert.equal(priceComparisonEngine.determinePriceStatus(unavailableOffer), PRICE_STATUS.UNAVAILABLE);
  console.log(' Passed: All 4 price status states classified accurately\n');

  // -------------------------------------------------------------
  // Test 5: Integration End-to-End API (POST /api/products/compare)
  // -------------------------------------------------------------
  console.log('Test 5: Integration Test POST /api/products/compare');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    const apiRes = await request(
      server,
      { path: '/api/products/compare', method: 'POST' },
      {
        product: sampleProduct,
        offers: multiOffers,
      }
    );

    assert.equal(apiRes.status, 200);
    assert.equal(apiRes.body.success, true);
    assert.equal(apiRes.body.data.lowest.retailer, 'Amazon');
    assert.equal(apiRes.body.data.highest.retailer, 'Walmart');
    assert.equal(apiRes.body.data.savings, 71.99);
    assert.equal(apiRes.body.data.offers.length, 4);
    console.log(' Passed: POST /api/products/compare successfully returned comparison matrix\n');

    console.log('======================================================');
    console.log('🎉 ALL PRICE COMPARISON ENGINE TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
};

runPriceComparisonTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Price Comparison test execution failed:', err);
  process.exit(1);
});
