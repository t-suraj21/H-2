import { AmazonAdapter } from './adapters/AmazonAdapter.js';
import { FlipkartAdapter } from './adapters/FlipkartAdapter.js';
import { CromaAdapter } from './adapters/CromaAdapter.js';

/**
 * AdapterRegistry
 * Central registry managing and routing URLs to retailer adapters in HL²
 */
export class AdapterRegistry {
  constructor() {
    this.adapters = [];
    this.initDefaultAdapters();
  }

  /**
   * Initialize default supported retailer adapters
   */
  initDefaultAdapters() {
    this.register(new AmazonAdapter());
    this.register(new FlipkartAdapter());
    this.register(new CromaAdapter());
  }

  /**
   * Register a new retailer adapter
   * @param {import('./adapters/BaseAdapter').BaseRetailerAdapter} adapter
   */
  register(adapter) {
    this.adapters.push(adapter);
  }

  /**
   * Resolve appropriate adapter for a given URL
   * @param {URL | string} url
   * @returns {import('./adapters/BaseAdapter').BaseRetailerAdapter | null}
   */
  getAdapterForUrl(url) {
    return this.adapters.find((adapter) => adapter.canHandle(url)) || null;
  }

  /**
   * Get adapter by slug
   * @param {string} slug
   * @returns {import('./adapters/BaseAdapter').BaseRetailerAdapter | null}
   */
  getAdapterBySlug(slug) {
    return this.adapters.find((a) => a.slug === slug.toLowerCase()) || null;
  }

  /**
   * Get all registered adapters
   * @returns {import('./adapters/BaseAdapter').BaseRetailerAdapter[]}
   */
  getAllAdapters() {
    return [...this.adapters];
  }

  /**
   * Get list of all supported domains
   * @returns {string[]}
   */
  getSupportedDomains() {
    return this.adapters.flatMap((a) => a.domains);
  }
}

// Global Singleton Registry
export const adapterRegistry = new AdapterRegistry();
export default adapterRegistry;
