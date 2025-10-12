// src/hooks/useSessionWarning.ts
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

type SessionWarningConfig = {
  sessionDuration?: number; // ms
  warnBefore?: number; // ms
};

export function useSessionWarning({
  warnBefore = 5 * 60 * 1000, // default: 5 min
}: SessionWarningConfig) {
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { tokenExpiry, logout, setTokenExpiry } = useAuth();
  const navigate = useNavigate();

  // Timer: show modal before expiry
  useEffect(() => {
    if (!tokenExpiry) return;

    const now = Date.now();
    const timeLeft = tokenExpiry - now;

    if (timeLeft <= 0) {
      logout('Session Expired. Please log in again to continue');
      navigate('/auth/login', { replace: true });
      return;
    }

    const warnAt = timeLeft - warnBefore;
    if (warnAt <= 0) {
      setShowModal(true);
      setCountdown(Math.floor(timeLeft / 1000));
    } else {
      const timer = setTimeout(() => {
        setShowModal(true);
        setCountdown(Math.floor(warnBefore / 1000));
      }, warnAt);
      return () => clearTimeout(timer);
    }
  }, [tokenExpiry, warnBefore, logout, navigate]);

  // Timer: countdown once modal is open
  useEffect(() => {
    if (!showModal) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          logout('Session Expired. Please log in again to continue');
          navigate('/auth/login', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showModal, navigate, logout]);

  // Extend session
  const extendSession = async () => {
    try {
      const { tokenExpiry: newExpiry } = await authService.refreshSession();
      setTokenExpiry(newExpiry);
      setShowModal(false);
      setCountdown(0);
    } catch {
      logout('Session Expired. Please log in again to continue');
      navigate('/auth/login', { replace: true });
    }
  };

  // Force logout now
  const forceLogout = () => {
    logout('Session Expired. Please log in again to continue');
    navigate('/auth/login', { replace: true }); // prevent user form hitting back button
  };

  return { showModal, countdown, extendSession, forceLogout };
}
