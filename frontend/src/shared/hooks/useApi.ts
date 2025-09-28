import { useEffect, useReducer } from 'react';

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

  useEffect(() => {
    let mounted = true;

    async function load() {
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

    load();

    return () => {
      mounted = false;
    };
  }, deps);

  return state;
}
