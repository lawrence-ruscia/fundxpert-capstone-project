import { useEmployeeOverview } from '../hooks/useEmployeeOverview.js';
import { BalanceCard } from '../components/BalanceCard.js';
import { EmploymentStatusBadge } from '../components/EmployeeStatusBadge.js';
import {
  formatCurrency,
  formatGrowth,
  formatVesting,
  formatVestingDate,
} from '../utils/formatters.js';
import {
  AlertCircle,
  Building2,
  Clock,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  Timer,
  User,
} from 'lucide-react';
import { FundGrowthChart } from '../components/FundGrowthChart.js';
import { QuickActions } from '../components/QuickActions.js';
import { LoanStatus } from '../components/LoanStatus.js';
import { EligibilityStatus } from '../components/EligibilityStatus.js';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { NetworkError } from '@/shared/components/NetworkError';
import { DataError } from '@/shared/components/DataError';
import { useCallback, useState } from 'react';
import type { ContributionPeriod } from '@/features/contributions/shared/types/contributions.js';
import { usePersistedState } from '@/shared/hooks/usePersistedState.js';
import { fetchEmployeeOverview } from '../services/employeeService.js';
import { fetchEmployeeContributions } from '@/features/contributions/employee/services/employeeContributionsService.js';
import { Button } from '@/components/ui/button.js';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling.js';
import { Switch } from '@/components/ui/switch.js';

export default function EmployeeDashboardPage() {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = usePersistedState(
    'employee-dashboard-auto-refresh',
    true // default value
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<ContributionPeriod>('year');

  const fetchDashboardData = useCallback(async () => {
    // This should match what useHRDashboardData returns
    const [overview, contributions] = await Promise.all([
      fetchEmployeeOverview(),
      fetchEmployeeContributions(timeRange),
    ]);

    return { overview, contributions };
  }, [timeRange]);

  const { data, error, loading, refresh, lastUpdated } = useSmartPolling(
    fetchDashboardData,
    {
      context: 'dashboard',
      enabled: autoRefreshEnabled,
      pauseWhenHidden: true,
      pauseWhenInactive: true,
    }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  if (loading && !data)
    return <LoadingSpinner text={'Loading employee dashboard...'} />;
  if (error) return <NetworkError message={error} />;
  if (!data)
    return (
      <DataError
        title='No employee overview data found'
        message='Please try refreshing the page or contact support'
      />
    );

  const { overview, contributions } = data;

  return (
    <>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>
                Welcome back, {overview.employee.name}!
              </h1>
              <div className='mt-2 flex items-center gap-4 tracking-tight'>
                <p className='text-muted-foreground'>
                  <span className='text-muted-foreground'>Employee ID: </span>
                  {overview.employee.employee_id}
                </p>
                <p>
                  <span className='text-muted-foreground flex items-center gap-2'>
                    Status:
                    <EmploymentStatusBadge
                      status={overview.employee.employment_status}
                      size='sm'
                    />
                  </span>
                </p>
              </div>
            </div>
          </div>
          {/* Refresh Controls */}
          <div className='flex flex-wrap items-center gap-3'>
            {/* Auto-refresh Toggle */}
            <div className='flex items-center gap-2 rounded-lg border px-3 py-2'>
              <div className='flex items-center gap-2'>
                <Timer className='text-muted-foreground h-4 w-4' />
                <span className='text-sm font-medium'>Auto-refresh</span>
              </div>
              <Switch
                checked={autoRefreshEnabled}
                onCheckedChange={setAutoRefreshEnabled}
                aria-label='Toggle auto-refresh'
              />
            </div>
            {/* Last Updated */}
            {lastUpdated && (
              <div className='text-muted-foreground text-right text-sm'>
                <p className='font-medium'>Last updated</p>
                <p className='text-xs'>
                  {lastUpdated.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
            {/* Manual Refresh Button */}
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={isRefreshing}
              className='gap-2'
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        {/* Auto-refresh Status Banner */}
        {!autoRefreshEnabled && (
          <div className='bg-muted/50 mt-4 mb-8 flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5'>
            <AlertCircle className='text-muted-foreground h-4 w-4' />
            <p className='text-muted-foreground text-sm'>
              Auto-refresh is disabled. Data will only update when manually
              refreshed.
            </p>
          </div>
        )}
      </div>

      {/* Loading Overlay for Background Refresh */}
      {loading && data && (
        <div className='bg-background/80 fixed inset-0 z-50 flex items-start justify-center pt-20 backdrop-blur-sm'>
          <div className='bg-card flex items-center gap-2 rounded-lg border p-4 shadow-lg'>
            <RefreshCw className='h-4 w-4 animate-spin' />
            <span className='text-sm font-medium'>Updating data...</span>
          </div>
        </div>
      )}

      <div className='space-y-6'>
        <div className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'>
            <BalanceCard
              label='Total Balance'
              value={formatCurrency(Number(overview.balances.total_balance))}
              icon={PiggyBank}
              description={formatGrowth(
                Number(overview.balances.comparisons.growth_percentage)
              )}
            />
            <BalanceCard
              label='Total Employee Contributions'
              value={formatCurrency(
                Number(overview.balances.employee_contribution_total)
              )}
              icon={User}
            />
            <BalanceCard
              label='Total Employer Contributions'
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
          </div>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-8'>
            <div className='col-span-1 lg:col-span-5'>
              <div>
                <FundGrowthChart
                  contributionsData={contributions}
                  timeRange={timeRange}
                  setTimeRange={setTimeRange}
                />
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
