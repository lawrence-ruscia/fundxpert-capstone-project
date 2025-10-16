import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { releaseLoanToTrustBank } from '../services/hrLoanService';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { Loan } from '../../employee/types/loan';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { getErrorMessage } from '@/shared/api/getErrorMessage';

type ReleaseLoanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean, reason?: string) => void;
  setActionLoading: (actionLoading: boolean) => void;
  refreshAccess: () => void;
  loan: Loan;
  refetch: () => void;
};

export function ReleaseLoanDialog({
  open,
  onOpenChange,
  setActionLoading,
  refreshAccess,
  loan,
  refetch,
}: ReleaseLoanDialogProps) {
  const handleReleaseLoan = async () => {
    try {
      onOpenChange(false);

      setActionLoading(true);
      await releaseLoanToTrustBank(Number(loan.id));
      await refreshAccess();
      setActionLoading(false);

      toast.success(
        `Loan #${loan.id} released successfully. ${formatCurrency(Number(loan.amount))} has been disbursed to ${loan.employee_name}."`
      );

      refetch();
    } catch (err) {
      console.error(err);
      toast.error(
        getErrorMessage(
          err,
          'Failed to release loan funds. Please try again or contact the finance department.'
        )
      );
      refetch();
    }
  };
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleReleaseLoan}
      title={
        <span className='flex items-center'>
          <DollarSign className='me-1 inline-block' size={18} />
          Confirm Loan Disbursement
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='font-medium'>
            You are about to release funds for this loan. This action cannot be
            undone.
          </p>

          <div className='bg-muted space-y-2 rounded-lg p-4'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Employee:</span>
              <span className='font-medium'>
                {loan.employee_name} ({loan.employee_id})
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Amount:</span>
              <span className='text-lg font-bold'>
                {formatCurrency(Number(loan.amount))}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Term:</span>
              <span className='font-medium'>
                {loan.repayment_term_months} months
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Purpose:</span>
              <span className='font-medium'>{loan.purpose_category}</span>
            </div>
          </div>

          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Please verify all loan details are correct before proceeding.
              Funds will be disbursed to the employee's registered account.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Release Loan'
    />
  );
}
