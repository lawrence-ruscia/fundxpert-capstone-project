import { useEffect, useState } from 'react';
import type { LoanDocument } from '../types/loan';
import {
  fetchLoanDocuments,
  uploadLoanDocument,
} from '../services/loanService';
import { uploadFile } from '../services/fileService';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const useLoanDocs = (loanId: number) => {
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
      setError('File must be less than 10MB');
      e.target.value = '';
      return;
    }

    try {
      setLoading(true);
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
      setLoading(false);
      e.target.value = ''; // reset input
    }
  }

  async function handleFileDelete(
    fileName: string,
    loanId: number,
    docId: number
  ) {
    if (confirm(`Delete ${fileName}?`)) {
      try {
        setLoading(true);
        await fetch(
          `http://localhost:3000/employee/loan/${loanId}/documents/${docId}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        );
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }

      // To update the UI
      setDocuments(prev => prev.filter(docs => docs.id != docId));
    }
  }

  return {
    documents,
    handleFileChange,
    handleFileDelete,
    loading,
    error,
    clearError: () => setError(null),
  };
};
