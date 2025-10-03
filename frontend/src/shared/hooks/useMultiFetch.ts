import { useState, useEffect } from 'react';

type MultiFetchResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

/**
 * Simple hook for fetching multiple data sources with Promise.all
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useMultiFetch(
 *   async () => {
 *     const [employee, contributions, summary] = await Promise.all([
 *       getEmployeeById(userId),
 *       hrContributionsService.getAllContributions(userId),
 *       hrContributionsService.getContributionSummary(userId)
 *     ]);
 *
 *     return { employee, contributions, summary };
 *   },
 *   [userId] // dependencies
 * );
 * ```
 */
export function useMultiFetch<T>(
  fetchFn: () => Promise<T>,
  dependencies: unknown[] = []
): MultiFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const executeFetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeFetch();
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: executeFetch,
  };
}
