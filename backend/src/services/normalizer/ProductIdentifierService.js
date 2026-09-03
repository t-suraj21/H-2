/**
 * ProductIdentifierService
 * Validates, normalizes, and scores certainty of product identifiers
 */
export class ProductIdentifierService {
  /**
   * Validate GTIN / UPC / EAN checksum
   * @param {string} barcode
   * @returns {boolean}
   */
  isValidGTIN(barcode) {
    if (!barcode || typeof barcode !== 'string') return false;
    const clean = barcode.replace(/[^0-9]/g, '');
    if (![8, 12, 13, 14].includes(clean.length)) return false;

    // Calculate Luhn / Mod 10 checksum
    const digits = clean.split('').map(Number);
    const checkDigit = digits.pop();
    let sum = 0;

    for (let i = digits.length - 1, weight = 3; i >= 0; i--) {
      sum += digits[i] * weight;
      weight = weight === 3 ? 1 : 3;
    }

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
  }

  /**
   * Validate Amazon ASIN format
   * @param {string} asin
   * @returns {boolean}
   */
  isValidASIN(asin) {
    if (!asin || typeof asin !== 'string') return false;
    return /^[B0-9][A-Z0-9]{9}$/i.test(asin.trim());
  }

  /**
   * Normalize an identifier collection
   * @param {object} rawIdentifiers
   * @returns {object} Standardized identifiers
   */
  normalizeIdentifiers(rawIdentifiers = {}) {
    const normalized = {
      asin: null,
      gtin: null,
      upc: null,
      ean: null,
      sku: null,
      mpn: null,
      retailerSpecific: [],
    };

    if (rawIdentifiers.asin && this.isValidASIN(rawIdentifiers.asin)) {
      normalized.asin = rawIdentifiers.asin.trim().toUpperCase();
    }

    if (rawIdentifiers.gtin && this.isValidGTIN(rawIdentifiers.gtin)) {
      normalized.gtin = rawIdentifiers.gtin.trim();
    }

    if (rawIdentifiers.upc && this.isValidGTIN(rawIdentifiers.upc)) {
      normalized.upc = rawIdentifiers.upc.trim();
      if (!normalized.gtin) normalized.gtin = normalized.upc;
    }

    if (rawIdentifiers.ean && this.isValidGTIN(rawIdentifiers.ean)) {
      normalized.ean = rawIdentifiers.ean.trim();
      if (!normalized.gtin) normalized.gtin = normalized.ean;
    }

    if (rawIdentifiers.sku) {
      normalized.sku = String(rawIdentifiers.sku).trim();
    }

    if (rawIdentifiers.mpn) {
      normalized.mpn = String(rawIdentifiers.mpn).trim().toUpperCase();
    }

    if (Array.isArray(rawIdentifiers.retailerSpecific)) {
      normalized.retailerSpecific = rawIdentifiers.retailerSpecific;
    } else if (rawIdentifiers.retailerId) {
      normalized.retailerSpecific.push({
        retailer: rawIdentifiers.retailer || 'unknown',
        id: String(rawIdentifiers.retailerId),
      });
    }

    return normalized;
  }

  /**
   * Evaluate product identity certainty
   * @param {object} params
   * @param {string} [params.brand]
   * @param {string} [params.model]
   * @param {object} [params.identifiers]
   * @param {object} [params.variant]
   * @returns {{ isCertain: boolean, confidence: number, matchLevel: 'EXACT' | 'PROBABLE' | 'UNCERTAIN', reason: string }}
   */
  evaluateIdentityCertainty({ brand, model, identifiers = {}, variant = {} }) {
    // 1. Direct GTIN/UPC match is 100% exact
    if (identifiers.gtin || identifiers.upc || identifiers.ean) {
      return {
        isCertain: true,
        confidence: 1.0,
        matchLevel: 'EXACT',
        reason: 'Verified Global Trade Item Number (GTIN/UPC/EAN) present',
      };
    }

    const isGenericBrand =
      !brand || ['generic', 'unknown', 'unbranded'].includes(brand.toLowerCase().trim());
    const isGenericModel =
      !model ||
      model.trim().length < 3 ||
      ['generic', 'unknown', 'standard', 'standard model', 'model', 'pro', 'plus'].includes(
        model.toLowerCase().trim()
      );

    // 2. Exact Brand + specific alphanumeric Model Number
    if (!isGenericBrand && !isGenericModel) {
      // If variant attributes are also resolved
      if (variant.storage || variant.size || variant.color) {
        return {
          isCertain: true,
          confidence: 0.95,
          matchLevel: 'EXACT',
          reason: `Exact match for ${brand} model '${model}' with verified variant attributes`,
        };
      }

      return {
        isCertain: true,
        confidence: 0.88,
        matchLevel: 'PROBABLE',
        reason: `Verified ${brand} model '${model}' (variant attributes pending confirmation)`,
      };
    }

    // 3. Known ASIN or validated SKU
    if (identifiers.asin || identifiers.sku || identifiers.mpn) {
      return {
        isCertain: true,
        confidence: 0.85,
        matchLevel: 'PROBABLE',
        reason: 'Verified retailer catalog identifier (ASIN/SKU/MPN)',
      };
    }

    // 4. Incomplete or ambiguous identity -> Flag as UNCERTAIN
    return {
      isCertain: false,
      confidence: 0.45,
      matchLevel: 'UNCERTAIN',
      reason: 'Product identity is ambiguous: missing verified model number or global identifier',
    };
  }
}

export const productIdentifierService = new ProductIdentifierService();
export default productIdentifierService;
