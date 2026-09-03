import { affiliateUrlService } from '../affiliate/AffiliateUrlService.js';

/**
 * Price Status Classifications
 * @readonly
 * @enum {string}
 */
export const PRICE_STATUS = {
  VERIFIED: 'VERIFIED',
  UNAVAILABLE: 'UNAVAILABLE',
  STALE: 'STALE',
  ESTIMATED: 'ESTIMATED',
};

/**
 * PriceComparisonEngine
 * Evaluates cross-retailer product offers to determine lowest price, price range,
 * savings metrics, and availability breakdown.
 */
export class PriceComparisonEngine {
  constructor(defaultFreshnessHours = 24) {
    this.defaultFreshnessHours = defaultFreshnessHours;
  }

  /**
   * Determine pricing status based on availability, timestamp freshness, and estimation flags
   * @param {object} offer
   * @param {number} [maxAgeHours]
   * @returns {string} Price status string from PRICE_STATUS enum
   */
  determinePriceStatus(offer, maxAgeHours = this.defaultFreshnessHours) {
    // 1. Availability check
    const isAvailable =
      offer.availability !== false &&
      offer.inStock !== false &&
      offer.available !== false &&
      offer.stockStatus !== 'OUT_OF_STOCK';

    if (!isAvailable) {
      return PRICE_STATUS.UNAVAILABLE;
    }

    // 2. Freshness check
    const lastChecked = offer.lastChecked || offer.lastAuditedAt || offer.timestamp;
    if (lastChecked) {
      const checkedTime = new Date(lastChecked).getTime();
      const now = Date.now();
      const ageHours = (now - checkedTime) / (1000 * 60 * 60);

      if (!isNaN(ageHours) && ageHours > maxAgeHours) {
        return PRICE_STATUS.STALE;
      }
    }

    // 3. Estimation check
    if (offer.isEstimated || offer.isDeliveryEstimated || offer.priceEstimated) {
      return PRICE_STATUS.ESTIMATED;
    }

    // 4. Default: Verified fresh price
    return PRICE_STATUS.VERIFIED;
  }

  /**
   * Calculate effective price reliably when required pricing information is available
   * @param {object} offer
   * @returns {number} Calculated effective price rounded to 2 decimals
   */
  calculateEffectivePrice(offer) {
    const basePrice = Number(offer.price) || 0;
    const deliveryFee =
      typeof offer.deliveryFee === 'number' && !isNaN(offer.deliveryFee) && offer.deliveryFee > 0
        ? offer.deliveryFee
        : 0;
    const discount =
      typeof offer.discount === 'number' && !isNaN(offer.discount) && offer.discount > 0
        ? offer.discount
        : 0;

    const effective = basePrice + deliveryFee - discount;
    return Math.max(0, parseFloat(effective.toFixed(2)));
  }

