/**
 * HL² Mongoose Models Barrel Export
 */

export { User } from './User.js';
export { Retailer } from './Retailer.js';
export { Product } from './Product.js';
export { ProductOffer } from './ProductOffer.js';
export { PriceHistory } from './PriceHistory.js';
export { Watchlist } from './Watchlist.js';
export { PriceAlert } from './PriceAlert.js';

import { User } from './User.js';
import { Retailer } from './Retailer.js';
import { Product } from './Product.js';
import { ProductOffer } from './ProductOffer.js';
import { PriceHistory } from './PriceHistory.js';
import { Watchlist } from './Watchlist.js';
import { PriceAlert } from './PriceAlert.js';

export const models = {
  User,
  Retailer,
  Product,
  ProductOffer,
  PriceHistory,
  Watchlist,
  PriceAlert,
};

export default models;
