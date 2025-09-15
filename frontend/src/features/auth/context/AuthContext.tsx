import { createContext, useContext, useEffect, useState } from 'react';
import type { UserResponse } from '../services/authService';
import { authService } from '../services/authService';

type AuthContextType = {
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
  login: (user: UserResponse) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user on mount (auto-login via cookie)
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const userData = await authService.fetchCurrentUser();
        if (mounted) setUser(userData);
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

  const login = (userData: UserResponse) => {
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
      setUser(data);
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
