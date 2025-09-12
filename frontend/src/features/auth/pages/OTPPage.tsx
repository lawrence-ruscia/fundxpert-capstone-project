import { OTPForm } from '../components/OTPForm';
import { useNavigate, Navigate } from 'react-router-dom';
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
import type { UseFormSetError } from 'react-hook-form';
import type { OTPSchema } from '../schemas/otpSchema';

export const OTPPage = () => {
  const navigate = useNavigate();
  const storedUserId = sessionStorage.getItem('twofa_userId');
  const userId = storedUserId ? parseInt(storedUserId, 10) : null;

  if (!userId) {
    //  No userId means user skipped login
    return <Navigate to='/auth/login' replace />;
  }

  const handle2FALogin = async (
    otp: string,
    setError: UseFormSetError<OTPSchema>
  ) => {
    try {
      const response: LoginResponse = await authService.verify2FA(userId, otp);
      console.log(response);
      if ('user' in response) {
        // Clear temporary userId
        sessionStorage.removeItem('twofa_userId');
        // let ProtectedRoute handle the redirect
        navigate('/dashboard');
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
