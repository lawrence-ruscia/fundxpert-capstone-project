import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import type { EmployeeOverview } from '../types/employeeOverview';
import { Badge } from '@/components/ui/badge';

export const EligibilityStatus = ({
  overview,
  ...props
}: {
  overview: EmployeeOverview;
}) => {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Eligibility Status</CardTitle>
        <CardDescription>
          Check your eligibility for loans and withdrawals
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <span className='text-sm'>Withdrawals</span>
          <Badge
            variant={
              overview.eligibility.can_withdraw ? 'default' : 'secondary'
            }
          >
            {overview.eligibility.can_withdraw ? 'Eligible' : 'Not Eligible'}
          </Badge>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-sm'>Loan Requests</span>
          <Badge
            variant={
              overview.eligibility.can_request_loan ? 'default' : 'secondary'
            }
          >
            {overview.eligibility.can_request_loan
              ? 'Eligible'
              : 'Not Eligible'}
          </Badge>
        </div>
        <div className='border-t pt-2'>
          <div className='flex items-center justify-between'>
            <span className='text-sm'>Max Loan Amount</span>
            <span className='font-semibold'>
              ₱{overview.eligibility.max_loan_amount.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
