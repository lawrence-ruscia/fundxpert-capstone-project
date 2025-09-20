import { Link } from 'react-router-dom';
import { fetchEmployeeLoans } from '../services/loanService';
import type { Loan } from '../types/loan';
import { useApi } from '@/hooks/useApi';

export default function LoanListPage() {
  const { data: loans, loading, error } = useApi<Loan[]>(fetchEmployeeLoans);

  if (loading) return <p>Loading loans...</p>;
  if (error) return <p style={{ color: 'red' }}>❌ {error.message}</p>;
  if (!loans || loans.length === 0) return <p>No loans yet</p>;

  return (
    <div>
      <h1>📑 My Loans</h1>

      <ul>
        {loans.map(loan => (
          <li key={loan.id}>
            Loan #{loan.id} – {loan.status} – ₱{loan.amount}{' '}
            <Link to={`/dashboard/loans/${loan.id}`}>View Details</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
