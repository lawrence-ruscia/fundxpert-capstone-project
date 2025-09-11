import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import Logo from '@/components/ui/logo';
import backgroundSmall from '../assets/login-background-small.png';
import background from '../assets/login-background.png';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBreakpoint } from '../hooks/useBreakpoint';

const loginSchema = z.object({
  email: z.email('Company email address is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginSchema = z.infer<typeof loginSchema>;

type LoginResponse =
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
  const isTablet = useBreakpoint('(min-width: 768px)');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    const res = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const response: LoginResponse = await res.json();

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
    const res = await fetch('http://localhost:3000/auth/2fa/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token: otp }),
    });

    const response = await res.json();
    console.log(response);

    if (response.token) {
      setToken(response.token);
      alert('✅ Logged in with 2FA!');
    } else {
      alert('❌ Invalid 2FA code');
    }
  };

  return (
    <div
      className='lg:bg-autobg-center flex min-h-svh w-full items-center justify-center bg-contain bg-bottom bg-no-repeat p-6 sm:bg-bottom md:bg-contain md:p-10'
      style={{
        backgroundImage: `url(${isTablet ? background : backgroundSmall})`,
      }}
    >
      <div className='w-full max-w-sm'>
        <Logo className='mb-4' />
        <div className={cn('flex flex-col gap-6')}>
          <Card>
            <CardHeader className='flex flex-col items-center'>
              <CardTitle className='text-xl'>Welcome Back</CardTitle>
              <CardDescription>
                Enter your company email to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className='mx-auto flex max-w-3xl flex-col gap-4'
              >
                <div>
                  <div className='space-y-2'>
                    <label
                      id='emailLabel'
                      htmlFor='email'
                      className={`text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                        errors.email ? 'text-red-500' : ''
                      }`}
                    >
                      Company Email *
                    </label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='Your company email'
                      className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className='text-sm font-medium text-red-500'>
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <label
                        htmlFor='password'
                        className={`text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                          errors.password ? 'text-red-500' : ''
                        }`}
                      >
                        Password *
                      </label>
                      <a
                        href='#'
                        className='hover:text-primary ml-auto inline-block text-sm underline-offset-4 hover:underline'
                      >
                        Forgot your password?
                      </a>
                    </div>

                    <PasswordInput
                      className={`mt-1 ${errors.password ? 'border-red-500' : ''}`}
                      required
                      id='password'
                      placeholder='Your password'
                      {...register('password')}
                    />
                    {errors.password && (
                      <p className='text-sm font-medium text-red-500'>
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  className='mt-1.5 w-full'
                  type='submit'
                  disabled={isSubmitting}
                >
                  Login
                </Button>
              </form>
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
      </div>
    </div>
  );
};
