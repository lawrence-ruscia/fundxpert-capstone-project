import { describe, it, vi, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import { authService } from '../services/authService';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../context/AuthContext';

// Mock useNavigate()
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock login() from useAuth()
const mockLogin = vi.fn();

vi.mock('../context/AuthContext.tsx', async () => {
  const actual = await vi.importActual('../context/AuthContext.tsx');

  return {
    ...actual,
    login: () => mockLogin,
  };
});

describe('LoginPage', () => {
  it('redirects to reset password when password change is required', async () => {
    // Mock useAuth()
    vi.spyOn(authService, 'login').mockResolvedValueOnce({
      forcePasswordChange: true,
      userId: 42,
    });

    render(
      <MemoryRouter initialEntries={['/auth/login']}>
        <Routes>
          <Route
            path='/auth/login'
            element={
              <AuthProvider>
                <LoginPage />
              </AuthProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    );

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

    render(
      <MemoryRouter initialEntries={['/auth/login']}>
        <Routes>
          <Route
            path='/auth/login'
            element={
              <AuthProvider>
                <LoginPage />
              </AuthProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    );

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

    render(
      <MemoryRouter initialEntries={['/auth/login']}>
        <Routes>
          <Route
            path='/auth/login'
            element={
              <AuthProvider>
                <LoginPage />
              </AuthProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    );

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
});
