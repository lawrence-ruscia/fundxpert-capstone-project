import { useState } from 'react';
import { cancelWithdrawal } from '../services/withdrawalService';
import type { CancelWithdrawalResponse } from '../types/withdrawal';
import { getErrorMessage } from '@/shared/api/getErrorMessage';

export function useCancelWithdrawal() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelWithdrawalRequest = async (
    withdrawalId: number,
    onSuccess?: (response: CancelWithdrawalResponse) => void
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await cancelWithdrawal(withdrawalId);
      onSuccess?.(response);
      return response;
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'An error occurred');
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cancelWithdrawalRequest,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
