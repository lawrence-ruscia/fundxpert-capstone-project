import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoanStatusBadge } from '@/features/loans/employee/components/LoanStatusBadge';
import { Link, useNavigate } from 'react-router-dom';
import { useEmployeeLoans } from '@/features/loans/employee/hooks/useEmployeeLoans';

export const LoanStatus = ({ ...props }) => {
  const {
    activeLoan: loan,
    loading: loanLoading,
    error: loanError,
  } = useEmployeeLoans();

  const navigate = useNavigate();

  if (loanLoading) {
    return (
      <Card {...props}>
        <CardHeader>
          <CardTitle>Loan Status</CardTitle>
          <CardDescription>
            View your current loan application and balances
          </CardDescription>
        </CardHeader>
        <CardContent className='flex items-center justify-center py-8'>
          <div className='flex items-center gap-2'>
            <div className='border-primary h-4 w-4 animate-spin rounded-full border-b-2' />
            <span className='text-muted-foreground text-sm'>Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loanError) {
    return (
      <Card {...props}>
        <CardHeader>
          <CardTitle>Loan Status</CardTitle>
          <CardDescription>
            View your current loan application and balances
          </CardDescription>
        </CardHeader>
        <CardContent className='py-4 text-center'>
          <p className='text-destructive mb-3 text-sm'>{loanError}</p>
          <Button size='sm' className='w-full'>
            Apply for Loan
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Loan Status</CardTitle>
        <CardDescription>
          View your current loan application and balances
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {loan ? (
          <div className='space-y-3'>
            {/* Loan Status Badge */}
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Status</span>
              <LoanStatusBadge size='sm' status={loan.status} />
            </div>

            {/* Loan Amount */}
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Loan Amount</span>
              <span className='font-semibold'>
                ₱{loan.amount.toLocaleString()}
              </span>
            </div>

            {/* Monthly Amortization - Only show for Active/Approved loans */}
            {(loan.status === 'Approved' || loan.status === 'Released') && (
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Monthly Payment</span>
                <span className='font-semibold'>
                  ₱{loan.monthly_amortization.toLocaleString()}
                </span>
              </div>
            )}

            {/* Repayment Term */}
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Repayment Term</span>
              <span className='font-medium'>
                {loan.repayment_term_months} months
              </span>
            </div>

            {/* Loan ID */}
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Loan ID</span>
              <Badge variant='outline'>#{loan.id}</Badge>
            </div>

            {/* View Details Button */}
            <Link to={`/employee/loans/${loan.id}`} className='block w-full'>
              <Button
                size='sm'
                variant='outline'
                className='w-full bg-transparent'
              >
                View Loan Details
              </Button>
            </Link>
          </div>
        ) : (
          <div className='flex-col justify-between text-center'>
            <p className='text-muted-foreground mb-3 py-12'>No active loans</p>
            <Button
              onClick={() => navigate('/employee/loans')}
              size='sm'
              className='w-full'
            >
              Apply for Loan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
