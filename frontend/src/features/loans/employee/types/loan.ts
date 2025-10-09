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

  employee_id: string;
  employee_name: string;
  department_name: string;
  position_title: string;
  assistant_name: string;
  officer_id: number;
  officer_name: string;
  ready_for_review: boolean;
  assistant_id: number;
  notes?: string;

  monthly_amortization: number;
  created_at: Date;
  approved_at?: Date | null;
  updated_at?: Date | null;
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

export type LoanDocumentResponse = {
  employeeDocuments: LoanDocument[];
  hrDocuments: LoanDocument[];
};

export type LoanResponse = Loan & { documents: LoanDocument[] };

export type CancelLoanResponse = {
  success: boolean;
  loanId?: number;
  newStatus?: string;
};
