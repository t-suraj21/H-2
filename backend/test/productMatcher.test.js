import assert from 'node:assert/strict';
import { productMatcher, MATCH_STATUS } from '../src/services/matcher/ProductMatcher.js';

const runProductMatcherTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting HL² Exact-Product Matching Engine Test Suite');
  console.log('======================================================\n');

  // -------------------------------------------------------------
  // Test 1: Exact Match across different retailers with title variations
  // -------------------------------------------------------------
  console.log('Test 1: Exact Match (Sony WH-1000XM5 Amazon vs Flipkart)');
  const sonyAmazon = {
    title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones - Black - Amazon.com',
    brand: 'Sony',
    model: 'WH-1000XM5',
    specifications: { color: 'Black' },
    identifier: 'B09XS7JWHH',
  };
  const sonyFlipkart = {
    title: 'Sony WH-1000XM5 ANC Bluetooth Headset with 30hr Battery (Black) | Flipkart.com',
    brand: 'Sony',
    model: 'WH-1000XM5',
    specifications: { color: 'Black' },
    identifier: 'MOB123456',
  };

  const res1 = productMatcher.match(sonyAmazon, sonyFlipkart);
  assert.equal(res1.match, true, 'Products must match');
  assert.equal(res1.status, MATCH_STATUS.EXACT_MATCH);
  assert.ok(res1.confidence >= 0.95, `Expected confidence >= 0.95, got ${res1.confidence}`);
  console.log(` Passed: Status '${res1.status}' with confidence ${res1.confidence}\n`);

  // -------------------------------------------------------------
  // Test 2: Storage Variant Mismatch (iPhone 17 256GB vs iPhone 17 512GB)
  // -------------------------------------------------------------
  console.log('Test 2: Storage Variant Mismatch (iPhone 17 256GB vs 512GB)');
  const iphone256 = {
    title: 'Apple iPhone 17 (Black, 256 GB)',
    brand: 'Apple',
    model: 'iPhone 17',
    specifications: { storage: '256GB', color: 'Black' },
  };
  const iphone512 = {
    title: 'Apple iPhone 17 (Black, 512 GB)',
    brand: 'Apple',
    model: 'iPhone 17',
    specifications: { storage: '512GB', color: 'Black' },
  };

  const res2 = productMatcher.match(iphone256, iphone512);
  assert.equal(res2.match, false, 'Different storage tiers MUST NOT match');
  assert.equal(res2.status, MATCH_STATUS.NO_MATCH);
  assert.ok(res2.reason.includes('Storage capacity differs'));
  console.log(` Passed: Blocked false match due to storage mismatch (${res2.reason})\n`);

  // -------------------------------------------------------------
  // Test 3: Model Generation Mismatch (Sony WH-1000XM5 vs WH-1000XM4)
  // -------------------------------------------------------------
  console.log('Test 3: Model Generation Mismatch (Sony XM5 vs XM4)');
  const sonyXM5 = {
    title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    brand: 'Sony',
    model: 'WH-1000XM5',
  };
  const sonyXM4 = {
    title: 'Sony WH-1000XM4 Wireless Noise Canceling Headphones',
    brand: 'Sony',
    model: 'WH-1000XM4',
  };

  const res3 = productMatcher.match(sonyXM5, sonyXM4);
  assert.equal(res3.match, false, 'Different hardware generations MUST NOT match');
  assert.equal(res3.status, MATCH_STATUS.NO_MATCH);
  assert.ok(res3.reason.includes('Model generation/number mismatch'));
  console.log(` Passed: Blocked false match despite identical product name structure (${res3.reason})\n`);

  // -------------------------------------------------------------
  // Test 4: Same Model with Different Colors (Black vs Silver)
  // -------------------------------------------------------------
  console.log('Test 4: Color Variant (Sony WH-1000XM5 Black vs Silver)');
  const sonyBlack = {
    title: 'Sony WH-1000XM5 (Black)',
    brand: 'Sony',
    model: 'WH-1000XM5',
    specifications: { color: 'Black' },
  };
  const sonySilver = {
    title: 'Sony WH-1000XM5 (Silver)',
    brand: 'Sony',
    model: 'WH-1000XM5',
    specifications: { color: 'Silver' },
  };

  const res4 = productMatcher.match(sonyBlack, sonySilver);
  assert.equal(res4.match, true, 'Same core hardware model should match as color variant');
  assert.equal(res4.status, MATCH_STATUS.HIGH_CONFIDENCE);
  assert.ok(res4.confidence >= 0.88, `Expected confidence >= 0.88, got ${res4.confidence}`);
  assert.ok(res4.reason.includes('color variant differs'));
  console.log(` Passed: Flagged HIGH_CONFIDENCE color variation: '${res4.reason}'\n`);

  // -------------------------------------------------------------
  // Test 5: Screen / Size Dimension Mismatch (55" vs 65" TV)
  // -------------------------------------------------------------
  console.log('Test 5: Screen Size Dimension Mismatch (55-inch vs 65-inch)');
  const tv55 = {
    title: 'Sony Bravia 55 inch 4K Ultra HD Smart Google TV',
    brand: 'Sony',
    model: 'KD-55X74L',
    specifications: { size: '55-inch' },
  };
  const tv65 = {
    title: 'Sony Bravia 65 inch 4K Ultra HD Smart Google TV',
    brand: 'Sony',
    model: 'KD-65X74L',
    specifications: { size: '65-inch' },
  };

  const res5 = productMatcher.match(tv55, tv65);
  assert.equal(res5.match, false, 'Different screen sizes MUST NOT match');
  assert.equal(res5.status, MATCH_STATUS.NO_MATCH);
  console.log(` Passed: Successfully separated 55" and 65" TV listings (${res5.reason})\n`);

  // -------------------------------------------------------------
  // Test 6: RAM Memory Mismatch (Dell Laptop 8GB vs 16GB)
  // -------------------------------------------------------------
  console.log('Test 6: RAM Memory Mismatch (8GB RAM vs 16GB RAM)');
  const laptop8GB = {
    title: 'Dell Inspiron 3520 (8GB RAM, 512GB SSD, 15.6-inch)',
    brand: 'Dell',
    model: 'Inspiron 3520',
    specifications: { ram: '8GB RAM', storage: '512GB SSD', size: '15.6-inch' },
  };
  const laptop16GB = {
    title: 'Dell Inspiron 3520 (16GB RAM, 512GB SSD, 15.6-inch)',
    brand: 'Dell',
    model: 'Inspiron 3520',
    specifications: { ram: '16GB RAM', storage: '512GB SSD', size: '15.6-inch' },
  };

  const res6 = productMatcher.match(laptop8GB, laptop16GB);
  assert.equal(res6.match, false, 'Different RAM capacities MUST NOT match');
  assert.equal(res6.status, MATCH_STATUS.NO_MATCH);
  assert.ok(res6.reason.includes('RAM capacity differs'));
  console.log(` Passed: RAM mismatch rejected correctly (${res6.reason})\n`);

  // -------------------------------------------------------------
  // Test 7: Global Barcode (GTIN / UPC / EAN) Exact Match
  // -------------------------------------------------------------
  console.log('Test 7: Global Barcode (GTIN) Fast-Track Match');
  const prodBarcodeA = {
    title: 'Sony Headphones Generic Description',
    brand: 'Sony',
    gtin: '027242923508',
  };
  const prodBarcodeB = {
    title: 'Sony Headset International Listing',
    brand: 'Sony',
    gtin: '027242923508',
  };

  const res7 = productMatcher.match(prodBarcodeA, prodBarcodeB);
  assert.equal(res7.match, true);
  assert.equal(res7.status, MATCH_STATUS.EXACT_MATCH);
  assert.equal(res7.confidence, 1.0);
  console.log(` Passed: 100% Exact match from global GTIN barcode\n`);

  // -------------------------------------------------------------
  // Test 8: Insufficient Data on Vague Product Titles
  // -------------------------------------------------------------
  console.log('Test 8: Insufficient Data on Vague Unbranded Titles');
  const vagueA = { title: 'Wireless Bluetooth Earbuds with Charging Case' };
  const vagueB = { title: 'TWS In-Ear Wireless Stereo Earphones' };

  const res8 = productMatcher.match(vagueA, vagueB);
  assert.equal(res8.match, false);
  assert.equal(res8.status, MATCH_STATUS.INSUFFICIENT_DATA);
  console.log(` Passed: Vague listings flagged as INSUFFICIENT_DATA without hallucinating matches\n`);

  console.log('======================================================');
  console.log('🎉 ALL PRODUCT MATCHING ENGINE TESTS PASSED PERFECTLY!');
  console.log('======================================================\n');
};

runProductMatcherTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Product Matcher test execution failed:', err);
  process.exit(1);
});
