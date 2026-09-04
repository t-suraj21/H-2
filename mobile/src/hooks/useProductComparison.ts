import { useState, useCallback, useMemo } from 'react';
import {
  productApi,
  ComparisonResultData,
  RetailerOffer,
  ApiResponse,
} from '../services/productApi';

export interface UseProductComparisonResult {
  comparing: boolean;
  comparison: ComparisonResultData | null;
  error: string | null;
  bestOffer: RetailerOffer | null;
  worstOffer: RetailerOffer | null;
  savingsAmount: number;
  savingsPercentage: number;
  availableOffers: RetailerOffer[];
  compare: (product: object, offers: object[]) => Promise<ApiResponse<ComparisonResultData>>;
  searchAndCompare: (query: string) => Promise<ApiResponse<ComparisonResultData>>;
  reset: () => void;
}

export const useProductComparison = (): UseProductComparisonResult => {
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState<ComparisonResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compare = useCallback(
    async (product: object, offers: object[]): Promise<ApiResponse<ComparisonResultData>> => {
      setComparing(true);
      setError(null);

      try {
        const res = await productApi.compareOffers(product, offers);
        if (res.success && res.data) {
          setComparison(res.data);
          return res;
        } else {
          const errMsg = res.message || 'Comparison failed.';
          setError(errMsg);
          return res;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Error running multi-store comparison.';
        setError(errMsg);
        return { success: false, message: errMsg };
      } finally {
        setComparing(false);
      }
    },
    []
  );

  const searchAndCompare = useCallback(
    async (query: string): Promise<ApiResponse<ComparisonResultData>> => {
      setComparing(true);
      setError(null);

      try {
        const res = await productApi.getRealtimePricing(query);
        if (res.success && res.data) {
          setComparison(res.data);
          return res;
        } else {
          const errMsg = res.message || 'Multi-store search failed.';
          setError(errMsg);
          return res;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Error searching across retailers.';
        setError(errMsg);
        return { success: false, message: errMsg };
      } finally {
        setComparing(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setComparison(null);
    setError(null);
    setComparing(false);
  }, []);

  const bestOffer = useMemo(() => {
    if (!comparison) return null;
    return comparison.lowest || null;
  }, [comparison]);

  const worstOffer = useMemo(() => {
    if (!comparison) return null;
    return comparison.highest || null;
  }, [comparison]);

  const savingsAmount = useMemo(() => {
    if (!comparison) return 0;
    return comparison.savings || 0;
  }, [comparison]);

  const savingsPercentage = useMemo(() => {
    if (!comparison) return 0;
    return comparison.savingsPercentage || 0;
  }, [comparison]);

  const availableOffers = useMemo(() => {
    if (!comparison || !Array.isArray(comparison.offers)) return [];
    return comparison.offers.filter((o) => o.availability && o.effectivePrice > 0);
  }, [comparison]);

  return {
    comparing,
    comparison,
    error,
    bestOffer,
    worstOffer,
    savingsAmount,
    savingsPercentage,
    availableOffers,
    compare,
    searchAndCompare,
    reset,
  };
};
