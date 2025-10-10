import { api } from '@/shared/api/api';
import type {
  CancelWithdrawalResponse,
  WithdrawalApplicationRequest,
  WithdrawalDocument,
  WithdrawalEligibility,
  WithdrawalRequest,
} from '../types/withdrawal';

export async function uploadWithdrawalDocument(
  withdrawalId: number,
  fileUrl: string,
  fileName: string,
  role: 'HR' | 'Employee' = 'Employee'
): Promise<{ document: WithdrawalDocument }> {
  const endpoint =
    role === 'Employee'
      ? `employee/withdrawal/${withdrawalId}/documents`
      : `hr/withdrawals/${withdrawalId}/documents`;

  const res = await api.post(endpoint, {
    fileUrl,
    fileName,
  });

  return res.data;
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
  const res = await api.get(`employee/withdrawal/${withdrawalId}/documents`);

  return res.data.employeeDocuments;
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

export async function cancelWithdrawal(
  withdrawalId: number
): Promise<CancelWithdrawalResponse> {
  const res = await fetch(
    `http://localhost:3000/employee/withdrawal/${withdrawalId}/cancel`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }
  );

  if (!res.ok) {
    throw new Error((await res.json()).error || 'Loan application failed');
  }
  return res.json();
}
