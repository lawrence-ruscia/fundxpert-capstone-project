import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { UserType } from '../types/loginResponse';

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

  // Fetch current user on mount (auto-login via cookie)
  useEffect(() => {
    let mounted = true;
    async function init() {
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
    setUser(userData);
    setTokenExpiry(expiry);
    setError(null);
  };

  const logout = async () => {
    try {
      await authService.logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setTokenExpiry(null);

      // Clear client-only data
      sessionStorage.removeItem('twofa_userId');
      localStorage.removeItem('role');
    }
  };

  const refreshUser = async () => {
    try {
      const { user, tokenExpiry } = await authService.fetchCurrentUser();
      setUser(user);
      setTokenExpiry(tokenExpiry);
    } catch (err) {
      setUser(null);
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
