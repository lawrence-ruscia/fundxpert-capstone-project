import type { LoginSchema } from '../schemas/loginSchema';
import type { LoginResponse, UserResponse } from '../types/loginResponse';
import { logout } from '@/utils/auth';
import { api } from '@/shared/api/api';

// TODO: Move these to global shared/types folder

export const authService = {
  login: async (data: LoginSchema): Promise<LoginResponse> => {
    const res = await api.post('/auth/login', data);

    return res.data;
  },

  setup2FA: async (userId: number) => {
    const res = await api.post('/auth/2fa/setup', { userId });

    return res.data;
  },

  verify2FA: async (
    userId: number | null,
    otp: string
  ): Promise<LoginResponse> => {
    const res = await api.post('/auth/2fa/verify-setup', {
      userId,
      token: otp,
    });

    return res.data;
  },

  login2FA: async (
    userId: number | null,
    otp: string
  ): Promise<LoginResponse> => {
    const res = await api.post('/auth/2fa/login', { userId, token: otp });

    return res.data;
  },

  reset2FA: async () => {
    const res = await api.post('/auth/2fa/reset');

    return res.data;
  },

  fetchCurrentUser: async (): Promise<UserResponse> => {
    const res = await api.get('/auth/me');

    return res.data;
  },

  logoutUser: async () => {
    const res = await api.post('/auth/logout');

    return res.data;
  },

  refreshSession: async (): Promise<{
    success: string;
    tokenExpiry: number;
  }> => {
    const res = await api.post('/auth/refresh');

    return res.data;
  },

  resetPassword: async (userId: number, newPassword: string) => {
    const res = await api.post('/auth/reset-password', { userId, newPassword });

    return res.data;
  },
};
