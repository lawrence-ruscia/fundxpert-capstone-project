import { useLocation, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from './confirm-dialog';
import { authService } from '@/features/auth/services/authService';
import { useAuth } from '@/features/auth/context/AuthContext';

interface ResetQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetQRDialog({ open, onOpenChange }: ResetQRDialogProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const location = useLocation();

  const handleResetQR = async () => {
    try {
      const res = await authService.reset2FA(); // call backend POST /account/reset-2fa
      if (res.qrCode) {
        // Save mode + userId in sessionStorage so Setup2FAPage knows what to do
        sessionStorage.setItem('twofa_mode', 'setup');
        // Navigate to Setup2FAPage, where QR will be shown
        logout();

        // Preserve current location for redirect after sign-in
        const currentPath = location.pathname + location.search + location.hash;
        const searchParams = new URLSearchParams();
        searchParams.set('redirect', currentPath);

        navigate(`/auth/login?${searchParams.toString()}`, {
          replace: true,
        });
      }
    } catch (err) {
      console.error('❌ Reset QR failed', err);
      alert('Failed to reset 2FA. Please try again.');
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Reset Two-Factor Authentication'
      desc='Resetting will disable your current 2FA binding and generate a new QR code. 
            You will need to login again and scan the new QR with your authenticator app.'
      confirmText='Reset QR'
      handleConfirm={handleResetQR}
      className='sm:max-w-sm'
    />
  );
}
