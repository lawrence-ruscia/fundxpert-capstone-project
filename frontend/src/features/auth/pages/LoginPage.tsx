import { LoginForm } from '../components/LoginForm';
import { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import type { LoginSchema } from '../schemas/loginSchema';
import { authService } from '../services/authService';
import { OTPForm } from '../components/OTPForm';
import { useNavigate } from 'react-router-dom';

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
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (data: LoginSchema) => {
    const response: LoginResponse = await authService.login(data);

    if ('twofaRequired' in response) {
      setUserId(response.userId);
      setStep('2fa');
    } else if ('token' in response) {
      setToken(response.token);
      alert('✅ Logged in successfully!');
      navigate('/dashboard');
    } else {
      alert('❌ Login failed');
    }
  };

  return (
    <AuthLayout>
      {step === 'login' && <LoginForm onSubmit={onSubmit} />}

      {step === '2fa' && <OTPForm userId={userId} setToken={setToken} />}
    </AuthLayout>
  );
};
