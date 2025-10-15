// src/hooks/useSessionWarning.ts
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

type SessionWarningConfig = {
  warnBefore?: number; // ms
};

export function useSessionWarning({
  warnBefore = 5 * 60 * 1000, // default: 5 min
}: SessionWarningConfig = {}) {
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { tokenExpiry, logout, setTokenExpiry } = useAuth();
  const navigate = useNavigate();

  // Timer: show modal before expiry
  useEffect(() => {
    if (!tokenExpiry || tokenExpiry <= 0) return;

    const now = Date.now();
    const timeLeft = tokenExpiry - now;

    // Already expired
    if (timeLeft <= 0) {
      console.log('⚠️ Token already expired, logging out');
      logout();
      navigate('/auth/login', { replace: true });
      return;
    }

    const warnAt = timeLeft - warnBefore;

    // Should already be warning
    if (warnAt <= 0) {
      setShowModal(true);
      setCountdown(Math.floor(timeLeft / 1000));
    } else {
      // Schedule warning
      const timer = setTimeout(() => {
        setShowModal(true);
        setCountdown(Math.floor(warnBefore / 1000));
      }, warnAt);

      return () => clearTimeout(timer);
    }
  }, [tokenExpiry, warnBefore, logout, navigate]);

  // Timer: countdown once modal is open
  useEffect(() => {
    if (!showModal || countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowModal(false);
          logout();
          navigate('/auth/login', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showModal, countdown, navigate, logout]);

  // Extend session
  const extendSession = async () => {
    try {
      const { tokenExpiry: newExpiry } = await authService.refreshSession();
      setTokenExpiry(newExpiry);
      setShowModal(false);
      setCountdown(0);
    } catch (err) {
      console.error('Failed to extend session:', err);
      setShowModal(false);
      logout();
      navigate('/auth/login', { replace: true });
    }
  };

  // Force logout now
  const forceLogout = () => {
    setShowModal(false);
    logout();
    navigate('/auth/login', { replace: true });
  };

  return { showModal, countdown, extendSession, forceLogout };
}
