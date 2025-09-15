import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService, type UserResponse } from '../services/authService';
import { useAuth } from '../context/AuthContext';
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

  if (loading) return <p> Checking authentication...</p>;

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
        return <Navigate to='/hr-dashboard' replace />;
      case 'Admin':
        return <Navigate to='/admin-dashboard' replace />;
      default:
        return <Navigate to='/dashboard' replace />;
    }
  }

  return <>{children}</>;
}
