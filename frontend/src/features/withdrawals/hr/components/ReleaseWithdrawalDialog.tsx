import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import type { WithdrawalRequest } from '../../employee/types/withdrawal';
import { releaseWithdrawalFunds } from '../services/hrWithdrawalService';

type ReleaseWithdrawalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean, reason?: string) => void;
  setActionLoading: (actionLoading: boolean) => void;
  refreshAccess: () => void;
  request: WithdrawalRequest;
  refetch: () => void;
};

export function ReleaseWithdrawalDialog({
  open,
  onOpenChange,
  setActionLoading,
  refreshAccess,
  request,
  refetch,
}: ReleaseWithdrawalDialogProps) {
  const handleReleaseWithdrawal = async () => {
    try {
      onOpenChange(false);

      setActionLoading(true);
      await releaseWithdrawalFunds(Number(request.id));
      await refreshAccess();
      setActionLoading(false);

      toast.success(
        `Withdrawal request #${request.id} released successfully. ${formatCurrency(Number(request.payout_amount))} has been disbursed to ${request.employee_name}."`
      );

      refetch();
    } catch (err) {
      console.error(err);
      toast.error(
        (err as Error).message ??
          'Failed to release withdrawal funds. Please try again or contact the finance department.'
      );
      refetch();
    }
  };
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleReleaseWithdrawal}
      title={
        <span className='flex items-center'>
          <DollarSign className='me-1 inline-block' size={18} />
          Confirm Withdrawal Disbursement
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='font-medium'>
            You are about to release funds for this request. This action cannot
            be undone.
          </p>

          <div className='bg-muted space-y-2 rounded-lg p-4'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Employee:</span>
              <span className='font-medium'>
                {request.employee_name} ({request.employee_id})
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Amount:</span>
              <span className='text-lg font-bold'>
                {formatCurrency(Number(request.payout_amount))}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Request Type:</span>
              <span className='font-medium'>{request.request_type}</span>
            </div>
          </div>

          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Please verify all request details are correct before proceeding.
              Funds will be disbursed to the employee's registered account.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Release Request'
    />
  );
}
