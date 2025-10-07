import { api } from '@/shared/api/api';
import type {
  LoanAccess,
  LoanApproval,
  LoanFilters,
  LoanHistory,
  LoanSummary,
} from '../types/hrLoanType';

import type { Loan, LoanDocument } from '../../employee/types/loan';

/**
 * Step 0: Mark loan as ready for HR officer review
 */
export async function markLoanReady(
  loanId: number
): Promise<{ success: boolean; loan: Loan }> {
  const res = await api.patch(`/hr/loans/${loanId}/mark-ready`);
  return res.data;
}

/**
 * Step 0: Mark loan as incomplete for HR officer review
 */
export async function markLoanIncomplete(
  loanId: number,
  reason: string
): Promise<{ success: boolean; loan: Loan }> {
  const res = await api.patch(`/hr/loans/${loanId}/mark-incomplete`, {
    remarks: reason,
  });
  return res.data;
}

/**
 * Step 1:  Move a loan from pending to HR approvers review stage
 */
export async function moveLoanToReview(
  loanId: number
): Promise<{ success: boolean; loan: Loan }> {
  const res = await api.post(`/hr/loans/${loanId}/review`);
  return res.data;
}

/**
 * Step 2:  Assign approvers dynamically
 */
export async function assignLoanApprovers(
  loanId: number,
  approvers: { approverId: number; sequence: number }[]
): Promise<{ success: boolean }> {
  const res = await api.post(`/hr/loans/${loanId}/approvers`, {
    approvers,
  });
  return res.data;
}

/**
 * Step 3:  Review loan approval (approve/reject)
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
 * Step 4:  Release an approved loan to the trust bank
 */
export async function releaseLoanToTrustBank(
  loanId: number,
  txRef?: string | null
): Promise<{ success: boolean; loan: Loan }> {
  const res = await api.post(`/hr/loans/${loanId}/release`, { txRef });
  return res.data;
}

/**
 * Cancel a loan request (HR only)
 */
export async function cancelLoanRequest(
  loanId: number,
  reason: string
): Promise<{ success: boolean; loan: Loan }> {
  const res = await api.post(`/hr/loans/${loanId}/cancel`, { remarks: reason });
  return res.data;
}

/**
 * HR can view loan access
 */
export async function getLoanAccess(
  loanId: number
): Promise<{ user: number; access: LoanAccess }> {
  const res = await api.get(`/hr/loans/${loanId}/access`);

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

/**
 * Fetch loan status summary
 */
export async function getLoanStatusSummary(): Promise<LoanSummary[]> {
  const res = await api.get(`/hr/loans/status-summary`);

  return res.data.summary;
}

export async function exportLoansDataCSV(params?: {
  userId?: number;
  start?: string;
  end?: string;
}) {
  const res = await api.get('/hr/loans/export/csv', {
    responseType: 'blob',
    params: {
      user_id: params?.userId,
      start: params?.start,
      end: params?.end,
    },
  });
  return res.data;
}

export async function exportLoansDataExcel(params?: {
  userId?: number;
  start?: string;
  end?: string;
}) {
  const res = await api.get('/hr/loans/export/excel', {
    responseType: 'blob',
    params: {
      user_id: params?.userId,
      start: params?.start,
      end: params?.end,
    },
  });
  return res.data;
}

export async function exportLoansDataPDF(params?: {
  userId?: number;
  start?: string;
  end?: string;
}) {
  const res = await api.get('/hr/loans/export/pdf', {
    responseType: 'blob',
    params: {
      user_id: params?.userId,
      start: params?.start,
      end: params?.end,
    },
  });
  return res.data;
}

export async function getLoanDocuments(
  loanId: number
): Promise<LoanDocument[]> {
  const res = await api.get(`/hr/loans/${loanId}/documents`);
  return res.data.documents;
}

export async function searchHR(query: string) {
  const data = api.get(`/hr/search?q=${encodeURIComponent(query)}`);

  return data;
}
