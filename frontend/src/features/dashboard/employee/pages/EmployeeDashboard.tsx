import { useNavigate } from 'react-router-dom';
import { logout } from '@/utils/auth';
export default function EmployeeDashboard() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '2rem' }}>
      <h1>🏦 FundXpert Employee Dashboard</h1>
      <p>Welcome to the secure employee dashboard.</p>
      <button
        onClick={() => {
          logout();
          navigate('/');
        }}
      >
        Logout
      </button>
    </div>
  );
}
