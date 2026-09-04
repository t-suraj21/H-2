import { useState, useEffect, useCallback, useRef } from 'react';
import { checkApiHealth } from '../services/api';
import { HealthResponse } from '../types';

export interface UseHealthCheckOptions {
  autoCheck?: boolean;
  pollIntervalMs?: number; // e.g. 30000 for periodic heartbeat
}

export interface UseHealthCheckResult {
  data: HealthResponse | null;
  loading: boolean;
  error: string | null;
  latencyMs: number | null;
  isOnline: boolean;
  refetch: () => Promise<HealthResponse | null>;
}

export const useHealthCheck = (options: UseHealthCheckOptions = {}): UseHealthCheckResult => {
  const { autoCheck = true, pollIntervalMs } = options;

  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(autoCheck);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchHealth = useCallback(async (): Promise<HealthResponse | null> => {
    if (!isMounted.current) return null;
    setLoading(true);
    setError(null);

    const startTime = Date.now();
    try {
      const result = await checkApiHealth();
      const duration = Date.now() - startTime;

      if (!isMounted.current) return null;

      setLatencyMs(duration);
      setData(result);
      setIsOnline(result.success);

      if (!result.success) {
        setError(result.message || 'API Health check failed');
      }
      return result;
    } catch (err) {
      if (!isMounted.current) return null;
      const errorMsg = err instanceof Error ? err.message : 'Unable to connect to backend server';
      setError(errorMsg);
      setIsOnline(false);
      return null;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (autoCheck) {
      fetchHealth();
    }

    if (pollIntervalMs && pollIntervalMs > 0) {
      const interval = setInterval(fetchHealth, pollIntervalMs);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoCheck, pollIntervalMs, fetchHealth]);

  return {
    data,
    loading,
    error,
    latencyMs,
    isOnline,
    refetch: fetchHealth,
  };
};
