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
          ? await authService.verify2FA(userId, data.otp) // first-time setup
          : await authService.login2FA(userId, data.otp); // normal login

      if ('user' in response) {
        // Clear temporary userId
        sessionStorage.removeItem('twofa_userId');
        sessionStorage.removeItem('twofa_mode');

        login(response.user, response.tokenExpiry);
        // Redirect to dashboard
        console.log('User is: ', response);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError('otp', {
        message: (err as Error).message || 'Invalid 2FA token.',
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
