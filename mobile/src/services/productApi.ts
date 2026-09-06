import { authConfig } from '../auth/authConfig';

export interface AnalyzedProductData {
  originalUrl: string;
  normalizedUrl: string;
  retailer: {
    name: string;
    slug: string;
    domain: string;
    countryCode: string;
    currency: string;
  };
  identifier: {
    type: string;
    value: string;
  };
  product: {
    title: string;
    brand: string;
    model?: string;
    category: string;
    price: number;
    mrp?: number;
    discount?: {
      amount: number;
      percentage: number;
    };
    currency: string;
    inStock: boolean;
    rating: number;
    reviewCount: number;
    seller: {
      name: string;
      isAuthorized: boolean;
    };
    delivery: string;
    image?: string;
    specifications: Record<string, string>;
  };
  analysis: {
    dealScore: number;
    verdict: string;
    priceAssessment: string;
    verifiedAt: string;
  };
}

export interface RetailerOffer {
  retailer: string;
  retailerSlug?: string;
  title?: string;
  url?: string;
  destinationUrl?: string;
  isAffiliate?: boolean;
  trackingMetadata?: Record<string, any>;
  price: number;
  mrp?: number;
  deliveryFee?: number;
  effectivePrice: number;
  currency: string;
  availability: boolean;
  status: 'VERIFIED' | 'UNAVAILABLE' | 'STALE' | 'ESTIMATED';
  seller?: {
    name: string;
    isAuthorized: boolean;
  };
  lastChecked?: string;
}

export interface ComparisonResultData {
  product: {
    title: string;
    brand: string;
    model?: string;
    canonicalProductName: string;
    category: string;
    image?: string | null;
  };
  lowest: RetailerOffer | null;
  highest: RetailerOffer | null;
  averagePrice: number;
  savings: number;
  savingsPercentage: number;
  availableRetailers: Array<{
    retailer: string;
    effectivePrice: number;
    currency: string;
    status: string;
    url: string;
  }>;
  unavailableRetailers: Array<{
    retailer: string;
    status: string;
    url: string;
  }>;
  offers: RetailerOffer[];
  comparisonTimestamp: string;
}

export interface PriceChangeDelta {
  amount: number;
  percentage: number;
  direction: 'UP' | 'DOWN' | 'NO_CHANGE';
  previousPrice: number;
  recordedAt: string;
}

export interface PriceTimelinePoint {
  timestamp: string;
  price: number;
  effectivePrice: number;
  mrp?: number | null;
  inStock: boolean;
  retailer: {
    name: string;
    slug: string;
  };
}

export interface PriceHistoryData {
  productId: string;
  period: string;
  currentPrice: number;
  lowestRecordedPrice: number;
  highestRecordedPrice: number;
  averagePrice: number;
  change7d: PriceChangeDelta | null;
  change30d: PriceChangeDelta | null;
  change90d: PriceChangeDelta | null;
  hasSufficientData: boolean;
  pointsCount: number;
  timeline: PriceTimelinePoint[];
  generatedAt: string;
}

export interface WatchlistItem {
  id: string;
  productId: string;
  title: string;
  brand: string;
  model: string;
  category: string;
  image: string;
  currentPrice: number;
  lowestRecordedPrice: number;
  highestRecordedPrice: number;
  initialPrice: number;
  targetPrice: number | null;
  isTargetReached: boolean;
  notes?: string;
  createdAt: string;
}

export interface AddToWatchlistPayload {
  productId?: string;
  targetPrice?: number;
  notes?: string;
  productData?: {
    title?: string;
    brand?: string;
    model?: string;
    category?: string;
    image?: string;
    price?: number;
    mrp?: number;
  };
}

export interface PriceAlertItem {
  id: string;
  productId: string;
  title: string;
  brand: string;
  model: string;
  category: string;
  image: string;
  targetPrice: number;
  currentPrice: number;
  status: 'ACTIVE' | 'TRIGGERED' | 'DISMISSED' | 'EXPIRED';
  triggered: boolean;
  triggeredAt?: string | null;
  triggeredPrice?: number | null;
  isTargetMet: boolean;
  notificationChannels?: {
    push: boolean;
    email: boolean;
  };
  createdAt: string;
}

export interface CreateAlertPayload {
  productId?: string;
  targetPrice: number;
  retailerId?: string;
  notificationChannels?: {
    push: boolean;
    email: boolean;
  };
  productData?: {
    title?: string;
    brand?: string;
    model?: string;
    category?: string;
    image?: string;
    price?: number;
    mrp?: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | object;
}

const API_BASE_URL = authConfig.apiBaseUrl || process.env.EXPO_PUBLIC_API_URL || 'http://192.168.121.121:5001/api';

export const productApi = {
  /**
   * Analyze a product URL
   */
  async analyzeUrl(url: string): Promise<ApiResponse<AnalyzedProductData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to connect to HL² analysis engine.',
      };
    }
  },

  /**
   * Compare multiple retailer offers for a product
   */
  async compareOffers(
    product: object,
    offers: object[]
  ): Promise<ApiResponse<ComparisonResultData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ product, offers }),
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to compare product offers.',
      };
    }
  },

  /**
   * Get price history and trend analytics for a product
   */
  async getPriceHistory(
    productId: string,
    period: string = '30D'
  ): Promise<ApiResponse<PriceHistoryData>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/products/${encodeURIComponent(productId)}/history?period=${encodeURIComponent(
          period
        )}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to load price history.',
      };
    }
  },

  /**
   * Search real-time multi-store pricing across supported retailers
   */
  async getRealtimePricing(
    query: string
  ): Promise<ApiResponse<ComparisonResultData>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to retrieve real-time pricing.',
      };
    }
  },
};

