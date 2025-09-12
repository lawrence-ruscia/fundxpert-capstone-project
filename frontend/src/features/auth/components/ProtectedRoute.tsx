import { isAuthenticated, getRole } from '@/utils/auth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Employee' | 'HR' | 'Admin')[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    // If not logged in, redirect to login page
    return <Navigate to='/auth/login' replace />;
  }
  const role = getRole();
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to role-specific dashboard if not authorized
    switch (role) {
      case 'HR':
        return <Navigate to='/hr-dashboard' replace />;
      case 'Admin':
        return <Navigate to='/admin-dashboard' replace />;
      default:
        return <Navigate to='/dashboard' replace />;
    }
  }

  return <>{children}</>;
}
