import { useNavigate } from 'react-router-dom';
import { logout } from '@/utils/auth';
export default function AdminDashboard() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '2rem' }}>
      <h1>🏦 FundXpert Admin Dashboard</h1>
      <p>Welcome to the secure Admin dashboard.</p>
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
