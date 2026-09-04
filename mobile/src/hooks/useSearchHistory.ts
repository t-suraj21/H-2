import { useState, useEffect, useCallback } from 'react';
import {
  searchHistoryApi,
  SearchHistoryItem,
} from '../services/productApi';

const DEFAULT_SAMPLE_SEARCHES: SearchHistoryItem[] = [
  {
    id: 's1',
    title: 'Sony WH-1000XM5',
    category: 'Headphones',
    retailer: 'Amazon',
    brand: 'Sony',
    lowestPrice: 24999,
    url: 'https://www.amazon.in/dp/B09XS7JWHH',
    searchedAt: new Date().toISOString(),
  },
  {
    id: 's2',
    title: 'Apple iPhone 17 256GB',
    category: 'Smartphones',
    retailer: 'Flipkart',
    brand: 'Apple',
    lowestPrice: 79999,
    url: 'https://www.flipkart.com/apple-iphone-17-256gb/p/itmiphone17',
    searchedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 's3',
    title: 'MacBook Air M3 (16GB)',
    category: 'Laptops',
    retailer: 'Croma',
    brand: 'Apple',
    lowestPrice: 114900,
    url: 'https://www.croma.com/macbook-air-m3-16gb/p/260000',
    searchedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 's4',
    title: 'Samsung 65" 4K OLED TV',
    category: 'Smart TVs',
    retailer: 'Amazon',
    brand: 'Samsung',
    lowestPrice: 144990,
    url: 'https://www.amazon.in/dp/B0CX234S90C',
    searchedAt: new Date(Date.now() - 10800000).toISOString(),
  },
];

export interface UseSearchHistoryResult {
  searches: SearchHistoryItem[];
  loading: boolean;
  count: number;
  fetchSearches: () => Promise<void>;
  addSearch: (item: Omit<SearchHistoryItem, 'id' | 'searchedAt'>) => Promise<SearchHistoryItem>;
  removeSearch: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  filterSearches: (query: string) => SearchHistoryItem[];
}

export const useSearchHistory = (autoFetch = true): UseSearchHistoryResult => {
  const [searches, setSearches] = useState<SearchHistoryItem[]>(DEFAULT_SAMPLE_SEARCHES);
  const [loading, setLoading] = useState<boolean>(autoFetch);

  const fetchSearches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchHistoryApi.getRecentSearches(20);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setSearches(res.data);
      } else {
        setSearches(DEFAULT_SAMPLE_SEARCHES);
      }
    } catch {
      setSearches(DEFAULT_SAMPLE_SEARCHES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchSearches();
    }
  }, [autoFetch, fetchSearches]);

  const addSearch = useCallback(
    async (item: Omit<SearchHistoryItem, 'id' | 'searchedAt'>): Promise<SearchHistoryItem> => {
      try {
        const res = await searchHistoryApi.recordSearch(item);
        if (res.success && res.data) {
          setSearches((prev) => [res.data!, ...prev.filter((s) => s.id !== res.data!.id)]);
          return res.data;
        }
      } catch {
        // Fallback local creation
      }

      const localItem: SearchHistoryItem = {
        ...item,
        id: 'search_' + Date.now(),
        searchedAt: new Date().toISOString(),
      };

      setSearches((prev) => [localItem, ...prev.filter((s) => s.title.toLowerCase() !== item.title.toLowerCase())]);
      return localItem;
    },
    []
  );

  const removeSearch = useCallback(async (id: string) => {
    try {
      await searchHistoryApi.removeSearchItem(id);
    } catch {
      // Ignore
    }
    setSearches((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await searchHistoryApi.clearSearchHistory();
    } catch {
      // Ignore
    }
    setSearches([]);
  }, []);

  const filterSearches = useCallback(
    (query: string): SearchHistoryItem[] => {
      if (!query || !query.trim()) return searches;
      const lower = query.toLowerCase().trim();
      return searches.filter(
        (s) =>
          s.title.toLowerCase().includes(lower) ||
          s.brand.toLowerCase().includes(lower) ||
          s.category.toLowerCase().includes(lower) ||
          s.retailer.toLowerCase().includes(lower)
      );
    },
    [searches]
  );

  return {
    searches,
    loading,
    count: searches.length,
    fetchSearches,
    addSearch,
    removeSearch,
    clearHistory,
    filterSearches,
  };
};
