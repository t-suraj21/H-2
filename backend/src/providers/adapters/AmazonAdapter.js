import { BaseRetailerAdapter } from './BaseAdapter.js';

/**
 * AmazonAdapter
 * Handles Amazon URLs across regional domains (.com, .in, .co.uk, amzn.to) and extracts ASINs
 */
export class AmazonAdapter extends BaseRetailerAdapter {
  constructor() {
    super({
      name: 'Amazon',
      slug: 'amazon',
      domains: [
        'amazon.com',
        'amazon.in',
        'amazon.co.uk',
        'amazon.ca',
        'amazon.de',
        'amazon.fr',
        'amazon.es',
        'amazon.it',
        'amazon.co.jp',
        'amzn.to',
        'amzn.in',
        'amzn.com',
      ],
      countryCode: 'US',
      currency: 'USD',
    });

    // Sample mock catalog database for instant development & testing
    this.mockCatalog = new Map([
      [
        'B09XS7JWHH',
        {
          title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones',
          brand: 'Sony',
          model: 'WH-1000XM5',
          category: 'Electronics & Headphones',
          price: 328.0,
          mrp: 399.99,
          currency: 'USD',
          rating: 4.8,
          reviewCount: 14250,
          inStock: true,
          seller: { name: 'Amazon.com', isAuthorized: true },
          delivery: 'FREE Prime 1-Day Delivery',
          image: 'https://m.media-amazon.com/images/I/61+ElPAk3TL._AC_SL1500_.jpg',
          specifications: {
            BatteryLife: '30 Hours',
            NoiseCanceling: 'Active Noise Canceling with 8 Microphones',
            Connectivity: 'Bluetooth 5.2, Multipoint Connection',
            Weight: '250g',
          },
        },
      ],
      [
        'B0CX23V251',
        {
          title: 'Apple MacBook Air 13-inch with M3 chip (16GB Unified Memory, 512GB SSD)',
          brand: 'Apple',
          model: 'MacBook Air M3',
          category: 'Computers & Laptops',
          price: 1249.0,
          mrp: 1499.0,
          currency: 'USD',
          rating: 4.9,
          reviewCount: 3890,
          inStock: true,
          seller: { name: 'Apple Official Store', isAuthorized: true },
          delivery: 'FREE Delivery',
          image: 'https://m.media-amazon.com/images/I/71eXN6sqSaL._AC_SL1500_.jpg',
          specifications: {
            Processor: 'Apple M3 8-core CPU',
            Memory: '16GB Unified Memory',
            Storage: '512GB SSD',
            Display: '13.6-inch Liquid Retina Display',
          },
        },
      ],
    ]);
  }

  /**
   * Extract 10-character Amazon Standard Identification Number (ASIN)
   * @param {URL | string} url
   * @returns {{ identifierType: 'ASIN', identifier: string } | null}
   */
  extractProductIdentifier(url) {
    try {
      const urlStr = typeof url === 'string' ? url : url.href;

      // Pattern 1: standard /dp/B09XS7JWHH or /gp/product/B09XS7JWHH or /product/B09XS7JWHH
      const standardMatch = urlStr.match(
        /(?:\/dp\/|\/gp\/product\/|\/product\/|\/ASIN\/|\/gp\/aw\/d\/)([A-Z0-9]{10})(?:[/?#]|$)/i
      );
      if (standardMatch && standardMatch[1]) {
        return {
          identifierType: 'ASIN',
          identifier: standardMatch[1].toUpperCase(),
        };
      }

      // Pattern 2: query parameter asin=B09XS7JWHH
      const queryMatch = urlStr.match(/[?&]asin=([A-Z0-9]{10})(?:[&/?#]|$)/i);
      if (queryMatch && queryMatch[1]) {
        return {
          identifierType: 'ASIN',
          identifier: queryMatch[1].toUpperCase(),
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Normalize Amazon URL into clean canonical format
   * @param {URL | string} url
   * @returns {string}
   */
  normalizeUrl(url) {
    const extracted = this.extractProductIdentifier(url);
    if (!extracted) {
      return typeof url === 'string' ? url : url.href;
    }

    try {
      const urlObj = typeof url === 'string' ? new URL(url) : url;
      const hostname = urlObj.hostname.toLowerCase();
      // Retain regional domain (e.g., amazon.in or amazon.com)
      const domain = hostname.includes('amazon.in')
        ? 'www.amazon.in'
        : hostname.includes('amazon.co.uk')
        ? 'www.amazon.co.uk'
        : 'www.amazon.com';

      return `https://${domain}/dp/${extracted.identifier}`;
    } catch {
      return `https://www.amazon.com/dp/${extracted.identifier}`;
    }
  }

  /**
   * Retrieve normalized product data for ASIN
   * @param {string} identifier
   * @param {object} [options]
   * @returns {Promise<object>}
   */
  async getProduct(identifier, options = {}) {
    const asin = identifier.toUpperCase();
    const mockData = this.mockCatalog.get(asin);

    if (mockData) {
      return {
        identifier: asin,
        identifierType: 'ASIN',
        retailer: this.name,
        retailerSlug: this.slug,
        ...mockData,
        canonicalUrl: `https://www.amazon.com/dp/${asin}`,
        lastAuditedAt: new Date().toISOString(),
      };
    }

    // Generic fallback for any valid ASIN
    return {
      identifier: asin,
      identifierType: 'ASIN',
      retailer: this.name,
      retailerSlug: this.slug,
      title: `Amazon Verified Product (${asin})`,
      brand: 'Generic Brand',
      model: asin,
      category: 'General Merchandise',
      price: 99.99,
      mrp: 129.99,
      currency: options.currency || this.currency,
      rating: 4.5,
      reviewCount: 120,
      inStock: true,
      seller: { name: 'Amazon Authorized Seller', isAuthorized: true },
      delivery: 'Standard Shipping',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
      canonicalUrl: `https://www.amazon.com/dp/${asin}`,
      specifications: { ASIN: asin },
      lastAuditedAt: new Date().toISOString(),
    };
  }

  async searchProduct(query, options = {}) {
    return Array.from(this.mockCatalog.entries()).map(([asin, data]) => ({
      identifier: asin,
      identifierType: 'ASIN',
      retailer: this.name,
      ...data,
    }));
  }
}

export default AmazonAdapter;
