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

  payout_amount: number;
  payout_method?: string | null;

  consent_acknowledged: boolean;

  status: WithdrawalStatus;

  employee_id: string;
  employee_name: string;
  department_name: string;
  position_title: string;
  assistant_name: string;
  officer_id: number;
  officer_name: string;
  ready_for_review: boolean;
  assistant_id: number;
  notes?: string | null;

  created_at: Date;
  updated_at?: Date | null;
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
