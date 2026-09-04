import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  watchlistApi,
  WatchlistItem,
  AddToWatchlistPayload,
  ApiResponse,
} from '../services/productApi';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';

const STORAGE_KEY_WATCHLIST = 'hl2_cached_watchlist';

const DEMO_FALLBACK_WATCHLIST: WatchlistItem[] = [
  {
    id: 'mock-1',
    productId: 'p1',
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    brand: 'Sony',
    model: 'WH-1000XM5',
    category: 'Headphones & Audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    currentPrice: 24999,
    lowestRecordedPrice: 23999,
    highestRecordedPrice: 29990,
    initialPrice: 26999,
    targetPrice: 25000,
    isTargetReached: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    productId: 'p2',
    title: 'Apple MacBook Air 13-inch M3 (16GB RAM, 512GB SSD Storage)',
    brand: 'Apple',
    model: 'MacBook Air M3',
    category: 'Computers & Laptops',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
    currentPrice: 114900,
    lowestRecordedPrice: 109900,
    highestRecordedPrice: 124900,
    initialPrice: 119900,
    targetPrice: 110000,
    isTargetReached: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export interface UseWatchlistResult {
  watchlist: WatchlistItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  count: number;
  targetReachedCount: number;
  priceDropCount: number;
  fetchWatchlist: (isRefresh?: boolean) => Promise<void>;
  addToWatchlist: (payload: AddToWatchlistPayload) => Promise<ApiResponse<WatchlistItem>>;
  removeFromWatchlist: (id: string) => Promise<ApiResponse<{ id: string }>>;
  updateTargetPrice: (id: string, targetPrice: number, notes?: string) => Promise<ApiResponse<WatchlistItem>>;
  isInWatchlist: (productIdOrTitle: string) => boolean;
  getFilteredWatchlist: (filter: 'ALL' | 'TARGET_REACHED' | 'PRICE_DROPS') => WatchlistItem[];
}

export const useWatchlist = (autoFetch = true): UseWatchlistResult => {
  const { token, isAuthenticated } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEMO_FALLBACK_WATCHLIST);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached watchlist from local storage
  const loadCache = useCallback(async () => {
    try {
      const cached = await storage.getItem<WatchlistItem[]>(STORAGE_KEY_WATCHLIST);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setWatchlist(cached);
      }
    } catch {
      // Ignore cache load errors
    }
  }, []);

  const fetchWatchlist = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        if (isAuthenticated && token) {
          const res = await watchlistApi.getWatchlist(token);
          if (res.success && Array.isArray(res.data)) {
            setWatchlist(res.data);
            await storage.setItem(STORAGE_KEY_WATCHLIST, res.data);
          } else {
            // Keep current / demo
            await loadCache();
          }
        } else {
          await loadCache();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch watchlist';
        setError(msg);
        await loadCache();
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, token, loadCache]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchWatchlist();
    }
  }, [autoFetch, fetchWatchlist]);

  const addToWatchlist = useCallback(
    async (payload: AddToWatchlistPayload): Promise<ApiResponse<WatchlistItem>> => {
      setError(null);
      try {
        if (isAuthenticated && token) {
          const res = await watchlistApi.addToWatchlist(payload, token);
          if (res.success && res.data) {
            setWatchlist((prev) => [res.data!, ...prev.filter((i) => i.id !== res.data!.id)]);
            return res;
          }
        }

        // Offline / Demo fallback item creation
        const newLocalItem: WatchlistItem = {
          id: 'local_' + Date.now(),
          productId: payload.productId || 'p_' + Date.now(),
          title: payload.productData?.title || 'Tracked Product',
          brand: payload.productData?.brand || 'HL²',
          model: payload.productData?.model || '',
          category: payload.productData?.category || 'General',
          image: payload.productData?.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80',
          currentPrice: payload.productData?.price || 0,
          lowestRecordedPrice: payload.productData?.price || 0,
          highestRecordedPrice: payload.productData?.mrp || payload.productData?.price || 0,
          initialPrice: payload.productData?.price || 0,
          targetPrice: payload.targetPrice || null,
          isTargetReached: payload.targetPrice ? (payload.productData?.price || 0) <= payload.targetPrice : false,
          notes: payload.notes,
          createdAt: new Date().toISOString(),
        };

        const updated = [newLocalItem, ...watchlist];
        setWatchlist(updated);
        await storage.setItem(STORAGE_KEY_WATCHLIST, updated);

        return {
          success: true,
          message: 'Added to watchlist successfully',
          data: newLocalItem,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error adding to watchlist';
        setError(msg);
        return { success: false, message: msg };
      }
    },
    [isAuthenticated, token, watchlist]
  );

  const removeFromWatchlist = useCallback(
    async (id: string): Promise<ApiResponse<{ id: string }>> => {
      try {
        if (isAuthenticated && token) {
          await watchlistApi.removeFromWatchlist(id, token);
        }

        const updated = watchlist.filter((item) => item.id !== id);
        setWatchlist(updated);
        await storage.setItem(STORAGE_KEY_WATCHLIST, updated);

        return { success: true, message: 'Removed from watchlist', data: { id } };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error removing item';
        setError(msg);
        return { success: false, message: msg };
      }
    },
    [isAuthenticated, token, watchlist]
  );

  const updateTargetPrice = useCallback(
    async (id: string, targetPrice: number, notes?: string): Promise<ApiResponse<WatchlistItem>> => {
      try {
        if (isAuthenticated && token) {
          const res = await watchlistApi.updateWatchlistItem(id, { targetPrice, notes }, token);
          if (res.success && res.data) {
            setWatchlist((prev) => prev.map((item) => (item.id === id ? res.data! : item)));
            return res;
          }
        }

        const updated = watchlist.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              targetPrice,
              notes: notes !== undefined ? notes : item.notes,
              isTargetReached: item.currentPrice <= targetPrice,
            };
          }
          return item;
        });

        setWatchlist(updated);
        await storage.setItem(STORAGE_KEY_WATCHLIST, updated);
        const item = updated.find((i) => i.id === id);

        return {
          success: true,
          message: 'Target price updated',
          data: item,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error updating target price';
        setError(msg);
        return { success: false, message: msg };
      }
    },
    [isAuthenticated, token, watchlist]
  );

  const isInWatchlist = useCallback(
    (productIdOrTitle: string): boolean => {
      if (!productIdOrTitle) return false;
      const lower = productIdOrTitle.toLowerCase().trim();
      return watchlist.some(
        (item) =>
          item.productId.toLowerCase() === lower ||
          item.id.toLowerCase() === lower ||
          item.title.toLowerCase().includes(lower)
      );
    },
    [watchlist]
  );

  const targetReachedCount = useMemo(() => {
    return watchlist.filter((item) => item.isTargetReached).length;
  }, [watchlist]);

  const priceDropCount = useMemo(() => {
    return watchlist.filter((item) => item.currentPrice < item.initialPrice).length;
  }, [watchlist]);

  const getFilteredWatchlist = useCallback(
    (filter: 'ALL' | 'TARGET_REACHED' | 'PRICE_DROPS'): WatchlistItem[] => {
      if (filter === 'TARGET_REACHED') {
        return watchlist.filter((item) => item.isTargetReached);
      }
      if (filter === 'PRICE_DROPS') {
        return watchlist.filter((item) => item.currentPrice < item.initialPrice);
      }
      return watchlist;
    },
    [watchlist]
  );

  return {
    watchlist,
    loading,
    refreshing,
    error,
    count: watchlist.length,
    targetReachedCount,
    priceDropCount,
    fetchWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    updateTargetPrice,
    isInWatchlist,
    getFilteredWatchlist,
  };
};
