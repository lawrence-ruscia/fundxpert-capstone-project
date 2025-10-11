import { useState, useEffect, useMemo } from 'react';
import { fetchEmployeeLoans } from '../services/loanService';
import type { Loan } from '../types/loan';

export const useEmployeeLoans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLoans() {
      try {
        setLoading(true);
        const data = await fetchEmployeeLoans();
        setLoans(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    loadLoans();
  }, []);

  // Find the active loan (prioritize Active, then Approved, then most recent Pending)
  const activeLoan = useMemo(() => {
    if (loans.length === 0) return null;

    // First, look for Active loans
    const activeLoan = loans.find(
      loan => loan.status === 'Pending' || loan.status === 'Incomplete'
    );
    if (activeLoan) return activeLoan;

    // Then, look for Approved loans
    const approvedLoan = loans.find(loan => loan.status === 'Approved');
    if (approvedLoan) return approvedLoan;

    // Finally, get the most recent Pending loan
    const pendingLoans = loans.filter(loan => loan.status === 'Pending');
    if (pendingLoans.length > 0) {
      return pendingLoans.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
    }

    return null;
  }, [loans]);

  return { loans, activeLoan, loading, error };
};
