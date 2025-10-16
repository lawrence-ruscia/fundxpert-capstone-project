import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { moveLoanToReview } from '../services/hrLoanService';
import { getErrorMessage } from '@/shared/api/getErrorMessage';

type MoveToReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean, reason?: string) => void;
  setActionLoading: (actionLoading: boolean) => void;
  refreshAccess: () => void;
  loanId: number;
  refetch: () => void;
};

export function MoveToReviewDialog({
  open,
  onOpenChange,
  setActionLoading,
  refreshAccess,
  loanId,
  refetch,
}: MoveToReviewDialogProps) {
  const handleMoveToReview = async () => {
    try {
      onOpenChange(false);

      setActionLoading(true);
      await moveLoanToReview(Number(loanId));
      await refreshAccess();
      setActionLoading(false);

      toast.success(
        `Loan #${loanId} moved to review stage. Approvers will be notified once assigned.`
      );

      refetch();
    } catch (err) {
      console.error(err);
      toast.error(
        getErrorMessage(err, 'Failed to move loan to review. Please try again.')
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
          Move Loan to Review?
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            This will advance the loan to the review stage where approvers will
            be assigned. Once moved, the HR Benefits Officer will be able to
            assign the approval chain.
          </p>
          <p className='text-muted-foreground text-sm'>
            Ensure all required documents have been uploaded and verified before
            proceeding.
          </p>
        </div>
      }
      confirmText='Move Loan to Review'
    />
  );
}
