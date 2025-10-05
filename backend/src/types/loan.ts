export type LoanStatus =
  | 'Pending'
  | 'Incomplete'
  | 'UnderReviewOfficer'
  | 'AwaitingApprovals'
  | 'PendingNextApproval'
  | 'Approved'
  | 'Released'
  | 'Rejected'
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

  officer_id: number;
  officer_name: string;
  ready_for_review: boolean;
  assistant_id: number;

  monthly_amortization: number;
  created_at: Date;
  approved_at?: Date | null;
  approved_by?: number | null;
  active_at?: Date | null;
  settled_at?: Date | null;
  rejected_at?: Date | null;
  trust_bank_ref?: string | null;
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
