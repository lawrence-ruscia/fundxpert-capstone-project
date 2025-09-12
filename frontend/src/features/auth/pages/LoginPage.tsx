import { LoginForm } from '../components/LoginForm';
import type { LoginSchema } from '../schemas/loginSchema';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
  const navigate = useNavigate();

  const onSubmit = async (data: LoginSchema) => {
    const response: LoginResponse = await authService.login(data);

    if ('twofaRequired' in response) {
      // Store userId in sessionStorage so it's available after refresh
      sessionStorage.setItem('twofa_userId', String(response.userId));

      navigate('/auth/verify-2fa');
    } else if ('token' in response) {
      localStorage.setItem('token', response.token);
      navigate('/dashboard');
    } else {
      alert('❌ Login failed');
    }
  };

  return (
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
  );
};
