import { Document, Model, Types } from 'mongoose';

/**
 * User Interface & Model Types
 */
export interface IUserPreferences {
  currency: 'USD' | 'INR' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  countryCode: string;
  notifications: {
    email: boolean;
    push: boolean;
    minPriceDropPercentage: number;
  };
  preferredRetailers: Types.ObjectId[];
}

export interface IUser {
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'pro' | 'admin';
  tier: 'free' | 'pro' | 'enterprise';
  avatar?: string | null;
  preferences: IUserPreferences;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}
export type UserModel = Model<IUserDocument>;

/**
 * Retailer Interface & Model Types
 */
export interface IRetailerScrapingConfig {
  rateLimitRequestsPerMin: number;
  headers: Record<string, string>;
  selectorEngine: string;
  supportsLiveStock: boolean;
}

export interface IRetailer {
  name: string;
  slug: string;
  websiteUrl: string;
  logoUrl?: string | null;
  affiliateParam?: string | null;
  countryCode: string;
  currency: string;
  reliabilityRating: number;
  isScrapable: boolean;
  isActive: boolean;
  scrapingConfig: IRetailerScrapingConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRetailerDocument extends IRetailer, Document {}
export type RetailerModel = Model<IRetailerDocument>;

/**
 * Product Interface & Model Types
 */
export interface IProductVariant {
  variantId: string;
  name: string;
  sku?: string;
  color?: string | null;
  size?: string | null;
  storage?: string | null;
  image?: string | null;
  attributes: Record<string, string>;
}

export interface IRetailerSpecificId {
  retailer: Types.ObjectId;
  identifier: string;
  url?: string;
}

export interface IProductIdentifiers {
  sku?: string;
  asin?: string;
  gtin?: string;
  mpn?: string;
  retailerSpecificIds: IRetailerSpecificId[];
}

export interface IProduct {
  name: string;
  brand: string;
  model?: string | null;
  category: string;
  subcategory?: string | null;
  description?: string;
  image: string;
  images: string[];
  identifiers: IProductIdentifiers;
  variants: IProductVariant[];
  specifications: Record<string, unknown>;
  rating: {
    average: number;
    count: number;
  };
  lowestRecordedPrice?: number | null;
  highestRecordedPrice?: number | null;
  currentLowestOffer?: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductDocument extends IProduct, Document {}
export type ProductModel = Model<IProductDocument>;

/**
 * ProductOffer Interface & Model Types
 */
export interface IOfferSeller {
  name: string;
  rating?: number | null;
  isAuthorized: boolean;
  isFulfilledByRetailer: boolean;
}

export interface IOfferAvailability {
  status: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER' | 'BACKORDER' | 'UNKNOWN';
  stockQuantity?: number | null;
  shippingEstimate?: string;
}

export interface IProductOffer {
  product: Types.ObjectId;
  retailer: Types.ObjectId;
  title: string;
  url: string;
  price: number;
  mrp?: number | null;
  discount: {
    percentage: number;
    amount: number;
  };
  deliveryFee: number;
  isFreeDelivery: boolean;
  effectivePrice: number;
  seller: IOfferSeller;
  availability: IOfferAvailability;
  returnPolicy: {
    returnDays: number;
    isFreeReturn: boolean;
  };
  coupon: {
    code?: string | null;
    discountAmount: number;
    isApplied: boolean;
  };
  isVerifiedDeal: boolean;
  dealScore: number;
  lastChecked: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductOfferDocument extends IProductOffer, Document {}
export type ProductOfferModel = Model<IProductOfferDocument>;

/**
 * PriceHistory Interface & Model Types
 */
export interface IPriceHistory {
  product: Types.ObjectId;
  retailer: Types.ObjectId;
  price: number;
  mrp?: number | null;
  deliveryFee: number;
  effectivePrice: number;
  inStock: boolean;
  timestamp: Date;
  createdAt: Date;
}

export interface IPriceHistoryDocument extends IPriceHistory, Document {}
export type PriceHistoryModel = Model<IPriceHistoryDocument>;

/**
 * Watchlist Interface & Model Types
 */
export interface IWatchlist {
  user: Types.ObjectId;
  product: Types.ObjectId;
  targetPrice?: number | null;
  initialPrice?: number | null;
  lowestPriceSinceAdded?: number | null;
  notifyOnPriceDrop: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWatchlistDocument extends IWatchlist, Document {}
export type WatchlistModel = Model<IWatchlistDocument>;

/**
 * PriceAlert Interface & Model Types
 */
export interface IPriceAlert {
  user: Types.ObjectId;
  product: Types.ObjectId;
  targetPrice: number;
  retailer?: Types.ObjectId | null;
  notificationChannels: {
    push: boolean;
    email: boolean;
    emailAddress?: string;
  };
  triggered: boolean;
  triggeredAt?: Date | null;
  triggeredPrice?: number | null;
  triggeredOffer?: Types.ObjectId | null;
  autoDeactivateAfterTrigger: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPriceAlertDocument extends IPriceAlert, Document {}
export type PriceAlertModel = Model<IPriceAlertDocument>;
