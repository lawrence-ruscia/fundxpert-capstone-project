import type { LoanStatus } from './loan.js';
import type { WithdrawalStatus } from './withdrawal.js';

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

export type HREmployeeRecord = {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  department_id: number;
  position_id: number;
  role: 'Employee';
  salary: number;
  employment_status: string;
  date_hired: string;
  department: string;
  position: string;
};
