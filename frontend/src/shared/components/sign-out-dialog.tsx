import { useNavigate, useLocation } from 'react-router-dom';
import { ConfirmDialog } from './confirm-dialog';
import { logout } from '@/utils/auth';
interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    logout();
    // Preserve current location for redirect after sign-in
    const currentPath = location.pathname + location.search + location.hash;

    const searchParams = new URLSearchParams();
    searchParams.set('redirect', currentPath);
    navigate(`/auth/login?${searchParams.toString()}`, {
      replace: true,
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText='Sign out'
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  );
}
