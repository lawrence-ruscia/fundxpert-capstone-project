export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('http://localhost:3000/employee/loan/files/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok)
    throw new Error((await res.json()).error || 'File upload failed');

  const data = await res.json();
  return data.fileUrl; // backend returns { fileUrl }
}
