import { useState } from 'react';
import { toast } from 'sonner';
import {
  Shield,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateTempPassword } from '@/utils/generateTempPassword';
import { resetUserPassword } from '../services/usersManagementService';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { getBackendErrorMessage } from '@/utils/getBackendErrorMessages';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setActionLoading: (loading: boolean) => void;
  userId: number;
  userName?: string;
  employeeId?: string;
  refresh: () => Promise<void>;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  setActionLoading,
  userId,
  userName,
  employeeId,
  refresh,
}: ResetPasswordDialogProps) {
  const [tempPassword, setTempPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleGenerateTempPassword = () => {
    const newPassword = generateTempPassword(12);
    setTempPassword(newPassword);
    toast.success('Temporary password generated!');
  };

  const copyPasswordToClipboard = async () => {
    if (tempPassword) {
      try {
        await navigator.clipboard.writeText(tempPassword);
        toast.success('Password copied to clipboard');
      } catch (err) {
        console.error(err);
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleResetPassword = async () => {
    if (!tempPassword || tempPassword.trim().length === 0) {
      toast.error('Please generate a temporary password first');
      return;
    }

    try {
      onOpenChange(false);
      setActionLoading(true);

      await resetUserPassword(userId, tempPassword);
      await refresh();

      setActionLoading(false);
      setTempPassword(''); // Clear password after successful reset

      toast.success(
        `Password reset successfully for ${userName || 'user'}. The temporary password has been applied.`
      );
    } catch (err) {
      setActionLoading(false);

      console.error('❌ Reset password failed:', err);

      //  Extract backend error message safely
      toast.error(getBackendErrorMessage(err, 'Failed to reset password.'));
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Clear password when dialog closes
      setTempPassword('');
      setShowPassword(false);
    }
    onOpenChange(isOpen);
  };

  const isResetEnabled = Boolean(
    tempPassword && tempPassword.trim().length > 0
  );

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={handleOpenChange}
      handleConfirm={handleResetPassword}
      disabled={!isResetEnabled}
      title={
        <span className='flex items-center gap-2'>
          <Shield className='me-1 inline-block' size={18} />
          Reset User Password?
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            Are you sure you want to reset the password for{' '}
            <strong>{userName ?? 'this user'}</strong>
            {employeeId && (
              <>
                {' '}
                (<code className='text-sm'>{employeeId}</code>)
              </>
            )}
            ? This will immediately change their password to the generated
            temporary password.
          </p>

          <div className='space-y-2'>
            <Label htmlFor='tempPassword'>Temporary Password:</Label>
            <div className='flex flex-wrap gap-2'>
              <div className='relative flex-1'>
                <Shield className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  id='tempPassword'
                  type={showPassword ? 'text' : 'password'}
                  value={tempPassword}
                  readOnly
                  placeholder='Click generate to create password'
                  className='h-11 pr-20 pl-10 font-mono text-sm'
                />
                <div className='absolute top-1/2 right-2 flex -translate-y-1/2 gap-1'>
                  {tempPassword && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='h-7 w-7 p-0'
                      onClick={copyPasswordToClipboard}
                      title='Copy to clipboard'
                    >
                      <Copy className='h-3.5 w-3.5' />
                    </Button>
                  )}
                  {tempPassword && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='h-7 w-7 p-0'
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className='h-3.5 w-3.5' />
                      ) : (
                        <Eye className='h-3.5 w-3.5' />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <Button
                type='button'
                variant='outline'
                onClick={handleGenerateTempPassword}
                className='h-11'
              >
                <RefreshCw className='mr-2 h-4 w-4' />
                Generate
              </Button>
            </div>
            <p className='text-muted-foreground text-xs'>
              Generate a secure 12-character temporary password with mixed case,
              numbers, and symbols.
            </p>
          </div>

          <Alert className='rounded-lg border-0 border-l-4 border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/20'>
            <AlertTriangle className='h-4 w-4' />
            <AlertTitle className='font-semibold'>Important</AlertTitle>
            <AlertDescription className='text-amber-800'>
              <ul className='mt-2 list-inside list-disc space-y-1 text-sm'>
                <li>
                  The user will be immediately logged out from all sessions
                </li>
                <li>They must use this temporary password to log in</li>
                <li>Make sure to securely share this password with the user</li>
                <li>Consider requiring them to change it on first login</li>
              </ul>
            </AlertDescription>
          </Alert>

          {!isResetEnabled && (
            <p className='text-muted-foreground text-sm italic'>
              Please generate a temporary password before proceeding.
            </p>
          )}
        </div>
      }
      confirmText='Reset Password'
    />
  );
}
