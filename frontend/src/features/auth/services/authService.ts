import type { LoginSchema } from '../schemas/loginSchema';
import type { LoginResponse, UserResponse } from '../types/loginResponse';
import { logout } from '@/utils/auth';

// TODO: Move these to global shared/types folder

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

  setup2FA: async (userId: number) => {
    const res = await fetch('http://localhost:3000/auth/2fa/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  verify2FA: async (
    userId: number | null,
    otp: string
  ): Promise<LoginResponse> => {
    const res = await fetch('http://localhost:3000/auth/2fa/verify-setup', {
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

  login2FA: async (
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

  reset2FA: async () => {
    const res = await fetch('http://localhost:3000/auth/2fa/reset', {
      method: 'POST',
      credentials: 'include', // send cookies
    });

    if (!res.ok) {
      throw new Error('Failed to reset 2FA');
    }

    return res.json(); // { message, qrCode }
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

    return responseData;
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
