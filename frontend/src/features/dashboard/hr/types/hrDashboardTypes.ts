import type { LoanStatus } from '@/features/loans/employee/types/loan';
import type { WithdrawalStatus } from '@/features/withdrawals/employee/types/withdrawal';

// Improve this HRDashboardPage for my Provident Fund Tracker System, just change the structure and the layout/spacing, but don't change the colors as I already have a pre-defined design system using tailwind, use shadcn if you want for the components, I'll Provide the necessary data:

/**
 * Overview
 */
export type HrOverviewResponse = {
  total_employees: number;
  active_employees: number;
  total_employee_contributions: number;
  total_employer_contributions: number;
  pending_loans: number;
  approved_loans_this_month: number;
  pending_withdrawals: number;
  processsed_withdrawals_this_month: number;
};

/**
 * Contributions Trends
 */
export type HRContributionsResponse = {
  period?: HRContributionPeriod;
  contributions: HRContributionRecord[];
  totals: HRContributionTotals;
};

export type HRContributionPeriod = '3m' | '6m' | '1y' | 'all' | 'year';
export type HRContributionRecord = {
  month: string;
  year: string;
  employee: number;
  employer: number;
  total: number;
};

export type HRContributionTotals = {
  employee: number;
  employer: number;
  grand_total: number;
};

/**
 * Loans
 */

export type HRLoanSummaryResponse = {
  status: LoanStatus;
  count: number;
  total_amount: number;
};

export type HRLoanPendingResponse = {
  id: number;
  user_id: number;
  amount: number;
  created_at: string;
};

/**
 * Withdrawals
 */

export type HRWithdrawalSummaryResponse = {
  status: WithdrawalStatus;
  count: number;
  total_amount: number;
};

export type HRWithdrawalPendingResponse = {
  id: number;
  user_id: number;
  total_balance: number;
  created_at: string;
};
