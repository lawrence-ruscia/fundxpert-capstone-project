import { useLocation, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from './confirm-dialog';
import { authService } from '@/features/auth/services/authService';
import { useAuth } from '@/features/auth/context/AuthContext';

interface ResetQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
}: ResetQRDialogProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const location = useLocation();

  const handleResetPassword = async () => {
    try {
      logout();

      // Preserve current location for redirect after sign-in
      const currentPath = location.pathname + location.search + location.hash;
      const searchParams = new URLSearchParams();
      searchParams.set('redirect', currentPath);

      navigate(`/auth/reset-password`, {
        replace: true,
      });
    } catch (err) {
      console.error('❌ Logout failed', err);
      alert('Failed to logout. Please try again.');
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Reset Password'
      desc='You will be logged out and redirected to the password reset page. Please have your current password ready to verify your identity before creating a new password.'
      confirmText='Continue to Reset'
      handleConfirm={handleResetPassword}
      className='sm:max-w-sm'
    />
  );
}
