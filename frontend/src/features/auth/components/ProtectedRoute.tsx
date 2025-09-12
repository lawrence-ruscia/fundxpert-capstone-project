import { Navigate } from 'react-router-dom';
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
    async function checkAuth() {
      try {
        const userData = await authService.fetchCurrentUser();
        setUser(userData);
      } catch (err) {
        if (err instanceof Error) {
          console.error(`Error Fetch Current User: ${err}`);
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (loading) return <p> Checking authentication...</p>;

  if (error || !user) return <Navigate to='/auth/login' replace />;

  // TODO: Fix bug where users are able to go back to login page after successfully logging in
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
