import { useEmployeeOverview } from '../hooks/useEmployeeOverview.js';
import { BalanceCard } from '../components/BalanceCard.js';
import { EmploymentStatusBadge } from '../components/EmployeeStatusBadge.js';
import {
  formatCurrency,
  formatGrowth,
  formatVesting,
  formatVestingDate,
} from '../utils/formatters.js';
import { Building2, Clock, PiggyBank, ShieldCheck, User } from 'lucide-react';
import { FundGrowthChart } from '../components/FundGrowthChart.js';
import { QuickActions } from '../components/QuickActions.js';
import { LoanStatus } from '../components/LoanStatus.js';
import { EligibilityStatus } from '../components/EligibilityStatus.js';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { NetworkError } from '@/shared/components/NetworkError';
import { DataError } from '@/shared/components/DataError';

export default function EmployeeDashboardPage() {
  const { data: overview, loading, error } = useEmployeeOverview();

  if (loading) return <LoadingSpinner text={'Loading Dashboard Data'} />;
  if (error) return <NetworkError message={error.message} />;
  if (!overview)
    return (
      <DataError
        title='No employee overview data found'
        message='Unable to load employee informatio n'
      />
    );

  return (
    <>
      <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Welcome back, {overview.employee.name} !
          </h1>
          <div className='flex gap-6'>
            <p>
              <span className='text-muted-foreground'>Employee ID: </span>
              {overview.employee.employee_id}
            </p>
            <p>
              <span className='text-muted-foreground'>Hired: </span>
              {new Date(overview.employee.date_hired).toLocaleDateString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }
              )}
            </p>
          </div>
        </div>
        <div className='flex flex-col justify-center space-x-2 tracking-tight'>
          <EmploymentStatusBadge status={overview.employee.employment_status} />
        </div>
      </div>
      <div className='space-y-4'>
        <div className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'>
            <BalanceCard
              label='Employee Contributions'
              value={formatCurrency(
                Number(overview.balances.employee_contribution_total)
              )}
              icon={User}
            />
            <BalanceCard
              label='Employer Contributions'
              value={formatCurrency(
                Number(overview.balances.employer_contribution_total)
              )}
              icon={Building2}
            />
            <BalanceCard
              label='Vested Amount'
              value={formatCurrency(Number(overview.balances.vested_amount))}
              icon={ShieldCheck}
              description={formatVesting(
                Number(overview.balances.comparisons.vesting_percentage)
              )}
            />
            <BalanceCard
              label='Unvested Amount'
              value={formatCurrency(Number(overview.balances.unvested_amount))}
              icon={Clock}
              description={formatVestingDate(
                overview.employee.date_hired,
                overview.balances.unvested_amount
              )}
            />
            <BalanceCard
              label='Total Balance'
              value={formatCurrency(Number(overview.balances.total_balance))}
              icon={PiggyBank}
              description={formatGrowth(
                Number(overview.balances.comparisons.growth_percentage)
              )}
            />
          </div>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-8'>
            <div className='col-span-1 lg:col-span-5'>
              <div>
                <FundGrowthChart />
              </div>
            </div>

            <QuickActions className='col-span-1 lg:col-span-3' />
          </div>
        </div>

        <div className='grid gap-4 lg:grid-cols-2'>
          <LoanStatus />
          <EligibilityStatus overview={overview} />
        </div>
      </div>
    </>
  );
}