export const watchlistApi = {
  /**
   * Get all watched products for authenticated user
   */
  async getWatchlist(token?: string | null): Promise<ApiResponse<WatchlistItem[]>> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/watchlist`, {
        method: 'GET',
        headers,
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to retrieve watchlist.',
      };
    }
  },

  /**
   * Add a product to watchlist or update target price
   */
  async addToWatchlist(
    payload: AddToWatchlistPayload,
    token?: string | null
  ): Promise<ApiResponse<any>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/watchlist`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to add product to watchlist.',
      };
    }
  },

  /**
   * Update a watchlist item (target price, notes)
   */
  async updateWatchlistItem(
    id: string,
    payload: { targetPrice?: number; notes?: string },
    token?: string | null
  ): Promise<ApiResponse<WatchlistItem>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/watchlist/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to update watchlist item.',
      };
    }
  },

  /**
   * Remove a product from watchlist
   */
  async removeFromWatchlist(
    id: string,
    token?: string | null
  ): Promise<ApiResponse<{ id: string; removed: boolean }>> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/watchlist/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to remove from watchlist.',
      };
    }
  },
};

export const alertApi = {
  /**
   * Get all price alerts for authenticated user
   */
  async getAlerts(token?: string | null): Promise<ApiResponse<PriceAlertItem[]>> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/alerts`, {
        method: 'GET',
        headers,
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to retrieve price alerts.',
      };
    }
  },

  /**
   * Create a new price drop alert
   */
  async createAlert(
    payload: CreateAlertPayload,
    token?: string | null
  ): Promise<ApiResponse<any>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/alerts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to create price alert.',
      };
    }
  },

  /**
   * Toggle alert status between active and dismissed
   */
  async toggleAlertStatus(
    id: string,
    status: string,
    token?: string | null
  ): Promise<ApiResponse<PriceAlertItem>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/alerts/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to toggle alert status.',
      };
    }
  },

  /**
   * Trigger an on-demand check of live price alerts
   */
  async checkPriceAlerts(
    token?: string | null
  ): Promise<ApiResponse<{ checkedCount: number; triggeredCount: number }>> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/alerts/check`, {
        method: 'POST',
        headers,
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to check price alerts.',
      };
    }
  },

  /**
   * Delete a price alert
   */
  async deleteAlert(
    id: string,
    token?: string | null
  ): Promise<ApiResponse<{ id: string; deleted: boolean }>> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/alerts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to delete price alert.',
      };
    }
  },
};

export interface NotificationLogItem {
  id: string;
  title: string;
  body: string;
  product?: {
    _id: string;
    name: string;
    brand: string;
    model: string;
    image: string;
  };
  retailer: string;
  currentPrice: number;
  targetPrice: number;
  channel: string;
  status: string;
  sentAt: string;
}

export interface RegisterPushTokenPayload {
  token: string;
  platform?: 'ios' | 'android' | 'web' | 'unknown';
  deviceId?: string;
}

export const notificationApi = {
  /**
   * Register mobile device push token on backend
   */
  async registerPushToken(
    payload: RegisterPushTokenPayload,
    token?: string | null
  ): Promise<ApiResponse<any>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/register-token`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to register push token.',
      };
    }
  },

  /**
   * Get user notification delivery history
   */
  async getNotificationHistory(
    token?: string | null
  ): Promise<ApiResponse<NotificationLogItem[]>> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/history`, {
        method: 'GET',
        headers,
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to retrieve notification history.',
      };
    }
  },
};

export interface BuyNowPayload {
  url: string;
  retailer?: string;
  productId?: string;
  offerId?: string;
  campaign?: string;
}

export interface BuyNowResult {
  originalUrl: string;
  destinationUrl: string;
  retailer: string;
  isAffiliate: boolean;
  trackingMetadata: Record<string, any>;
}

export const buyNowApi = {
  /**
   * Request backend to generate an authorized destination / affiliate URL
   */
  async getDestinationUrl(
    payload: BuyNowPayload,
    token?: string | null
  ): Promise<ApiResponse<BuyNowResult>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/products/buy-now`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to generate Buy Now destination URL.',
      };
    }
  },
};

export interface SearchHistoryItem {
  id: string;
  title: string;
  url: string;
  retailer: string;
  brand: string;
  category: string;
  lowestPrice: number;
  image?: string | null;
  productId?: string | null;
  searchedAt: string;
}

export interface RecordSearchPayload {
  title: string;
  url: string;
  retailer?: string;
  brand?: string;
  category?: string;
  lowestPrice?: number;
  image?: string | null;
  productId?: string | null;
}

export const searchHistoryApi = {
  /**
   * Get user's recent product searches
   */
  async getRecentSearches(
    limit: number = 20,
    token?: string | null
  ): Promise<ApiResponse<SearchHistoryItem[]>> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/search-history?limit=${limit}`, {
        method: 'GET',
        headers,
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to retrieve search history.',
      };
    }
  },

  /**
   * Record a new search item
   */
  async recordSearch(
    payload: RecordSearchPayload,
    token?: string | null
  ): Promise<ApiResponse<SearchHistoryItem>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/search-history`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to record search history.',
      };
    }
  },

  /**
   * Remove a single search item
   */
  async removeSearchItem(
    id: string,
    token?: string | null
  ): Promise<ApiResponse<{ id: string; removed: boolean }>> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/search-history/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to remove search item.',
      };
    }
  },

  /**
   * Clear all search history
   */
  async clearSearchHistory(
    token?: string | null
  ): Promise<ApiResponse<{ deletedCount: number; cleared: boolean }>> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/search-history`, {
        method: 'DELETE',
        headers,
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to clear search history.',
      };
    }
  },
};



