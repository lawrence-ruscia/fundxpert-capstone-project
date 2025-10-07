import type { LoanStatus } from '../../employee/types/loan';

export interface LoanApproval {
  id: number;
  loan_id: number;
  approver_id: number;
  approver_name?: string;
  approver_email?: string;
  sequence_order: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewed_at?: string;
  comments?: string;
  is_current: boolean;
}

export interface LoanHistory {
  id: number;
  loan_id: number;
  action: string;
  performed_by: number;
  actor_name?: string;
  created_at: string;
  comments?: string;
}

export interface LoanFilters {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface LoanAccess {
  canMarkReady: boolean;
  canMarkIncomplete: boolean;
  canMoveToReview: boolean;
  canAssignApprovers: boolean;
  canApprove: boolean;
  canRelease: boolean;
  canCancel: boolean;
}

export interface LoanSummary {
  status: LoanStatus;
  count: number;
}

export type SearchHRRecord = {
  id: number;
  employee_id: string;
  name: string;
  department: string;
  position: string;
};
