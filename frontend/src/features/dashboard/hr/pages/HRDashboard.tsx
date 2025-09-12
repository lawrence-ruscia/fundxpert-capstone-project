import { useNavigate } from 'react-router-dom';
import { logout } from '@/utils/auth';

export default function HRDashboard() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '2rem' }}>
      <h1>🏦 FundXpert HR Dashboard</h1>
      <p>Welcome to the secure HR dashboard.</p>
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
