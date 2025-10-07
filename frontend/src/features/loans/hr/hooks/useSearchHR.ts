import { useState, useEffect, useCallback } from 'react';
import type { SearchHRRecord } from '../types/hrLoanType';
import { searchHR } from '../services/hrLoanService';

export const useSearchHR = (
  query: string,
  setError: (error: string | null) => void
) => {
  const [results, setResults] = useState<SearchHRRecord[]>([]);
  // isSearching is optional; not used in original UI but available if needed

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await searchHR(query);
        setResults(res.data);
        setError(null); // Clear any previous search-related error on success
      } catch (err) {
        setError((err as Error).message);
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
