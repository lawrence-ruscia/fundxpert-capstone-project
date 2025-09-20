// src/components/LoanDocumentUpload.tsx
import { useState, useEffect } from 'react';
import type { LoanDocument } from '../services/loanService';
import {
  uploadLoanDocument,
  fetchLoanDocuments,
} from '../services/loanService';
import { uploadFile } from '../services/fileService';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const LoanDocumentUpload = ({ loanId }: { loanId: number }) => {
  const [fileUrl, setFileUrl] = useState('');
  const [documents, setDocuments] = useState<LoanDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing docs
  useEffect(() => {
    async function loadDocs() {
      try {
        const data = await fetchLoanDocuments(loanId);
        setDocuments(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    loadDocs();
  }, [loanId]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // File validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only PDF, JPG, and PNG files are allowed');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File must be less than 5MB');
      e.target.value = '';
      return;
    }

    try {
      // 1. Upload file to server (returns fileUrl)
      const fileUrl = await uploadFile(file);

      // 2. Attach fileUrl to loan in DB
      const resDocument = await uploadLoanDocument(loanId, fileUrl);

      // 3. Update UI
      setDocuments(prev => [...prev, resDocument]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      e.target.value = ''; // reset input
    }
  }

  if (loading) return <p>Loading documents...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ marginTop: '1rem' }}>
      <h3>📎 Supporting Documents</h3>

      <ul>
        {documents.map(doc => (
          <li key={doc.id}>
            <a href={doc.file_url} target='_blank' rel='noopener noreferrer'>
              {doc.file_url}
            </a>{' '}
            <small>({new Date(doc.uploaded_at).toLocaleDateString()})</small>
          </li>
        ))}
      </ul>

      <input type='file' onChange={handleFileChange} />
    </div>
  );
};
