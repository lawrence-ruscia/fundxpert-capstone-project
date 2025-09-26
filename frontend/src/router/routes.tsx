import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import EmployeeDashboardPage from '@/features/dashboard/employee/pages/EmployeeDashboardPage';
import AdminDashboard from '@/features/dashboard/admin/pages/AdminDashboard';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import { AuthLayout } from '@/shared/layout/AuthLayout';
import { OTPPage } from '@/features/auth/pages/OTPPage';
import AuthRedirect from '@/features/auth/components/AuthRedirect';
import EmployeeLayout from '@/shared/layout/EmployeeLayout';
import ContributionHistoryPage from '@/features/contributions/employee/pages/ContributionHistoryPage';
import FundProjectionPage from '@/features/fundProjection/pages/FundProjectionPage';
import LoanDetailPage from '@/features/loans/employee/pages/LoanDetailPage';
import LoansPage from '@/features/loans/employee/pages/LoansPage';
import { NotFoundError } from '@/shared/components/NotFoundError';
import WithdrawalsPage from '@/features/withdrawals/employee/pages/WithdrawalsPage';
import WithdrawalDetailPage from '@/features/withdrawals/employee/pages/WithdrawalDetailPage';
import { Setup2FAPage } from '@/features/auth/pages/Setup2FAPage';
import { HRDashboardPage } from '@/features/dashboard/hr/pages/HRDashboardPage';
import HRLayout from '@/shared/layout/HRLayout';
import { EmployeeDetailPage } from '@/features/employeeManagement/pages/EmployeeDetailPage';
import { EmployeeListPage } from '@/features/employeeManagement/pages/EmployeeListPage';
import { EmployeeFormPage } from '@/features/employeeManagement/pages/EmployeeFormPage';

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
        path: 'login-2fa',
        element: (
          <AuthRedirect>
            <OTPPage />
          </AuthRedirect>
        ),
      },
      {
        path: 'setup-2fa',
        element: <Setup2FAPage />,
      },
      { index: true, element: <Navigate to='/auth/login' replace /> },
    ],
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['Employee']}>
        <EmployeeLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <EmployeeDashboardPage /> },
      { path: 'contributions', element: <ContributionHistoryPage /> },
      { path: 'projection', element: <FundProjectionPage /> },
      { path: 'loans', element: <LoansPage /> },
      { path: 'loans/:loanId', element: <LoanDetailPage /> },
      { path: 'withdrawals', element: <WithdrawalsPage /> },
      { path: 'withdrawals/:withdrawalId', element: <WithdrawalDetailPage /> },
    ],
  },
  {
    path: '/hr',
    element: (
      <ProtectedRoute allowedRoles={['HR']}>
        <HRLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HRDashboardPage /> },
      {
        path: '/hr/employees',
        element: <EmployeeListPage />,
      },
      {
        path: '/hr/employees/create',
        element: <EmployeeFormPage />,
      },
      {
        path: '/hr/employees/:id',
        element: <EmployeeDetailPage />,
      },
    ],
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
    element: <NotFoundError />,
  },
  {
    path: '*',
    element: <Navigate to='/404' replace />,
  },
]);
