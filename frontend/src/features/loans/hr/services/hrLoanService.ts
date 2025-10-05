import { api } from '@/shared/api/api';
import type {
  LoanAccess,
  LoanApproval,
  LoanFilters,
  LoanHistory,
} from '../types/hrLoanType';

import type { Loan } from '../../employee/types/loan';

/**
 * Move a loan from pending to HR review stage
 */
export async function markLoanReady(
  loanId: number
): Promise<{ success: boolean; loan: Loan }> {
  const res = await api.post(`/hr/loans/${loanId}/mark-ready`);
  return res.data;
}

/**
 * Move a loan from pending to HR review stage
 */
export async function markLoanIncomplete(
  loanId: number
): Promise<{ success: boolean; loan: Loan }> {
  const res = await api.post(`/hr/loans/${loanId}/mark-incomplete`);
  return res.data;
}

/**
 * Move a loan from pending to HR review stage
 */
export async function moveLoanToReview(
  loanId: number
): Promise<{ success: boolean; loan: Loan }> {
  const res = await api.post(`/hr/loans/${loanId}/move-to-review`);
  return res.data;
}

/**
 * Assign approvers dynamically
 */
export async function assignLoanApprovers(
  loanId: number,
  approvers: { approverId: number; sequence: number }[]
): Promise<{ success: boolean }> {
  const res = await api.post(`/hr/loans/${loanId}/assign-approvers`, {
    approvers,
  });
  return res.data;
}

/**
 * Review loan approval (approve/reject)
 */
export async function reviewLoanApproval(
  loanId: number,
  decision: 'Approved' | 'Rejected',
  comments?: string
): Promise<{ success: boolean; approval: LoanApproval }> {
  const res = await api.post(`/hr/loans/${loanId}/review`, {
    decision,
    comments,
  });
  return res.data;
}

/**
 * Release an approved loan to the trust bank
 */
export async function releaseLoanToTrustBank(
  loanId: number,
  txRef: string
): Promise<{ success: boolean; loan: Loan }> {
  const res = await api.post(`/hr/loans/${loanId}/release`, { txRef });
  return res.data;
}

/**
 * Cancel a loan request (HR only)
 */
export async function cancelLoanRequest(
  loanId: number
): Promise<{ success: boolean; loan: Loan }> {
  const res = await api.post(`/hr/loans/${loanId}/cancel`);
  return res.data;
}

/**
 * Mark loan as ready
 */
export async function viewLoanAccess(
  loanId: number
): Promise<{ user: number; access: LoanAccess }> {
  const res = await api.post(`/hr/loans/${loanId}/access`);
  return res.data;
}

/**
 * Fetch approval chain for a given loan
 */
export async function getLoanApprovals(
  loanId: number
): Promise<LoanApproval[]> {
  const res = await api.get(`/hr/loans/${loanId}/approvals`);
  return res.data;
}

/**
 * Fetch loan activity history (e.g., approval steps, status changes)
 */
export async function getLoanHistory(loanId: number): Promise<LoanHistory[]> {
  const res = await api.get(`/hr/loans/${loanId}/history`);
  return res.data;
}

/**
 * Fetch all loans with optional filters (status, search, date range)
 */
export async function getAllLoans(filters?: LoanFilters): Promise<Loan[]> {
  const params = new URLSearchParams();

  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const res = await api.get(`/hr/loans`, { params });
  return res.data;
}

/**
 * Fetch loan details by ID
 */
export async function getLoanById(loanId: number): Promise<Loan> {
  const res = await api.get(`/hr/loans/${loanId}`);
  return res.data;
}
