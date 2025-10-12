import {
  fetchWithdrawalEligibility,
  fetchWithdrawalHistory,
} from '../services/withdrawalService';
import type {
  WithdrawalEligibility,
  WithdrawalRequest,
} from '../types/withdrawal';
import { useApi } from '@/shared/hooks/useApi';
import { WithdrawalApplicationForm } from '../components/WithdrawalApplicationForm';
import { useCallback, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Plus,
  AlertCircle,
  Activity,
  UserCheck,
  LogOut,
  Briefcase,
  Heart,
  Users,
  FileText,
  Minus,
  CheckCircle,
  Clock,
  XCircle,
  FileX,
  Wallet,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
// import { LoansList } from '../components/LoanList';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { NetworkError } from '@/shared/components/NetworkError';
import { DataError } from '@/shared/components/DataError';
import { WithdrawalItem } from '../components/WithdrawalItem';
import { usePersistedState } from '@/shared/hooks/usePersistedState';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling';

export default function WithdrawalsPage() {
  const [autoRefreshEnabled] = usePersistedState(
    'employee-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWithdrawalDetailsHandler = useCallback(async () => {
    const [withdrawals, eligibility] = await Promise.all([
      fetchWithdrawalHistory(),
      fetchWithdrawalEligibility(),
    ]);

    return { withdrawals, eligibility };
  }, []);

  const { data, loading, error, refresh, lastUpdated } = useSmartPolling(
    fetchWithdrawalDetailsHandler,
    {
      context: 'withdrawal-detail',
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

  const [showForm, setShowForm] = useState(false);

  const handleFormSuccess = () => {
    setShowForm(false);
    refresh();
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner text={'Checking Withdrawal Eligibility'} />;
  }

  // Error state
  if (error) {
    return <NetworkError message={error} />;
  }

  if (!data) {
    return (
      <DataError
        title='No withdrawal eligibility data found'
        message='Unable to load withdrawal eligibility information'
      />
    );
  }

  const { withdrawals, eligibility } = data;
  // FIX: Filter for active withdrawals and get the latest one
  const activeWithdrawals =
    withdrawals?.filter(
      w =>
        w.status === 'Pending' ||
        w.status === 'Incomplete' ||
        w.status === 'UnderReviewOfficer' ||
        w.status === 'Approved' ||
        w.status === 'Released'
    ) || [];

  // Show active withdrawal or latest withdrawal
  const withdrawalToShow =
    activeWithdrawals.length > 0 ? activeWithdrawals[0] : withdrawals?.[0];

  const latest = withdrawals && withdrawals.length > 0 ? withdrawals[0] : null;
  const hasActiveWithdrawal = activeWithdrawals.length > 0;

  // FIX: Button should be disabled if not eligible OR if there's already an active withdrawal
  const canRequestNewWithdrawal = eligibility.eligible && !hasActiveWithdrawal;
  console.log('Reason if not eligible: ', eligibility.reasonIfNotEligible);
  return (
    <div>
      {showForm ? (
        <div className='mt-8'>
          <Card className='border-0 shadow-xl'>
            <CardHeader>
              <CardTitle className='text-2xl'>Withdrawal Application</CardTitle>
              <CardDescription>
                Complete the form below to apply for a withdrawal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WithdrawalApplicationForm
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
                eligibility={eligibility}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className=''>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='flex items-center gap-3'>
                <div>
                  <h1 className='text-2xl font-bold tracking-tight'>
                    Withdrawals Management
                  </h1>
                  <p className='text-muted-foreground'>
                    Manage your provident fund withdrawals
                  </p>
                </div>
              </div>
              {/* Refresh Controls */}
              <div className='flex flex-wrap items-center gap-3'>
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

          {/* Overview Cards */}
          <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
            <BalanceCard
              label='Available to Withdraw'
              value={formatCurrency(Number(eligibility.snapshot.vested_amount))}
              icon={Wallet}
              description='Your vested balance eligible for withdrawal'
            />
            <BalanceCard
              label='Current Status'
              value={latest ? latest.status : 'No Request'}
              icon={
                latest
                  ? latest.status === 'Released'
                    ? CheckCircle
                    : latest.status === 'Approved'
                      ? Clock
                      : latest.status === 'Rejected'
                        ? XCircle
                        : AlertCircle
                  : FileX
              }
              description={
                latest
                  ? latest.status === 'Pending'
                    ? 'Awaiting review'
                    : latest.status === 'Approved'
                      ? 'Approved, pending payment'
                      : latest.status === 'Released'
                        ? 'Payment completed'
                        : latest.status === 'Rejected'
                          ? 'Request was denied'
                          : 'Under review'
                  : 'You have not submitted any withdrawal requests'
              }
            />
            <BalanceCard
              label='Withdrawal Type'
              value={latest ? latest.request_type : '—'}
              icon={
                latest
                  ? latest.request_type === 'Retirement'
                    ? UserCheck
                    : latest.request_type === 'Resignation'
                      ? LogOut
                      : latest.request_type === 'Redundancy'
                        ? Briefcase
                        : latest.request_type === 'Disability'
                          ? Heart
                          : latest.request_type === 'Death'
                            ? Users
                            : FileText
                  : Minus
              }
              description={
                latest
                  ? 'Reason for withdrawal request'
                  : 'No withdrawal type selected'
              }
            />
            <BalanceCard
              label='Request Date'
              value={
                latest
                  ? new Date(latest.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'
              }
              icon={Calendar}
              description={
                latest
                  ? 'When you submitted your request'
                  : 'No request submitted yet'
              }
            />
          </div>

          {/* Main Content */}
          <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
            {/* Withdrawal List */}
            <div className='lg:col-span-2'>
              <Card className='shadow-lg'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-3 text-xl font-bold'>
                    <div className='rounded-lg p-2'>
                      <Activity className='h-5 w-5' />
                    </div>
                    Withdrawal Request
                  </CardTitle>
                  <CardDescription>
                    Your provident fund withdrawal request status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {withdrawals?.length === 0 ? (
                    <div className='py-8 text-center'>
                      <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl'>
                        <Activity className='h-6 w-6' />
                      </div>
                      <p className='font-medium'>No withdrawal requests</p>
                      <p className='mt-1 text-sm'>
                        Submit a withdrawal request to access your provident
                        fund balance
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {withdrawals?.length === 0 ? (
                        <div className='py-8 text-center'>
                          <p className='font-medium'>
                            No active withdrawal requests
                          </p>
                          <p className='text-muted-foreground mt-1 text-sm'>
                            Your recent requests have been completed or
                            cancelled
                          </p>
                        </div>
                      ) : withdrawalToShow ? (
                        <WithdrawalItem withdrawal={withdrawalToShow} />
                      ) : (
                        // All withdrawals are completed/cancelled message
                        <div className='py-8 text-center'>
                          <p className='font-medium'>
                            No active withdrawal requests
                          </p>
                          <p className='text-muted-foreground mt-1 text-sm'>
                            Your recent requests have been completed or
                            cancelled
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className='space-y-6'>
              <Card className='lg:sticky lg:top-8'>
                <CardHeader>
                  <CardTitle className='text-xl font-semibold'>
                    Need a Withdrawal?
                  </CardTitle>
                  <CardDescription>
                    Request withdrawal of your provident fund balance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!showForm ? (
                    <Button
                      onClick={() => setShowForm(true)}
                      className='w-full'
                      disabled={!canRequestNewWithdrawal}
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Request New Withdrawal
                    </Button>
                  ) : (
                    <div className='space-y-4'>
                      <p className='text-muted-foreground text-sm'>
                        Fill out the withdrawal request form:
                      </p>
                      <Button
                        variant='outline'
                        onClick={handleFormCancel}
                        className='w-full bg-transparent'
                      >
                        Cancel Application
                      </Button>
                    </div>
                  )}

                  {!canRequestNewWithdrawal && (
                    <Alert className='mt-4 border-amber-200 bg-amber-50 text-amber-800'>
                      <AlertCircle className='h-4 w-4 text-amber-800' />
                      <AlertDescription className='text-amber-800'>
                        {eligibility.reasonIfNotEligible}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
