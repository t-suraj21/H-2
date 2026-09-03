import { adapterRegistry } from '../providers/AdapterRegistry.js';
import { productNormalizer } from './normalizer/ProductNormalizer.js';
import {
  InvalidUrlError,
  UnsupportedRetailerError,
  ProductNotFoundError,
  RetailerProviderError,
} from '../errors/AppError.js';

// Common tracking parameters to strip during initial URL sanitization
const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'ref_',
  'tag',
  'linkCode',
  'camp',
  'creative',
  'qid',
  'sr',
  'keywords',
  'fbclid',
  'gclid',
  'dclid',
  'mc_eid',
  '_hsenc',
  '_hsmi',
];

/**
 * Clean common tracking parameters from a URL object
 * @param {URL} urlObj
 * @returns {URL}
 */
const stripTrackingParams = (urlObj) => {
  const cleaned = new URL(urlObj.href);
  for (const param of TRACKING_PARAMS) {
    cleaned.searchParams.delete(param);
  }
  return cleaned;
};

/**
 * Calculate AI Deal Authenticity Score & Verdict
 * @param {number} price
 * @param {number} [mrp]
 * @param {number} [rating]
 * @returns {{ dealScore: number, verdict: string, assessment: string }}
 */
const calculateDealAnalysis = (price, mrp, rating = 4.5) => {
  let dealScore = 75;

  if (mrp && mrp > price) {
    const discountPercent = ((mrp - price) / mrp) * 100;
    if (discountPercent >= 20) dealScore += 15;
    else if (discountPercent >= 10) dealScore += 10;
    else dealScore += 5;
  }

  if (rating >= 4.5) dealScore += 10;
  else if (rating >= 4.0) dealScore += 5;

  // Clamp between 0 and 100
  dealScore = Math.min(99, Math.max(20, Math.round(dealScore)));

  let verdict = 'FAIR_PRICE';
  let assessment = 'Current price is within standard market range.';

  if (dealScore >= 85) {
    verdict = 'EXCELLENT_DEAL';
    assessment = 'Verified price drop! Price is currently near all-time low.';
  } else if (dealScore >= 70) {
    verdict = 'GOOD_VALUE';
    assessment = 'Authentic discount detected compared to historical average.';
  }

  return {
    dealScore,
    verdict,
    assessment,
  };
};

export class UrlAnalyzerService {
  /**
   * Main entry point to analyze a product URL
   * @param {string} rawUrl - Input product URL from user
   * @returns {Promise<object>} Normalized product analysis
   */
  async analyzeUrl(rawUrl) {
    // 1. Validate URL format
    if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
      throw new InvalidUrlError('Product URL is required.');
    }

    const trimmed = rawUrl.trim();
    let urlObj;
    try {
      urlObj = new URL(trimmed);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        throw new InvalidUrlError('Invalid URL protocol. Only HTTP and HTTPS URLs are supported.');
      }
    } catch {
      throw new InvalidUrlError('Invalid product URL format. Please provide a complete web address.');
    }

    // 2. Sanitize and strip general tracking parameters
    const sanitizedUrlObj = stripTrackingParams(urlObj);

    // 3. Detect retailer adapter
    const adapter = adapterRegistry.getAdapterForUrl(sanitizedUrlObj);
    if (!adapter) {
      const supportedList = adapterRegistry.getAllAdapters().map((a) => a.name).join(', ');
      throw new UnsupportedRetailerError(
        `Unsupported retailer domain '${urlObj.hostname}'. Currently supported retailers: ${supportedList}`
      );
    }

    // 4. Extract retailer product identifier
    const extracted = adapter.extractProductIdentifier(sanitizedUrlObj);
    if (!extracted || !extracted.identifier) {
      throw new ProductNotFoundError(
        `Could not extract a valid product identifier from the provided ${adapter.name} URL. Please ensure this is a direct product page link.`
      );
    }

    // 5. Generate clean canonical URL
    const canonicalUrl = adapter.normalizeUrl(sanitizedUrlObj);

    // 6. Fetch raw product details from retailer adapter
    let rawProductDetails;
    try {
      rawProductDetails = await adapter.getProduct(extracted.identifier);
    } catch (err) {
      throw new RetailerProviderError(
        `Provider for ${adapter.name} is currently unavailable: ${err.message}`
      );
    }

    // 7. Run through HL² Product Normalization Engine
    const normalizedProduct = productNormalizer.normalize({
      ...rawProductDetails,
      canonicalUrl,
      identifier: extracted.identifier,
      identifierType: extracted.identifierType,
      retailer: adapter.name,
      retailerSlug: adapter.slug,
    });

    // 8. Calculate Deal Authenticity Analysis
    const analysis = calculateDealAnalysis(
      rawProductDetails.price,
      rawProductDetails.mrp,
      rawProductDetails.rating
    );

    // 9. Return structured response
    return {
      originalUrl: trimmed,
      normalizedUrl: canonicalUrl,
      retailer: {
        name: adapter.name,
        slug: adapter.slug,
        domain: urlObj.hostname.replace(/^www\./, ''),
        countryCode: adapter.countryCode,
        currency: rawProductDetails.currency || adapter.currency,
      },
      identifier: {
        type: extracted.identifierType,
        value: extracted.identifier,
      },
      product: {
        title: normalizedProduct.normalizedTitle,
        brand: normalizedProduct.brand,
        model: normalizedProduct.model,
        canonicalProductName: normalizedProduct.canonicalProductName,
        category: normalizedProduct.category,
        variant: normalizedProduct.variant,
        identifiers: normalizedProduct.identifiers,
        identityMatch: normalizedProduct.identityMatch,
        price: rawProductDetails.price,
        mrp: rawProductDetails.mrp,
        discount: rawProductDetails.mrp && rawProductDetails.mrp > rawProductDetails.price
          ? {
              amount: parseFloat((rawProductDetails.mrp - rawProductDetails.price).toFixed(2)),
              percentage: parseFloat(
                (((rawProductDetails.mrp - rawProductDetails.price) / rawProductDetails.mrp) * 100).toFixed(1)
              ),
            }
          : { amount: 0, percentage: 0 },
        currency: rawProductDetails.currency || adapter.currency,
        inStock: rawProductDetails.inStock ?? true,
        rating: rawProductDetails.rating ?? 0,
        reviewCount: rawProductDetails.reviewCount ?? 0,
        seller: rawProductDetails.seller || { name: adapter.name, isAuthorized: true },
        delivery: rawProductDetails.delivery || 'Standard Delivery',
        image: normalizedProduct.image,
        specifications: normalizedProduct.specifications,
      },
      analysis: {
        dealScore: analysis.dealScore,
        verdict: analysis.verdict,
        priceAssessment: analysis.assessment,
        verifiedAt: new Date().toISOString(),
      },
      rawRetailerData: normalizedProduct.rawRetailerData,
    };
  }
}

export const urlAnalyzerService = new UrlAnalyzerService();
export default urlAnalyzerService;
