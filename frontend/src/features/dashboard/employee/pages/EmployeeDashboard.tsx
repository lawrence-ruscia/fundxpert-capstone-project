import { useNavigate } from 'react-router-dom';
import { logout } from '@/utils/auth';
import { useEmployeeOverview } from '../hooks/useEmployeeOverview';
export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { overview, loading, error } = useEmployeeOverview();

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p style={{ color: 'red' }}>❌ {error.message}</p>;
  if (!overview) return <p>No data available</p>;

  // TODO: Build proper frontend
  return (
    <div style={{ padding: '1rem' }}>
      <button
        className='border-2 border-red-600'
        onClick={() => {
          logout();
          navigate('/');
        }}
      >
        Logout
      </button>
      <h1>Employee Dashboard</h1>
      <h2>Welcome, {overview.employee.name}</h2>
      <p>Employee ID: {overview.employee.employee_id}</p>
      <p>Status: {overview.employee.employment_status}</p>
      <p>Date Hired: {new Date(overview.employee.date_hired).toDateString()}</p>

      <hr />

      <h3>Balances</h3>
      <ul>
        <li>
          Employee Contributions: ₱
          {overview.balances.employee_contribution_total}
        </li>
        <li>
          Employer Contributions: ₱
          {overview.balances.employer_contribution_total}
        </li>
        <li>Vested Amount: ₱{overview.balances.vested_amount}</li>
        <li>Unvested Amount: ₱{overview.balances.unvested_amount}</li>
        <li>
          <strong>Total Balance: ₱{overview.balances.total_balance}</strong>
        </li>
      </ul>

      <h3>Loan Status</h3>
      {overview.loan_status.active_loan ? (
        <p>
          Active Loan: ₱{overview.loan_status.outstanding_balance} <br />
          Loan ID: {overview.loan_status.loan_id}
        </p>
      ) : (
        <p>No active loans</p>
      )}

      <h3>Eligibility</h3>
      <p>
        Can Withdraw: {overview.eligibility.can_withdraw ? '✅ Yes' : '❌ No'}
      </p>
      <p>
        Can Request Loan:{' '}
        {overview.eligibility.can_request_loan ? '✅ Yes' : '❌ No'}
      </p>
      <p>Max Loan Amount: ₱{overview.eligibility.max_loan_amount}</p>
    </div>
  );
}
