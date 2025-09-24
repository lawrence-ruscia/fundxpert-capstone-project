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
import { PendingActions } from '../components/PendingActions';
import { RecentActivity } from '../components/RecentActivity';

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
              comparison={`${overview?.active_employees} active employees`}
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
        <RecentActivity
          pendingLoans={pendingLoans}
          pendingWithdrawals={pendingWithdrawals}
          approved_loans_this_month={overview?.approved_loans_this_month ?? 0}
          processsed_withdrawals_this_month={
            overview?.processsed_withdrawals_this_month ?? 0
          }
        />

        {/* Pending Actions */}
        <PendingActions
          pendingLoans={pendingLoans}
          pendingWithdrawals={pendingWithdrawals}
        />
      </div>
    </div>
  );
};
