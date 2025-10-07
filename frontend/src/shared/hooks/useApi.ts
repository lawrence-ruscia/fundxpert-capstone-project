import { useEffect, useReducer, useCallback } from 'react';

type State<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

type Action<T> =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: T }
  | { type: 'FETCH_ERROR'; payload: Error };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { data: action.payload, loading: false, error: null };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, dispatch] = useReducer(reducer<T>, {
    data: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const result = await fetcher();
      dispatch({ type: 'FETCH_SUCCESS', payload: result });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err as Error });
    }
  }, [fetcher]);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      dispatch({ type: 'FETCH_START' });
      try {
        const result = await fetcher();
        if (mounted) {
          dispatch({ type: 'FETCH_SUCCESS', payload: result });
        }
      } catch (err) {
        if (mounted) {
          dispatch({ type: 'FETCH_ERROR', payload: err as Error });
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, deps);

  return { ...state, refetch: load };
}
