import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { NetworkError } from '@/shared/components/NetworkError';
import {
  AlertCircle,
  BanknoteArrowDown,
  PiggyBank,
  RefreshCw,
  Timer,
  Users,
  Wallet,
} from 'lucide-react';
import { BalanceCard } from '../../employee/components/BalanceCard';
import { formatCurrency } from '../../employee/utils/formatters';
import { ContributionTrends } from '../components/ContributionTrends';
import { AssignedLoans } from '../components/AssignedLoans';
import { useAutoRefresh } from '@/shared/hooks/useAuthRefresh';
import { useCallback, useState } from 'react';
import {
  fetchAssignedLoans,
  fetchContributionTrends,
  fetchHROverview,
} from '../services/hrDashboardService';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { HRContributionPeriod } from '../types/hrDashboardTypes';
import { usePersistedState } from '@/shared/hooks/usePersistedState';
import { DataError } from '@/shared/components/DataError';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling';
import { useAuth } from '@/features/auth/context/AuthContext';

export const HRDashboardPage = () => {
  const { user } = useAuth();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = usePersistedState(
    'hr-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<HRContributionPeriod>('year');

  const fetchDashboardData = useCallback(async () => {
    // This should match what useHRDashboardData returns
    const [overview, assignedLoans, contributions] = await Promise.all([
      fetchHROverview(),
      fetchAssignedLoans(),
      fetchContributionTrends(timeRange),
    ]);

    return { overview, assignedLoans, contributions };
  }, [timeRange]);

  const { data, loading, error, refresh, lastUpdated } = useSmartPolling(
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

  if (loading && !data && !user)
    return <LoadingSpinner text='Loading hr dashboard...' />;
  if (error) return <NetworkError message={error} />;
  if (!data)
    return (
      <DataError
        title='Failed to load hr dashboard'
        message='Please try refreshing the page or contact support'
      />
    );

  const { overview, assignedLoans, contributions } = data;

  return (
    <div>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>
                HR Dashboard
              </h1>
              <p className='text-muted-foreground'>
                Monitor employee provident fund activities and manage pending
                requests
              </p>
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
              <ContributionTrends
                contributions={contributions}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
              />
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        {user && (
          <AssignedLoans
            assignedLoans={assignedLoans}
            userHrRole={user.hr_role}
          />
        )}
      </div>
    </div>
  );
};
