import type {
  WithdrawalDocument,
  WithdrawalEligibility,
  WithdrawalRequest,
} from '../types/withdrawal';

export async function uploadLoanDocument(
  withdrawalId: number,
  fileUrl: string,
  fileName: string
): Promise<{ document: WithdrawalDocument }> {
  const res = await fetch(
    `http://localhost:3000/employee/loan/${withdrawalId}/documents`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // important for httpOnly cookie
      body: JSON.stringify({ fileUrl, fileName }),
    }
  );

  if (!res.ok) {
    throw new Error((await res.json()).error || 'Failed to upload document');
  }
  return res.json();
}

export async function fetchWithdrawalEligibility(): Promise<WithdrawalEligibility> {
  const res = await fetch(
    `http://localhost:3000/employee/withdrawal/eligibility`,
    {
      credentials: 'include',
    }
  );

  if (!res.ok) {
    throw new Error((await res.json()).error || 'Failed to fetch documents');
  }
  return res.json();
}

export async function fetchWithdrawalDocuments(
  withdrawalId: number
): Promise<WithdrawalDocument[]> {
  const res = await fetch(
    `http://localhost:3000/employee/loan/${withdrawalId}/documents`,
    {
      credentials: 'include',
    }
  );

  if (!res.ok) {
    throw new Error((await res.json()).error || 'Failed to fetch documents');
  }
  return res.json();
}

export async function fetchWithdrawalDetails(
  withdrawalId: number
): Promise<WithdrawalRequest & { documents: WithdrawalDocument[] }> {
  const res = await fetch(
    `http://localhost:3000/employee/withdrawal/${withdrawalId}`,
    {
      method: 'GET',
      credentials: 'include', // ensure cookies (auth) are sent
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch loan details: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchWithdrawalHistory(): Promise<WithdrawalRequest[]> {
  const res = await fetch(`http://localhost:3000/employee/withdrawal/history`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch loans: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
}

type WithdrawalApplicationRequest = {
  request_type: string;
  purpose_detail?: string;
  requested_amount?: number;
  payout_method?: string;
  beneficiary_name?: string;
  beneficiary_relationship?: string;
  beneficiary_contact?: string;
};

export async function applyWithdrawal(
  payload: WithdrawalApplicationRequest
): Promise<WithdrawalRequest> {
  const res = await fetch('http://localhost:3000/employee/withdrawal/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error((await res.json()).error || 'Loan application failed');
  }

  return res.json();
}
