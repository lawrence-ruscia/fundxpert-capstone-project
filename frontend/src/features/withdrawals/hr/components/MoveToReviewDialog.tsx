import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { moveWithdrawalToReview } from '../services/hrWithdrawalService';
import { getErrorMessage } from '@/shared/api/getErrorMessage';

type MoveToReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean, reason?: string) => void;
  setActionLoading: (actionLoading: boolean) => void;
  refreshAccess: () => void;
  withdrawalId: number;
  refetch: () => void;
};

export function MoveToReviewDialog({
  open,
  onOpenChange,
  setActionLoading,
  refreshAccess,
  withdrawalId,
  refetch,
}: MoveToReviewDialogProps) {
  const handleMoveToReview = async () => {
    try {
      onOpenChange(false);

      setActionLoading(true);
      await moveWithdrawalToReview(Number(withdrawalId));
      await refreshAccess();
      setActionLoading(false);

      toast.success(
        `Withdrawal request #${withdrawalId} moved to review stage.`
      );

      refetch();
    } catch (err) {
      console.error(err);
      toast.error(
        getErrorMessage(
          err,
          'Failed to move withdrawal request to review. Please try again.'
        )
      );
      refetch();
    }
  };
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleMoveToReview}
      title={
        <span>
          <FileText className='me-1 inline-block' size={18} />
          Move Request to Review?
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            This will advance the withdrawal request to the review stage. Once
            moved, the HR Benefits Officer will be able to approve or reject the
            request.
          </p>
          <p className='text-muted-foreground text-sm'>
            Ensure all required documents have been uploaded and verified before
            proceeding.
          </p>
        </div>
      }
      confirmText='Move Request to Review'
    />
  );
}
