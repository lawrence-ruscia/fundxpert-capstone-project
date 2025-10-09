import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { FileText, User, DollarSign, AlertCircle, XCircle } from 'lucide-react';
import type { WithdrawalRequest } from '../../employee/types/withdrawal';
import { WithdrawalStatusBadge } from '../../employee/components/WithdrawalStatusBadge';

export const WithdrawalSummary = ({
  request,
}: {
  request: WithdrawalRequest;
}) => {
  return (
    <Card>
      <CardHeader className='pb-4'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <div className='bg-primary/10 rounded-lg p-2'>
            <FileText className='text-primary h-5 w-5' />
          </div>
          Withdrawal Request Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {/* Employee Information */}
          <div className='space-y-4'>
            <div>
              <div className='mb-2 flex items-center gap-2'>
                <User className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground text-sm font-medium'>
                  Employee
                </span>
              </div>
              <p className='text-base font-semibold'>{request.employee_name}</p>
            </div>

            <div>
              <div className='mb-2 flex items-center gap-2'>
                <User className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground text-sm font-medium'>
                  Employee ID
                </span>
              </div>
              <p className='font-mono text-base'>{request.employee_id}</p>
            </div>

            <div>
              <div className='mb-2 flex items-center gap-2'>
                <FileText className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground text-sm font-medium'>
                  Purpose
                </span>
              </div>
              <p className='text-base'>
                {request.request_type}{' '}
                {request.purpose_detail && (
                  <p className='text-muted-foreground text-sm'>
                    {request.purpose_detail}
                  </p>
                )}
              </p>
            </div>
          </div>

          {/* Loan Details */}
          <div className='space-y-4'>
            <div>
              <div className='mb-2 flex items-center gap-2'>
                <DollarSign className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground text-sm font-medium'>
                  Loan Amount
                </span>
              </div>
              <p className='text-2xl font-bold'>
                {formatCurrency(Number(request.payout_amount))}
              </p>
            </div>

            <div>
              <div className='mb-2 flex items-center gap-2'>
                <AlertCircle className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground text-sm font-medium'>
                  Current Status
                </span>
              </div>
              <WithdrawalStatusBadge status={request.status} size='sm' />
            </div>
          </div>
        </div>
        {request.status === 'Cancelled' && (
          <Alert className='mt-4 rounded-lg border-0 border-l-4 border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20'>
            <XCircle className='h-4 w-4' />
            <AlertTitle className='font-semibold'>Cancelled</AlertTitle>
            <AlertDescription className='text-red-800'>
              {request.notes}
            </AlertDescription>
          </Alert>
        )}

        {request.status === 'Rejected' && (
          <Alert className='mt-4 rounded-lg border-0 border-l-4 border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20'>
            <XCircle className='h-4 w-4' />
            <AlertTitle className='font-semibold'>Rejected</AlertTitle>
            <AlertDescription className='text-red-800'>
              This withdrawal request was rejected during the approval review
              process.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
