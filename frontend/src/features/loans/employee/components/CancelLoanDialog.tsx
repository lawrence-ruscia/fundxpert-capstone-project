import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cancelLoan } from '../services/loanService';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import type { Loan } from '../types/loan';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';

const defaultCancelReason = 'Applicant cancelled the application voluntarily.';

type CancelLoanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean, reason?: string) => void;
  setActionLoading: (actionLoading: boolean) => void;
  loan: Loan;
  refetch: () => void;
};

export function CancelLoanDialog({
  open,
  onOpenChange,
  setActionLoading,
  loan,
  refetch,
}: CancelLoanDialogProps) {
  const [value, setValue] = useState(defaultCancelReason);
  const handleCancelLoan = async () => {
    try {
      onOpenChange(false);

      const reason = value.trim().length <= 0 ? defaultCancelReason : value;

      setActionLoading(true);
      await cancelLoan(Number(loan.id), reason);
      setActionLoading(false);

      toast.success(`Loan #${loan.id} has been cancelled.`);

      refetch();
    } catch (err) {
      console.error(err);
      toast.error(
        (err as Error).message ??
          'Failed to cancel your loan application. Please try again or contact support if the issue persists.'
      );
      refetch();
    }
  };
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleCancelLoan} // Ensure this is the correct handler
      disabled={value.trim().length <= 0}
      title={
        <span className='text-destructive flex items-center'>
          <XCircle className='stroke-destructive me-1 inline-block' size={18} />
          Final Confirmation to Cancel Loan?
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='font-medium'>
            You are about to <strong>permanently cancel</strong> your loan
            application. This action cannot be reversed.
          </p>

          {/* Loan Details Block */}
          <div className='space-y-2 rounded-lg border p-4'>
            <h3 className='mb-3 text-sm font-semibold'>Application Details</h3>

            {/* Loan Amount */}
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Loan Amount:</span>
              <span className='text-lg font-bold'>
                {formatCurrency(Number(loan.amount))}
              </span>
            </div>

            {/* Repayment Term */}
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Repayment Term:</span>
              <span className='font-medium'>
                {loan.repayment_term_months} months
              </span>
            </div>

            {/* Loan Purpose */}
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Purpose:</span>
              <span className='font-medium'>{loan.purpose_category}</span>
            </div>
          </div>
          {/* End Loan Details Block */}

          {/* Reason for Cancellation */}
          <Label>
            <p>Reason for cancellation (required):</p>
            <Textarea
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder='Enter your reason for cancelling this application...'
              rows={4}
              className='mt-2'
            />
          </Label>

          {/* Final Warning Alert */}
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertTitle>Warning: Permanent Action</AlertTitle>
            <AlertDescription>
              <p>
                Cancelling means this application will be closed. You will lose
                your place in the review process and must{' '}
                <strong>submit a new application</strong> if you wish to apply
                again.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Yes, Cancel Application'
    />
  );
}
