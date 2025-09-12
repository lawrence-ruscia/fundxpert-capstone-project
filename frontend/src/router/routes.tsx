import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import DashboardPage from '@/features/dashboard/employee/pages/DashboardPage';
import NotFoundPage from '@/features/NotFoundError';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
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
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to='/auth/login' replace />,
  },
]);
