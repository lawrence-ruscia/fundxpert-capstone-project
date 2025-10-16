import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { reviewLoanApproval } from '../services/hrLoanService.js';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { getErrorMessage } from '@/shared/api/getErrorMessage.js';

const defaultRejectReason =
  'Your loan application has been rejected after review. Please contact HR if you need clarification or wish to discuss reapplying.';

type RejectLoanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setActionLoading: (actionLoading: boolean) => void;
  refreshAccess: () => void;
  loanId: number;
  refetch: () => void;
};

export function RejectLoanDialog({
  open,
  onOpenChange,
  setActionLoading,
  refreshAccess,
  loanId,
  refetch,
}: RejectLoanDialogProps) {
  const [value, setValue] = useState(defaultRejectReason);
  const handleRejectLoan = async () => {
    try {
      onOpenChange(false);
      const comments = value.trim().length <= 0 ? defaultRejectReason : value;

      setActionLoading(true);
      await reviewLoanApproval(Number(loanId), 'Rejected', comments);
      await refreshAccess();
      setActionLoading(false);

      toast.success(
        `Loan #${loanId} has been rejected. The employee has been notified.`
      );

      // Reset state
      setValue(defaultRejectReason);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error(
        getErrorMessage(err, 'Failed to reject loan. Please try again.')
      );
      setActionLoading(false);
      refetch();
    }
  };
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={isOpen => {
        onOpenChange(isOpen);
        if (!isOpen) setValue(defaultRejectReason); // Reset on close
      }}
      handleConfirm={handleRejectLoan}
      disabled={value.trim().length <= 0}
      title={
        <span className='text-destructive'>
          <XCircle className='stroke-destructive me-1 inline-block' size={18} />
          Reject Loan Application?
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            This will reject the loan application at your approval level. The
            loan process will be stopped and the employee will be notified of
            the rejection.
          </p>

          <Label>
            Reason for rejection (required):
            <Textarea
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder='Provide a clear explanation for why this loan is being rejected...'
              rows={4}
              className='mt-2'
            />
          </Label>

          <p className='text-muted-foreground text-sm'>
            This reason will be sent to the employee to help them understand the
            decision. Be specific and professional in your explanation.
          </p>

          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Once rejected, the loan application will be closed. The employee
              may submit a new application after addressing the concerns
              mentioned in your rejection reason.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Reject Loan'
      destructive
    />
  );
}
