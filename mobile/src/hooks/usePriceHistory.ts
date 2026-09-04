import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  productApi,
  PriceHistoryData,
  PriceTimelinePoint,
  ApiResponse,
} from '../services/productApi';

export type PriceHistoryPeriod = '7d' | '30d' | '90d' | '1y' | 'all';

export interface UsePriceHistoryResult {
  history: PriceHistoryData | null;
  loading: boolean;
  error: string | null;
  period: PriceHistoryPeriod;
  setPeriod: (p: PriceHistoryPeriod) => void;
  fetchHistory: (productId: string, customPeriod?: PriceHistoryPeriod) => Promise<ApiResponse<PriceHistoryData>>;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  priceTrend: 'FALLING' | 'RISING' | 'STABLE';
  changeAmount: number;
  changePercentage: number;
  timeline: PriceTimelinePoint[];
  hasSufficientData: boolean;
}

export const usePriceHistory = (
  initialProductId?: string,
  initialPeriod: PriceHistoryPeriod = '30d'
): UsePriceHistoryResult => {
  const [history, setHistory] = useState<PriceHistoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(!!initialProductId);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriodState] = useState<PriceHistoryPeriod>(initialPeriod);
  const [currentProductId, setCurrentProductId] = useState<string | undefined>(initialProductId);

  const fetchHistory = useCallback(
    async (
      productId: string,
      customPeriod?: PriceHistoryPeriod
    ): Promise<ApiResponse<PriceHistoryData>> => {
      const activePeriod = customPeriod || period;
      setLoading(true);
      setError(null);
      setCurrentProductId(productId);

      try {
        const res = await productApi.getPriceHistory(productId, activePeriod);
        if (res.success && res.data) {
          setHistory(res.data);
          return res;
        } else {
          const msg = res.message || 'Price history unavailable';
          setError(msg);
          return res;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error fetching price history';
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setLoading(false);
      }
    },
    [period]
  );

  const setPeriod = useCallback(
    (newPeriod: PriceHistoryPeriod) => {
      setPeriodState(newPeriod);
      if (currentProductId) {
        fetchHistory(currentProductId, newPeriod);
      }
    },
    [currentProductId, fetchHistory]
  );

  useEffect(() => {
    if (initialProductId) {
      fetchHistory(initialProductId, period);
    }
  }, [initialProductId, period, fetchHistory]);

  const currentPrice = useMemo(() => history?.currentPrice || 0, [history]);
  const lowestPrice = useMemo(() => history?.lowestRecordedPrice || 0, [history]);
  const highestPrice = useMemo(() => history?.highestRecordedPrice || 0, [history]);
  const averagePrice = useMemo(() => history?.averagePrice || 0, [history]);

  const activeDelta = useMemo(() => {
    if (!history) return null;
    if (period === '7d') return history.change7d;
    if (period === '30d') return history.change30d;
    return history.change90d || history.change30d || history.change7d;
  }, [history, period]);

  const priceTrend = useMemo<'FALLING' | 'RISING' | 'STABLE'>(() => {
    if (!activeDelta) return 'STABLE';
    if (activeDelta.direction === 'DOWN') return 'FALLING';
    if (activeDelta.direction === 'UP') return 'RISING';
    return 'STABLE';
  }, [activeDelta]);

  const changeAmount = useMemo(() => activeDelta?.amount || 0, [activeDelta]);
  const changePercentage = useMemo(() => activeDelta?.percentage || 0, [activeDelta]);
  const timeline = useMemo(() => history?.timeline || [], [history]);
  const hasSufficientData = useMemo(() => history?.hasSufficientData ?? false, [history]);

  return {
    history,
    loading,
    error,
    period,
    setPeriod,
    fetchHistory,
    currentPrice,
    lowestPrice,
    highestPrice,
    averagePrice,
    priceTrend,
    changeAmount,
    changePercentage,
    timeline,
    hasSufficientData,
  };
};
