import { useLoanDocs } from '../hooks/useLoanDocs';

export const LoanDocumentUpload = ({ loanId }: { loanId: number }) => {
  const { documents, handleFileChange, handleFileDelete, loading, error } =
    useLoanDocs(loanId);

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
              onClick={() => handleFileDelete(doc.file_name, loanId, doc.id)}
              disabled={loading}
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
