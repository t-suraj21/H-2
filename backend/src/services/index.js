/**
 * Services Barrel Export
 */

export { UrlAnalyzerService, urlAnalyzerService } from './urlAnalyzer.service.js';
export {
  ProductNormalizer,
  productNormalizer,
  VariantNormalizer,
  variantNormalizer,
  ProductIdentifierService,
  productIdentifierService,
} from './normalizer/index.js';
export { ProductMatcher, productMatcher, MATCH_STATUS } from './matcher/index.js';
export { PriceComparisonEngine, priceComparisonEngine, PRICE_STATUS } from './comparison/index.js';
export { PriceHistoryService, priceHistoryService, SearchHistoryService, searchHistoryService } from './history/index.js';
export { WatchlistService, watchlistService } from './watchlist.service.js';
export { AlertEvaluationService, alertEvaluationService } from './alert/index.js';
export { NotificationService, notificationService } from './notification/index.js';
export { AffiliateUrlService, affiliateUrlService } from './affiliate/index.js';

import { urlAnalyzerService } from './urlAnalyzer.service.js';
import { productNormalizer } from './normalizer/ProductNormalizer.js';
import { variantNormalizer } from './normalizer/VariantNormalizer.js';
import { productIdentifierService } from './normalizer/ProductIdentifierService.js';
import { productMatcher } from './matcher/ProductMatcher.js';
import { priceComparisonEngine } from './comparison/PriceComparisonEngine.js';
import { priceHistoryService } from './history/PriceHistoryService.js';
import { searchHistoryService } from './history/SearchHistoryService.js';
import { watchlistService } from './watchlist.service.js';
import { alertEvaluationService } from './alert/AlertEvaluationService.js';
import { notificationService } from './notification/NotificationService.js';
import { affiliateUrlService } from './affiliate/AffiliateUrlService.js';

export const services = {
  urlAnalyzer: urlAnalyzerService,
  productNormalizer,
  variantNormalizer,
  productIdentifierService,
  productMatcher,
  priceComparisonEngine,
  priceHistory: priceHistoryService,
  searchHistory: searchHistoryService,
  watchlist: watchlistService,
  alertEvaluation: alertEvaluationService,
  notification: notificationService,
  affiliateUrl: affiliateUrlService,
};

export default services;
