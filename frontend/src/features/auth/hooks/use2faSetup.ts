import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface Use2faSetupReturn {
  userId: number | null;
  qrCode: string | null;
  isLoading: boolean;
  error: string | null;
  handleProceed: () => void;
  retryFetch: () => void;
}

export const use2faSetup = (): Use2faSetupReturn => {
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse and validate userId once
  const userId = useMemo(() => {
    const storedUserId = sessionStorage.getItem('twofa_userId');
    if (!storedUserId) return null;

    const parsedId = parseInt(storedUserId, 10);
    return isNaN(parsedId) ? null : parsedId;
  }, []);

  const fetchQrCode = useCallback(async () => {
    if (!userId) {
      navigate('/auth/login');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await authService.setup2FA(userId);

      if (!res?.qrCode) {
        throw new Error('QR code not received from server');
      }

      setQrCode(res.qrCode);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch QR code. Please try again.';

      setError(errorMessage);
      console.error('2FA setup error:', err);

      // Optionally redirect to login on auth errors
      if (err instanceof Error && err.message.includes('unauthorized')) {
        navigate('/auth/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, navigate]);

  const retryFetch = useCallback(() => {
    fetchQrCode();
  }, [fetchQrCode]);

  const handleProceed = useCallback(() => {
    if (!qrCode) {
      setError('Please wait for QR code to load before proceeding');
      return;
    }
    navigate('/auth/login-2fa');
  }, [qrCode, navigate]);

  useEffect(() => {
    fetchQrCode();
  }, [fetchQrCode]);

  return {
    userId,
    qrCode,
    isLoading,
    error,
    handleProceed,
    retryFetch,
  };
};
