import { cn } from '@/lib/utils';
import { LoginForm } from '../components/LoginForm';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';

import { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import type { LoginSchema } from '../schemas/loginSchema';
import { authService } from '../services/authService';

export type LoginResponse =
  | {
      token: string;
      user: { id: number; name: string; role: string };
    }
  | {
      twofaRequired: true;
      userId: number;
    };

export const LoginPage = () => {
  const [step, setStep] = useState<'login' | '2fa'>('login');
  const [userId, setUserId] = useState<number | null>(null);
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState<string | null>(null);

  const onSubmit = async (data: LoginSchema) => {
    const response: LoginResponse = await authService.login(data);

    if ('twofaRequired' in response) {
      setUserId(response.userId);
      setStep('2fa');
    } else if ('token' in response) {
      setToken(response.token);
      alert('✅ Logged in successfully!');
    } else {
      alert('❌ Login failed');
    }
  };

  const handle2FALogin = async () => {
    const response: LoginResponse = await authService.verify2FA(userId, otp);
    console.log(response);

    if ('token' in response && response.token !== null) {
      setToken(response.token);
      alert('✅ Logged in with 2FA!');
    } else {
      alert('❌ Invalid 2FA code');
    }
  };

  return (
    <AuthLayout>
      <div className={cn('flex flex-col gap-6')}>
        <Card>
          <CardHeader className='flex flex-col items-center'>
            <CardTitle className='text-xl'>Welcome Back</CardTitle>
            <CardDescription>
              Enter your company email to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm onSubmit={onSubmit} />
          </CardContent>
          <CardFooter>
            <p className='text-muted-foreground px-8 text-center text-sm'>
              By signing in, you agree to our{' '}
              <a
                href='https://web-assets.metrobank.com.ph/1661480202-mbos-ebtc-as-of-sept-2021.pdf'
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-primary underline underline-offset-4'
              >
                Terms of Use
              </a>
              ,{' '}
              <a
                href='https://www.metrobank.com.ph/articles/privacy-notice'
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-primary underline underline-offset-4'
              >
                Privacy Policy
              </a>
              , and{' '}
              <a
                href='https://web-assets.metrobank.com.ph/1661480290-mbos-security-features.pdf'
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-primary underline underline-offset-4'
              >
                Security Features
              </a>
              .
            </p>
          </CardFooter>
        </Card>
      </div>
    </AuthLayout>
  );
};
