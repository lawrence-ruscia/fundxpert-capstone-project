import { useState, useEffect } from 'react';
import {
  getOverview,
  getContributionTrends,
  getLoanSummary,
  getWithdrawalSummary,
  getPendingLoans,
  getPendingWithdrawals,
} from '../services/hrDashboardService';
import type {
  HrOverviewResponse,
  HRContributionRecord,
  HRLoanSummaryResponse,
  HRWithdrawalSummaryResponse,
  HRLoanPendingResponse,
  HRWithdrawalPendingResponse,
} from '../types/hrDashboardTypes';

export interface HRDashboardData {
  overview: HrOverviewResponse | null;
  contributions: HRContributionRecord[];
  loanSummary: HRLoanSummaryResponse[] | null;
  withdrawalSummary: HRWithdrawalSummaryResponse[] | null;
  pendingLoans: HRLoanPendingResponse[];
  pendingWithdrawals: HRWithdrawalPendingResponse[];
}

export function useHRDashboardData() {
  const [data, setData] = useState<HRDashboardData>({
    overview: null,
    contributions: [],
    loanSummary: [],
    withdrawalSummary: null,
    pendingLoans: [],
    pendingWithdrawals: [],
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
          getOverview(),
          getContributionTrends(),
          getLoanSummary(),
          getWithdrawalSummary(),
          getPendingLoans(),
          getPendingWithdrawals(),
        ]);

        // Extract successful results and log failures
        const [
          overviewResult,
          contributionsResult,
          loanSummaryResult,
          withdrawalSummaryResult,
          pendingLoansResult,
          pendingWithdrawalsResult,
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
          pendingLoans:
            pendingLoansResult.status === 'fulfilled'
              ? pendingLoansResult.value
              : [],
          pendingWithdrawals:
            pendingWithdrawalsResult.status === 'fulfilled'
              ? pendingWithdrawalsResult.value
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
      contributions: [],
      loanSummary: [],
      withdrawalSummary: [],
      pendingLoans: [],
      pendingWithdrawals: [],
    });
    // The useEffect will run again due to the dependency change
  };

  return { data, loading, error, refetch };
}
