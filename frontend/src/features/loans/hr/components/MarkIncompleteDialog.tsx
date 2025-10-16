import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { markLoanIncomplete } from '../services/hrLoanService';
import { getErrorMessage } from '@/shared/api/getErrorMessage';

const defaultIncReason =
  'We need you to review and update your loan application. The HR team will proceed with the review once the necessary revisions are complete.';

type MarkIncompleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean, reason?: string) => void;
  setActionLoading: (actionLoading: boolean) => void;
  refreshAccess: () => void;
  loanId: number;
  refetch: () => void;
};

export function MarkIncompleteDialog({
  open,
  onOpenChange,
  setActionLoading,
  refreshAccess,
  loanId,
  refetch,
}: MarkIncompleteDialogProps) {
  const [value, setValue] = useState(defaultIncReason);

  const handleMarkIncomplete = async () => {
    try {
      onOpenChange(false);

      const reason = value.trim().length <= 0 ? defaultIncReason : value;

      setActionLoading(true);
      await markLoanIncomplete(Number(loanId), reason);
      await refreshAccess();
      setActionLoading(false);

      toast.success(
        `Loan #${loanId} marked as incomplete. Employee has been notified to provide additional information.`
      );

      refetch();
    } catch (err) {
      console.error(err);
      toast.error(
        getErrorMessage(
          err,
          'Failed to mark loan as incomplete. Please try again.'
        )
      );
      refetch();
    }
  };
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleMarkIncomplete}
      disabled={value.trim().length <= 0}
      title={
        <span>
          <AlertCircle className='me-1 inline-block' size={18} /> Mark Loan as
          Incomplete?
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            This will move the loan back to the employee for additional
            information or corrections. The employee will be notified that their
            application needs revision.
          </p>
          <Label>
            Reason (required):
            <Textarea
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder='Explain what information or corrections are needed...'
              rows={4}
              className='mt-2'
            />
          </Label>
          <p className='text-muted-foreground text-sm'>
            This reason will be sent to the employee to help them understand
            what needs to be corrected.
          </p>
        </div>
      }
      confirmText='Mark Incomplete'
    />
  );
}
