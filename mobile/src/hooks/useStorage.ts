import { useState, useEffect, useCallback, useRef } from 'react';
import { storage } from '../services/storage';

export interface UseStorageResult<T> {
  value: T;
  setValue: (newValue: T | ((prev: T) => T)) => Promise<void>;
  removeValue: () => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export function useStorage<T>(key: string, initialValue: T): UseStorageResult<T> {
  const [value, setInternalValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load from persistent storage on mount
  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      try {
        setLoading(true);
        const stored = await storage.getItem<T>(key);
        if (!cancelled && stored !== null && stored !== undefined) {
          setInternalValue(stored);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [key]);

  const setValue = useCallback(
    async (newValueOrFn: T | ((prev: T) => T)) => {
      try {
        const computed =
          typeof newValueOrFn === 'function'
            ? (newValueOrFn as (prev: T) => T)(value)
            : newValueOrFn;

        if (isMounted.current) {
          setInternalValue(computed);
        }
        await storage.setItem(key, computed);
      } catch (err) {
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    },
    [key, value]
  );

  const removeValue = useCallback(async () => {
    try {
      if (isMounted.current) {
        setInternalValue(initialValue);
      }
      await storage.removeItem(key);
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, [key, initialValue]);

  return {
    value,
    setValue,
    removeValue,
    loading,
    error,
  };
}
