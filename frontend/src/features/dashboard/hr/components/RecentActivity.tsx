import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock, Wallet, ArrowRight, BanknoteArrowDown } from 'lucide-react';
import type {
  HRLoanPendingResponse,
  HrOverviewResponse,
  HRWithdrawalPendingResponse,
} from '../types/hrDashboardTypes';
import { Badge } from '@/components/ui/badge';

export const RecentActivity = ({
  pendingLoans,
  pendingWithdrawals,
  approved_loans_this_month,
  processsed_withdrawals_this_month,
}: {
  pendingLoans: HRLoanPendingResponse[];
  pendingWithdrawals: HRWithdrawalPendingResponse[];
  approved_loans_this_month: HrOverviewResponse['approved_loans_this_month'];
  processsed_withdrawals_this_month: HrOverviewResponse['processsed_withdrawals_this_month'];
}) => {
  return (
    <section className='space-y-6'>
      <div className='flex items-center gap-3'>
        <Clock className='text-primary h-6 w-6' />
        <h2 className='text-2xl font-semibold'>Recent Activity</h2>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Loan Activity */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
            <div className='flex items-center gap-2'>
              <Wallet className='h-5 w-5' />
              <CardTitle className='text-lg'>Loan Activity</CardTitle>
            </div>
            <Badge variant='secondary'>{pendingLoans.length} Pending</Badge>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex justify-between'>
              <div className='text-center'>
                <p className='text-3xl font-bold text-red-500'>
                  {pendingLoans.length}
                </p>
                <p className='text-muted-foreground text-sm'>Pending Loans</p>
              </div>
              <div className='text-center'>
                <p className='text-3xl font-bold text-green-500'>
                  {approved_loans_this_month ?? 0}
                </p>
                <p className='text-muted-foreground text-sm'>
                  Approved This Month
                </p>
              </div>
            </div>
            <Button variant='secondary' className='w-full'>
              View All Loans
              <ArrowRight className='h-4 w-4' />
            </Button>
          </CardContent>
        </Card>

        {/* Withdrawal Activity */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-4'>
            <div className='flex items-center gap-2'>
              <BanknoteArrowDown className='h-5 w-5' />
              <CardTitle className='text-lg'>Withdrawal Activity</CardTitle>
            </div>
            <Badge variant='secondary'>
              {pendingWithdrawals.length} Pending
            </Badge>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex justify-between'>
              <div className='text-center'>
                <p className='text-3xl font-bold text-red-500'>
                  {pendingWithdrawals.length}
                </p>
                <p className='text-muted-foreground text-sm'>
                  Pending Withdrawals
                </p>
              </div>
              <div className='text-center'>
                <p className='text-3xl font-bold text-green-500'>
                  {processsed_withdrawals_this_month ?? 0}
                </p>
                <p className='text-muted-foreground text-sm'>
                  Processed This Month
                </p>
              </div>
            </div>
            <Button variant='secondary' className='w-full'>
              View All Withdrawals
              <ArrowRight className='h-4 w-4' />
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
