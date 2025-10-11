import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useHRDashboardData } from '../hooks/useHrDashboardData';
import { NetworkError } from '@/shared/components/NetworkError';
import { BanknoteArrowDown, PiggyBank, Users, Wallet } from 'lucide-react';
import { BalanceCard } from '../../employee/components/BalanceCard';
import { formatCurrency } from '../../employee/utils/formatters';
import { ContributionTrends } from '../components/ContributionTrends';
import { AssignedLoans } from '../components/AssignedLoans';

export const HRDashboardPage = () => {
  const { data, loading, error } = useHRDashboardData();

  if (loading) return <LoadingSpinner text={'Loading Dashboard Data'} />;
  if (error) return <NetworkError message={error} />;

  const { overview, assignedLoans: assignedLoans } = data;

  // TODO: show a “Refresh” or “Sync” button beside a “Last updated at” timestamp.
  // TODO: Auto-refresh interval of 3–5 minutes works best (configurable toggle).
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
              description={`${overview?.active_employees} active employees`}
            />
            <BalanceCard
              label='Total Contributions'
              value={formatCurrency(
                Number(overview?.total_employee_contributions) +
                  Number(overview?.total_employer_contributions)
              )}
              icon={PiggyBank}
              description={`${formatCurrency(Number(overview?.total_employee_contributions))} from employee`}
            />

            <BalanceCard
              label='Pending Loans'
              value={String(overview?.pending_loans)}
              icon={Wallet}
              description={`${String(overview?.approved_loans_this_month ?? 0)} approved loans this month`}
            />

            <BalanceCard
              label='Pending Withdrawals'
              value={String(overview?.pending_withdrawals)}
              icon={BanknoteArrowDown}
              description={`${String(overview?.processsed_withdrawals_this_month ?? 0)} processed withdrawals this month`}
            />
          </div>
          <div className='grid grid-cols-1'>
            <div className='col-span-1 lg:col-span-5'>
              <ContributionTrends />
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        <AssignedLoans assignedLoans={assignedLoans} />
      </div>
    </div>
  );
};
