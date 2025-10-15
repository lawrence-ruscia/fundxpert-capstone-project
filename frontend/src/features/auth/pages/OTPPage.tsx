import { OTPForm } from '../components/OTPForm';
import { useNavigate, Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { LoginResponse } from '../types/loginResponse';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import type { UseFormSetError } from 'react-hook-form';
import type { OTPSchema } from '../schemas/otpSchema';
import { useAuth } from '../context/AuthContext';
import { BackButton } from '@/shared/components/back-button';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/api/getErrorMessage';

export const OTPPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const storedUserId = sessionStorage.getItem('twofa_userId');
  const userId = storedUserId ? parseInt(storedUserId, 10) : null;

  if (!userId) {
    //  No userId means user skipped login
    return <Navigate to='/auth/login' replace />;
  }

  const mode = sessionStorage.getItem('twofa_mode');
  const handle2FALogin = async (
    data: OTPSchema,
    setError: UseFormSetError<OTPSchema>
  ) => {
    try {
      const response: LoginResponse =
        mode === 'setup'
          ? await authService.verify2FA(userId, data.otp)
          : await authService.login2FA(userId, data.otp);

      if ('user' in response) {
        sessionStorage.removeItem('twofa_userId');
        sessionStorage.removeItem('twofa_mode');

        login(response.user, response.tokenExpiry);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Navigate directly to role-based dashboard
        const dashboardRoute =
          response.user.role === 'Employee'
            ? '/employee'
            : response.user.role === 'HR'
              ? '/hr'
              : '/admin';

        navigate(dashboardRoute, { replace: true });

        toast.success(
          `Successfully logged in! Welcome back, ${response.user.name}!`
        );
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Invalid 2FA token.'));
      setError('otp', {
        message: getErrorMessage(err, 'Invalid 2FA token.'),
      });
    }
  };

  return (
    <Card className='gap-4'>
      <CardHeader>
        <BackButton />
        <CardTitle className='text-base tracking-tight'>
          Two-factor Authentication
        </CardTitle>
        <CardDescription>
          Please enter the authentication code sent to your authenticator app.{' '}
          <br />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OTPForm onVerify={handle2FALogin} />
      </CardContent>
    </Card>
  );
};
