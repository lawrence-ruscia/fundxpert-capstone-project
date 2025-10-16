import { toast } from 'sonner';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { toggleLockUser } from '../services/usersManagementService';
import { Check, CheckCircle, Unlock, UnlockKeyhole } from 'lucide-react';
import { getBackendErrorMessage } from '@/utils/getBackendErrorMessages';

interface UnlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setActionLoading: (loading: boolean) => void;
  userId: string;
  refresh: () => void;
  userName?: string | null;
  lockExpiresAt?: string | null; // ISO date string of when lock was supposed to expire
}

export function UnlockUserDialog({
  open,
  onOpenChange,
  setActionLoading,
  userId,
  refresh,
  userName,
  lockExpiresAt,
}: UnlockUserDialogProps) {
  const handleUnlockUser = async () => {
    try {
      onOpenChange(false);
      setActionLoading(true);

      await toggleLockUser(userId, false);

      await refresh();
      setActionLoading(false);

      toast.success(
        `${userName ?? 'User'}'s account has been unlocked. They can now access the system.`
      );
    } catch (err) {
      setActionLoading(false);

      console.error('❌ Unlock user failed:', err);

      //  Extract backend error message safely
      toast.error(
        getBackendErrorMessage(err, 'Failed to unlock user account.')
      );
    }
  };

  const formatLockExpiry = () => {
    if (!lockExpiresAt) return null;
    try {
      const date = new Date(lockExpiresAt);
      return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return null;
    }
  };

  const expiryDate = formatLockExpiry();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleUnlockUser}
      disabled={false}
      title={
        <span className='flex items-center gap-2'>
          <Unlock className='me-1 inline-block' size={18} />
          Unlock User Account?
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            Are you sure you want to unlock{' '}
            <strong>{userName ?? 'this user'}'s</strong> account? This will
            immediately restore their access to the system.
          </p>

          {expiryDate && (
            <div className='bg-muted rounded-md p-3 text-sm'>
              <p className='text-muted-foreground'>
                Current lock was set to expire on:
              </p>
              <p className='mt-1 font-medium'>{expiryDate}</p>
            </div>
          )}

          <Alert className='rounded-lg border-0 border-l-4 border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20'>
            <UnlockKeyhole className='h-4 w-4' />
            <AlertTitle className='font-semibold'> What will happen</AlertTitle>
            <AlertDescription className='text-green-800'>
              <ul className='mt-2 list-inside list-disc space-y-1 text-sm'>
                <li>The account lock will be removed immediately</li>
                <li>The user can log in and access the system</li>
                <li>Any active sessions will remain logged out</li>
                <li>The user will be notified of this action</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Unlock Account'
    />
  );
}
