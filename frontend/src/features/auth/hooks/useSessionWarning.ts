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
  sessionDuration = 60 * 60 * 1000, // default: 1h
  warnBefore = 5 * 60 * 1000, // default: 5 min
}: SessionWarningConfig) {
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Timer: show modal before expiry
  useEffect(() => {
    const warnTimer = setTimeout(() => {
      setShowModal(true);
      setCountdown(warnBefore / 1000); // seconds
    }, sessionDuration - warnBefore);

    return () => clearTimeout(warnTimer);
  }, [sessionDuration, warnBefore]);

  // Timer: countdown once modal is open
  useEffect(() => {
    if (!showModal) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          logout();
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
      await authService.refreshSession();
      setShowModal(false);
      setCountdown(0);
    } catch {
      logout();
      navigate('/auth/login', { replace: true });
    }
  };

  // Force logout now
  const forceLogout = () => {
    logout();
    navigate('/auth/login', { replace: true }); // prevent user form hitting back button
  };

  return { showModal, countdown, extendSession, forceLogout };
}
