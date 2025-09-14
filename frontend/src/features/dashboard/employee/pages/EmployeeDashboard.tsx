import { useNavigate } from 'react-router-dom';
import { logout } from '@/utils/auth';
import { useEmployeeOverview } from '../hooks/useEmployeeOverview';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useEmployeeContributions } from '@/features/contributions/employee/hooks/useEmployeeContributions';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { data: overview, loading, error } = useEmployeeOverview();
  const { data: empContribution } = useEmployeeContributions();

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
      <h1>🏦 Employee Dashboard</h1>
      <h2>Welcome, {overview.employee.name}</h2>
      <p>Employee ID: {overview.employee.employee_id}</p>

      <h3>💰 Balances</h3>
      <p>Total Balance: ₱{overview.balances.total_balance}</p>

      <h3>📈 Fund Growth</h3>
      <LineChart width={600} height={300} data={empContribution?.contributions}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis dataKey='month' />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type='monotone'
          dataKey='employee'
          stroke='#8884d8'
          name='Employee'
        />
        <Line
          type='monotone'
          dataKey='employer'
          stroke='#82ca9d'
          name='Employer'
        />
        <Line
          type='monotone'
          dataKey='cumulative'
          stroke='#ffc658'
          name='Cumulative'
        />
      </LineChart>
    </div>
  );
}
