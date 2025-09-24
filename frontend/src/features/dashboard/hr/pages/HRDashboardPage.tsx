import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useHRDashboardData } from '../hooks/useHrDashboardData';
import { NetworkError } from '@/shared/components/NetworkError';
import {
  ArrowRight,
  BanknoteArrowDown,
  Clock,
  PiggyBank,
  Users,
  Wallet,
} from 'lucide-react';
import { BalanceCard } from '../../employee/components/BalanceCard';
import { formatCurrency } from '../../employee/utils/formatters';
import { ContributionTrends } from '../components/ContributionTrends';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const HRDashboardPage = () => {
  const { data, loading, error } = useHRDashboardData();

  if (loading) return <LoadingSpinner text={'Loading Dashboard Data'} />;
  if (error) return <NetworkError message={error} />;

  const {
    overview,
    contributions,
    loanSummary,
    withdrawalSummary,
    pendingLoans,
    pendingWithdrawals,
  } = data;

  return (
    <div>
      {/* Header */}
      <div className='mb-8'>
        <div className='mb-2 flex items-center gap-3'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>HR Dashboard</h1>
            <p className='text-muted-foreground'>
              Monitor employee provident fund activities and manage pending
              requests
            </p>
          </div>
        </div>
      </div>
      <div className='space-y-6'>
        <div className='space-y-4'>
          <div className='mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <BalanceCard
              label='Total Employees'
              value={String(overview?.total_employees)}
              icon={Users}
              comparison={`${overview?.active_employees} active`}
            />
            <BalanceCard
              label='Total Contributions'
              value={formatCurrency(
                Number(overview?.total_employee_contributions) +
                  Number(overview?.total_employer_contributions)
              )}
              icon={PiggyBank}
              comparison={`${formatCurrency(Number(overview?.total_employee_contributions))} from employee`}
            />

            <BalanceCard
              label='Pending Loans'
              value={String(overview?.pending_loans)}
              icon={Wallet}
              comparison={`${String(overview?.approved_loans_this_month ?? 0)} approved loans this month`}
            />

            <BalanceCard
              label='Pending Withdrawals'
              value={String(overview?.pending_withdrawals)}
              icon={BanknoteArrowDown}
              comparison={`${String(overview?.processsed_withdrawals_this_month ?? 0)} processed withdrawals this month`}
            />
          </div>
          <div className='grid grid-cols-1'>
            <div className='col-span-1 lg:col-span-5'>
              <ContributionTrends />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
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
                    <p className='text-muted-foreground text-sm'>
                      Pending Loans
                    </p>
                  </div>
                  <div className='text-center'>
                    <p className='text-3xl font-bold text-green-500'>
                      {overview?.approved_loans_this_month ?? 0}
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
                      {overview?.processsed_withdrawals_this_month ?? 0}
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

        <div className='grid gap-4 lg:grid-cols-2'>
          {/* <LoanStatus />
          <EligibilityStatus overview={overview} /> */}
        </div>
      </div>
    </div>
  );
};
