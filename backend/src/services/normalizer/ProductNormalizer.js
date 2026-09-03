import { variantNormalizer } from './VariantNormalizer.js';
import { productIdentifierService } from './ProductIdentifierService.js';

// Common brands dictionary
const KNOWN_BRANDS = [
  'Apple',
  'Sony',
  'Samsung',
  'Dell',
  'Lenovo',
  'HP',
  'Asus',
  'LG',
  'Bose',
  'JBL',
  'Google',
  'OnePlus',
  'Xiaomi',
  'Canon',
  'Nikon',
  'Microsoft',
  'Dyson',
  'Sennheiser',
  'Garmin',
  'Anker',
  'Logitech',
  'Boat',
  'Noise',
  'Motorola',
  'Realme',
  'Vivo',
  'Oppo',
  'Whirlpool',
  'Philips',
  'TCL',
  'Hisense',
];

// Marketing buzzwords and spam patterns to clean from titles
const MARKETING_NOISE_PATTERNS = [
  /\b(?:Newest\s+Model|Latest\s+Model|Upgraded\s+Model|New\s+Model)\b/gi,
  /\b(?:Newest|Latest|Upgraded|202[0-9]|203[0-9])\b/gi,
  /\b(?:Best\s+Seller!|Best\s+Seller|Amazon's\s+Choice|Top\s+Rated|Hot\s+Deal|Flash\s+Deal|Super\s+Saver)\b/gi,
  /\b(?:Limited\s+Stock|Hurry|Special\s+Offer|Big\s+Billion|Great\s+Indian\s+Festival)\b/gi,
  /\b(?:Buy\s+Online\s+at|Lowest\s+Price|Free\s+Delivery|Fast\s+Shipping|Free\s+Shipping)\b/gi,
  /\b(?:100%\s+Genuine|Original|Official\s+Warranty|Certified)\b/gi,
];

export class ProductNormalizer {
  constructor() {
    this.brands = KNOWN_BRANDS;
  }

  /**
   * Clean product title by removing promotional noise, retailer branding, and redundant symbols
   * @param {string} rawTitle
   * @returns {string} Cleaned, standardized title
   */
  cleanTitle(rawTitle) {
    if (!rawTitle || typeof rawTitle !== 'string') return '';

    let cleaned = rawTitle.trim();

    // 1. Remove emojis and special promotional symbols
    cleaned = cleaned.replace(/[⚡🔥✨⭐🎉🎁💥]/gu, ' ');

    // 2. Remove retailer store suffixes at end of title
    cleaned = cleaned.replace(
      /\s*[-|–/\\:]\s*(?:Amazon(?:\.com|\.in)?|Flipkart(?:\.com)?|Croma(?:\.com)?|Best Buy|Walmart(?:\.com)?)\s*$/gi,
      ''
    );

    // 3. Remove parenthetical promotional clauses e.g. (Includes Free Protective Case)
    cleaned = cleaned.replace(
      /\((?:includes?\s+free|with\s+free|free\s+|bonus|gift|bundle|hot\s+deal|best\s+seller)[^)]*\)/gi,
      ''
    );
    cleaned = cleaned.replace(
      /\[(?:includes?\s+free|with\s+free|free\s+|bonus|gift|bundle|hot\s+deal|best\s+seller)[^\]]*\]/gi,
      ''
    );

    // 4. Remove marketing buzzwords
    for (const pattern of MARKETING_NOISE_PATTERNS) {
      cleaned = cleaned.replace(pattern, ' ');
    }

    // 5. Clean exclamation marks and isolated symbols
    cleaned = cleaned.replace(/!+/g, ' ');

    // 6. Clean dangling conjunctions and separators before/after trailing chunks
    cleaned = cleaned.replace(/\s*[-|–/\\:]\s*(?:and|&|\+)?\s*[-|–/\\:]+/gi, ' - ');
    cleaned = cleaned.replace(/\s+(&|and|\+)\s+(?:[-|–/\\:]|$)/gi, ' ');
    cleaned = cleaned.replace(/\(\s*\)/g, ' ');
    cleaned = cleaned.replace(/\[\s*\]/g, ' ');

    // 7. Normalize multiple whitespace
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

    // 8. Remove leading or trailing punctuation, connectors, or dangling symbols (preserving balanced parens)
    cleaned = cleaned.replace(/^[-–,:;./\s!|&+]+|[-–,:;./\s!|&+]+$/g, '').trim();

    return cleaned;
  }

  /**
   * Detect Brand from title or text
   * @param {string} text
   * @param {string} [hintBrand]
   * @returns {string} Standardized Brand Name
   */
  detectBrand(text, hintBrand) {
    if (hintBrand && typeof hintBrand === 'string') {
      const match = this.brands.find((b) => b.toLowerCase() === hintBrand.trim().toLowerCase());
      if (match) return match;
    }

    if (!text || typeof text !== 'string') return 'Generic';

    for (const brand of this.brands) {
      const regex = new RegExp(`\\b${brand}\\b`, 'i');
      if (regex.test(text)) {
        return brand;
      }
    }

    return hintBrand ? hintBrand.trim() : 'Generic';
  }

  /**
   * Extract model code or model designation
   * @param {string} text
   * @param {string} brand
   * @param {string} [hintModel]
   * @returns {string} Standardized model name
   */
  extractModel(text, brand, hintModel) {
    if (hintModel && typeof hintModel === 'string' && hintModel.trim().length >= 2) {
      return hintModel.trim();
    }

    if (!text || typeof text !== 'string') return 'Standard Model';

    // Model Patterns:
    // 1. Apple products: iPhone 15 Pro Max, MacBook Air M3, iPad Pro 11, Apple Watch Series 9
    if (brand === 'Apple') {
      const macChipMatch = text.match(/\b(MacBook\s+(?:Air|Pro))\b.*?\b(M[1234](?:\s*(?:Pro|Max))?)\b/i);
      if (macChipMatch) {
        return `${macChipMatch[1]} ${macChipMatch[2]}`.trim();
      }

      const appleMatch = text.match(
        /\b((?:iPhone|MacBook(?:\s+(?:Air|Pro))?|iPad(?:\s+(?:Air|Pro|Mini))?|Apple Watch(?:\s+(?:Ultra|Series\s+[0-9]+|SE))?)(?:\s+[0-9]+(?:\s*(?:Pro Max|Pro|Plus|Mini|Max))?(?:\s+M[1234](?:\s*(?:Pro|Max))?)?)?)\b/i
      );
      if (appleMatch) {
        return appleMatch[1].trim();
      }
    }

    // 2. Sony products: WH-1000XM5, WF-1000XM5, KD-55X74L, Bravia X90L, Alpha 7 IV
    const sonyMatch = text.match(
      /\b([A-Z]{1,3}-[0-9]{3,4}[A-Z0-9]{1,4}|WH-[0-9]{4}[A-Z]{1,3}|WF-[0-9]{4}[A-Z]{1,3}|KD-[0-9]{2}[A-Z0-9]+|XR-[0-9]{2}[A-Z0-9]+|Alpha\s+[0-9]+(?:\s*[A-Z]+)?)\b/i
    );
    if (sonyMatch) {
      return sonyMatch[1].trim();
    }

    // 3. Samsung products: Galaxy S24 Ultra, Galaxy Z Fold 6, Galaxy Watch 6, WW80T504DAX1TL
    const samsungMatch = text.match(
      /\b((?:Galaxy\s+(?:S[0-9]{2}(?:\s*(?:Ultra|Plus|\+))?|Z\s+(?:Fold|Flip)\s*[0-9]|A[0-9]{2}|Watch\s*[0-9]))|[A-Z]{2}[0-9]{2}[A-Z0-9]{5,10})\b/i
    );
    if (samsungMatch) {
      return samsungMatch[1].trim();
    }

    // 4. Dell / HP / Lenovo Laptops: Inspiron 3520, XPS 13, ThinkPad X1 Carbon, Pavilion 15
    const laptopMatch = text.match(
      /\b((?:Inspiron|XPS|Latitude|Vostro|ThinkPad|IdeaPad|Legion|Yoga|Pavilion|Envy|Spectre|OMEN|ZenBook|ROG|TUF)\s+[A-Z0-9\-]+(?:\s+(?:Carbon|Fold|Slim|Pro|Plus|Flip))?)(?:\s+(?:Intel|AMD|Core|Ryzen|Laptop|Notebook|Computer|Gaming))?\b/i
    );
    if (laptopMatch) {
      return laptopMatch[1].trim();
    }

    // 5. Generic alphanumeric model number pattern (e.g. ABC-1234, X7500L, WW80T)
    const genericCodeMatch = text.match(/\b([A-Z]{2,4}[-][0-9]{3,5}[A-Z0-9]*|[A-Z][0-9]{4,6}[A-Z0-9]*)\b/i);
    if (genericCodeMatch) {
      return genericCodeMatch[1].trim();
    }

    return 'Standard Model';
  }

  /**
   * Determine product category from text
   * @param {string} text
   * @returns {string} Standardized category name
   */
  detectCategory(text) {
    const lower = (text || '').toLowerCase();

    if (/headphone|earphone|earbuds|airpods|audio|tws|headset|soundbar/i.test(lower)) {
      return 'Headphones & Audio';
    }
    if (
      /laptop|macbook|notebook|chromebook|thinkpad|computer|inspiron|xps|latitude|ideapad|legion|pavilion|zenbook|core i[0-9]|ryzen [0-9]|ram.*ssd|ssd.*ram/i.test(
        lower
      )
    ) {
      return 'Computers & Laptops';
    }
    if (/phone|mobile|smartphone|iphone|galaxy s|galaxy z|galaxy a|oneplus|redmi|pixel/i.test(lower)) {
      return 'Smartphones & Mobiles';
    }
    if (/tv|television|bravia|oled|qled|smart tv|led tv/i.test(lower)) {
      return 'Televisions & Home Entertainment';
    }
    if (/watch|smartwatch|band|fitness tracker/i.test(lower)) {
      return 'Smart Watches & Wearables';
    }
    if (/camera|dslr|mirrorless|lens|camcorder/i.test(lower)) {
      return 'Cameras & Photography';
    }
    if (/washing machine|refrigerator|fridge|microwave|air conditioner|vacuum|dryer/i.test(lower)) {
      return 'Home Appliances';
    }

    return 'Electronics & Gadgets';
  }

  /**
   * Normalize raw product payload into canonical HL² Product representation
   * @param {object} rawProduct - Raw data from retailer adapter or API
   * @returns {object} Canonical normalized product entity
   */
  normalize(rawProduct = {}) {
    const rawTitle = rawProduct.title || rawProduct.name || '';
    const cleanedTitle = this.cleanTitle(rawTitle);

    const brand = this.detectBrand(cleanedTitle, rawProduct.brand);
    const model = this.extractModel(cleanedTitle, brand, rawProduct.model);
    const category = rawProduct.category || this.detectCategory(`${cleanedTitle} ${model}`);

    // Extract variants
    const variant = variantNormalizer.normalizeVariants(
      cleanedTitle,
      rawProduct.specifications || {}
    );

    // Normalize identifiers
    const identifiers = productIdentifierService.normalizeIdentifiers({
      asin: rawProduct.identifierType === 'ASIN' ? rawProduct.identifier : rawProduct.asin,
      gtin: rawProduct.gtin,
      upc: rawProduct.upc,
      ean: rawProduct.ean,
      sku: rawProduct.sku,
      mpn: rawProduct.mpn || null,
      retailerId: rawProduct.identifier,
      retailer: rawProduct.retailerSlug || rawProduct.retailer,
    });

    // Evaluate identity certainty
    const identityMatch = productIdentifierService.evaluateIdentityCertainty({
      brand,
      model,
      identifiers,
      variant,
    });

    // Generate canonical product display name
    const canonicalProductName =
      model !== 'Standard Model' ? `${brand} ${model}` : `${brand} ${cleanedTitle.slice(0, 40)}`;

    return {
      normalizedTitle: cleanedTitle,
      brand,
      model,
      canonicalProductName,
      category,
      variant,
      identifiers,
      identityMatch,
      image: rawProduct.image || null,
      specifications: rawProduct.specifications || {},
      rawRetailerData: {
        retailer: rawProduct.retailer || 'Unknown',
        originalTitle: rawTitle,
        price: rawProduct.price,
        mrp: rawProduct.mrp,
        currency: rawProduct.currency,
        canonicalUrl: rawProduct.canonicalUrl || rawProduct.url,
        lastAuditedAt: rawProduct.lastAuditedAt || new Date().toISOString(),
      },
    };
  }
}

export const productNormalizer = new ProductNormalizer();
export default productNormalizer;
