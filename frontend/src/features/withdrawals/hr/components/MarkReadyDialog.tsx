import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { markWithdrawalReady } from '../services/hrWithdrawalService';
import { getErrorMessage } from '@/shared/api/getErrorMessage';

type MarkReadyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean, reason?: string) => void;
  setActionLoading: (actionLoading: boolean) => void;
  refreshAccess: () => void;
  withdrawalId: number;
  refetch: () => void;
};

export function MarkReadyDialog({
  open,
  onOpenChange,
  setActionLoading,
  refreshAccess,
  withdrawalId,
  refetch,
}: MarkReadyDialogProps) {
  const handleMarkReady = async () => {
    try {
      onOpenChange(false);

      setActionLoading(true);
      await markWithdrawalReady(Number(withdrawalId));
      await refreshAccess();
      setActionLoading(false);

      toast.success(
        `Withdrawal request #${withdrawalId} marked as ready for review. The HR Benefits Officer has been notified.`
      );

      refetch();
    } catch (err) {
      console.error(err);
      toast.error(
        getErrorMessage(
          err,
          'Failed to mark withdrawal request as ready. Please try again.'
        )
      );
      refetch();
    }
  };
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleMarkReady}
      title={
        <span>
          <CheckCircle2 className='me-1 inline-block' size={18} />
          Mark request as Ready?
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            This will mark the withdrawal request as ready for review and move
            it to the next stage. The HR Benefits Officer will be notified to
            proceed with the approval process.
          </p>
          <p className='text-muted-foreground text-sm'>
            Once marked as ready, the withdrawal request will be queued for
            officer review.
          </p>
        </div>
      }
      confirmText='Mark Ready'
    />
  );
}
