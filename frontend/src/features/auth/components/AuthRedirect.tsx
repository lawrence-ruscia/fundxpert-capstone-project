import { isAuthenticated } from '@/utils/auth';
import { Navigate } from 'react-router-dom';
interface AuthRedirectProps {
  children: React.ReactNode;
}

export default function AuthRedirect({ children }: AuthRedirectProps) {
  if (isAuthenticated()) {
    // If user is already logged in, block access to auth pages
    return <Navigate to='/dashboard' replace />;
  }
  return <>{children}</>;
}
