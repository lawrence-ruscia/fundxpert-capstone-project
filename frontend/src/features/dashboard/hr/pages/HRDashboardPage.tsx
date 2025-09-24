import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useHRDashboardData } from '../hooks/useHrDashboardData';
import { NetworkError } from '@/shared/components/NetworkError';
import { useAuth } from '@/features/auth/context/AuthContext';
import { EmploymentStatusBadge } from '../../employee/components/EmployeeStatusBadge';
import {
  BanknoteArrowDown,
  Building2,
  PiggyBank,
  Users,
  Wallet,
} from 'lucide-react';
import { BalanceCard } from '../../employee/components/BalanceCard';
import { formatCurrency, formatGrowth } from '../../employee/utils/formatters';
import { FundGrowthChart } from '../../employee/components/FundGrowthChart';
import { ContributionTrends } from '../components/ContributionTrends';

export const HRDashboardPage = () => {
  const { user } = useAuth();
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
      <div className='space-y-4'>
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
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-8'>
            <div className='col-span-1 lg:col-span-5'>
              <div>
                <ContributionTrends />
              </div>
            </div>

            {/* <QuickActions className='col-span-1 lg:col-span-3' /> */}
          </div>
        </div>

        <div className='grid gap-4 lg:grid-cols-2'>
          {/* <LoanStatus />
          <EligibilityStatus overview={overview} /> */}
        </div>
      </div>
    </div>
  );
};
