import { api } from '@/shared/api/api';

export type UploadedLoan = {
  fileUrl: string;
  fileName: string;
  expiresAt: string;
};

export async function uploadFile(
  file: File,
  role: 'HR' | 'Employee' = 'Employee'
): Promise<UploadedLoan> {
  const formData = new FormData();
  formData.append('file', file);

  const endpoint =
    role === 'Employee'
      ? '/employee/loan/files/upload'
      : '/hr/loans/files/upload';

  // Pass FormData directly, not wrapped in an object
  const res = await api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
}

export async function deleteFile(
  loanId: number,
  docId: number,
  role: 'HR' | 'Employee' = 'Employee'
): Promise<UploadedLoan> {
  const endpoint =
    role === 'Employee'
      ? `/employee/loan/${loanId}/documents/${docId}`
      : `/hr/loans/${loanId}/documents/${docId}`;

  const res = await api.delete(endpoint);
  return res.data;
}
