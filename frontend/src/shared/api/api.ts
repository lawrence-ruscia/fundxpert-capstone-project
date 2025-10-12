import { useAuth } from '@/features/auth/context/AuthContext';
import axios from 'axios';
// Create a single axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true, // send cookies (JWT httpOnly cookies)
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const errorMessage =
        error.response?.data?.error || 'Authentication failed';

      // Don't trigger logout if:
      // 1. Already on auth pages
      // 2. Request was to /auth/me (initial user fetch)
      const currentPath = window.location.pathname;
      const isOnAuthPage = currentPath.startsWith('/auth/');
      const isAuthMeRequest = error.config?.url?.includes('/auth/me');

      if (isOnAuthPage || isAuthMeRequest) {
        console.log('⚠️ Auth error on safe route, ignoring interceptor');
        return Promise.reject(error);
      }

      // Check if it's a token version mismatch (force logout scenario)
      if (
        errorMessage.includes('User not found') ||
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('expired token')
      ) {
        console.log('🚨 Auth error detected, forcing logout');

        // Trigger logout event that AuthContext can listen to
        window.dispatchEvent(
          new CustomEvent('auth:force-logout', {
            detail: {
              message:
                'Your session has been invalidated. Please log in again.',
            },
          })
        );
      }
    }
    return Promise.reject(error);
  }
);
