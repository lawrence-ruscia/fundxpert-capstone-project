import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import type { WithdrawalRequest } from '../../employee/types/withdrawal';
import { reviewWithdrawalDecision } from '../services/hrWithdrawalService';

type ApproveWithdrawalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean, reason?: string) => void;
  setActionLoading: (actionLoading: boolean) => void;
  refreshAccess: () => void;
  request: WithdrawalRequest;
  refetch: () => void;
};

export function ApproveWithdrawalDialog({
  open,
  onOpenChange,
  setActionLoading,
  refreshAccess,
  request,
  refetch,
}: ApproveWithdrawalDialogProps) {
  const handleApproveRequest = async () => {
    try {
      onOpenChange(false);
      setActionLoading(true);

      await reviewWithdrawalDecision(Number(request.id), 'Approved');
      await refreshAccess();
      setActionLoading(false);

      toast.success(`Withdrawal request #${request.id} approved successfully.`);

      refetch();
    } catch (err) {
      console.error(err);
      toast.error(
        (err as Error).message ??
          'Failed to approve withdrawal request. Please try again.'
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
      handleConfirm={handleApproveRequest}
      title={
        <span className='flex items-center'>
          <CheckCircle2 className='me-1 inline-block' size={18} />
          Approve Withdrawal Request
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            You are about to approve this withdrawal request. Once approved, the
            request will proceed to disbursement.
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
            <AlertTitle>Review Complete</AlertTitle>
            <AlertDescription>
              By approving, you confirm that you have reviewed all request
              documents and supporting materials, and the request meets all
              requirements.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Approve Request'
    />
  );
}
