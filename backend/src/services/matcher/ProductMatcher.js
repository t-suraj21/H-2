import { productNormalizer } from '../normalizer/ProductNormalizer.js';

/**
 * Match Statuses
 * @readonly
 * @enum {string}
 */
export const MATCH_STATUS = {
  EXACT_MATCH: 'EXACT_MATCH',
  HIGH_CONFIDENCE: 'HIGH_CONFIDENCE',
  POSSIBLE_MATCH: 'POSSIBLE_MATCH',
  NO_MATCH: 'NO_MATCH',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
};

/**
 * ProductMatcher
 * Confidence-based matching engine to determine if product listings across retailers
 * represent the same physical product and variant
 */
export class ProductMatcher {
  /**
   * Compare two products and evaluate match confidence
   * @param {object} productA - Raw or normalized product object
   * @param {object} productB - Raw or normalized product object
   * @param {object} [options]
   * @returns {{ match: boolean, confidence: number, status: string, reason: string, details: object }}
   */
  match(productA, productB, options = {}) {
    if (!productA || !productB) {
      return {
        match: false,
        confidence: 0.0,
        status: MATCH_STATUS.INSUFFICIENT_DATA,
        reason: 'One or both products are missing',
        details: {},
      };
    }

    // 1. Ensure both products are passed through normalizer
    const normA = productA.canonicalProductName ? productA : productNormalizer.normalize(productA);
    const normB = productB.canonicalProductName ? productB : productNormalizer.normalize(productB);

    const details = {
      productA: { brand: normA.brand, model: normA.model, variant: normA.variant },
      productB: { brand: normB.brand, model: normB.model, variant: normB.variant },
      identifierMatch: false,
      brandMatch: false,
      modelMatch: false,
      variantCompatibility: {},
    };

    // 2. Fast-Track: Global Barcode Identifiers (GTIN / UPC / EAN)
    const gtinMatch = this.compareBarcodes(normA.identifiers, normB.identifiers);
    if (gtinMatch) {
      details.identifierMatch = true;
      return {
        match: true,
        confidence: 1.0,
        status: MATCH_STATUS.EXACT_MATCH,
        reason: `Global barcode identifier (${gtinMatch}) matches exactly across retailers`,
        details,
      };
    }

    // Fast-Track: Identical MPN / Model Part Number
    const mpnMatch = this.compareMPNs(normA.identifiers, normB.identifiers);
    if (mpnMatch && this.isBrandCompatible(normA.brand, normB.brand)) {
      details.identifierMatch = true;
      details.brandMatch = true;
      return {
        match: true,
        confidence: 0.98,
        status: MATCH_STATUS.EXACT_MATCH,
        reason: `Manufacturer Part Number (${mpnMatch}) matches exactly for ${normA.brand}`,
        details,
      };
    }

    // 3. Brand Compatibility Check (Hard Blocker)
    const brandCompatible = this.isBrandCompatible(normA.brand, normB.brand);
    details.brandMatch = brandCompatible;
    if (!brandCompatible) {
      return {
        match: false,
        confidence: 0.0,
        status: MATCH_STATUS.NO_MATCH,
        reason: `Brand mismatch: '${normA.brand}' vs '${normB.brand}'`,
        details,
      };
    }

    // 4. Model Number Compatibility Check (Hard Blocker)
    const modelCheck = this.compareModels(normA.model, normB.model);
    details.modelMatch = modelCheck.isMatch;

    if (modelCheck.status === MATCH_STATUS.INSUFFICIENT_DATA) {
      return {
        match: false,
        confidence: 0.3,
        status: MATCH_STATUS.INSUFFICIENT_DATA,
        reason: 'Insufficient model or identifier data to establish product identity with certainty',
        details,
      };
    }

    if (!modelCheck.isMatch) {
      return {
        match: false,
        confidence: 0.0,
        status: MATCH_STATUS.NO_MATCH,
        reason: `Model generation/number mismatch: '${normA.model}' vs '${normB.model}'`,
        details,
      };
    }

    // 5. Hardware Variant Attributes Check (Storage, RAM, Display Size)
    const varA = normA.variant || {};
    const varB = normB.variant || {};

    // 5a. Storage Check
    const storageComp = this.compareAttribute(varA.storage, varB.storage);
    details.variantCompatibility.storage = storageComp.status;
    if (storageComp.status === 'MISMATCH') {
      return {
        match: false,
        confidence: 0.15,
        status: MATCH_STATUS.NO_MATCH,
        reason: `Variant mismatch: Storage capacity differs (${varA.storage} vs ${varB.storage})`,
        details,
      };
    }

    // 5b. RAM Check
    const ramComp = this.compareAttribute(varA.ram, varB.ram);
    details.variantCompatibility.ram = ramComp.status;
    if (ramComp.status === 'MISMATCH') {
      return {
        match: false,
        confidence: 0.15,
        status: MATCH_STATUS.NO_MATCH,
        reason: `Variant mismatch: RAM capacity differs (${varA.ram} vs ${varB.ram})`,
        details,
      };
    }

    // 5c. Size / Display Dimension Check
    const sizeComp = this.compareAttribute(varA.size, varB.size);
    details.variantCompatibility.size = sizeComp.status;
    if (sizeComp.status === 'MISMATCH') {
      return {
        match: false,
        confidence: 0.15,
        status: MATCH_STATUS.NO_MATCH,
        reason: `Variant mismatch: Screen/size dimension differs (${varA.size} vs ${varB.size})`,
        details,
      };
    }

    // 6. Color Variant Evaluation
    const colorComp = this.compareAttribute(varA.color, varB.color);
    details.variantCompatibility.color = colorComp.status;

    if (colorComp.status === 'MATCH') {
      return {
        match: true,
        confidence: 0.98,
        status: MATCH_STATUS.EXACT_MATCH,
        reason: `Exact model (${normA.model}) and variant specifications match across retailers`,
        details,
      };
    }

    if (colorComp.status === 'MISMATCH') {
      return {
        match: true,
        confidence: 0.90,
        status: MATCH_STATUS.HIGH_CONFIDENCE,
        reason: `Same product model (${normA.model}) and hardware specifications (color variant differs: ${varA.color} vs ${varB.color})`,
        details,
      };
    }

    // One listing specified color, other did not
    return {
      match: true,
      confidence: 0.94,
      status: MATCH_STATUS.HIGH_CONFIDENCE,
      reason: `Same product model (${normA.model}) and hardware specifications (color unspecified on one retailer)`,
      details,
    };
  }

