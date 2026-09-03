/**
 * BaseRetailerAdapter
 * Abstract interface for all retailer-specific e-commerce adapters in HL²
 */
export class BaseRetailerAdapter {
  /**
   * @param {object} config
   * @param {string} config.name - Display name of retailer (e.g. 'Amazon')
   * @param {string} config.slug - Unique slug identifier (e.g. 'amazon')
   * @param {string[]} config.domains - Array of handled domain names (e.g. ['amazon.com', 'amazon.in'])
   * @param {string} config.countryCode - ISO country code (e.g. 'US', 'IN')
   * @param {string} config.currency - Default currency symbol/code (e.g. 'USD', 'INR')
   */
  constructor({ name, slug, domains = [], countryCode = 'US', currency = 'USD' }) {
    if (new.target === BaseRetailerAdapter) {
      throw new TypeError('Cannot construct BaseRetailerAdapter instances directly');
    }
    this.name = name;
    this.slug = slug;
    this.domains = domains.map((d) => d.toLowerCase());
    this.countryCode = countryCode;
    this.currency = currency;
  }

  /**
   * Check if this adapter can handle the given URL
   * @param {URL | string} parsedUrl
   * @returns {boolean}
   */
  canHandle(parsedUrl) {
    try {
      const urlObj = typeof parsedUrl === 'string' ? new URL(parsedUrl) : parsedUrl;
      const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');
      return this.domains.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * Extract retailer-specific product identifier (ASIN, PID, SKU, etc.) from URL
   * @param {URL | string} url
   * @returns {{ identifierType: string, identifier: string } | null}
   */
  extractProductIdentifier(url) {
    throw new Error(`extractProductIdentifier() must be implemented in ${this.constructor.name}`);
  }

  /**
   * Normalize a product URL to its canonical format without tracking tags
   * @param {URL | string} url
   * @returns {string}
   */
  normalizeUrl(url) {
    throw new Error(`normalizeUrl() must be implemented in ${this.constructor.name}`);
  }

  /**
   * Retrieve normalized product details for a specific identifier
   * @param {string} identifier - Product identifier (e.g. ASIN)
   * @param {object} [options]
   * @returns {Promise<object>}
   */
  async getProduct(identifier, options = {}) {
    throw new Error(`getProduct() must be implemented in ${this.constructor.name}`);
  }

  /**
   * Search for products on this retailer
   * @param {string} query
   * @param {object} [options]
   * @returns {Promise<object[]>}
   */
  async searchProduct(query, options = {}) {
    throw new Error(`searchProduct() must be implemented in ${this.constructor.name}`);
  }
}

export default BaseRetailerAdapter;
