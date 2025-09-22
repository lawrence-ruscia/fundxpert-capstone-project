export type UploadedWithdrawal = {
  fileUrl: string;
  fileName: string;
  expiresAt: string;
};

export async function uploadFile(file: File): Promise<UploadedWithdrawal> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(
    'http://localhost:3000/employee/withdrawal/files/upload',
    {
      method: 'POST',
      body: formData,
      credentials: 'include',
    }
  );

  if (!res.ok)
    throw new Error((await res.json()).error || 'File upload failed');

  const data = await res.json();
  return data;
}
