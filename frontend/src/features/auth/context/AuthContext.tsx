import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { UserType } from '../types/loginResponse';
import { setupAuthInterceptor } from '@/shared/api/api';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/api/getErrorMessage';

type AuthContextType = {
  user: UserType | null;
  loading: boolean;
  error: string | null;
  login: (user: UserType, expiry: number) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  tokenExpiry: number | null;
  setTokenExpiry: (expiry: number | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Setup interceptor once when component mounts
  useEffect(() => {
    setupAuthInterceptor(logout);
  }, []); // Empty deps - only run once

  // Fetch current user on mount (auto-login via cookie)
  useEffect(() => {
    let mounted = true;
    async function init() {
      // Skip auto-fetch if on auth pages
      const isAuthPage = window.location.pathname.startsWith('/auth');
      if (isAuthPage) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { user: userData, tokenExpiry } =
          await authService.fetchCurrentUser();
        if (mounted) {
          setUser(userData);
          setTokenExpiry(tokenExpiry);
        }
      } catch (err) {
        if (mounted) {
          setUser(null);
          setError((err as Error).message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();

    return () => {
      mounted = false;
    };
  }, []);

  const login = (userData: UserType, expiry: number) => {
    console.log('🟢 AuthContext.login() called', {
      user: userData,
      expiry,
      now: Date.now(),
      timeLeft: expiry - Date.now(),
      timeLeftMinutes: (expiry - Date.now()) / 60000,
    });
    setUser(userData);
    setTokenExpiry(expiry);
    setError(null);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await authService.logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
      toast.error(
        getErrorMessage(err, 'Logout failed. Clearing local session.')
      );
    } finally {
      setUser(null);
      setTokenExpiry(null);
      // Clear client-only data
      sessionStorage.removeItem('twofa_userId');
      sessionStorage.removeItem('twofa_mode');
      localStorage.removeItem('role');
    }
  };

  const refreshUser = async () => {
    try {
      const { user, tokenExpiry } = await authService.fetchCurrentUser();
      setUser(user);
      setTokenExpiry(tokenExpiry);
      setError(null);
    } catch (err) {
      setUser(null);
      setTokenExpiry(null);
      setError((err as Error).message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        refreshUser,
        tokenExpiry,
        setTokenExpiry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
