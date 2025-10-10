import { api } from '@/shared/api/api';
export type UploadedWithdrawal = {
  fileUrl: string;
  fileName: string;
  expiresAt: string;
};

export async function uploadFile(
  file: File,
  role: 'HR' | 'Employee' = 'Employee'
): Promise<UploadedWithdrawal> {
  const formData = new FormData();
  formData.append('file', file);

  const endpoint =
    role === 'Employee'
      ? '/employee/withdrawal/files/upload'
      : '/hr/withdrawals/files/upload';

  // Pass FormData directly, not wrapped in an object
  const res = await api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
}

export async function deleteWithdrawalFile(
  withdrawalId: number,
  docId: number,
  role: 'HR' | 'Employee' = 'Employee'
): Promise<UploadedWithdrawal> {
  const endpoint =
    role === 'Employee'
      ? `/employee/withdrawal/${withdrawalId}/documents/${docId}`
      : `/hr/withdrawals/${withdrawalId}/documents/${docId}`;

  const res = await api.delete(endpoint);
  return res.data;
}
