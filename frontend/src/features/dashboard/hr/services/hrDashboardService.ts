import { api } from '@/shared/api/api';
export const fetchHROverview = async () => {
  try {
    const { data } = await api.get('/hr/overview');
    return data;
  } catch (err) {
    throw new Error((err as Error).message || 'Failed to fetch hr overview');
  }
};

export const fetchContributionTrends = async (period: string = 'all') => {
  try {
    const { data } = await api.get('/hr/contributions/trends', {
      params: {
        period,
      },
    });

    return data;
  } catch (err) {
    throw new Error(
      (err as Error).message || 'Failed to fetch hr contributions trends'
    );
  }
};

export const fetchLoanSummary = async () => {
  try {
    const { data } = await api.get('/hr/loans/');
    return data;
  } catch (err) {
    throw new Error(
      (err as Error).message || 'Failed to fetch hr loans summary'
    );
  }
};

export const fetchWithdrawalSummary = async () => {
  try {
    const { data } = await api.get('/hr/withdrawals/summary');
    return data;
  } catch (err) {
    throw new Error(
      (err as Error).message || 'Failed to fetch hr withdrawals summary'
    );
  }
};

export const fetchAssignedLoans = async () => {
  try {
    const { data } = await api.get('/hr/loans/assigned');
    return data;
  } catch (err) {
    throw new Error(
      (err as Error).message || 'Failed to fetch hr withdrawals pending'
    );
  }
};
