import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Building2,
  CalendarDays,
  CheckCircle,
  Clock,
  FileText,
  PhilippinePeso,
  Target,
  User,
  Wallet,
} from 'lucide-react';
import { useWithdrawalDetails } from '../hooks/useWithdrawalDetails';
import { Separator } from '@radix-ui/react-select';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import { NetworkError } from '@/shared/components/NetworkError';
import { WithdrawalStatusBadge } from '../components/WithdrawalStatusBadge';
import { WithdrawalDocumentUpload } from '../components/LoanDocumentUpload';

export default function WithdrawalDetailPage() {
  const { withdrawal, loading, error } = useWithdrawalDetails();

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
          </CardContent>
        </Card>

        {/* Document Upload Section */}
        <WithdrawalDocumentUpload withdrawalId={withdrawal.id} />
      </div>
    </div>
  );
}
