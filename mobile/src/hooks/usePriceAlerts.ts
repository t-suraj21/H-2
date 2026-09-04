import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  alertApi,
  PriceAlertItem,
  CreateAlertPayload,
  ApiResponse,
} from '../services/productApi';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';

const STORAGE_KEY_ALERTS = 'hl2_cached_price_alerts';

const DEMO_FALLBACK_ALERTS: PriceAlertItem[] = [
  {
    id: 'mock-alert-1',
    productId: 'p1',
    title: 'Sony WH-1000XM5 Wireless Headphones',
    brand: 'Sony',
    model: 'WH-1000XM5',
    category: 'Headphones & Audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    targetPrice: 22000,
    currentPrice: 24999,
    status: 'ACTIVE',
    triggered: false,
    isTargetMet: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-alert-2',
    productId: 'p2',
    title: 'Apple MacBook Air M3 (16GB RAM, 512GB SSD)',
    brand: 'Apple',
    model: 'MacBook Air M3',
    category: 'Computers & Laptops',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
    targetPrice: 115000,
    currentPrice: 114900,
    status: 'TRIGGERED',
    triggered: true,
    triggeredAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    triggeredPrice: 114900,
    isTargetMet: true,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
];

export interface UsePriceAlertsResult {
  alerts: PriceAlertItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  count: number;
  activeCount: number;
  triggeredCount: number;
  fetchAlerts: (isRefresh?: boolean) => Promise<void>;
  createAlert: (payload: CreateAlertPayload) => Promise<ApiResponse<PriceAlertItem>>;
  deleteAlert: (id: string) => Promise<ApiResponse<{ id: string }>>;
  toggleAlertStatus: (id: string) => Promise<ApiResponse<PriceAlertItem>>;
  getFilteredAlerts: (filter: 'ALL' | 'ACTIVE' | 'TRIGGERED') => PriceAlertItem[];
  checkLiveAlerts: () => Promise<void>;
}

export const usePriceAlerts = (autoFetch = true): UsePriceAlertsResult => {
  const { token, isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlertItem[]>(DEMO_FALLBACK_ALERTS);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCache = useCallback(async () => {
    try {
      const cached = await storage.getItem<PriceAlertItem[]>(STORAGE_KEY_ALERTS);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setAlerts(cached);
      }
    } catch {
      // Ignore cache error
    }
  }, []);

  const fetchAlerts = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        if (isAuthenticated && token) {
          const res = await alertApi.getAlerts(token);
          if (res.success && Array.isArray(res.data)) {
            setAlerts(res.data);
            await storage.setItem(STORAGE_KEY_ALERTS, res.data);
          } else {
            await loadCache();
          }
        } else {
          await loadCache();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch alerts';
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
      fetchAlerts();
    }
  }, [autoFetch, fetchAlerts]);

  const createAlert = useCallback(
    async (payload: CreateAlertPayload): Promise<ApiResponse<PriceAlertItem>> => {
      setError(null);
      try {
        if (isAuthenticated && token) {
          const res = await alertApi.createAlert(payload, token);
          if (res.success && res.data) {
            setAlerts((prev) => [res.data!, ...prev.filter((a) => a.id !== res.data!.id)]);
            return res;
          }
        }

        // Local demo creation
        const current = payload.productData?.price || 0;
        const newLocalAlert: PriceAlertItem = {
          id: 'local_alert_' + Date.now(),
          productId: payload.productId || 'p_' + Date.now(),
          title: payload.productData?.title || 'Custom Tracked Product',
          brand: payload.productData?.brand || 'HL²',
          model: payload.productData?.model || '',
          category: payload.productData?.category || 'General',
          image: payload.productData?.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80',
          targetPrice: payload.targetPrice,
          currentPrice: current,
          status: 'ACTIVE',
          triggered: current > 0 && current <= payload.targetPrice,
          isTargetMet: current > 0 && current <= payload.targetPrice,
          createdAt: new Date().toISOString(),
        };

        const updated = [newLocalAlert, ...alerts];
        setAlerts(updated);
        await storage.setItem(STORAGE_KEY_ALERTS, updated);

        return {
          success: true,
          message: 'Price alert created successfully',
          data: newLocalAlert,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error creating alert';
        setError(msg);
        return { success: false, message: msg };
      }
    },
    [isAuthenticated, token, alerts]
  );

  const deleteAlert = useCallback(
    async (id: string): Promise<ApiResponse<{ id: string }>> => {
      try {
        if (isAuthenticated && token) {
          await alertApi.deleteAlert(id, token);
        }

        const updated = alerts.filter((a) => a.id !== id);
        setAlerts(updated);
        await storage.setItem(STORAGE_KEY_ALERTS, updated);

        return { success: true, message: 'Alert deleted', data: { id } };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error deleting alert';
        setError(msg);
        return { success: false, message: msg };
      }
    },
    [isAuthenticated, token, alerts]
  );

  const toggleAlertStatus = useCallback(
    async (id: string): Promise<ApiResponse<PriceAlertItem>> => {
      try {
        const target = alerts.find((a) => a.id === id);
        const newStatus = target?.status === 'ACTIVE' ? 'DISMISSED' : 'ACTIVE';

        if (isAuthenticated && token) {
          const res = await alertApi.toggleAlertStatus(id, newStatus, token);
          if (res.success && res.data) {
            setAlerts((prev) => prev.map((a) => (a.id === id ? res.data! : a)));
            return res;
          }
        }

        const updated = alerts.map((a) => {
          if (a.id === id) {
            return {
              ...a,
              status: newStatus as PriceAlertItem['status'],
            };
          }
          return a;
        });

        setAlerts(updated);
        await storage.setItem(STORAGE_KEY_ALERTS, updated);
        const item = updated.find((a) => a.id === id);

        return {
          success: true,
          message: `Alert ${newStatus === 'ACTIVE' ? 'activated' : 'paused'}`,
          data: item,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error toggling alert status';
        setError(msg);
        return { success: false, message: msg };
      }
    },
    [isAuthenticated, token, alerts]
  );

  const checkLiveAlerts = useCallback(async () => {
    try {
      if (isAuthenticated && token) {
        const res = await alertApi.checkPriceAlerts(token);
        if (res.success) {
          await fetchAlerts(true);
        }
      }
    } catch {
      // Ignore background check errors
    }
  }, [isAuthenticated, token, fetchAlerts]);

  const activeCount = useMemo(() => {
    return alerts.filter((a) => a.status === 'ACTIVE' && !a.triggered).length;
  }, [alerts]);

  const triggeredCount = useMemo(() => {
    return alerts.filter((a) => a.triggered || a.status === 'TRIGGERED').length;
  }, [alerts]);

  const getFilteredAlerts = useCallback(
    (filter: 'ALL' | 'ACTIVE' | 'TRIGGERED'): PriceAlertItem[] => {
      if (filter === 'ACTIVE') {
        return alerts.filter((a) => a.status === 'ACTIVE' && !a.triggered);
      }
      if (filter === 'TRIGGERED') {
        return alerts.filter((a) => a.triggered || a.status === 'TRIGGERED');
      }
      return alerts;
    },
    [alerts]
  );

  return {
    alerts,
    loading,
    refreshing,
    error,
    count: alerts.length,
    activeCount,
    triggeredCount,
    fetchAlerts,
    createAlert,
    deleteAlert,
    toggleAlertStatus,
    getFilteredAlerts,
    checkLiveAlerts,
  };
};
