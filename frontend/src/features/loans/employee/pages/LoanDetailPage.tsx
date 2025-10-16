import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Clock,
  PhilippinePeso,
  RefreshCw,
  Target,
  XCircle,
} from 'lucide-react';
import { LoanDocumentUpload } from '../components/LoanDocumentUpload';

import { Separator } from '@radix-ui/react-select';
import { LoanStatusBadge } from '../components/LoanStatusBadge';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import { NetworkError } from '@/shared/components/NetworkError';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useNavigate, useParams } from 'react-router-dom';
import { CancelLoanDialog } from '../components/CancelLoanDialog';
import type { Loan } from '../types/loan';
import { useApi } from '@/shared/hooks/useApi';
import { usePersistedState } from '@/shared/hooks/usePersistedState';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling';
import { fetchLoanDetails } from '../services/loanService';

const allowedCancelStatuses = [
  'Pending',
  'Incomplete',
  'UnderReviewOfficer',
  'AwaitingApprovals',
];

export default function LoanDetailPage() {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();

  const [autoRefreshEnabled] = usePersistedState(
    'employee-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLoanDetailsHandler = useCallback(async () => {
    const loan = await fetchLoanDetails(parseInt(loanId ?? '', 10));

    return loan;
  }, [loanId]);

  const { data, loading, error, refresh, lastUpdated } = useSmartPolling(
    fetchLoanDetailsHandler,
    {
      context: 'loan-detail',
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

  const [openCancel, setOpenCancel] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const loan = data;

  const canCancel = allowedCancelStatuses.find(
    status => loan?.status === status
  );

  if (loading) {
    return <LoadingSpinner text={'Loading loan details...'} />;
  }

  if (error) {
    return <NetworkError message={error} />;
  }

  if (!loan) {
    return (
      <DataError
        title='No loan found'
        message=' The requested loan application could not be located.'
      />
    );
  }
  return (
    <div className='bg-background'>
      <div className='mx-auto space-y-8'>
        {/* Header */}
        <div className='mb-8'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate('/employee/loans')}
            className='mb-4'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Loans
          </Button>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div>
                <h1 className='text-2xl font-bold tracking-tight'>
                  Loan Application: #{loan.id}
                </h1>
                <p className='text-muted-foreground'>
                  Review your loan application details and manage required
                  documents
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

        {/* Loan Overview Card */}
        <Card className='border-border/50 shadow-sm'>
          <CardHeader className='pb-4'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div>
                <CardTitle className='text-foreground text-xl'>
                  Application Overview
                </CardTitle>
                <CardDescription>
                  Current status and loan details
                </CardDescription>
              </div>

              <LoanStatusBadge status={loan.status} />
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <PhilippinePeso className='text-primary h-5 w-5' />
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Loan Amount
                  </p>
                  <p className='text-foreground text-lg font-semibold'>
                    ₱{loan.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <Clock className='text-primary h-5 w-5' />
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Repayment Term
                  </p>
                  <p className='text-foreground text-lg font-semibold'>
                    {loan.repayment_term_months} months
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <CalendarDays className='text-primary h-5 w-5' />
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Applied On
                  </p>
                  <p className='text-foreground text-lg font-semibold'>
                    {new Date(loan.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Target className='text-primary h-4 w-4' />
                <h3 className='text-foreground font-semibold'>Loan Purpose</h3>
              </div>
              <div className='space-y-1 pl-6'>
                <p className='text-foreground font-medium'>
                  {loan.purpose_category}
                </p>
                {loan.purpose_detail && (
                  <p className='text-muted-foreground text-sm'>
                    {loan.purpose_detail}
                  </p>
                )}
              </div>
              {loan.status === 'Incomplete' && (
                <Alert className='mt-6 rounded-lg border-0 border-l-4 border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/20'>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertTitle className='font-semibold'>Incomplete</AlertTitle>
                  <AlertDescription className='text-amber-800'>
                    {loan.notes}
                  </AlertDescription>
                </Alert>
              )}

              {(loan.status === 'Cancelled' || loan.status === 'Rejected') && (
                <Alert className='rounded-lg border-0 border-l-4 border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20'>
                  <XCircle className='h-4 w-4' />
                  <AlertTitle className='font-semibold'>
                    {loan.status === 'Cancelled' ? 'Cancelled' : 'Rejected'}
                  </AlertTitle>
                  <AlertDescription className='text-red-800'>
                    {loan.notes}
                  </AlertDescription>
                </Alert>
              )}
              {canCancel && (
                <div className='flex flex-1 gap-2'>
                  <Button
                    variant='destructive'
                    onClick={() => setOpenCancel(true)}
                    disabled={actionLoading}
                    className='mt-8 flex-1'
                    size='lg'
                  >
                    {actionLoading ? (
                      <>
                        <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className='mr-2 h-4 w-4' />
                        Cancel Request
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          <CancelLoanDialog
            open={openCancel}
            onOpenChange={setOpenCancel}
            setActionLoading={setActionLoading}
            loan={loan}
            refetch={refresh}
          />
        </Card>

        {/* Document Upload Section */}
        <LoanDocumentUpload loanId={loan.id} />
      </div>
    </div>
  );
}
