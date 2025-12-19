import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/authService';
import { OTPPage } from './OTPPage';
import type { UserType } from '../types/loginResponse';
import { toast } from 'sonner';

/**
 * Responsibilities:
 *  - logs in user based on role
 *  - shows an error when given an invalid otp
 */

beforeEach(() => {
  vi.restoreAllMocks();
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

// Mock login()
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

// Renders OTPPage
const renderOTPPage = () => {
  render(
    <MemoryRouter
      initialEntries={['/auth/login', '/auth/login-2fa']}
      initialIndex={1}
    >
      <Routes>
        <Route path='/auth/login' element={<div>Login Page</div>} />
        <Route
          path='/auth/login-2fa'
          element={
            <TestAuthProvider>
              <OTPPage />
            </TestAuthProvider>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('OTPPage', () => {
  it('redirects to login when user id is missing', async () => {
    // Mock response with no userId
    vi.spyOn(sessionStorage, 'getItem').mockReturnValueOnce(null);

    renderOTPPage();

    expect(screen.getByText(/login page/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('uses verify2fa when mode is setup', async () => {
    const mockUser = { id: 42, name: 'John Doe', role: 'Employee' } as UserType;
    const mockResponse = { user: mockUser, tokenExpiry: 900_000 };
    const mockVerify2fa = vi
      .spyOn(authService, 'verify2FA')
      .mockResolvedValueOnce(mockResponse);

    sessionStorage.setItem('twofa_userId', String(mockUser.id));
    sessionStorage.setItem('twofa_mode', 'setup');

    renderOTPPage();

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/one-time password/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    expect(mockVerify2fa).toHaveBeenCalled();
    expect(mockLogin).toHaveBeenCalledWith(
      mockResponse.user,
      mockResponse.tokenExpiry
    );
  });

  it('uses login2FA when mode is login', async () => {
    const mockUser = { id: 42, name: 'John Doe', role: 'Employee' } as UserType;
    const mockResponse = { user: mockUser, tokenExpiry: 900_000 };
    const mocklogin2fa = vi
      .spyOn(authService, 'login2FA')
      .mockResolvedValueOnce(mockResponse);

    sessionStorage.setItem('twofa_userId', String(mockUser.id));
    sessionStorage.setItem('twofa_mode', 'login');

    renderOTPPage();

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/one-time password/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    expect(mocklogin2fa).toHaveBeenCalled();
    expect(mockLogin).toHaveBeenCalledWith(
      mockResponse.user,
      mockResponse.tokenExpiry
    );
  });

  it('logs in and redirects HR to /hr', async () => {
    const mockUser = { id: 42, name: 'John Doe', role: 'HR' } as UserType;
    const mockResponse = { user: mockUser, tokenExpiry: 900_000 };

    // Mock login2fa
    vi.spyOn(authService, 'login2FA').mockResolvedValueOnce(mockResponse);

    const mockToast = vi.spyOn(toast, 'success');

    sessionStorage.setItem('twofa_userId', String(mockUser.id));
    sessionStorage.setItem('twofa_mode', 'login');

    renderOTPPage();

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/one-time password/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    expect(mockLogin).toHaveBeenCalledWith(
      mockResponse.user,
      mockResponse.tokenExpiry
    );

    expect(mockNavigate).toHaveBeenCalledWith('/hr', { replace: true });
    expect(mockToast).toHaveBeenCalled();
  });

  it('logs in and redirects Employee to /employee', async () => {
    const mockUser = { id: 42, name: 'John Doe', role: 'Employee' } as UserType;
    const mockResponse = { user: mockUser, tokenExpiry: 900_000 };

    // Mock login2fa
    vi.spyOn(authService, 'login2FA').mockResolvedValueOnce(mockResponse);

    const mockToast = vi.spyOn(toast, 'success');

    sessionStorage.setItem('twofa_userId', String(mockUser.id));
    sessionStorage.setItem('twofa_mode', 'login');

    renderOTPPage();

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/one-time password/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    expect(mockLogin).toHaveBeenCalledWith(
      mockResponse.user,
      mockResponse.tokenExpiry
    );

    expect(mockNavigate).toHaveBeenCalledWith('/employee', { replace: true });
    expect(mockToast).toHaveBeenCalled();
  });

  it('logs in and redirects Admin to /admin', async () => {
    const mockUser = { id: 42, name: 'Jane Doe', role: 'Admin' } as UserType;
    const mockResponse = { user: mockUser, tokenExpiry: 900_000 };

    // Mock login2fa
    vi.spyOn(authService, 'login2FA').mockResolvedValueOnce(mockResponse);

    const mockToast = vi.spyOn(toast, 'success');

    sessionStorage.setItem('twofa_userId', String(mockUser.id));
    sessionStorage.setItem('twofa_mode', 'login');

    renderOTPPage();

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/one-time password/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    expect(mockLogin).toHaveBeenCalledWith(
      mockResponse.user,
      mockResponse.tokenExpiry
    );

    expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
    expect(mockToast).toHaveBeenCalled();
  });

  it('shows an error and does not redirect on invalid OTP', async () => {
    const mockUser = { id: 42, name: 'Jane Doe', role: 'Employee' } as UserType;
    vi.spyOn(authService, 'login2FA').mockRejectedValueOnce(
      new Error('Invalid OTP')
    );
    const mockToast = vi.spyOn(toast, 'error');
    sessionStorage.setItem('twofa_userId', String(mockUser.id));
    sessionStorage.setItem('twofa_mode', 'login');
    renderOTPPage();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/one-time password/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    const error = await screen.findByText(/invalid otp/i);
    expect(error).toBeInTheDocument();
    expect(mockToast).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
