import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { toast } from 'sonner'; // or your toast library
import { authService } from '../services/authService';
import type { UserType } from '../types/loginResponse';

type AuthContextType = {
  user: UserType | null;
  loading: boolean;
  error: string | null;
  login: (user: UserType, expiry: number) => void;
  logout: (message?: string) => Promise<void>;
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
      const hasTokenCookie = document.cookie
        .split('; ')
        .some(cookie => cookie.startsWith('token='));

      if (!hasTokenCookie) {
        console.log('⚠️ No token cookie found, skipping user fetch');
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

  // Automatic logout when token expires
  useEffect(() => {
    if (!tokenExpiry || !user) return;

    // Check immediately if token is already expired
    if (Date.now() > tokenExpiry) {
      logout('Your session has expired. Please log in again.');
      return;
    }

    // Check every 10 seconds for token expiry
    const interval = setInterval(() => {
      if (Date.now() > tokenExpiry) {
        logout('Your session has expired. Please log in again.');
      }
    }, 10_000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [tokenExpiry, user]); // Note: logout is defined below, eslint might warn

  const login = useCallback((userData: UserType, expiry: number) => {
    setUser(userData);
    setTokenExpiry(expiry);
    setError(null);
  }, []);

  const logout = useCallback(
    async (message?: string) => {
      try {
        // Only call logout API if we have a user session
        if (user) {
          await authService.logoutUser();
        }
      } catch (err) {
        console.error('Logout error:', err);
        // Continue with logout even if API call fails
      } finally {
        // Clear all state
        setUser(null);
        setTokenExpiry(null);
        setError(null);

        // Clear client-only data
        sessionStorage.removeItem('twofa_userId');
        sessionStorage.removeItem('twofa_mode');
        sessionStorage.removeItem('forceChangeUserId');
        localStorage.removeItem('role');

        // Show logout message if provided
        if (message) {
          toast.error(message);
        }

        // Navigate to login page
        window.location.href = '/auth/login';
      }
    },
    [user]
  );

  useEffect(() => {
    const handleForceLogout = (event: CustomEvent) => {
      const message = event.detail?.message || 'Session expired';
      logout(message);
    };

    window.addEventListener(
      'auth:force-logout',
      handleForceLogout as EventListener
    );

    return () => {
      window.removeEventListener(
        'auth:force-logout',
        handleForceLogout as EventListener
      );
    };
  }, [logout]);

  const refreshUser = useCallback(async () => {
    try {
      const { user, tokenExpiry } = await authService.fetchCurrentUser();
      setUser(user);
      setTokenExpiry(tokenExpiry);
      setError(null);
    } catch (err) {
      setUser(null);
      setTokenExpiry(null);
      setError((err as Error).message);
      // Optionally auto-logout on refresh failure
      logout('Session could not be refreshed. Please log in again.');
    }
  }, [logout]);

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
