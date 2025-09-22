import type { LoginSchema } from '../schemas/loginSchema';
import type { LoginResponse } from '../pages/LoginPage';
import { logout } from '@/utils/auth';

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

    if (res.status === 401) {
      //  auto logout if unauthorized
      await logout();
      throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
      throw new Error(responseData.error || 'Not Authenticated');
    }

    return responseData.user;
  },

  logoutUser: async () => {
    const res = await fetch('http://localhost:3000/auth/logout', {
      method: 'POST',
      credentials: 'include', //
    });

    if (!res.ok) {
      throw new Error('Logout failed');
    }

    return res.json();
  },

  refreshSession: async () => {
    const res = await fetch('http://localhost:3000/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Failed to refresh session');
    return res.json();
  },
};
