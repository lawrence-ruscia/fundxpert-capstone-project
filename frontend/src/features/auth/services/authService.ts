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

    return res.json();
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

    return res.json();
  },

  fetchCurrentUser: async (): Promise<UserResponse> => {
    const res = await fetch('http://localhost:3000/auth/me', {
      method: 'GET',
      credentials: 'include', // include cookies
    });

    if (!res.ok) {
      throw new Error('Not authenticated');
    }

    const data = await res.json();
    console.log(`USER ROLE: ${data.user.role}`);
    return data.user;
  },
};
