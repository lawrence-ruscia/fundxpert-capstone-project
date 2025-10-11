import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useAutoRefresh — reusable hook for dashboards that need periodic refresh
 *
 * @param fetchFn - async function that fetches latest data
 * @param options - configuration object
 *   - interval: refresh interval in ms (default: 300000 = 5 mins)
 *   - enabled: whether auto refresh is enabled
 */
export function useAutoRefresh<T>(
  fetchFn: () => Promise<T>,
  options: { interval?: number; enabled?: boolean } = {}
) {
  const { interval = 300000, enabled = true } = options; // 5 min default
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Use ref to always have the latest fetchFn without triggering re-renders
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFnRef.current();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('❌ Auto-refresh fetch failed:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - stable reference

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up interval if enabled
    if (enabled) {
      const timerId = setInterval(fetchData, interval);

      // Cleanup on unmount
      return () => clearInterval(timerId);
    }
  }, [fetchData, enabled, interval]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh: fetchData,
  };
}
