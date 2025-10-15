import { fetchEmployeeLoans } from '../services/loanService';
import { LoanApplicationForm } from '../components/LoanApplicationForm';
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
  ShieldCheck,
  PiggyBank,
  Wallet,
  RefreshCw,
  Timer,
} from 'lucide-react';
import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { LoansList } from '../components/LoanList';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { NetworkError } from '@/shared/components/NetworkError';
import { DataError } from '@/shared/components/DataError';
import { usePersistedState } from '@/shared/hooks/usePersistedState';
import { fetchEmployeeOverview } from '@/features/dashboard/employee/services/employeeService';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling';
import { Switch } from '@/components/ui/switch';

export default function LoansPage() {
  const [autoRefreshEnabled] = usePersistedState(
    'employee-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLoansData = useCallback(async () => {
    const [loans, overview] = await Promise.all([
      fetchEmployeeLoans(),
      fetchEmployeeOverview(),
    ]);

    return { loans, overview };
  }, []);

  const [showForm, setShowForm] = useState(false);

  const { data, loading, error, refresh, lastUpdated } = useSmartPolling(
    fetchLoansData,
    {
      context: 'loan-detail',
      enabled: autoRefreshEnabled && !showForm, // Disable when form is shown,,
      pauseWhenHidden: true,
      pauseWhenInactive: true,
    }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    refresh();
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner text={'Loading Employee Data'} />;
  }

  // Error state
  if (error) {
    return <NetworkError message={error} />;
  }

  if (!data?.overview) {
    return (
      <DataError
        title='No employee overview data found'
        message='Unable to load loan eligibility information'
      />
    );
  }

  const { loans, overview } = data;

  const maxLoanAmount = overview.eligibility.max_loan_amount ?? 0;

  return (
    <div>
      {showForm ? (
        <div className='mt-8'>
          <Card className='border-0 shadow-xl'>
            <CardHeader>
              <CardTitle className='text-2xl'>New Loan Application</CardTitle>
              <CardDescription>
                Complete the form below to apply for a new loan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoanApplicationForm
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
                maxLoan={maxLoanAmount}
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
                  <h1 className='text-2xl font-bold tracking-tight'>Loans</h1>
                  <p className='text-muted-foreground'>
                    Manage your provident fund loans and applications
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
          <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-3'>
            <BalanceCard
              label='Vested Amount'
              value={formatCurrency(Number(overview.balances.vested_amount))}
              icon={ShieldCheck}
            />

            <BalanceCard
              label='Total Balance'
              value={formatCurrency(Number(overview.balances.total_balance))}
              icon={PiggyBank}
            />

            <BalanceCard
              label='Max Loan Amount'
              value={formatCurrency(maxLoanAmount)}
              icon={Wallet}
              description={
                overview.eligibility.can_request_loan
                  ? 'Eligible for loan'
                  : 'Not eligible'
              }
            />
          </div>

          {/* Main Content */}
          <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
            {/* Loans List */}
            <div className='lg:col-span-2'>
              <LoansList loans={loans || []} />
            </div>

            {/* Sidebar */}
            <div className='space-y-6'>
              {/* Apply for Loan Card */}
              <Card className='lg:sticky lg:top-8'>
                <CardHeader>
                  <CardTitle className='text-xl font-semibold'>
                    Need a Loan?
                  </CardTitle>
                  <CardDescription>
                    Apply for a new loan against your provident fund balance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!showForm ? (
                    <Button
                      onClick={() => setShowForm(true)}
                      className='w-full'
                      disabled={!overview.eligibility.can_request_loan}
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Apply for New Loan
                    </Button>
                  ) : (
                    <div className='space-y-4'>
                      <p className='text-muted-foreground text-sm'>
                        Fill out the application form below:
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

                  {!overview.eligibility.can_request_loan && (
                    <Alert className='mt-4 border-amber-200 bg-amber-50 text-amber-800'>
                      <AlertCircle className='h-4 w-4 text-amber-800' />
                      <AlertDescription className='text-amber-800'>
                        You are currently not eligible for a loan.
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
