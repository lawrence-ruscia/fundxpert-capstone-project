import { useState, useEffect } from 'react';
import {
  fetchHROverview,
  fetchContributionTrends,
  fetchLoanSummary,
  fetchWithdrawalSummary,
  fetchAssignedLoans,
} from '../services/hrDashboardService';
import type {
  HrOverviewResponse,
  HRLoanSummaryResponse,
  HRWithdrawalSummaryResponse,
  HRContributionsResponse,
} from '../types/hrDashboardTypes';
import type { Loan } from '@/features/loans/employee/types/loan';

export interface HRDashboardData {
  overview: HrOverviewResponse | null;
  contributions: HRContributionsResponse | null;
  loanSummary: HRLoanSummaryResponse[] | null;
  withdrawalSummary: HRWithdrawalSummaryResponse[] | null;
  assignedLoans: { assistant: Loan[]; officer: Loan[]; approver: Loan[] };
}

export function useHRDashboardData() {
  const [data, setData] = useState<HRDashboardData>({
    overview: null,
    contributions: null,
    loanSummary: [],
    withdrawalSummary: null,
    assignedLoans: { assistant: [], officer: [], approver: [] },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data concurrently (allows partial failures)
        const results = await Promise.allSettled([
          fetchHROverview(),
          fetchContributionTrends('all'),
          fetchLoanSummary(),
          fetchWithdrawalSummary(),
          fetchAssignedLoans(),
        ]);

        // Extract successful results and log failures
        const [
          overviewResult,
          contributionsResult,
          loanSummaryResult,
          withdrawalSummaryResult,
          pendingLoansResult,
        ] = results;

        // Set data for successful requests, keep defaults for failed ones
        setData({
          overview:
            overviewResult.status === 'fulfilled' ? overviewResult.value : null,
          contributions:
            contributionsResult.status === 'fulfilled'
              ? contributionsResult.value
              : [],
          loanSummary:
            loanSummaryResult.status === 'fulfilled'
              ? loanSummaryResult.value
              : null,
          withdrawalSummary:
            withdrawalSummaryResult.status === 'fulfilled'
              ? withdrawalSummaryResult.value
              : null,
          assignedLoans:
            pendingLoansResult.status === 'fulfilled'
              ? pendingLoansResult.value
              : [],
        });

        // Log any failures for debugging
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Request ${index} failed:`, result.reason);
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error('HR Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, []);

  const refetch = () => {
    // Reset state and refetch
    setData({
      overview: null,
      contributions: null,
      loanSummary: [],
      withdrawalSummary: [],
      assignedLoans: { assistant: [], officer: [], approver: [] },
    });
    // The useEffect will run again due to the dependency change
  };

  return { data, loading, error, refetch };
}
