import { useEffect, useState } from 'react';
import { LoanDocumentUpload } from '../components/LoanDocumentUpload';
import { useParams } from 'react-router-dom';
import { fetchLoanDetails } from '../services/loanService';
import type { LoanResponse } from '../types/loan';

export default function LoanDetailPage() {
  const { loanId } = useParams<{ loanId: string }>();
  const [loan, setLoan] = useState<LoanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loanId) return;

    async function loadLoan() {
      try {
        const data = await fetchLoanDetails(parseInt(loanId ?? '', 10));
        setLoan(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadLoan();
  }, [loanId]);

  if (loading) return <p>Loading loan details...</p>;
  if (error) return <p style={{ color: 'red' }}>❌ {error}</p>;
  if (!loan) return <p>No loan found.</p>;

  return (
    <div>
      <h2>Loan #{loan.id} Details</h2>
      <p>Status: {loan.status}</p>
      <p>Amount: ₱{loan.amount}</p>
      <p>Purpose: {loan.purpose}</p>
      <p>Term: {loan.repayment_term_months} months</p>
      <p>Applied on: {new Date(loan.created_at).toLocaleDateString()}</p>

      <h3>Documents</h3>
      {loan.documents.length ? (
        <ul>
          {loan.documents.map((document, idx) => (
            <li key={idx}>
              <a href={document.file_url} target='_blank' rel='noreferrer'>
                Document {idx + 1}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>No documents uploaded yet.</p>
      )}

      {/* // TODO: FIX <LoanDocumentUpload loanId={loan.id} /> */}
    </div>
  );
}
