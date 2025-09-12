import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService, type UserResponse } from '../services/authService';
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Employee' | 'HR' | 'Admin')[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const userData = await authService.fetchCurrentUser();
        if (mounted) setUser(userData);
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p> Checking authentication...</p>;

  if (error || !user) return <Navigate to='/auth/login' replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    switch (user.role) {
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
