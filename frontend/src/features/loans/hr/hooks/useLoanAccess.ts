import { useAuth } from '@/features/auth/context/AuthContext';
import { useState, useCallback, useEffect } from 'react';
import { getLoanAccess } from '../services/hrLoanService';
import type { LoanAccess } from '../types/hrLoanType';

interface UseLoanAccessResult {
  access: LoanAccess | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  can: (key: keyof LoanAccess) => boolean;
}

/**
 * Hook: useLoanAccess
 * Fetches & tracks permission flags for a specific loan based on current user.
 * Usage:
 *   const { can, loading, refresh } = useLoanAccess(loanId);
 *   if (can('canApprove')) show Approve button.
 */
export function useLoanAccess(loanId: number | undefined): UseLoanAccessResult {
  const { user } = useAuth();
  const [access, setAccess] = useState<LoanAccess | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccess = useCallback(async () => {
    if (!loanId || !user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getLoanAccess(loanId);

      setAccess(res.access);
    } catch (err) {
      setError((err as Error).message);
      setAccess(null);
    } finally {
      setLoading(false);
    }
  }, [loanId, user]);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  const can = useCallback((key: keyof LoanAccess) => !!access?.[key], [access]);

  return { access, loading, error, refresh: fetchAccess, can };
}
