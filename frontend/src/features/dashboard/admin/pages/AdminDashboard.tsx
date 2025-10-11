import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { AdminStats } from '../types/admin';

import {
  Activity,
  Users,
  Lock,
  KeyRound,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Timer,
  AlertCircle,
} from 'lucide-react';
import { getAdminStats } from '../services/adminService';
import { BalanceCard } from '../../employee/components/BalanceCard';
import { RoleDistribution } from '../components/RoleDistribution';
import { RecentActions } from '../components/RecentActions';
import { LoginTrendsChart } from '../components/LoginTrendsChart';
import { DataError } from '@/shared/components/DataError';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useCallback, useState } from 'react';
import { useAutoRefresh } from '@/shared/hooks/useAuthRefresh';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { usePersistedState } from '@/shared/hooks/usePersistedState';

export default function AdminDashboardPage() {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = usePersistedState(
    'admin-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    return await getAdminStats();
  }, []);

  const {
    data: stats,
    loading,
    refresh,
    lastUpdated,
  } = useAutoRefresh<AdminStats>(fetchStats, {
    interval: 300000, // 5 minutes
    enabled: autoRefreshEnabled,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  if (loading && !stats) {
    return <LoadingSpinner text=' Loading system overview...' />;
  }

  if (!stats) {
    return (
      <DataError
        title='Failed to load admin dashboard'
        message='Please try refreshing the page or contact support'
      />
    );
  }

  const user_summary = stats.user_summary;
  const role_summary = stats.role_summary ?? [];
  const login_trends = stats.login_trends ?? [];
  const recent_actions = stats.recent_actions ?? [];

  return (
    <div className=''>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              System Overview
            </h1>
            <p className='text-muted-foreground mt-2'>
              Monitor user activity, roles, and system health
            </p>
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
          <div className='bg-muted/50 mt-4 flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5'>
            <AlertCircle className='text-muted-foreground h-4 w-4' />
            <p className='text-muted-foreground text-sm'>
              Auto-refresh is disabled. Data will only update when manually
              refreshed.
            </p>
          </div>
        )}
      </div>

      {/* Loading Overlay for Background Refresh */}
      {loading && stats && (
        <div className='bg-background/80 fixed inset-0 z-50 flex items-start justify-center pt-20 backdrop-blur-sm'>
          <div className='bg-card flex items-center gap-2 rounded-lg border p-4 shadow-lg'>
            <RefreshCw className='h-4 w-4 animate-spin' />
            <span className='text-sm font-medium'>Updating data...</span>
          </div>
        </div>
      )}

      <div className='space-y-6'>
        {/* Summary Cards */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <BalanceCard
            label='Total Users'
            value={String(user_summary.total_users)}
            icon={Users}
          />
          <BalanceCard
            label='Active Users'
            value={String(user_summary.active_users)}
            icon={Activity}
          />
          <BalanceCard
            label='Locked Accounts'
            value={String(user_summary.locked_accounts)}
            icon={Lock}
          />
          <BalanceCard
            label='Temp Password Users'
            value={String(user_summary.temp_password_users)}
            icon={KeyRound}
          />
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Role Distribution */}
          <RoleDistribution
            role_summary={role_summary}
            user_summary={user_summary}
          />

          {/* Login Trends Chart */}
          <Card className='lg:col-span-2'>
            <CardHeader>
              <div className='flex items-start justify-between'>
                <div>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <div className='bg-primary/10 rounded-lg p-2'>
                      <BarChart3 className='text-primary h-5 w-5' />
                    </div>
                    Login Activity
                  </CardTitle>
                  <CardDescription>
                    Success and failed attempts over the past 7 days
                  </CardDescription>
                </div>

                {/* Quick Stats */}
                {login_trends.length > 0 && (
                  <div className='flex gap-4'>
                    <div className='text-right'>
                      <div className='mb-1 flex items-center gap-1.5'>
                        <div className='h-3 w-3 rounded-full bg-green-500' />
                        <span className='text-muted-foreground text-xs'>
                          Success
                        </span>
                      </div>
                      <p className='text-2xl font-bold text-green-600'>
                        {login_trends.reduce(
                          (sum, day) => sum + day.success_count,
                          0
                        )}
                      </p>
                    </div>
                    <div className='text-right'>
                      <div className='mb-1 flex items-center gap-1.5'>
                        <div className='h-3 w-3 rounded-full bg-red-500' />
                        <span className='text-muted-foreground text-xs'>
                          Failed
                        </span>
                      </div>
                      <p className='text-2xl font-bold text-red-600'>
                        {login_trends.reduce(
                          (sum, day) => sum + day.failed_count,
                          0
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {login_trends.length > 0 ? (
                <div className='space-y-6'>
                  {/* Login Trends Chart */}
                  <LoginTrendsChart login_trends={login_trends} />

                  {/* Legend & Insights */}
                  <div className='grid gap-4 md:grid-cols-2'>
                    {/* Success Rate Card */}
                    <div className='rounded-lg border bg-green-500/5 p-4'>
                      <div className='mb-2 flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className='rounded-lg bg-green-500/10 p-2'>
                            <TrendingUp className='h-4 w-4 text-green-600' />
                          </div>
                          <span className='text-sm font-medium'>
                            Success Rate
                          </span>
                        </div>
                        <span className='text-2xl font-bold text-green-600'>
                          {(() => {
                            const total = login_trends.reduce(
                              (sum, day) =>
                                sum + day.success_count + day.failed_count,
                              0
                            );
                            const success = login_trends.reduce(
                              (sum, day) => sum + day.success_count,
                              0
                            );
                            return total > 0
                              ? ((success / total) * 100).toFixed(1)
                              : '0';
                          })()}
                          %
                        </span>
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Average across all login attempts
                      </p>
                    </div>

                    {/* Peak Day Card */}
                    <div className='bg-primary/5 rounded-lg border p-4'>
                      <div className='mb-2 flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className='bg-primary/10 rounded-lg p-2'>
                            <Activity className='text-primary h-4 w-4' />
                          </div>
                          <span className='text-sm font-medium'>
                            Peak Activity
                          </span>
                        </div>
                        <span className='text-2xl font-bold'>
                          {(() => {
                            const peakDay = login_trends.reduce((max, day) =>
                              day.success_count + day.failed_count >
                              max.success_count + max.failed_count
                                ? day
                                : max
                            );
                            return peakDay.success_count + peakDay.failed_count;
                          })()}
                        </span>
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Highest number of login attempts in a day
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='py-16 text-center'>
                  <div className='bg-muted/50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                    <BarChart3 className='text-muted-foreground h-8 w-8' />
                  </div>
                  <p className='text-muted-foreground mb-1 font-medium'>
                    No login trend data available
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    Login activity will be tracked and displayed here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Actions */}
        <RecentActions recent_actions={recent_actions} />
      </div>
    </div>
  );
}
