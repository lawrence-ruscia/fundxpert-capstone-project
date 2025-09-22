import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { LoanResponse } from '../types/loan';
import { fetchWithdrawalDetails } from '../services/withdrawalService';

export const useLoanDetails = () => {
  const { loanId } = useParams<{ loanId: string }>();
  const [loan, setLoan] = useState<LoanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loanId) return;

    async function loadLoan() {
      try {
        const data = await fetchWithdrawalDetails(parseInt(loanId ?? '', 10));
        setLoan(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadLoan();
  }, [loanId]);

  return { loan, loading, error };
};