  /**
   * Execute price comparison across all retailer offers for a product
   * @param {object} product - Normalized product entity
   * @param {object[]} [offers=[]] - Array of retailer offers
   * @param {object} [options={}]
   * @returns {object} Standardized comparison result
   */
  compare(product = {}, offers = [], options = {}) {
    if (!Array.isArray(offers) || offers.length === 0) {
      return {
        product: {
          title: product.title || product.normalizedTitle || 'Unknown Product',
          brand: product.brand || 'Generic',
          model: product.model || 'Standard Model',
          canonicalProductName: product.canonicalProductName || product.title || 'Product',
          category: product.category || 'General',
          image: product.image || null,
        },
        lowest: null,
        highest: null,
        averagePrice: 0,
        savings: 0,
        savingsPercentage: 0,
        availableRetailers: [],
        unavailableRetailers: [],
        offers: [],
        comparisonTimestamp: new Date().toISOString(),
      };
    }

    const freshnessHours = options.maxAgeHours || this.defaultFreshnessHours;
    const trackingContext = options.trackingContext || {};

    // 1. Process and normalize each offer
    const processedOffers = offers.map((rawOffer) => {
      const price = Number(rawOffer.price) || 0;
      const mrp = Number(rawOffer.mrp) || null;
      const effectivePrice = this.calculateEffectivePrice(rawOffer);
      const status = this.determinePriceStatus(rawOffer, freshnessHours);
      const isAvailable = status !== PRICE_STATUS.UNAVAILABLE;
      const rawUrl = rawOffer.url || rawOffer.canonicalUrl || '';
      const retailerName = rawOffer.retailer || rawOffer.retailerName || 'Retailer';

      // Generate authorized destination / affiliate URL
      const { destinationUrl, isAffiliate, trackingMetadata } =
        affiliateUrlService.generateDestinationUrl(rawUrl, retailerName, trackingContext);

      return {
        retailer: retailerName,
        retailerSlug: (rawOffer.retailerSlug || rawOffer.retailer || 'retailer').toLowerCase(),
        title: rawOffer.title || product.normalizedTitle || product.title || '',
        url: rawUrl,
        destinationUrl: destinationUrl || rawUrl,
        isAffiliate,
        trackingMetadata,
        price,
        mrp,
        discount: rawOffer.discount ?? (mrp && mrp > price ? parseFloat((mrp - price).toFixed(2)) : 0),
        deliveryFee: rawOffer.deliveryFee ?? 0,
        effectivePrice,
        currency: rawOffer.currency || 'USD',
        availability: isAvailable,
        status,
        seller: rawOffer.seller || { name: rawOffer.retailer || 'Authorized Store', isAuthorized: true },
        lastChecked: rawOffer.lastChecked || rawOffer.lastAuditedAt || new Date().toISOString(),
      };
    });

    // 2. Separate available vs unavailable offers
    const availableOffers = processedOffers.filter((o) => o.availability);
    const unavailableOffers = processedOffers.filter((o) => !o.availability);

    // 3. Sort available offers ascending by effectivePrice
    availableOffers.sort((a, b) => a.effectivePrice - b.effectivePrice);

    let lowest = null;
    let highest = null;
    let averagePrice = 0;
    let savings = 0;
    let savingsPercentage = 0;

    if (availableOffers.length > 0) {
      lowest = availableOffers[0];
      highest = availableOffers[availableOffers.length - 1];

      // Calculate arithmetic mean of effective prices
      const sum = availableOffers.reduce((acc, curr) => acc + curr.effectivePrice, 0);
      averagePrice = parseFloat((sum / availableOffers.length).toFixed(2));

      // Calculate potential savings (compared to highest active retail price)
      if (highest.effectivePrice > lowest.effectivePrice) {
        savings = parseFloat((highest.effectivePrice - lowest.effectivePrice).toFixed(2));
        savingsPercentage = parseFloat(
          (((highest.effectivePrice - lowest.effectivePrice) / highest.effectivePrice) * 100).toFixed(1)
        );
      }
    }

    // 4. Combine sorted available offers followed by unavailable offers
    const sortedAllOffers = [...availableOffers, ...unavailableOffers];

    const availableRetailers = availableOffers.map((o) => ({
      retailer: o.retailer,
      effectivePrice: o.effectivePrice,
      currency: o.currency,
      status: o.status,
      url: o.url,
      destinationUrl: o.destinationUrl,
      isAffiliate: o.isAffiliate,
    }));

    const unavailableRetailers = unavailableOffers.map((o) => ({
      retailer: o.retailer,
      status: o.status,
      url: o.url,
      destinationUrl: o.destinationUrl,
      isAffiliate: o.isAffiliate,
    }));

    return {
      product: {
        title: product.title || product.normalizedTitle || 'Product',
        brand: product.brand || 'Generic',
        model: product.model || 'Standard Model',
        canonicalProductName: product.canonicalProductName || product.title || 'Product',
        category: product.category || 'General',
        image: product.image || null,
      },
      lowest,
      highest,
      averagePrice,
      savings,
      savingsPercentage,
      availableRetailers,
      unavailableRetailers,
      offers: sortedAllOffers,
      comparisonTimestamp: new Date().toISOString(),
    };
  }
}

export const priceComparisonEngine = new PriceComparisonEngine();
export default priceComparisonEngine;
