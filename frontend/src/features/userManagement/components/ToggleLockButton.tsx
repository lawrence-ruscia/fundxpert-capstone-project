import { Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User } from '@/shared/types/user';

interface ToggleLockButtonProps {
  user: User;
  actionLoading: boolean;
  onLockClick: () => void;
  onUnlockClick: () => void;

  className?: string;
}

export function ToggleLockButton({
  user,
  actionLoading,
  onLockClick,
  onUnlockClick,
  className,
}: ToggleLockButtonProps) {
  // Check if user is currently locked
  const isLocked = user.locked_until
    ? new Date(user.locked_until) > new Date()
    : false;

  const handleClick = async () => {
    if (isLocked) {
      onUnlockClick();
    } else {
      onLockClick();
    }
  };

  return (
    <Button
      type='button'
      variant='secondary'
      onClick={handleClick}
      disabled={actionLoading}
      className={className || 'h-12 px-6 text-base sm:w-auto'}
    >
      {actionLoading ? (
        <>
          <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current' />
          {isLocked ? 'Unlocking...' : 'Locking...'}
        </>
      ) : (
        <>
          {isLocked ? (
            <>
              <Unlock className='mr-2 h-4 w-4' />
              Unlock User
            </>
          ) : (
            <>
              <Lock className='mr-2 h-4 w-4' />
              Lock User
            </>
          )}
        </>
      )}
    </Button>
  );
}
