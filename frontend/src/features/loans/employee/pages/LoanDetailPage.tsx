import { LoanDocumentUpload } from '../components/LoanDocumentUpload';

import { useLoanDetails } from '../hooks/useLoanDetails';

export default function LoanDetailPage() {
  const { loan, loading, error } = useLoanDetails();

  if (loading) return <p>Loading loan details...</p>;
  if (error) return <p style={{ color: 'red' }}>❌ {error}</p>;
  if (!loan) return <p>No loan found.</p>;

  return (
    <div>
      <h2>Loan #{loan.id} Details</h2>
      <p>Status: {loan.status}</p>
      <p>Amount: ₱{loan.amount}</p>
      <p>Purpose: {loan.purpose_category}</p>
      {loan.purpose_detail && <p>Purpose Detail: {loan.purpose_detail}</p>}
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

      <LoanDocumentUpload loanId={loan.id} />
    </div>
  );
}
