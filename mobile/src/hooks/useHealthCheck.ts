import { useState, useEffect, useCallback } from 'react';
import { checkApiHealth } from '../services/api';
import { HealthResponse } from '../types';

export interface UseHealthCheckResult {
  data: HealthResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useHealthCheck = (): UseHealthCheckResult => {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await checkApiHealth();
      setData(result);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { data, loading, error, refetch: fetchHealth };
};
