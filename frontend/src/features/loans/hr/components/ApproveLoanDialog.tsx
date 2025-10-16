import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { Loan } from '../../employee/types/loan.js';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { reviewLoanApproval } from '../services/hrLoanService.js';
import { getErrorMessage } from '@/shared/api/getErrorMessage.js';

type ApproveLoanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean, reason?: string) => void;
  setActionLoading: (actionLoading: boolean) => void;
  refreshAccess: () => void;
  loan: Loan;
  refetch: () => void;
};

export function ApproveLoanDialog({
  open,
  onOpenChange,
  setActionLoading,
  refreshAccess,
  loan,
  refetch,
}: ApproveLoanDialogProps) {
  const handleApproveLoan = async () => {
    try {
      onOpenChange(false);
      setActionLoading(true);

      await reviewLoanApproval(Number(loan.id), 'Approved');
      await refreshAccess();
      setActionLoading(false);

      toast.success(
        `Loan #${loan.id} approved successfully. The next approver has been notified.`
      );

      refetch();
    } catch (err) {
      console.error(err);
      toast.error(
        getErrorMessage(err, 'Failed to approve loan. Please try again.')
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
      }}
      handleConfirm={handleApproveLoan}
      title={
        <span className='flex items-center'>
          <CheckCircle2 className='me-1 inline-block' size={18} />
          Approve Loan Application
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            You are about to approve this loan application. Once approved, it
            will move to the next approver in the chain or proceed to
            disbursement if you are the final approver.
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
            <AlertTitle>Review Complete</AlertTitle>
            <AlertDescription>
              By approving, you confirm that you have reviewed all loan
              documents and supporting materials, and the application meets all
              requirements.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Approve Loan'
    />
  );
}
