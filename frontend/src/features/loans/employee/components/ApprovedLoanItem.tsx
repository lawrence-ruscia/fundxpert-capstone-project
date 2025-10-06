import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import {
  CheckCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
  CreditCard,
  Clock,
  Target,
  Eye,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { Loan, LoanStatus } from '../types/loan';
import { LoanStatusBadge } from './LoanStatusBadge';
import { Link } from 'react-router-dom';

export function ApprovedLoanItem({ loan }: { loan: Loan }) {
  const getStatusIcon = (status: LoanStatus) => {
    switch (status) {
      case 'Approved':
      case 'Released':
        return <CheckCircle className='h-5 w-5' />;
      default:
        return <AlertCircle className='h-5 w-5' />;
    }
  };

  return (
    <Card className='group from-background via-background to-muted/20 relative overflow-hidden border-0 bg-gradient-to-br shadow-md transition-all duration-300'>
      {/* Subtle accent border */}
      <div className='from-primary/5 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300' />

      <CardHeader className='relative pb-4'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex items-center gap-4'>
            {/* Enhanced icon container */}
            <div className='bg-primary/10 ring-primary/20 group-hover:bg-primary/15 flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-colors'>
              {getStatusIcon(loan.status)}
            </div>

            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <h3 className='text-xl font-semibold tracking-tight'>
                  Loan #{loan.id}
                </h3>
              </div>
              <div className='text-muted-foreground flex items-center gap-1 text-sm'>
                <Calendar className='h-5 w-5' />
                <span>
                  Applied:{' '}
                  {new Date(loan.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          <LoanStatusBadge size='sm' status={loan.status} />
        </div>
      </CardHeader>

      <CardContent className='relative space-y-6'>
        {/* Key metrics cards */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {/* Loan Amount */}
          <div className='group/card bg-card/50 hover:bg-card/80 relative overflow-hidden rounded-lg border p-4 transition-colors'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <p className='text-muted-foreground text-sm font-medium'>
                  Loan Amount
                </p>
                <p className='text-2xl font-bold tracking-tight'>
                  {formatCurrency(Number(loan.amount.toLocaleString()))}
                </p>
              </div>
              <div className='rounded-full bg-green-100 p-2 dark:bg-green-900/20'>
                <TrendingUp className='h-4 w-4 text-green-600 dark:text-green-400' />
              </div>
            </div>
          </div>

          {/* Monthly Payment */}
          {loan.monthly_amortization && (
            <div className='group/card bg-card/50 hover:bg-card/80 relative overflow-hidden rounded-lg border p-4 transition-colors'>
              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Monthly Payment
                  </p>
                  <p className='text-2xl font-bold tracking-tight'>
                    {formatCurrency(
                      Number(loan.monthly_amortization.toLocaleString())
                    )}
                  </p>
                </div>
                <div className='rounded-full bg-blue-100 p-2 dark:bg-blue-900/20'>
                  <CreditCard className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                </div>
              </div>
            </div>
          )}

          {/* Repayment Term */}
          {loan.repayment_term_months && (
            <div className='group/card bg-card/50 hover:bg-card/80 relative overflow-hidden rounded-lg border p-4 transition-colors'>
              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Term
                  </p>
                  <p className='text-2xl font-bold tracking-tight'>
                    {loan.repayment_term_months}{' '}
                    <span className='text-muted-foreground text-base font-normal'>
                      months
                    </span>
                  </p>
                </div>
                <div className='rounded-full bg-purple-100 p-2 dark:bg-purple-900/20'>
                  <Clock className='h-4 w-4 text-purple-600 dark:text-purple-400' />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loan Purpose Section */}
        {loan.purpose_category && (
          <div className='bg-muted/30 rounded-lg border p-4'>
            <div className='flex items-start gap-3'>
              <div className='bg-muted/30 rounded-md p-1.5'>
                <Target className='0 h-4 w-4' />
              </div>
              <div className='flex-1 space-y-2'>
                <div className='flex items-center gap-2'>
                  <h4 className='font-medium'>Loan Purpose</h4>
                  <Badge variant='secondary' className='text-xs'>
                    {loan.purpose_category}
                  </Badge>
                </div>
                {loan.purpose_detail && (
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    {loan.purpose_detail}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className='pt-2'>
          <Button
            variant='default'
            size='lg'
            className='bg-primary/90 hover:bg-primary hover:shadow-primary/20 w-full transition-all duration-200 hover:shadow-md'
          >
            <Link
              className='flex items-center gap-2'
              to={`/dashboard/loans/${loan.id}`}
            >
              <Eye className='mr-2 h-4 w-4' />
              View Loan Details
            </Link>
          </Button>
        </div>

        {/* Progress indicator for active loans */}

        {loan.status === 'Approved' && (
          <Alert className='rounded-lg border-0 border-l-4 border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20'>
            <CheckCircle className='h-4 w-4' />
            <AlertTitle className='font-semibold'>Loan Approved</AlertTitle>
            <AlertDescription className='text-green-800'>
              Your loan has been approved! Funds will be disbursed shortly
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
