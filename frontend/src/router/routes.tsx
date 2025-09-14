import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import EmployeeDashboard from '@/features/dashboard/employee/pages/EmployeeDashboard';
import HRDashboard from '@/features/dashboard/hr/pages/HRDashboard';
import AdminDashboard from '@/features/dashboard/admin/pages/AdminDashboard';
import NotFoundPage from '@/features/NotFoundError';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import { AuthLayout } from '@/shared/layout/AuthLayout';
import { OTPPage } from '@/features/auth/pages/OTPPage';
import AuthRedirect from '@/features/auth/components/AuthRedirect';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to='/auth/login' replace />,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: (
          <AuthRedirect>
            <LoginPage />
          </AuthRedirect>
        ),
      },
      {
        path: 'verify-2fa',
        element: (
          <AuthRedirect>
            <OTPPage />
          </AuthRedirect>
        ),
      },
      { index: true, element: <Navigate to='/auth/login' replace /> },
    ],
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['Employee']}>
        <EmployeeDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/hr-dashboard',
    element: (
      <ProtectedRoute allowedRoles={['HR']}>
        <HRDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin-dashboard',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },

  {
    path: '/404',
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <Navigate to='/404' replace />,
  },
]);
