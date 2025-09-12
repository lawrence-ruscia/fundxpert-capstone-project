import type { LoginSchema } from '../schemas/loginSchema';
import type { LoginResponse } from '../pages/LoginPage';

// TODO: Move these to global shared/types folder
export type UserResponse = {
  id: number;
  name: string;
  role: 'Employee' | 'HR' | 'Admin';
};

export const authService = {
  login: async (data: LoginSchema): Promise<LoginResponse> => {
    const res = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    const responseData = await res.json();

    if (!res.ok) {
      throw new Error(responseData.error || 'Login failed');
    }

    return responseData;
  },

  verify2FA: async (
    userId: number | null,
    otp: string
  ): Promise<LoginResponse> => {
    const res = await fetch('http://localhost:3000/auth/2fa/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token: otp }),
      credentials: 'include',
    });

    const responseData = await res.json();

    if (!res.ok) {
      throw new Error(responseData.error || '2FA failed');
    }

    return responseData;
  },

  fetchCurrentUser: async (): Promise<UserResponse> => {
    const res = await fetch('http://localhost:3000/auth/me', {
      method: 'GET',
      credentials: 'include', // include cookies
    });
    const responseData = await res.json();

    if (!res.ok) {
      throw new Error(responseData.error || 'Not Authenticated');
    }

    return responseData.user;
  },
};
