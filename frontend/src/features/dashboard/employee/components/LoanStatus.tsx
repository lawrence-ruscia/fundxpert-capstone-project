import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EmployeeOverview } from '../types/employeeOverview';

export const LoanStatus = ({
  overview,
  ...props
}: {
  overview: EmployeeOverview;
}) => {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Loan Status</CardTitle>
        <CardDescription>
          View your current loan application and balances
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {overview.loan_status.active_loan ? (
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Outstanding Balance</span>
              <span className='font-semibold'>
                ₱
                {overview.loan_status.outstanding_balance !== undefined
                  ? overview.loan_status.outstanding_balance.toLocaleString()
                  : '0'}
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm'>Loan ID</span>
              <Badge variant='outline'>{overview.loan_status.loan_id}</Badge>
            </div>
            <Button
              size='sm'
              variant='outline'
              className='w-full bg-transparent'
            >
              View Loan Details
            </Button>
          </div>
        ) : (
          <div className='py-4 text-center'>
            <p className='mb-3 text-gray-500'>No active loans</p>
            <Button size='sm' className='w-full'>
              Apply for Loan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
