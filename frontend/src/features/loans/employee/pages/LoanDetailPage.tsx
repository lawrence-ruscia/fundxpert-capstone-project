import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CalendarDays, Clock, PhilippinePeso, Target } from 'lucide-react';
import { LoanDocumentUpload } from '../components/LoanDocumentUpload';

import { useLoanDetails } from '../hooks/useLoanDetails';
import { Separator } from '@radix-ui/react-select';
import { LoanStatusBadge } from '../components/LoanStatusBadge';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import { NetworkError } from '@/shared/components/NetworkError';

export default function LoanDetailPage() {
  const { loan, loading, error } = useLoanDetails();
  if (loading) {
    return <LoadingSpinner text={'Loading Loan Details'} />;
  }

  if (error) {
    return <NetworkError message={error} />;
  }

  if (!loan) {
    return (
      <DataError
        title='No loan found'
        message=' The requested loan application could not be located.'
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
              Loan Application: #{loan.id}
            </h1>
            <p className='text-muted-foreground'>
              Review your loan application details and manage required documents
            </p>
          </div>
        </div>

        {/* Loan Overview Card */}
        <Card className='border-border/50 shadow-sm'>
          <CardHeader className='pb-4'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div>
                <CardTitle className='text-foreground text-xl'>
                  Application Overview
                </CardTitle>
                <CardDescription>
                  Current status and loan details
                </CardDescription>
              </div>

              <LoanStatusBadge status={loan.status} />
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
                    Loan Amount
                  </p>
                  <p className='text-foreground text-lg font-semibold'>
                    ₱{loan.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <Clock className='text-primary h-5 w-5' />
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Repayment Term
                  </p>
                  <p className='text-foreground text-lg font-semibold'>
                    {loan.repayment_term_months} months
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <CalendarDays className='text-primary h-5 w-5' />
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Applied On
                  </p>
                  <p className='text-foreground text-lg font-semibold'>
                    {new Date(loan.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Target className='text-primary h-4 w-4' />
                <h3 className='text-foreground font-semibold'>Loan Purpose</h3>
              </div>
              <div className='space-y-1 pl-6'>
                <p className='text-foreground font-medium'>
                  {loan.purpose_category}
                </p>
                {loan.purpose_detail && (
                  <p className='text-muted-foreground text-sm'>
                    {loan.purpose_detail}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload Section */}
        <LoanDocumentUpload loanId={loan.id} />
      </div>
    </div>
  );
}
