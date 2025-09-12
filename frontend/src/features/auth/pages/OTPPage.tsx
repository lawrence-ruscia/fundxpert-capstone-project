import { OTPForm } from '../components/OTPForm';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { LoginResponse } from './LoginPage';
import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

export const OTPPage = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const storedUserId = sessionStorage.getItem('twofa_userId');
  const userId = storedUserId ? parseInt(storedUserId, 10) : null;

  if (!userId) {
    //  No userId means user skipped login
    return <Navigate to='/auth/login' replace />;
  }

  const handle2FALogin = async (otp: string) => {
    const response: LoginResponse = await authService.verify2FA(userId, otp);
    console.log(response);

    if ('token' in response && response.token !== null) {
      alert('✅ Logged in with 2FA!');

      // Store token and redirect to dashboard page
      setToken(response.token);
      localStorage.setItem('token', response.token);
      navigate('/dashboard');
    } else {
      alert('❌ Invalid 2FA code');
    }
  };

  return (
    <Card className='gap-4'>
      <CardHeader>
        <CardTitle className='text-base tracking-tight'>
          Two-factor Authentication
        </CardTitle>
        <CardDescription>
          Please enter the authentication code send to your authenticator app.{' '}
          <br />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OTPForm onVerify={handle2FALogin} />
      </CardContent>
      <CardFooter>
        <p className='text-muted-foreground px-8 text-center text-sm'>
          Haven't received it?{' '}
          <a
            href='/sign-in'
            className='hover:text-primary underline underline-offset-4'
          >
            Resend a new code.
          </a>
        </p>
      </CardFooter>
    </Card>
  );
};
