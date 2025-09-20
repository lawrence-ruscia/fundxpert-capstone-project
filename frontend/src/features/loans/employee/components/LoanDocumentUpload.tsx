// src/components/LoanDocumentUpload.tsx
import { useState, useEffect } from 'react';
import {
  uploadLoanDocument,
  fetchLoanDocuments,
} from '../services/loanService';
import { uploadFile } from '../services/fileService';
import type { LoanDocument } from '../types/loan';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const LoanDocumentUpload = ({ loanId }: { loanId: number }) => {
  const [documents, setDocuments] = useState<LoanDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing docs
  useEffect(() => {
    async function loadDocs() {
      try {
        const data = await fetchLoanDocuments(loanId);
        const { documents } = data;
        setDocuments(documents);
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
      const uploadedFile = await uploadFile(file);

      const fileUrl = uploadedFile.fileUrl;
      const fileName = uploadedFile.fileName;

      console.log('File Url: ', fileUrl);
      // 2. Attach fileUrl to loan in DB
      const resDocument = await uploadLoanDocument(loanId, fileUrl, fileName);
      console.log('Document: ', resDocument.document);

      // 3. Update UI
      setDocuments(prev => [...prev, resDocument.document]);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
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
              {doc.file_name}
            </a>{' '}
            <small>({new Date(doc.uploaded_at).toLocaleDateString()})</small>
            <button
              style={{ marginLeft: '1rem', color: 'red' }}
              onClick={async () => {
                if (confirm(`Delete ${doc.file_name}?`)) {
                  await fetch(
                    `http://localhost:3000/employee/loan/${loanId}/documents/${doc.id}`,
                    {
                      method: 'DELETE',
                      credentials: 'include',
                    }
                  );

                  // To update the UI
                  setDocuments(prev => prev.filter(docs => docs.id != doc.id));
                }
              }}
            >
              🗑 Delete
            </button>
          </li>
        ))}
      </ul>

      <input type='file' onChange={handleFileChange} />
    </div>
  );
};
