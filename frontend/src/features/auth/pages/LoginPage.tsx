import { LoginForm } from '../components/LoginForm';
import type { LoginSchema } from '../schemas/loginSchema';
import { authService } from '../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { UseFormSetError } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import type { LoginResponse } from '../types/loginResponse';
import { getErrorMessage } from '@/shared/api/getErrorMessage';

const storeTwoFaInfo = (userId: number, twofa_mode: 'setup' | 'login') => {
  sessionStorage.setItem('twofa_userId', String(userId));
  sessionStorage.setItem('twofa_mode', twofa_mode);
};

const storeForceChangeInfo = (userId: number) => {
  sessionStorage.setItem('forceChangeUserId', String(userId));
};

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (
    data: LoginSchema,
    setError: UseFormSetError<LoginSchema>
  ) => {
    try {
      const response: LoginResponse = await authService.login(data);

      // Handle force password change
      if ('forcePasswordChange' in response) {
        storeForceChangeInfo(response.userId);
        navigate('/auth/reset-password');
        return;
      }

      // Handle 2FA setup required
      if ('twofaSetupRequired' in response) {
        storeTwoFaInfo(response.userId, 'setup');
        navigate('/auth/setup-2fa');
        return;
      }

      // Handle 2FA verification required
      if ('twofaRequired' in response) {
        storeTwoFaInfo(response.userId, 'login');
        navigate('/auth/login-2fa');
        return;
      }

      // Fully logged in (no 2FA or password change required)
      if ('user' in response) {
        login(response.user, response.tokenExpiry);
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Login:', err);
      setError('root', {
        message: getErrorMessage(err, 'Login failed. Please try again.'),
      });
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
