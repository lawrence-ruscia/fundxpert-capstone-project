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

  if (user && user.role === 'Employee') {
    // already logged in, redirect to dashboard
    return <Navigate to='/employee' replace />;
  }

  if (user && user.role === 'HR') {
    return <Navigate to='/hr' replace />;
  }

  if (user && user.role === 'Admin') {
    return <Navigate to='/admin' replace />;
  }

  return <>{children}</>;
}
