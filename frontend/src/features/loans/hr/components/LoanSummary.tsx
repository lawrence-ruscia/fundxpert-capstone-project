import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import {
  FileText,
  User,
  DollarSign,
  Calendar,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { LoanStatusBadge } from '../../employee/components/LoanStatusBadge';
import type { Loan } from '../../employee/types/loan';

export const LoanSummary = ({ loan }: { loan: Loan }) => {
  return (
    <Card>
      <CardHeader className='pb-4'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <div className='bg-primary/10 rounded-lg p-2'>
            <FileText className='text-primary h-5 w-5' />
          </div>
          Loan Summary
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
              <p className='text-base font-semibold'>{loan.employee_name}</p>
            </div>

            <div>
              <div className='mb-2 flex items-center gap-2'>
                <User className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground text-sm font-medium'>
                  Employee ID
                </span>
              </div>
              <p className='font-mono text-base'>{loan.employee_id}</p>
            </div>

            <div>
              <div className='mb-2 flex items-center gap-2'>
                <FileText className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground text-sm font-medium'>
                  Purpose
                </span>
              </div>
              <p className='text-base'>
                {loan.purpose_category}{' '}
                {loan.purpose_detail && (
                  <p className='text-muted-foreground text-sm'>
                    {loan.purpose_detail}
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
                {formatCurrency(Number(loan.amount))}
              </p>
            </div>

            <div>
              <div className='mb-2 flex items-center gap-2'>
                <Calendar className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground text-sm font-medium'>
                  Repayment Term
                </span>
              </div>
              <p className='text-base font-semibold'>
                {loan.repayment_term_months} months
              </p>
            </div>

            <div>
              <div className='mb-2 flex items-center gap-2'>
                <AlertCircle className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground text-sm font-medium'>
                  Current Status
                </span>
              </div>
              <LoanStatusBadge status={loan.status} size='sm' />
            </div>
          </div>
        </div>
        {loan.status === 'Cancelled' && (
          <Alert className='mt-4 rounded-lg border-0 border-l-4 border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20'>
            <XCircle className='h-4 w-4' />
            <AlertTitle className='font-semibold'>Cancelled</AlertTitle>
            <AlertDescription className='text-red-800'>
              {loan.notes}
            </AlertDescription>
          </Alert>
        )}

        {loan.status === 'Rejected' && (
          <Alert className='mt-4 rounded-lg border-0 border-l-4 border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20'>
            <XCircle className='h-4 w-4' />
            <AlertTitle className='font-semibold'>Rejected</AlertTitle>
            <AlertDescription className='text-red-800'>
              This loan application was rejected during the approval review
              process.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
