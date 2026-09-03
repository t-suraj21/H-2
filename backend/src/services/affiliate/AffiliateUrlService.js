import { affiliateConfig } from '../../config/affiliate.config.js';
import { logger } from '../../utils/logger.js';

export class AffiliateUrlService {
  constructor(customConfig = null) {
    this.config = customConfig || affiliateConfig;
  }

  /**
   * Detect retailer key from slug, name, or URL hostname
   * @param {string} retailerNameOrSlug
   * @param {string} [url]
   * @returns {string|null} Key ('amazon', 'flipkart', 'croma') or null
   */
  detectRetailerKey(retailerNameOrSlug = '', url = '') {
    const cleanName = (retailerNameOrSlug || '').toLowerCase().trim();

    for (const [key, conf] of Object.entries(this.config.retailers)) {
      if (cleanName === key || cleanName.includes(key) || cleanName === conf.name.toLowerCase()) {
        return key;
      }
    }

    if (url) {
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        for (const [key, conf] of Object.entries(this.config.retailers)) {
          if (conf.domains.some((d) => host.includes(d))) {
            return key;
          }
        }
      } catch {
        // Ignore invalid URL parsing for detection
      }
    }

    return null;
  }

  /**
   * Generate an authorized affiliate / destination URL for a product offer
   * @param {string} originalUrl
   * @param {string} [retailerNameOrSlug]
   * @param {object} [trackingContext={}] - { userId, offerId, productId, campaign }
   * @returns {object} { originalUrl, destinationUrl, retailer, isAffiliate, trackingMetadata }
   */
  generateDestinationUrl(originalUrl, retailerNameOrSlug = '', trackingContext = {}) {
    if (!originalUrl || typeof originalUrl !== 'string') {
      return {
        originalUrl: '',
        destinationUrl: '',
        retailer: retailerNameOrSlug || 'Unknown',
        isAffiliate: false,
        trackingMetadata: {},
      };
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(originalUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return {
          originalUrl,
          destinationUrl: '',
          retailer: retailerNameOrSlug || 'Invalid',
          isAffiliate: false,
          trackingMetadata: { error: 'UNSUPPORTED_PROTOCOL' },
        };
      }
    } catch {
      // Return empty destination if malformed URL
      return {
        originalUrl,
        destinationUrl: '',
        retailer: retailerNameOrSlug,
        isAffiliate: false,
        trackingMetadata: { error: 'MALFORMED_URL' },
      };
    }

    const retailerKey = this.detectRetailerKey(retailerNameOrSlug, originalUrl);
    const retailerConfig = retailerKey ? this.config.retailers[retailerKey] : null;
    const isAffiliateEnabled = this.config.enabled && Boolean(retailerConfig?.defaultTag);

    const trackingId = `hl2_${Date.now().toString(36)}_${Math.random().toString(36).substring(7)}`;
    const subId = trackingContext.userId
      ? `u_${trackingContext.userId.toString().slice(-8)}_${trackingId.slice(-6)}`
      : trackingId;

    const trackingMetadata = {
      trackingId,
      subId,
      campaign: trackingContext.campaign || this.config.defaultCampaignSource,
      generatedAt: new Date().toISOString(),
    };

    if (isAffiliateEnabled && retailerConfig) {
      // 1. Inject Retailer-Specific Affiliate Parameters
      parsedUrl.searchParams.set(retailerConfig.paramKey, retailerConfig.defaultTag);

      if (retailerConfig.subTrackingKey) {
        parsedUrl.searchParams.set(retailerConfig.subTrackingKey, subId);
      }

      if (retailerConfig.extraParams) {
        for (const [k, v] of Object.entries(retailerConfig.extraParams)) {
          parsedUrl.searchParams.set(k, v);
        }
      }

      trackingMetadata.affiliateTag = retailerConfig.defaultTag;
      trackingMetadata.partner = retailerConfig.name;

      logger.info(
        `[AffiliateUrlService] Generated affiliate URL for ${retailerConfig.name} (Tag: ${retailerConfig.defaultTag})`
      );

      return {
        originalUrl,
        destinationUrl: parsedUrl.toString(),
        retailer: retailerConfig.name,
        isAffiliate: true,
        trackingMetadata,
      };
    }

    // 2. Default Non-Affiliate Destination URL (Clean with standard safe UTM tags)
    for (const [k, v] of Object.entries(this.config.defaultTracking)) {
      if (!parsedUrl.searchParams.has(k)) {
        parsedUrl.searchParams.set(k, v);
      }
    }

    return {
      originalUrl,
      destinationUrl: parsedUrl.toString(),
      retailer: retailerConfig?.name || retailerNameOrSlug || 'Retailer',
      isAffiliate: false,
      trackingMetadata,
    };
  }

  /**
   * Enrich an offer object with destination and affiliate attributes
   * @param {object} offer
   * @param {object} [trackingContext={}]
   * @returns {object} Enriched offer
   */
  enrichOffer(offer, trackingContext = {}) {
    if (!offer) return offer;

    const rawUrl = offer.url || offer.canonicalUrl || offer.productUrl || '';
    const retailerName = offer.retailer || offer.retailerName || '';

    const { destinationUrl, isAffiliate, trackingMetadata } = this.generateDestinationUrl(
      rawUrl,
      retailerName,
      {
        ...trackingContext,
        offerId: offer.id || offer._id,
      }
    );

    return {
      ...offer,
      url: rawUrl,
      destinationUrl: destinationUrl || rawUrl,
      isAffiliate,
      trackingMetadata,
    };
  }

  /**
   * Enrich full comparison result offers with destination URLs
   * @param {object} comparisonResult
   * @param {object} [trackingContext={}]
   * @returns {object}
   */
  enrichComparisonResult(comparisonResult, trackingContext = {}) {
    if (!comparisonResult) return comparisonResult;

    const enrichedOffers = (comparisonResult.offers || []).map((o) =>
      this.enrichOffer(o, trackingContext)
    );

    const enrichedAvailable = (comparisonResult.availableRetailers || []).map((o) => {
      const enriched = this.enrichOffer(o, trackingContext);
      return {
        ...o,
        url: o.url,
        destinationUrl: enriched.destinationUrl,
        isAffiliate: enriched.isAffiliate,
      };
    });

    const enrichedLowest = comparisonResult.lowest
      ? this.enrichOffer(comparisonResult.lowest, trackingContext)
      : null;

    const enrichedHighest = comparisonResult.highest
      ? this.enrichOffer(comparisonResult.highest, trackingContext)
      : null;

    return {
      ...comparisonResult,
      lowest: enrichedLowest,
      highest: enrichedHighest,
      availableRetailers: enrichedAvailable,
      offers: enrichedOffers,
    };
  }
}

export const affiliateUrlService = new AffiliateUrlService();
export default affiliateUrlService;
