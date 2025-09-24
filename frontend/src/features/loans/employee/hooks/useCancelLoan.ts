import { useState } from 'react';
import type { CancelLoanResponse } from '../types/loan';
import { cancelLoan } from '../services/loanService';

export function useCancelLoan() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelLoanRequest = async (
    loanId: number,
    onSuccess?: (response: CancelLoanResponse) => void
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await cancelLoan(loanId);
      onSuccess?.(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cancelLoanRequest,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
