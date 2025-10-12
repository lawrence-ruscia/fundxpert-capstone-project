import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { AlertTriangle, Lock, LockKeyhole } from 'lucide-react';
import { toggleLockUser } from '../services/usersManagementService';
import { NumberInput } from '@/shared/components/number-input';

interface LockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setActionLoading: (loading: boolean) => void;
  userId: string;
  userName?: string | null;
  refresh: () => void;
}

const LOCK_DURATIONS = [
  { value: '60', label: '1 Hour' },
  { value: '360', label: '6 Hours' },
  { value: '720', label: '12 Hours' },
  { value: '1440', label: '1 Day' },
  { value: '4320', label: '3 Days' },
  { value: '10080', label: '1 Week' },
  { value: '43200', label: '1 Month' },
  { value: 'custom', label: 'Custom Duration' },
];

export function LockUserDialog({
  open,
  onOpenChange,
  setActionLoading,
  userId,
  userName,
  refresh,
}: LockUserDialogProps) {
  const [duration, setDuration] = useState('1440'); // Default: 1 day
  const [customDuration, setCustomDuration] = useState('');

  const handleLockUser = async () => {
    try {
      onOpenChange(false);
      setActionLoading(true);

      const durationMinutes =
        duration === 'custom' ? Number(customDuration) : Number(duration);

      await toggleLockUser(userId, true, durationMinutes);

      await refresh();
      setActionLoading(false);

      const durationLabel =
        LOCK_DURATIONS.find(d => d.value === duration && d.value !== 'custom')
          ?.label || `${customDuration} minutes`;

      toast.success(
        `${userName}'s account has been locked for ${durationLabel}. They will not be able to access the system during this period.`
      );
    } catch (err) {
      setActionLoading(false);
      console.error(err);
      toast.error(
        (err as Error).message ??
          'Failed to lock user account. Please try again or contact system support'
      );
    }
  };

  const isCustomDurationValid =
    duration !== 'custom' ||
    (customDuration.trim().length > 0 && Number(customDuration) > 0);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleLockUser}
      disabled={!isCustomDurationValid}
      title={
        <span className='flex items-center gap-2'>
          <Lock className='me-1 inline-block' size={18} />
          Lock User Account?
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            Are you sure you want to lock{' '}
            <strong>{userName ?? 'this user'}'s</strong> account? This will
            prevent them from accessing the system until the lock expires or is
            manually removed.
          </p>

          <div className='space-y-2'>
            <Label htmlFor='duration'>Lock Duration:</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className='w-48' id='duration'>
                <SelectValue placeholder='Select duration' />
              </SelectTrigger>
              <SelectContent>
                {LOCK_DURATIONS.map(d => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {duration === 'custom' && (
            <div className='space-y-2'>
              <Label htmlFor='customDuration'>
                Custom Duration (in minutes):
              </Label>
              <NumberInput
                id='customDuration'
                min={1}
                value={customDuration}
                onChange={e => setCustomDuration(e.target.value)}
                placeholder='Enter duration in minutes'
              />
              <p className='text-muted-foreground text-sm'>
                For example: 120 for 2 hours, 1440 for 1 day
              </p>
            </div>
          )}

          <Alert className='rounded-lg border-0 border-l-4 border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20'>
            <LockKeyhole className='h-4 w-4' />
            <AlertTitle className='font-semibold'>Warning</AlertTitle>
            <AlertDescription className='text-red-800'>
              <ul className='mt-2 list-inside list-disc space-y-1 text-sm'>
                <li>The user will be immediately logged out</li>
                <li>They cannot access the system until the lock expires</li>
                <li>You can manually unlock the account at any time</li>
                <li>The user will be notified of this action</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Lock Account'
    />
  );
}
