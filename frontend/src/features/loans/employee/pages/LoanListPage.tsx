import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchEmployeeLoans } from '../services/loanService';
import type { Loan } from '../types/loan';

export default function LoanListPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLoans() {
      try {
        const data = await fetchEmployeeLoans();
        setLoans(data.loans);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    loadLoans();
  }, []);

  if (loading) return <p>Loading loans...</p>;
  if (error) return <p style={{ color: 'red' }}>❌ {error}</p>;

  return (
    <div>
      <h1>📑 My Loans</h1>
      {loans.length === 0 ? (
        <p>No loans yet.</p>
      ) : (
        <ul>
          {loans.map(loan => (
            <li key={loan.id}>
              Loan #{loan.id} – {loan.status} – ₱{loan.amount}{' '}
              <Link to={`/dashboard/loans/${loan.id}`}>View Details</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
