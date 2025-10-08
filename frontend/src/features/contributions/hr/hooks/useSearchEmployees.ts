import { useState, useEffect, useCallback } from 'react';
import { hrContributionsService } from '../services/hrContributionService';
import type { SearchEmployeesRecord } from '../../shared/types/contributions';

export const useSearchEmployees = (
  query: string,
  setError: (error: string | null) => void
) => {
  const [results, setResults] = useState<SearchEmployeesRecord[]>([]);
  // isSearching is optional; not used in original UI but available if needed

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await hrContributionsService.searchEmployees(query);
        setResults(res.data);
        setError(null); // Clear any previous search-related error on success
      } catch (err: any) {
        setError(err.message);
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, setError]);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return { results, clearResults };
};
