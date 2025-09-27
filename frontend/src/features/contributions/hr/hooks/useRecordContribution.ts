import { useState } from 'react';
import { hrContributionsService } from '../services/hrContributionService';

export const useRecordContribution = (
  setError: (error: string | null) => void,
  setSuccess: (success: boolean) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recordContribution = async (payload: {
    user_id: number;
    employee_amount: number;
    employer_amount: number;
    contribution_date: string;
    notes?: string;
  }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await hrContributionsService.recordContribution({
        userId: payload.user_id,
        contributionDate: payload.contribution_date,
        employeeAmount: payload.employee_amount,
        employerAmount: payload.employer_amount,
        notes: payload?.notes,
      });
      setSuccess(true);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to record contribution');
      setSuccess(false);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  return { recordContribution, isSubmitting };
};
