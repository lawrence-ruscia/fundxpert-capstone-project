import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
interface AuthRedirectProps {
  children: React.ReactNode;
}

export default function AuthRedirect({ children }: AuthRedirectProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text={'Checking Authentication'} />;
  }

  if (user) {
    // already logged in, redirect to dashboard
    return <Navigate to='/dashboard' replace />;
  }

  return <>{children}</>;
}
