export type WithdrawalStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Processed'
  | 'Cancelled';

export type WithdrawalType =
  | 'Retirement'
  | 'Resignation'
  | 'Redundancy'
  | 'Disability'
  | 'Death'
  | 'Other';

export interface WithdrawalSnapshot {
  employee_total: number;
  employer_total: number;
  vested_amount: number;
  unvested_amount: number;
  total_balance: number;
}

export interface WithdrawalRequest {
  id: number;
  user_id: number;
  request_type: WithdrawalType;
  purpose_detail?: string | null;

  employee_contribution_total: number;
  employer_contribution_total: number;
  vested_amount: number;
  unvested_amount: number;
  total_balance: number;

  payout_amount: number;
  payout_method?: string | null;

  consent_acknowkedged: boolean;

  status: WithdrawalStatus;

  created_at: Date;
  reviewed_by?: number | null;
  reviewed_at?: Date | null;
  processed_by?: number | null;
  processed_at?: Date | null;
  payment_reference?: string | null;

  notes?: string | null;

  beneficiary_name?: string | null;
  beneficiary_relationship?: string | null;
  beneficiary_contact?: string | null;
}

export interface WithdrawalDocument {
  id: number;
  withdrawal_id: number;
  file_name: string;
  file_url: string;
  uploaded_by: number;
  uploaded_at: Date;
}

export interface WithdrawalEligibility {
  eligible: boolean;
  eligibleTypes: WithdrawalType[];
  snapshot: WithdrawalSnapshot;
  reasonIfNotEligible?: string;
}
