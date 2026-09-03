/**
 * Normalizer Barrel Export
 */

export { VariantNormalizer, variantNormalizer } from './VariantNormalizer.js';
export { ProductIdentifierService, productIdentifierService } from './ProductIdentifierService.js';
export { ProductNormalizer, productNormalizer } from './ProductNormalizer.js';

import { productNormalizer } from './ProductNormalizer.js';
import { variantNormalizer } from './VariantNormalizer.js';
import { productIdentifierService } from './ProductIdentifierService.js';

export default {
  productNormalizer,
  variantNormalizer,
  productIdentifierService,
};
