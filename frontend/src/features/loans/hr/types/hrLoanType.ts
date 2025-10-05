export interface LoanApproval {
  approver_id: number;
  approver_name?: string;
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
