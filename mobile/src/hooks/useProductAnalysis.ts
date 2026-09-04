import { useState, useCallback, useRef } from 'react';
import { productApi, AnalyzedProductData, ApiResponse } from '../services/productApi';

export interface RetailerDetectionResult {
  name: string;
  slug: string;
  iconName: string;
  brandColor: string;
  isSupported: boolean;
}

const SUPPORTED_RETAILERS: Record<string, { name: string; slug: string; iconName: string; brandColor: string; domains: string[] }> = {
  amazon: {
    name: 'Amazon',
    slug: 'amazon',
    iconName: 'shopping-cart',
    brandColor: '#FF9900',
    domains: ['amazon.in', 'amazon.com', 'amzn.to', 'amzn.in'],
  },
  flipkart: {
    name: 'Flipkart',
    slug: 'flipkart',
    iconName: 'storefront',
    brandColor: '#2874F0',
    domains: ['flipkart.com', 'dl.flipkart.com'],
  },
  croma: {
    name: 'Croma',
    slug: 'croma',
    iconName: 'devices',
    brandColor: '#00B5B8',
    domains: ['croma.com'],
  },
};

export interface UseProductAnalysisResult {
  analyzing: boolean;
  data: AnalyzedProductData | null;
  error: string | null;
  retailerInfo: RetailerDetectionResult | null;
  isSuccess: boolean;
  analyze: (url: string) => Promise<ApiResponse<AnalyzedProductData>>;
  reset: () => void;
  detectRetailer: (url: string) => RetailerDetectionResult | null;
  validateUrl: (url: string) => { isValid: boolean; message?: string };
}

export const useProductAnalysis = (): UseProductAnalysisResult => {
  const [analyzing, setAnalyzing] = useState(false);
  const [data, setData] = useState<AnalyzedProductData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retailerInfo, setRetailerInfo] = useState<RetailerDetectionResult | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const detectRetailer = useCallback((url: string): RetailerDetectionResult | null => {
    if (!url || typeof url !== 'string') return null;
    const lower = url.toLowerCase().trim();

    for (const key of Object.keys(SUPPORTED_RETAILERS)) {
      const retailer = SUPPORTED_RETAILERS[key];
      if (retailer.domains.some((d) => lower.includes(d))) {
        return {
          name: retailer.name,
          slug: retailer.slug,
          iconName: retailer.iconName,
          brandColor: retailer.brandColor,
          isSupported: true,
        };
      }
    }

    return null;
  }, []);

  const validateUrl = useCallback((url: string): { isValid: boolean; message?: string } => {
    const trimmed = (url || '').trim();
    if (!trimmed) {
      return { isValid: false, message: 'Please enter or paste a product URL.' };
    }

    try {
      // Basic URL format check
      const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      if (!urlObj.hostname) {
        return { isValid: false, message: 'Invalid URL format.' };
      }
      return { isValid: true };
    } catch {
      return { isValid: false, message: 'Please enter a valid web URL.' };
    }
  }, []);

  const analyze = useCallback(
    async (url: string): Promise<ApiResponse<AnalyzedProductData>> => {
      const validation = validateUrl(url);
      if (!validation.isValid) {
        const err = validation.message || 'Invalid product URL';
        setError(err);
        return { success: false, message: err };
      }

      setAnalyzing(true);
      setError(null);

      const detected = detectRetailer(url);
      setRetailerInfo(detected);

      try {
        const res = await productApi.analyzeUrl(url.trim());
        if (res.success && res.data) {
          setData(res.data);
          setError(null);
          return res;
        } else {
          const errMsg = res.message || 'Analysis could not be completed. Please verify the URL.';
          setError(errMsg);
          return res;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to connect to the analysis engine.';
        setError(errMsg);
        return { success: false, message: errMsg };
      } finally {
        setAnalyzing(false);
      }
    },
    [detectRetailer, validateUrl]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setRetailerInfo(null);
    setAnalyzing(false);
  }, []);

  return {
    analyzing,
    data,
    error,
    retailerInfo,
    isSuccess: !!data && !error,
    analyze,
    reset,
    detectRetailer,
    validateUrl,
  };
};
