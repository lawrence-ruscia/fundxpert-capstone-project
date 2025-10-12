import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import SessionManager from './SessionManager';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Employee' | 'HR' | 'Admin')[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner text={'Checking Authentication'} />;

  if (error || !user)
    return (
      <Navigate
        to='/auth/login'
        replace
        state={{
          from: location,
          message: error,
        }}
      />
    );

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case 'HR':
        return <Navigate to='/hr' replace />;
      case 'Admin':
        return <Navigate to='/admin' replace />;
      default:
        return <Navigate to='/employee' replace />;
    }
  }

  return (
    <>
      <SessionManager />

      {children}
    </>
  );
}
