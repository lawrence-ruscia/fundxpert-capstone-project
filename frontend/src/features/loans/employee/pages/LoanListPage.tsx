import { Link } from 'react-router-dom';
import { fetchEmployeeLoans } from '../services/loanService';
import type { Loan } from '../types/loan';
import { useApi } from '@/hooks/useApi';
import { LoanApplicationForm } from '../components/LoanApplicationForm';
import { useState } from 'react';
import { useEmployeeOverview } from '@/features/dashboard/employee/hooks/useEmployeeOverview';

export default function LoanListPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    data: loans,
    loading,
    error,
  } = useApi<Loan[]>(
    fetchEmployeeLoans,
    [refreshKey] // Add refreshKey as dependency
  );
  const {
    data: overview,
    loading: overviewLoading,
    error: overviewError,
  } = useEmployeeOverview();

  const [showForm, setShowForm] = useState(false);

  const handleFormSuccess = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1); // Increment to trigger refetch
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  // Loading state
  if (loading || overviewLoading) {
    return <LoadingSpinner />;
  }

  // Error state
  if (error || overviewError) {
    return (
      <ErrorMessage
        message={
          error?.message || overviewError?.message || 'An error occurred'
        }
      />
    );
  }

  // No overview data (shouldn't happen but good to handle)
  if (!overview) {
    return (
      <ErrorMessage message='Unable to load loan eligibility information' />
    );
  }

  const maxLoanAmount = overview.eligibility.max_loan_amount ?? 0;

  return (
    <div style={{ margin: '0 auto', padding: '20px' }}>
      {/* Loans List Section */}
      <LoansList loans={loans || []} />

      {/* Form or Apply Button Section */}
      {showForm ? (
        <LoanApplicationForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          maxLoan={maxLoanAmount}
        />
      ) : (
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Apply for New Loan
          </button>
        </div>
      )}
    </div>
  );
}

// Error Boundary Component
function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      style={{
        color: 'red',
        padding: '10px',
        border: '1px solid red',
        borderRadius: '4px',
      }}
    >
      ❌ {message}
    </div>
  );
}

// Loading Component
function LoadingSpinner() {
  return <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>;
}

// Loan Item Component
function LoanItem({ loan }: { loan: Loan }) {
  return (
    <li style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
      <div>
        <strong>Loan #{loan.id}</strong> – {loan.status} – ₱
        {loan.amount.toLocaleString()}
      </div>
      <Link
        to={`/dashboard/loans/${loan.id}`}
        style={{ color: '#007bff', textDecoration: 'none' }}
      >
        View Details →
      </Link>
    </li>
  );
}

// Loans List Component
function LoansList({ loans }: { loans: Loan[] }) {
  if (!loans || loans.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <p>No loans yet</p>
      </div>
    );
  }

  return (
    <div>
      <h1>📑 My Loans</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {loans.map(loan => (
          <LoanItem key={loan.id} loan={loan} />
        ))}
      </ul>
    </div>
  );
}
