import assert from 'node:assert/strict';
import { productNormalizer } from '../src/services/normalizer/ProductNormalizer.js';
import { variantNormalizer } from '../src/services/normalizer/VariantNormalizer.js';
import { productIdentifierService } from '../src/services/normalizer/ProductIdentifierService.js';

const runProductNormalizerTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting HL² Product Normalization Engine Test Suite');
  console.log('======================================================\n');

  // -------------------------------------------------------------
  // Test 1: Title Cleaning & Marketing Noise Removal
  // -------------------------------------------------------------
  console.log('Test 1: Title Cleaning & Noise Removal');
  const messyTitle1 =
    '⚡ Newest Model 2026 Sony WH-1000XM5 Wireless Headphones - Best Seller! (Includes Free Protective Case) - Amazon.com';
  const cleanedTitle1 = productNormalizer.cleanTitle(messyTitle1);
  assert.equal(
    cleanedTitle1,
    'Sony WH-1000XM5 Wireless Headphones',
    `Expected cleaned title without promotional noise, got '${cleanedTitle1}'`
  );

  const messyTitle2 =
    'Apple iPhone 15 (Blue, 128 GB) - Hot Deal & Free Shipping | Flipkart.com';
  const cleanedTitle2 = productNormalizer.cleanTitle(messyTitle2);
  assert.equal(
    cleanedTitle2,
    'Apple iPhone 15 (Blue, 128 GB)',
    `Expected cleaned title without store suffix, got '${cleanedTitle2}'`
  );
  console.log(' Passed: Successfully removed marketing buzzwords, emojis, and retailer store suffixes\n');

  // -------------------------------------------------------------
  // Test 2: Variant Normalizer (Color, Storage, RAM, Size)
  // -------------------------------------------------------------
  console.log('Test 2: VariantNormalizer Extraction & Standardization');

  // 2a. Color normalization
  assert.equal(variantNormalizer.extractColor('Apple iPhone 15 Pro (Space Grey, 256GB)'), 'Space Gray');
  assert.equal(variantNormalizer.extractColor('MacBook Air M3 in Midnight Blue finish'), 'Midnight Blue');
  assert.equal(variantNormalizer.extractColor('Samsung Galaxy S24 Ultra (Natural Titanium)'), 'Natural Titanium');
  assert.equal(variantNormalizer.extractColor('Sony WH-1000XM5 (Silver)'), 'Silver');

  // 2b. Storage normalization
  assert.equal(variantNormalizer.extractStorage('Apple iPhone 15 (128 GB Storage)'), '128GB');
  assert.equal(variantNormalizer.extractStorage('Dell Laptop with 512GB SSD and 1TB HDD'), '512GB SSD');
  assert.equal(variantNormalizer.extractStorage('Samsung Galaxy S24 256GB'), '256GB');

  // 2c. RAM normalization
  assert.equal(variantNormalizer.extractRAM('Apple MacBook Air 16GB Unified Memory'), '16GB RAM');
  assert.equal(variantNormalizer.extractRAM('Dell Inspiron 3520 (16 GB RAM, 512GB SSD)'), '16GB RAM');

  // 2d. Screen / Case Size normalization
  assert.equal(variantNormalizer.extractSize('Apple Watch Series 9 44mm GPS'), '44mm');
  assert.equal(variantNormalizer.extractSize('MacBook Air 13.6-inch Liquid Retina Display'), '13.6-inch');
  assert.equal(variantNormalizer.extractSize('Sony Bravia 138.8 cm (55 inch) 4K Ultra HD Smart TV'), '55-inch');
  assert.equal(variantNormalizer.extractSize('Dell Inspiron 15.6" Full HD Laptop'), '15.6-inch');
  console.log(' Passed: VariantNormalizer standardized colors, storage, RAM, and dimensions\n');

  // -------------------------------------------------------------
  // Test 3: ProductIdentifierService & Identity Certainty Scoring
  // -------------------------------------------------------------
  console.log('Test 3: ProductIdentifierService & Identity Certainty Scoring');

  // 3a. Valid GTIN / ASIN validation
  assert.equal(productIdentifierService.isValidASIN('B09XS7JWHH'), true);
  assert.equal(productIdentifierService.isValidASIN('INVALID_ASIN_123'), false);

  // 3b. High Certainty Match (Brand + Model + Variant)
  const exactMatch = productIdentifierService.evaluateIdentityCertainty({
    brand: 'Sony',
    model: 'WH-1000XM5',
    variant: { color: 'Black' },
    identifiers: { asin: 'B09XS7JWHH' },
  });
  assert.equal(exactMatch.isCertain, true);
  assert.ok(exactMatch.confidence >= 0.95);
  assert.equal(exactMatch.matchLevel, 'EXACT');
  console.log(' Passed: Exact brand + model identified with high confidence (>= 0.95)');

  // 3c. Uncertain Match (Generic / Vague Title without Model Code)
  const uncertainMatch = productIdentifierService.evaluateIdentityCertainty({
    brand: 'Generic',
    model: 'Standard Model',
    variant: {},
    identifiers: {},
  });
  assert.equal(uncertainMatch.isCertain, false);
  assert.ok(uncertainMatch.confidence <= 0.5);
  assert.equal(uncertainMatch.matchLevel, 'UNCERTAIN');
  console.log(' Passed: Vague/unverified listings flagged as UNCERTAIN without guessing\n');

  // -------------------------------------------------------------
  // Test 4: Multi-Retailer Realistic Product Normalization
  // -------------------------------------------------------------
  console.log('Test 4: Full Multi-Retailer Realistic Product Normalization');

  // Case A: Amazon Sony Headphones
  const amazonSonyRaw = {
    title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones - Black - Amazon.com',
    brand: 'Sony',
    price: 328.0,
    mrp: 399.99,
    currency: 'USD',
    identifier: 'B09XS7JWHH',
    identifierType: 'ASIN',
    retailer: 'Amazon',
    url: 'https://www.amazon.com/dp/B09XS7JWHH',
  };

  const normalizedSony = productNormalizer.normalize(amazonSonyRaw);
  assert.equal(normalizedSony.brand, 'Sony');
  assert.equal(normalizedSony.model, 'WH-1000XM5');
  assert.equal(normalizedSony.canonicalProductName, 'Sony WH-1000XM5');
  assert.equal(normalizedSony.category, 'Headphones & Audio');
  assert.equal(normalizedSony.variant.color, 'Black');
  assert.equal(normalizedSony.identifiers.asin, 'B09XS7JWHH');
  assert.equal(normalizedSony.identityMatch.isCertain, true);
  assert.equal(normalizedSony.rawRetailerData.retailer, 'Amazon');
  assert.equal(normalizedSony.rawRetailerData.originalTitle, amazonSonyRaw.title);
  console.log(' Passed: Sony WH-1000XM5 normalized cleanly from Amazon listing');

  // Case B: Flipkart Apple iPhone 15
  const flipkartIPhoneRaw = {
    title: 'Apple iPhone 15 (Blue, 128 GB) (Includes Free Fast Charger) | Flipkart.com',
    brand: 'Apple',
    price: 65999,
    mrp: 79900,
    currency: 'INR',
    identifier: 'MOBFWQ6BRGFGG2FD',
    retailerSlug: 'flipkart',
    retailer: 'Flipkart',
  };

  const normalizedIPhone = productNormalizer.normalize(flipkartIPhoneRaw);
  assert.equal(normalizedIPhone.brand, 'Apple');
  assert.equal(normalizedIPhone.model, 'iPhone 15');
  assert.equal(normalizedIPhone.variant.color, 'Blue');
  assert.equal(normalizedIPhone.variant.storage, '128GB');
  assert.equal(normalizedIPhone.category, 'Smartphones & Mobiles');
  assert.equal(normalizedIPhone.identityMatch.isCertain, true);
  console.log(' Passed: Apple iPhone 15 normalized cleanly from Flipkart listing');

  // Case C: Croma Dell Laptop
  const cromaLaptopRaw = {
    title: 'Dell Inspiron 3520 Intel Core i5 12th Gen (16GB RAM, 512GB SSD, 15.6 inch) - Buy Online at Croma',
    brand: 'Dell',
    price: 48990,
    mrp: 68990,
    currency: 'INR',
    identifier: '264332',
    retailer: 'Croma',
  };

  const normalizedLaptop = productNormalizer.normalize(cromaLaptopRaw);
  assert.equal(normalizedLaptop.brand, 'Dell');
  assert.equal(normalizedLaptop.model, 'Inspiron 3520');
  assert.equal(normalizedLaptop.variant.ram, '16GB RAM');
  assert.equal(normalizedLaptop.variant.storage, '512GB SSD');
  assert.equal(normalizedLaptop.variant.size, '15.6-inch');
  assert.equal(normalizedLaptop.category, 'Computers & Laptops');
  assert.equal(normalizedLaptop.identityMatch.isCertain, true);
  console.log(' Passed: Dell Inspiron 3520 Laptop normalized cleanly from Croma listing');

  // Case D: MacBook Air M3
  const macbookRaw = {
    title: 'Apple 2024 MacBook Air 13-inch Laptop with M3 chip: 13.6-inch Liquid Retina Display, 16GB Unified Memory, 512GB SSD Storage, Midnight - Amazon',
    brand: 'Apple',
    price: 1249.0,
    mrp: 1499.0,
    identifier: 'B0CX23V251',
    identifierType: 'ASIN',
  };

  const normalizedMacBook = productNormalizer.normalize(macbookRaw);
  assert.equal(normalizedMacBook.brand, 'Apple');
  assert.equal(normalizedMacBook.model, 'MacBook Air M3');
  assert.equal(normalizedMacBook.variant.color, 'Midnight');
  assert.equal(normalizedMacBook.variant.ram, '16GB RAM');
  assert.equal(normalizedMacBook.variant.storage, '512GB SSD');
  assert.equal(normalizedMacBook.variant.size, '13.6-inch');
  console.log(' Passed: Apple MacBook Air M3 normalized with all specs & dimensions');

  // Case E: Sony Bravia TV
  const tvRaw = {
    title: 'Sony Bravia 138.8 cm (55 inch) 4K Ultra HD Smart Google TV KD-55X74L (Black) ⚡ Hot Deal',
    brand: 'Sony',
    price: 54990,
    mrp: 99900,
    identifier: 'itm3316238b9e69d',
  };

  const normalizedTV = productNormalizer.normalize(tvRaw);
  assert.equal(normalizedTV.brand, 'Sony');
  assert.equal(normalizedTV.model, 'KD-55X74L');
  assert.equal(normalizedTV.variant.size, '55-inch');
  assert.equal(normalizedTV.variant.color, 'Black');
  assert.equal(normalizedTV.category, 'Televisions & Home Entertainment');
  console.log(' Passed: Sony Bravia TV normalized with 55-inch size and KD-55X74L model');

  console.log('\n======================================================');
  console.log('🎉 ALL PRODUCT NORMALIZATION TESTS PASSED PERFECTLY!');
  console.log('======================================================\n');
};

runProductNormalizerTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Product Normalizer test execution failed:', err);
  process.exit(1);
});
