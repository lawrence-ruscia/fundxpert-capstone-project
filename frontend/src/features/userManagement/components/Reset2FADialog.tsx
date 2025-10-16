import { toast } from 'sonner';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, ShieldOff, AlertTriangle } from 'lucide-react';
import { adminReset2FA } from '../services/usersManagementService';
import { getBackendErrorMessage } from '@/utils/getBackendErrorMessages';

interface Reset2FADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setActionLoading: (loading: boolean) => void;
  userId: number;
  userName?: string | null;
  employeeId?: string | null;
  refresh: () => void;
}

export function Reset2FADialog({
  open,
  onOpenChange,
  setActionLoading,
  userId,
  userName,
  employeeId,
  refresh,
}: Reset2FADialogProps) {
  const handleReset2FA = async () => {
    try {
      onOpenChange(false);
      setActionLoading(true);

      await adminReset2FA(userId);

      await refresh();
      setActionLoading(false);

      toast.success(
        `2FA has been reset for ${userName || 'the user'}. They will be logged out and required to set up 2FA on their next login.`
      );
    } catch (err) {
      setActionLoading(false);

      console.error('❌ Reset 2FA failed:', err);

      //  Extract backend error message safely
      toast.error(getBackendErrorMessage(err, 'Failed to reset 2FA.'));
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleReset2FA}
      title={
        <span className='flex items-center gap-2'>
          <ShieldAlert className='me-1 inline-block' size={18} />
          Reset Two-Factor Authentication?
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            Are you sure you want to reset 2FA for{' '}
            <strong>{userName ?? 'this user'}</strong>
            {employeeId && ` (${employeeId})`}? This will disable their current
            two-factor authentication and force them to set it up again.
          </p>

          <Alert className='rounded-lg border-0 border-l-4 border-orange-500 bg-orange-50 text-orange-800 dark:bg-orange-900/20'>
            <ShieldOff className='h-4 w-4' />
            <AlertTitle className='font-semibold'>Warning</AlertTitle>
            <AlertDescription className='text-orange-800'>
              <ul className='mt-2 list-inside list-disc space-y-1 text-sm'>
                <li>The user's current 2FA will be disabled immediately</li>
                <li>They will be forced to logout from all sessions</li>
                <li>They must set up 2FA again on their next login attempt</li>
                <li>The user will receive a notification about this change</li>
                <li>This action will be logged in the audit trail</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className='rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'>
            <p className='mb-1 font-medium'>
              <AlertTriangle className='me-1 inline-block h-4 w-4' />
              Common reasons to reset 2FA:
            </p>
            <ul className='list-inside list-disc space-y-1'>
              <li>User lost access to their authenticator device</li>
              <li>Security concerns or suspected compromise</li>
              <li>User requested assistance with 2FA issues</li>
            </ul>
          </div>
        </div>
      }
      confirmText='Reset 2FA'
    />
  );
}
