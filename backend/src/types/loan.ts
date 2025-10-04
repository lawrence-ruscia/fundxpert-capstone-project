export type LoanStatus =
  | 'Pending'
  | 'UnderReviewOfficer'
  | 'AwaitingApprovals'
  | 'Rejected'
  | 'Approved'
  | 'Active'
  | 'Settled'
  | 'Cancelled';

export type LoanApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Loan {
  id: number;
  user_id: number;
  amount: number;
  repayment_term_months: number;
  purpose_category: LoanPurposeCategory;
  purpose_detail: string;
  co_maker_employee_id?: string | null;
  consent_acknowledged: boolean;
  status: LoanStatus;
  monthly_amortization: number;
  created_at: Date;
  approved_at?: Date | null;
  approved_by?: number | null;
  active_at?: Date | null;
  settled_at?: Date | null;
  rejected_at?: Date | null;
  trust_bank_txref?: string | null;
  approval_flow?: unknown; // JSONB, can define structure later
}

export type LoanPurposeCategory =
  | 'Medical'
  | 'Education'
  | 'Housing'
  | 'Emergency'
  | 'Debt'
  | 'Others';

export interface LoanEligibility {
  eligible: boolean;
  reason: string | null;
  vestedBalance: number;
  maxLoanAmount: number;
  hasActiveLoan: boolean;
  minLoanAmount: number;
  maxRepaymentMonths: number;
}

export interface LoanDocument {
  id: number;
  loan_id: number;
  file_url: string;
  file_name: string;
  uploaded_at: Date;
}

export type CancelledLoan = {
  success: boolean;
  loanId?: number;
  newStatus?: string;
};
