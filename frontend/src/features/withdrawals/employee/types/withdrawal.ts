export type WithdrawalStatus =
  | 'Pending' // Employee submitted, awaiting HR review
  | 'Incomplete' // Employee requirements incomplete
  | 'UnderReviewOfficer' // HR officer currently reviewing / verifying eligibility
  | 'Approved' // HR officer approved for release
  | 'Rejected' // HR officer denied the withdrawal
  | 'Released' // Funds released / confirmed
  | 'Cancelled'; // Employee withdrew the request before processing

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

  employee_id: string;
  employee_name: string;
  department_name: string;
  position_title: string;
  assistant_name: string;
  officer_name: string;

  payout_amount: number;
  payout_method?: string | null;

  consent_acknowledged: boolean;

  status: WithdrawalStatus;

  officer_id: number;
  created_at: Date;
  updated_at?: Date | null;
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

export interface WithdrawalAccess {
  canMarkReady: boolean;
  canMarkIncomplete: boolean;
  canMoveToReview: boolean;
  canApprove: boolean;
  canRelease: boolean;
  canCancel: boolean;
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

export type WithdrawalResponse = WithdrawalRequest & {
  documents: WithdrawalDocument[];
};

export interface WithdrawalApplicationRequest {
  request_type: string;
  consent_acknowledged: boolean;
  purpose_detail?: string;
  payout_method?: string;
  beneficiary_name?: string;
  beneficiary_relationship?: string;
  beneficiary_contact?: string;
}

export interface CancelWithdrawalResponse {
  success: boolean;
  message: string;
}

export interface WithdrawalHistory {
  id: number;
  loan_id: number;
  action: string;
  performed_by: number;
  actor_name?: string;
  created_at: string;
  comments?: string;
}

export interface WithdrawalFilters {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface WithdrawalSummary {
  status: WithdrawalStatus;
  count: number;
}

export type WithdrawalDocumentResponse = {
  employeeDocuments: WithdrawalDocument[];
  hrDocuments: WithdrawalDocument[];
};
