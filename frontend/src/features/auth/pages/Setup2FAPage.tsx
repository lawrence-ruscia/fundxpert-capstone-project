import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const Setup2FAPage = () => {
  const navigate = useNavigate();
  const storedUserId = sessionStorage.getItem('twofa_userId');
  const userId = storedUserId ? parseInt(storedUserId, 10) : null;

  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      navigate('/auth/login');
      return;
    }

    // Call backend to get QR code
    authService.setup2FA(userId).then(res => {
      setQrCode(res.qrCode);
    });
  }, [userId, navigate]);

  const handleProceed = () => {
    // After scanning, user clicks "Next" → go to OTPPage
    navigate('/auth/login-2fa');
  };

  if (!userId) return null;

  return (
    <div>
      <h1>🔐 Setup Two-Factor Authentication</h1>
      {qrCode && <img src={qrCode} alt='Scan QR for 2FA' />}
      <p>
        Scan this QR code using Google Authenticator or Authy, then click "Next"
        to enter your 6-digit code.
      </p>
      <button onClick={handleProceed}>Next</button>
    </div>
  );
};
