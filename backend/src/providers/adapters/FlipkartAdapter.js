import { BaseRetailerAdapter } from './BaseAdapter.js';

/**
 * FlipkartAdapter
 * Handles Flipkart URLs and extracts Product ID (PID / FSN / itm)
 */
export class FlipkartAdapter extends BaseRetailerAdapter {
  constructor() {
    super({
      name: 'Flipkart',
      slug: 'flipkart',
      domains: ['flipkart.com', 'dl.flipkart.com', 'fkrt.it'],
      countryCode: 'IN',
      currency: 'INR',
    });

    this.mockCatalog = new Map([
      [
        'MOBFWQ6BRGFGG2FD',
        {
          title: 'Apple iPhone 15 (Blue, 128 GB)',
          brand: 'Apple',
          model: 'iPhone 15',
          category: 'Smartphones & Mobiles',
          price: 65999,
          mrp: 79900,
          currency: 'INR',
          rating: 4.7,
          reviewCount: 24500,
          inStock: true,
          seller: { name: 'SuperComNet', isAuthorized: true },
          delivery: 'FREE Delivery by Tomorrow',
          image: 'https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/k/l/l/-original-imagtc5fz9spysyk.jpeg',
          specifications: {
            Display: '6.1 inch Super Retina XDR Display',
            Camera: '48MP + 12MP Dual Camera System',
            Processor: 'A16 Bionic Chip, 6 Core Processor',
            Storage: '128 GB ROM',
          },
        },
      ],
      [
        'itm3316238b9e69d',
        {
          title: 'Sony Bravia 138.8 cm (55 inch) 4K Ultra HD Smart Google TV',
          brand: 'Sony',
          model: 'KD-55X74L',
          category: 'Televisions & Home Entertainment',
          price: 54990,
          mrp: 99900,
          currency: 'INR',
          rating: 4.8,
          reviewCount: 8900,
          inStock: true,
          seller: { name: 'IndiFlashMart', isAuthorized: true },
          delivery: 'FREE Delivery',
          image: 'https://rukminim2.flixcart.com/image/832/832/xif0q/television/h/d/8/-original-imagss995gtyz5gy.jpeg',
          specifications: {
            ScreenSize: '55 inch (138.8 cm)',
            Resolution: 'Ultra HD (4K) 3840 x 2160',
            OperatingSystem: 'Google TV',
            SoundOutput: '20 W',
          },
        },
      ],
    ]);
  }

  /**
   * Extract Flipkart Product Identifier (PID query param or itm path)
   * @param {URL | string} url
   * @returns {{ identifierType: 'PID' | 'FSN', identifier: string } | null}
   */
  extractProductIdentifier(url) {
    try {
      const urlStr = typeof url === 'string' ? url : url.href;

      // Pattern 1: query parameter pid=... (e.g. pid=MOBFWQ6BRGFGG2FD)
      const pidParamMatch = urlStr.match(/[?&]pid=([a-zA-Z0-9_-]+)/i);
      if (pidParamMatch && pidParamMatch[1]) {
        return {
          identifierType: 'PID',
          identifier: pidParamMatch[1].toUpperCase(),
        };
      }

      // Pattern 2: path pattern /p/itm... or /p/MOB...
      const pathMatch = urlStr.match(/\/p\/([a-zA-Z0-9]+)/i);
      if (pathMatch && pathMatch[1]) {
        return {
          identifierType: 'FSN',
          identifier: pathMatch[1],
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Normalize Flipkart URL into clean canonical format
   * @param {URL | string} url
   * @returns {string}
   */
  normalizeUrl(url) {
    const extracted = this.extractProductIdentifier(url);
    if (!extracted) {
      return typeof url === 'string' ? url : url.href;
    }

    return `https://www.flipkart.com/p/${extracted.identifier}?pid=${extracted.identifier}`;
  }

  /**
   * Retrieve normalized product details for Flipkart PID
   * @param {string} identifier
   * @param {object} [options]
   * @returns {Promise<object>}
   */
  async getProduct(identifier, options = {}) {
    const pid = identifier;
    const mockData =
      this.mockCatalog.get(pid.toUpperCase()) || this.mockCatalog.get(pid);

    if (mockData) {
      return {
        identifier: pid,
        identifierType: 'PID',
        retailer: this.name,
        retailerSlug: this.slug,
        ...mockData,
        canonicalUrl: `https://www.flipkart.com/p/${pid}?pid=${pid}`,
        lastAuditedAt: new Date().toISOString(),
      };
    }

    // Generic fallback
    return {
      identifier: pid,
      identifierType: 'PID',
      retailer: this.name,
      retailerSlug: this.slug,
      title: `Flipkart Verified Listing (${pid})`,
      brand: 'Generic Brand',
      model: pid,
      category: 'Electronics & Mobiles',
      price: 24999,
      mrp: 29999,
      currency: options.currency || this.currency,
      rating: 4.4,
      reviewCount: 350,
      inStock: true,
      seller: { name: 'Flipkart Verified Seller', isAuthorized: true },
      delivery: 'Standard Delivery',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
      canonicalUrl: `https://www.flipkart.com/p/${pid}?pid=${pid}`,
      specifications: { ProductID: pid },
      lastAuditedAt: new Date().toISOString(),
    };
  }

  async searchProduct(query, options = {}) {
    return Array.from(this.mockCatalog.entries()).map(([pid, data]) => ({
      identifier: pid,
      identifierType: 'PID',
      retailer: this.name,
      ...data,
    }));
  }
}

export default FlipkartAdapter;
