import { describe, it, vi, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import { authService } from '../services/authService';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AuthContext, AuthProvider } from '../context/AuthContext';
import type { UserResponse, UserType } from '../types/loginResponse';
import type React from 'react';

// cleaup
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

// Mock useNavigate()
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock login() from AuthProvider
const mockLogin = vi.fn();

const authContextValue = {
  user: null,
  loading: false,
  error: null,
  login: mockLogin,
  logout: vi.fn(),
  refreshUser: vi.fn(),
  tokenExpiry: null,
  setTokenExpiry: vi.fn(),
};
const TestAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper for rendering LoginPage
const renderLoginPage = () => {
  render(
    <MemoryRouter initialEntries={['/auth/login']}>
      <Routes>
        <Route
          path='/auth/login'
          element={
            <TestAuthProvider>
              <LoginPage />
            </TestAuthProvider>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('LoginPage', () => {
  it('redirects to reset password when password change is required', async () => {
    // Mock useAuth()
    vi.spyOn(authService, 'login').mockResolvedValueOnce({
      forcePasswordChange: true,
      userId: 42,
    });

    renderLoginPage();

    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(/company email/i),
      'test@metrobank.com.ph'
    );
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(sessionStorage.getItem('forceChangeUserId')).toBe('42');
    expect(mockNavigate).toHaveBeenCalledWith('/auth/reset-password');
  });

  it('redirects to twofa setup when twofa setup is required', async () => {
    vi.spyOn(authService, 'login').mockResolvedValueOnce({
      twofaSetupRequired: true,
      userId: 42,
    });

    renderLoginPage();

    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(/company email/i),
      'test@metrobank.com.ph'
    );
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(sessionStorage.getItem('twofa_userId')).toBe('42');
    expect(sessionStorage.getItem('twofa_mode')).toBe('setup');
    expect(mockNavigate).toHaveBeenCalledWith('/auth/setup-2fa');
  });

  it('redirects to twofa verification when twofa verification is required', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue({
      twofaRequired: true,
      userId: 42,
    });

    renderLoginPage();

    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(/company email/i),
      'test@metrobank.com.ph'
    );
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(sessionStorage.getItem('twofa_userId')).toBe('42');
    expect(sessionStorage.getItem('twofa_mode')).toBe('login');
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login-2fa');
  });

  it('redirects to root when login is successful', async () => {
    const mockResponse = {
      user: { id: 42, name: 'John Doe', role: 'Employee' },
      tokenExpiry: 900_000,
    } as UserResponse;

    vi.spyOn(authService, 'login').mockResolvedValue({
      user: mockResponse.user,
      tokenExpiry: mockResponse.tokenExpiry,
    });

    renderLoginPage();

    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(/company email/i),
      'test@metrobank.com.ph'
    );
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(mockLogin).toHaveBeenCalledWith(
      mockResponse.user,
      mockResponse.tokenExpiry
    );
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('shows an error message when login fails', async () => {
    vi.spyOn(authService, 'login').mockRejectedValueOnce(
      new Error('Invalid credentials')
    );

    renderLoginPage();

    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(/company email/i),
      'test@metrobank.com.ph'
    );
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    const error = await screen.findByText(/invalid credentials/i);
    expect(error).toBeInTheDocument();

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
