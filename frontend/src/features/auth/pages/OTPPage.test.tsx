import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/authService';
import { OTPPage } from './OTPPage';

/**
 * Responsibilities:
 *  - logs in user based on role
 *  - shows an error when given an invalid otp
 */

beforeEach(() => {
  vi.clearAllMocks();
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
});
