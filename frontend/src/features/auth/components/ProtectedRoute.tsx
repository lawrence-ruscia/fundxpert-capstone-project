import { isAuthenticated } from '@/utils/auth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    // If not logged in, redirect to login page
    return <Navigate to='/' replace />;
  }
  return <>{children}</>;
}
