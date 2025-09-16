import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
interface AuthRedirectProps {
  children: React.ReactNode;
}

export default function AuthRedirect({ children }: AuthRedirectProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Checking authentication...</p>;
  }

  if (user) {
    // already logged in, redirect to dashboard
    return <Navigate to='/dashboard' replace />;
  }

  return <>{children}</>;
}
