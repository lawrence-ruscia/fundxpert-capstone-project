import { useAuth } from '@/features/auth/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { getErrorMessage } from './getErrorMessage';
// Create a single axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true, // send cookies (JWT httpOnly cookies)
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setupAuthInterceptor(logout: () => Promise<void>) {
  api.interceptors.response.use(
    response => response,
    async error => {
      const isLogoutEndpoint = error.config?.url?.includes('/auth/logout');
      const isCurrentUserEndpoint = error.config?.url?.includes('/auth/me');
      const isRefreshEndpoint = error.config?.url?.includes('/auth/refresh');
      if (
        error.response?.status === 401 &&
        !isLogoutEndpoint &&
        !isCurrentUserEndpoint &&
        !isRefreshEndpoint
      ) {
        // Token was revoked or expired - auto logout
        await logout();

        toast.error(
          getErrorMessage(
            error,
            'Your session has expired. Please login again.'
          )
        );

        // Optionally redirect to login
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
      return Promise.reject(error);
    }
  );
}
