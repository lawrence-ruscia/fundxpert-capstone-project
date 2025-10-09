import { useAuth } from '@/features/auth/context/AuthContext';
import { useState, useCallback, useEffect } from 'react';
import type { WithdrawalAccess } from '../../employee/types/withdrawal';
import { getWithdrawalAccess } from '../services/hrWithdrawalService';
interface UseWithdrawalAccessResult {
  access: WithdrawalAccess | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  can: (key: keyof WithdrawalAccess) => boolean;
}

export function useWithdrawalAccess(
  withdrawalId: number | undefined
): UseWithdrawalAccessResult {
  const { user } = useAuth();
  const [access, setAccess] = useState<WithdrawalAccess | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccess = useCallback(async () => {
    if (!withdrawalId || !user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getWithdrawalAccess(withdrawalId);

      setAccess(res.access);
    } catch (err) {
      setError((err as Error).message);
      setAccess(null);
    } finally {
      setLoading(false);
    }
  }, [withdrawalId, user]);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  const can = useCallback(
    (key: keyof WithdrawalAccess) => !!access?.[key],
    [access]
  );

  return { access, loading, error, refresh: fetchAccess, can };
}
