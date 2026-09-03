/**
 * History Barrel Export (Price History & Search History)
 */

export { PriceHistoryService, priceHistoryService } from './PriceHistoryService.js';
export { SearchHistoryService, searchHistoryService } from './SearchHistoryService.js';

import { priceHistoryService } from './PriceHistoryService.js';
import { searchHistoryService } from './SearchHistoryService.js';

export const historyServices = {
  priceHistory: priceHistoryService,
  searchHistory: searchHistoryService,
};

export default historyServices;
