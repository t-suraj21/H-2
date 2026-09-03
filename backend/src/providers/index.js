/**
 * Providers & Adapters Barrel Export
 */

export { BaseRetailerAdapter } from './adapters/BaseAdapter.js';
export { AmazonAdapter } from './adapters/AmazonAdapter.js';
export { FlipkartAdapter } from './adapters/FlipkartAdapter.js';
export { CromaAdapter } from './adapters/CromaAdapter.js';
export { AdapterRegistry, adapterRegistry } from './AdapterRegistry.js';

import { adapterRegistry } from './AdapterRegistry.js';

export const providers = {
  adapterRegistry,
};

export default providers;