  /**
   * Compare GTIN / UPC / EAN barcodes
   * @param {object} idA
   * @param {object} idB
   * @returns {string | null} Matched barcode or null
   */
  compareBarcodes(idA = {}, idB = {}) {
    const barcodesA = [idA.gtin, idA.upc, idA.ean].filter(Boolean);
    const barcodesB = [idB.gtin, idB.upc, idB.ean].filter(Boolean);

    for (const a of barcodesA) {
      if (barcodesB.includes(a)) return a;
    }
    return null;
  }

  /**
   * Compare MPN (Manufacturer Part Numbers)
   * @param {object} idA
   * @param {object} idB
   * @returns {string | null} Matched MPN or null
   */
  compareMPNs(idA = {}, idB = {}) {
    if (idA.mpn && idB.mpn) {
      const cleanA = idA.mpn.toUpperCase().replace(/[\s-_/]/g, '');
      const cleanB = idB.mpn.toUpperCase().replace(/[\s-_/]/g, '');
      if (cleanA === cleanB) return idA.mpn;
    }
    return null;
  }

  /**
   * Check if brands match
   * @param {string} brandA
   * @param {string} brandB
   * @returns {boolean}
   */
  isBrandCompatible(brandA, brandB) {
    if (!brandA || !brandB) return false;
    const a = brandA.toLowerCase().trim();
    const b = brandB.toLowerCase().trim();

    if (a === 'generic' || b === 'generic' || a === 'unknown' || b === 'unknown') {
      return true;
    }
    return a === b;
  }

  /**
   * Compare model numbers with normalized alphanumeric strip
   * @param {string} modelA
   * @param {string} modelB
   * @returns {{ isMatch: boolean, status: string }}
   */
  compareModels(modelA, modelB) {
    if (!modelA || !modelB) {
      return { isMatch: false, status: MATCH_STATUS.INSUFFICIENT_DATA };
    }

    const cleanA = modelA.toLowerCase().replace(/[\s-_]/g, '').trim();
    const cleanB = modelB.toLowerCase().replace(/[\s-_]/g, '').trim();

    if (
      ['standardmodel', 'generic', 'unknown', 'model'].includes(cleanA) &&
      ['standardmodel', 'generic', 'unknown', 'model'].includes(cleanB)
    ) {
      return { isMatch: false, status: MATCH_STATUS.INSUFFICIENT_DATA };
    }

    return {
      isMatch: cleanA === cleanB,
      status: cleanA === cleanB ? MATCH_STATUS.EXACT_MATCH : MATCH_STATUS.NO_MATCH,
    };
  }

  /**
   * Compare optional variant attributes (storage, RAM, size, color)
   * @param {string | null} valA
   * @param {string | null} valB
   * @returns {{ status: 'MATCH' | 'MISMATCH' | 'UNSPECIFIED' }}
   */
  compareAttribute(valA, valB) {
    if (!valA && !valB) return { status: 'MATCH' };
    if (!valA || !valB) return { status: 'UNSPECIFIED' };

    const cleanA = String(valA).toLowerCase().replace(/[\s-_]/g, '');
    const cleanB = String(valB).toLowerCase().replace(/[\s-_]/g, '');

    return {
      status: cleanA === cleanB ? 'MATCH' : 'MISMATCH',
    };
  }
}

export const productMatcher = new ProductMatcher();
export default productMatcher;
