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
  const res = await api.get(`/employee/withdrawal/eligibility`);

  return res.data;
}

export async function fetchWithdrawalDocuments(
  withdrawalId: number
): Promise<WithdrawalDocument[]> {
  const res = await api.get(`/employee/withdrawal/${withdrawalId}/documents`);

  return res.data.employeeDocuments;
}

export async function fetchWithdrawalDetails(
  withdrawalId: number
): Promise<WithdrawalRequest & { documents: WithdrawalDocument[] }> {
  const res = await api.get(`/employee/withdrawal/${withdrawalId}`);

  return res.data;
}

export async function fetchWithdrawalHistory(): Promise<WithdrawalRequest[]> {
  const res = await api.get(`/employee/withdrawal/history`);

  return res.data;
}

export async function applyWithdrawal(
  payload: WithdrawalApplicationRequest
): Promise<WithdrawalRequest> {
  try {
    const res = await api.post('/employee/withdrawal/apply', payload);

    return res.data;
  } catch (err) {
    console.error(err);
  }
}

export async function cancelWithdrawal(
  withdrawalId: number
): Promise<CancelWithdrawalResponse> {
  const res = await api.post(`/employee/withdrawal/${withdrawalId}/cancel`);

  return res.data;
}
