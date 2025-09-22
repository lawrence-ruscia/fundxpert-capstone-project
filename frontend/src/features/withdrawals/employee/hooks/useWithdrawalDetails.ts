import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchWithdrawalDetails } from '../services/withdrawalService';
import type { WithdrawalResponse } from '../types/withdrawal';

export const useWithdrawalDetails = () => {
  const { withdrawalId } = useParams<{ withdrawalId: string }>();
  const [withdrawal, setWithdrawal] = useState<WithdrawalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!withdrawalId) return;

    async function loadWithdrawal() {
      try {
        const data = await fetchWithdrawalDetails(
          parseInt(withdrawalId ?? '', 10)
        );
        setWithdrawal(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadWithdrawal();
  }, [withdrawalId]);

  return { withdrawal, loading, error };
};
