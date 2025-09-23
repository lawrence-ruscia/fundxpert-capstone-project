import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { UserType } from '../types/loginResponse';

type AuthContextType = {
  user: UserType | null;
  loading: boolean;
  error: string | null;
  login: (user: UserType) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user on mount (auto-login via cookie)
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const userData = await authService.fetchCurrentUser();
        if (mounted) setUser(userData.user);
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

  const login = (userData: UserType) => {
    setUser(userData);
    setError(null);
  };

  const logout = async () => {
    try {
      await authService.logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);

      // Clear client-only data
      sessionStorage.removeItem('twofa_userId');
      localStorage.removeItem('role');
    }
  };

  const refreshUser = async () => {
    try {
      const data = await authService.fetchCurrentUser();
      setUser(data.user);
    } catch (err) {
      setUser(null);
      setError((err as Error).message);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, refreshUser }}
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
