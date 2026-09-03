import { BaseRetailerAdapter } from './BaseAdapter.js';

/**
 * CromaAdapter
 * Handles Croma URLs and extracts numeric Product Codes
 */
export class CromaAdapter extends BaseRetailerAdapter {
  constructor() {
    super({
      name: 'Croma',
      slug: 'croma',
      domains: ['croma.com'],
      countryCode: 'IN',
      currency: 'INR',
    });

    this.mockCatalog = new Map([
      [
        '264332',
        {
          title: 'Dell Inspiron 3520 Intel Core i5 12th Gen (16GB RAM, 512GB SSD, Windows 11)',
          brand: 'Dell',
          model: 'Inspiron 3520',
          category: 'Computers & Laptops',
          price: 48990,
          mrp: 68990,
          currency: 'INR',
          rating: 4.6,
          reviewCount: 1420,
          inStock: true,
          seller: { name: 'Croma Electronics by Tata', isAuthorized: true },
          delivery: 'Express 2-Hour Store Pickup / Home Delivery',
          image: 'https://media-ik.croma.com/prod/https://media.croma.com/image/upload/v1688628082/Croma%20Assets/Computers%20Peripherals/Laptops/Images/274438_0_k9q32l.png',
          specifications: {
            Processor: 'Intel Core i5-1235U (12th Gen)',
            RAM: '16 GB DDR4',
            Storage: '512 GB SSD',
            ScreenSize: '15.6 inch Full HD 120Hz',
          },
        },
      ],
      [
        '258941',
        {
          title: 'Samsung 8 kg 5 Star Fully Automatic Front Load Washing Machine',
          brand: 'Samsung',
          model: 'WW80T504DAX1TL',
          category: 'Home Appliances',
          price: 36990,
          mrp: 47990,
          currency: 'INR',
          rating: 4.7,
          reviewCount: 3120,
          inStock: true,
          seller: { name: 'Croma Electronics by Tata', isAuthorized: true },
          delivery: 'FREE Home Delivery & Installation',
          image: 'https://media-ik.croma.com/prod/https://media.croma.com/image/upload/v1688628082/Croma%20Assets/Large%20Appliances/Washers%20and%20Dryers/Images/244332_0_k9q32l.png',
          specifications: {
            Capacity: '8 kg (Suitable for 4-5 Members)',
            StarRating: '5 Star Energy Rating',
            Motor: 'Digital Inverter with Hygiene Steam',
          },
        },
      ],
    ]);
  }

  /**
   * Extract Croma Product Code from URL (/p/264332 or -p-264332)
   * @param {URL | string} url
   * @returns {{ identifierType: 'PRODUCT_CODE', identifier: string } | null}
   */
  extractProductIdentifier(url) {
    try {
      const urlStr = typeof url === 'string' ? url : url.href;

      // Pattern 1: /p/264332 or -p-264332
      const match = urlStr.match(/(?:\/p\/|-p-|\/product\/)([0-9]{5,10})(?:[/?#]|$)/i);
      if (match && match[1]) {
        return {
          identifierType: 'PRODUCT_CODE',
          identifier: match[1],
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Normalize Croma URL to canonical format
   * @param {URL | string} url
   * @returns {string}
   */
  normalizeUrl(url) {
    const extracted = this.extractProductIdentifier(url);
    if (!extracted) {
      return typeof url === 'string' ? url : url.href;
    }

    return `https://www.croma.com/p/${extracted.identifier}`;
  }

  /**
   * Retrieve normalized product data for Croma product code
   * @param {string} identifier
   * @param {object} [options]
   * @returns {Promise<object>}
   */
  async getProduct(identifier, options = {}) {
    const code = identifier;
    const mockData = this.mockCatalog.get(code);

    if (mockData) {
      return {
        identifier: code,
        identifierType: 'PRODUCT_CODE',
        retailer: this.name,
        retailerSlug: this.slug,
        ...mockData,
        canonicalUrl: `https://www.croma.com/p/${code}`,
        lastAuditedAt: new Date().toISOString(),
      };
    }

    // Generic fallback
    return {
      identifier: code,
      identifierType: 'PRODUCT_CODE',
      retailer: this.name,
      retailerSlug: this.slug,
      title: `Croma Verified Electronics Listing (${code})`,
      brand: 'Generic Brand',
      model: code,
      category: 'Electronics & Appliances',
      price: 19990,
      mrp: 24990,
      currency: options.currency || this.currency,
      rating: 4.5,
      reviewCount: 150,
      inStock: true,
      seller: { name: 'Croma Electronics', isAuthorized: true },
      delivery: 'Standard Delivery',
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600',
      canonicalUrl: `https://www.croma.com/p/${code}`,
      specifications: { ProductCode: code },
      lastAuditedAt: new Date().toISOString(),
    };
  }

  async searchProduct(query, options = {}) {
    return Array.from(this.mockCatalog.entries()).map(([code, data]) => ({
      identifier: code,
      identifierType: 'PRODUCT_CODE',
      retailer: this.name,
      ...data,
    }));
  }
}

export default CromaAdapter;
