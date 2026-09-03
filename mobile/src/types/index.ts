export interface HealthResponse {
  success: boolean;
  message: string;
}

export interface ProductItem {
  id: string;
  title: string;
  brand?: string;
  category?: string;
  bestPrice: number;
  originalPrice?: number;
  discount?: string;
  store: string;
  rating?: string;
  inStock?: boolean;
}

export interface StoreOffer {
  store: string;
  price: number;
  shipping: string;
  inStock: boolean;
  sellerRating: string;
  isBestDeal?: boolean;
  condition?: string;
  url?: string;
}

export interface PriceAlertItem {
  id: string;
  title: string;
  currentPrice: number;
  targetPrice: number;
  active: boolean;
  lastTriggered?: string;
}

export interface WatchlistItem {
  id: string;
  title: string;
  currentPrice: number;
  targetPrice: number;
  priceDrop?: string | null;
  store: string;
  hasDropped: boolean;
  inStock: boolean;
}
