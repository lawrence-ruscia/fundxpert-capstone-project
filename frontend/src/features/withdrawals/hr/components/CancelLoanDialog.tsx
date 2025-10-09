import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { cancelWithdrawalRequest } from '../services/hrWithdrawalService';

const defaultCancelReason =
  'Your withdrawal request has been cancelled. Please contact HR or review the withdrawal terms if you have any questions.';

type CancelWithdrawalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean, reason?: string) => void;
  setActionLoading: (actionLoading: boolean) => void;
  refreshAccess: () => void;
  withdrawalId: number;
  refetch: () => void;
};

export function CancelWithdrawalDialog({
  open,
  onOpenChange,
  setActionLoading,
  refreshAccess,
  withdrawalId,
  refetch,
}: CancelWithdrawalDialogProps) {
  const [value, setValue] = useState(defaultCancelReason);
  const handleCancelWithdrawal = async () => {
    try {
      onOpenChange(false);

      const reason = value.trim().length <= 0 ? defaultCancelReason : value;

      setActionLoading(true);
      await cancelWithdrawalRequest(Number(withdrawalId), reason);
      await refreshAccess();
      setActionLoading(false);

      toast.success(
        `Withdrawal request #${withdrawalId} has been cancelled. The employee has been notified.`
      );

      refetch();
    } catch (err) {
      console.error(err);
      toast.error(
        (err as Error).message ??
          'Failed to cancel withdrawal request. Please try again or contact system support'
      );
      refetch();
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleCancelWithdrawal}
      disabled={value.trim().length <= 0}
      title={
        <span className='text-destructive'>
          <XCircle className='stroke-destructive me-1 inline-block' size={18} />
          Cancel Withdrawal Request?
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            **Are you sure you want to cancel this withdrawal request?** This
            action is **permanent** and cannot be reversed.
          </p>

          <Label>
            Reason for cancellation (required):
            <Textarea
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder='Explain why this request is being cancelled...'
              rows={4}
              className='mt-2'
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              The employee will be notified of the cancellation. This withdrawal
              request cannot be reopened and the employee will need to submit a
              new application.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Cancel Request'
    />
  );
}
