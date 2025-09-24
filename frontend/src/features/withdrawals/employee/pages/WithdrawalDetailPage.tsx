import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CalendarDays,
  Clock,
  FileText,
  PhilippinePeso,
  Target,
  User,
  XCircle,
} from 'lucide-react';
import { useWithdrawalDetails } from '../hooks/useWithdrawalDetails';
import { Separator } from '@radix-ui/react-select';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import { NetworkError } from '@/shared/components/NetworkError';
import { WithdrawalStatusBadge } from '../components/WithdrawalStatusBadge';
import { WithdrawalDocumentUpload } from '../components/LoanDocumentUpload';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCancelWithdrawal } from '../hooks/useCancelWithdrawal';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { toast } from 'sonner';

export default function WithdrawalDetailPage() {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { withdrawal, loading, error } = useWithdrawalDetails();
  const navigate = useNavigate();
  const {
    cancelWithdrawalRequest,
    isLoading: isCancelling,
    error: errorCancel,
  } = useCancelWithdrawal();

  const handleCancelWithdrawal = async () => {
    try {
      if (withdrawal) {
        await cancelWithdrawalRequest(withdrawal.id);

        // Success toast
        toast.success('Withdrawal Request Cancelled', {
          description: `Withdrawal request #${withdrawal.id} has been successfully cancelled.`,
          duration: 4000,
        });

        // Close dialog
        setShowCancelDialog(false);
        navigate(-1);
      }
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to cancel withdrawal:', err);

      // Error toast
      toast.error('Cancellation Failed', {
        description:
          err instanceof Error
            ? err.message
            : 'Unable to cancel your withdrawal request. Please try again or contact support.',
        duration: 5000,
        action: {
          label: 'Try Again',
          onClick: () => handleCancelWithdrawal(),
        },
      });
    }
  };

  const canCancel = withdrawal?.status === 'Pending';

  if (loading) {
    return <LoadingSpinner text={'Loading Withdrawal Details'} />;
  }

  if (error) {
    return <NetworkError message={error} />;
  }

  if (!withdrawal) {
    return (
      <DataError
        title='No withdrawal found'
        message='The requested withdrawal request could not be located.'
      />
    );
  }

  return (
    <div className='bg-background'>
      <div className='mx-auto space-y-8'>
        {/* Header */}
        <div className='space-y-2'>
          <div className='space-y-1'>
            <h1 className='text-2xl font-bold tracking-tight'>
              Withdrawal Request: #{withdrawal.id}
            </h1>
            <p className='text-muted-foreground'>
              Review your withdrawal request details and manage required
              documents
            </p>
          </div>
        </div>

        {/* Withdrawal Overview Card */}
        <Card className='border-border/50 shadow-sm'>
          <CardHeader className='pb-4'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div>
                <CardTitle className='text-foreground text-xl'>
                  Withdrawal Overview
                </CardTitle>
                <CardDescription>
                  Current status and withdrawal details
                </CardDescription>
              </div>

              <WithdrawalStatusBadge status={withdrawal.status} />
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <PhilippinePeso className='text-primary h-5 w-5' />
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Payout Amount
                  </p>
                  <p className='text-foreground text-lg font-semibold'>
                    ₱{withdrawal.payout_amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <FileText className='text-primary h-5 w-5' />
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Withdrawal Type
                  </p>
                  <p className='text-foreground text-lg font-semibold'>
                    {withdrawal.request_type}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <CalendarDays className='text-primary h-5 w-5' />
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Requested On
                  </p>
                  <p className='text-foreground text-lg font-semibold'>
                    {new Date(withdrawal.created_at).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Purpose Details */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Target className='text-primary h-4 w-4' />
                <h3 className='text-foreground font-semibold'>
                  Withdrawal Details
                </h3>
              </div>
              <div className='space-y-1 pl-6'>
                <p className='text-foreground font-medium'>
                  {withdrawal.request_type} Withdrawal
                </p>
                {withdrawal.purpose_detail && (
                  <p className='text-muted-foreground text-sm'>
                    {withdrawal.purpose_detail}
                  </p>
                )}
              </div>
            </div>

            {/* Processing Information */}
            {(withdrawal.reviewed_at || withdrawal.processed_at) && (
              <>
                <Separator />
                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <Clock className='text-primary h-4 w-4' />
                    <h3 className='text-foreground font-semibold'>
                      Processing Timeline
                    </h3>
                  </div>
                  <div className='space-y-2 pl-6'>
                    {withdrawal.reviewed_at && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground text-sm'>
                          Reviewed Date:
                        </span>
                        <span className='text-foreground font-medium'>
                          {new Date(withdrawal.reviewed_at).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </span>
                      </div>
                    )}
                    {withdrawal.processed_at && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground text-sm'>
                          Processed Date:
                        </span>
                        <span className='text-foreground font-medium'>
                          {new Date(withdrawal.processed_at).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </span>
                      </div>
                    )}
                    {withdrawal.payment_reference && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground text-sm'>
                          Payment Reference:
                        </span>
                        <span className='text-foreground font-mono font-medium'>
                          {withdrawal.payment_reference}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Beneficiary Information (for Death withdrawals) */}
            {withdrawal.request_type === 'Death' &&
              withdrawal.beneficiary_name && (
                <>
                  <Separator />
                  <div className='space-y-3'>
                    <div className='flex items-center gap-2'>
                      <User className='text-primary h-4 w-4' />
                      <h3 className='text-foreground font-semibold'>
                        Beneficiary Information
                      </h3>
                    </div>
                    <div className='space-y-2 pl-6'>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground text-sm'>
                          Name:
                        </span>
                        <span className='text-foreground font-medium'>
                          {withdrawal.beneficiary_name}
                        </span>
                      </div>
                      {withdrawal.beneficiary_relationship && (
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground text-sm'>
                            Relationship:
                          </span>
                          <span className='text-foreground font-medium'>
                            {withdrawal.beneficiary_relationship}
                          </span>
                        </div>
                      )}
                      {withdrawal.beneficiary_contact && (
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground text-sm'>
                            Contact:
                          </span>
                          <span className='text-foreground font-medium'>
                            {withdrawal.beneficiary_contact}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

            {/* Notes */}
            {withdrawal.notes && (
              <>
                <Separator />
                <div className='bg-muted/30 rounded-lg border p-4'>
                  <div className='flex items-start gap-3'>
                    <div className='bg-muted/30 rounded-md p-1.5'>
                      <FileText className='h-4 w-4' />
                    </div>
                    <div className='flex-1 space-y-2'>
                      <h4 className='font-medium'>Admin Notes</h4>
                      <p className='text-muted-foreground text-sm leading-relaxed'>
                        {withdrawal.notes}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            {canCancel && (
              <div className='flex flex-1 gap-2'>
                <Button
                  variant='destructive'
                  onClick={() => setShowCancelDialog(true)}
                  disabled={isCancelling}
                  className='mt-8 flex-1'
                  size='lg'
                >
                  {isCancelling ? (
                    <>
                      <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className='mr-2 h-4 w-4' />
                      Cancel Request
                    </>
                  )}
                </Button>
              </div>
            )}
            {errorCancel && (
              <Alert className='rounded-lg border-0 border-l-4 border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20'>
                <XCircle className='h-4 w-4' />
                <AlertTitle className='font-semibold'>Error</AlertTitle>
                <AlertDescription className='text-red-800'>
                  {errorCancel}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          {/* Cancel Confirmation Dialog */}
          <ConfirmDialog
            open={showCancelDialog}
            onOpenChange={setShowCancelDialog}
            title='Cancel Withdrawal Request'
            desc={
              <div className='space-y-2'>
                <p>Are you sure you want to cancel this withdrawal request?</p>
                <div className='text-muted-foreground text-sm'>
                  <p>
                    <strong>Amount:</strong>{' '}
                    {formatCurrency(Number(withdrawal.vested_amount))}
                  </p>
                  <p>
                    <strong>Method:</strong> {withdrawal.payout_method}
                  </p>
                </div>
                <p className='text-destructive text-sm font-medium'>
                  This action cannot be undone. You will need to create a new
                  withdrawal request if you change your mind.
                </p>
              </div>
            }
            cancelBtnText='Keep Request'
            confirmText={
              isCancelling ? (
                <>
                  <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                  Cancelling...
                </>
              ) : (
                'Cancel Withdrawal'
              )
            }
            destructive={true}
            handleConfirm={handleCancelWithdrawal}
            isLoading={isCancelling}
            disabled={isCancelling}
          />
        </Card>

        {/* Document Upload Section */}
        <WithdrawalDocumentUpload withdrawalId={withdrawal.id} />
      </div>
    </div>
  );
}
