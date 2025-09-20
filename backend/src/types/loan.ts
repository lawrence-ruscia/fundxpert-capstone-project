export type LoanStatus =
  | 'Pending'
  | 'Approved'
  | 'Active'
  | 'Settled'
  | 'Rejected'
  | 'Cancelled';

export interface Loan {
  id: number;
  user_id: number;
  amount: number;
  repayment_term_months: number;
  purpose: string;
  co_maker_employee_id?: string | null;
  consent_acknowledged: boolean;
  notes?: string | null;
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
  uploaded_at: Date;
}
