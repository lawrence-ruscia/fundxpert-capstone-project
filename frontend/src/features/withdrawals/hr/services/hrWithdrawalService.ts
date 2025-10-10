import { api } from '@/shared/api/api';
import type {
  WithdrawalAccess,
  WithdrawalFilters,
  WithdrawalHistory,
  WithdrawalRequest,
  WithdrawalSummary,
  WithdrawalType,
} from '../../employee/types/withdrawal';

export async function markWithdrawalReady(
  withdrawalId: number
): Promise<{ success: boolean; withdrawal: WithdrawalRequest }> {
  const res = await api.patch(`/hr/withdrawals/${withdrawalId}/mark-ready`);
  return res.data;
}

export async function markWithdrawalIncomplete(
  withdrawalId: number,
  reason: string
): Promise<{ success: boolean; withdrawal: WithdrawalRequest }> {
  const res = await api.patch(
    `/hr/withdrawals/${withdrawalId}/mark-incomplete`,
    {
      remarks: reason,
    }
  );
  return res.data;
}

export async function moveWithdrawalToReview(
  withdrawalId: number
): Promise<{ success: boolean; withdrawal: WithdrawalRequest }> {
  const res = await api.post(`/hr/withdrawals/${withdrawalId}/review`);
  return res.data;
}

export async function reviewWithdrawalDecision(
  withdrawalId: number,
  decision: 'Approved' | 'Rejected',
  comments?: string
): Promise<{ success: boolean; decision: 'Approved' | 'Rejected' }> {
  const res = await api.post(`/hr/withdrawals/${withdrawalId}/approve`, {
    decision,
    comments,
  });

  return res.data;
}

export async function releaseWithdrawalFunds(
  withdrawalId: number,
  txRef?: string | null
): Promise<{ success: boolean; withdrawal: WithdrawalType }> {
  const res = await api.post(`/hr/withdrawals/${withdrawalId}/release`, {
    txRef,
  });
  return res.data;
}

export async function cancelWithdrawalRequest(
  withdrawalId: number,
  reason: string
): Promise<{ success: boolean; withdrawal: WithdrawalType }> {
  const res = await api.post(`/hr/withdrawals/${withdrawalId}/cancel`, {
    remarks: reason,
  });
  return res.data;
}

export async function getWithdrawalAccess(
  withdrawalId: number
): Promise<{ user: number; access: WithdrawalAccess }> {
  const res = await api.get(`/hr/withdrawals/${withdrawalId}/access`);

  return res.data;
}

export async function getWithdrawalHistory(
  withdrawalId: number
): Promise<WithdrawalHistory[]> {
  const res = await api.get(`/hr/withdrawals/${withdrawalId}/history`);
  return res.data;
}

export async function getAllWithdrawals(
  filters?: WithdrawalFilters
): Promise<WithdrawalRequest[]> {
  const params = new URLSearchParams();

  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const res = await api.get(`/hr/withdrawals`, { params });
  return res.data;
}

export async function getWithdrawalById(
  withdrawalId: number
): Promise<WithdrawalRequest> {
  const res = await api.get(`/hr/withdrawals/${withdrawalId}`);
  console.log(res.data);
  return res.data;
}
export async function getWithdrawalStatusSummary(): Promise<
  WithdrawalSummary[]
> {
  const res = await api.get(`/hr/withdrawals/status-summary`);

  return res.data.summary;
}

export async function exportWithdrawalsDataCSV(params?: {
  userId?: number;
  start?: string;
  end?: string;
}) {
  const res = await api.get('/hr/withdrawals/export/csv', {
    responseType: 'blob',
    params: {
      user_id: params?.userId,
      start: params?.start,
      end: params?.end,
    },
  });
  return res.data;
}

export async function exportWithdrawalsDataExcel(params?: {
  userId?: number;
  start?: string;
  end?: string;
}) {
  const res = await api.get('/hr/withdrawals/export/excel', {
    responseType: 'blob',
    params: {
      user_id: params?.userId,
      start: params?.start,
      end: params?.end,
    },
  });

  return res.data;
}

export async function exportWithdrawalsDataPDF(params: {
  userId?: number;
  start?: string;
  end?: string | null;
}) {
  const res = await api.get('/hr/withdrawals/export/pdf', {
    responseType: 'blob',
    params: {
      user_id: params?.userId,
      start: params?.start,
      end: params?.end,
    },
  });
  return res.data;
}
