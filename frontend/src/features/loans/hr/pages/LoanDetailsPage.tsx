import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { useLoanAccess } from '../hooks/useLoanAccess';
import {
  getLoanById,
  getLoanApprovals,
  getLoanHistory,
  getLoanDocuments,
} from '../services/hrLoanService';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Paperclip,
  RefreshCw,
} from 'lucide-react';
import { MarkIncompleteDialog } from '../components/MarkIncompleteDialog';
import { MarkReadyDialog } from '../components/MarkReadyDialog';
import { MoveToReviewDialog } from '../components/MoveToReviewDialog';
import { ReleaseLoanDialog } from '../components/ReleaseLoanDialog';
import { CancelLoanDialog } from '../components/CancelLoanDialog';
import { ApproveLoanDialog } from '../components/ApproveLoanDialog';
import { RejectLoanDialog } from '../components/RejectLoanDialog';
import { LoanActivityHistory } from '../components/LoanActivityHistory';
import { SupportingLoanDocuments } from '../components/SupportingLoanDocuments';
import { LoanActions } from '../components/LoanActions';
import { LoanApprovalChain } from '../components/LoanApprovalChain';
import { LoanSummary } from '../components/LoanSummary';
import { VerifiedLoanDocuments } from '../components/VerfiedLoanDocuments';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling';
import { usePersistedState } from '@/shared/hooks/usePersistedState';

export default function LoanDetailsPage() {
  const { loanId } = useParams();
  const navigate = useNavigate();

  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [openIncomplete, setOpenIncomplete] = useState(false);
  const [openReady, setOpenReady] = useState(false);
  const [openMoveReview, setOpenMoveReview] = useState(false);
  const [openApprove, setOpenApprove] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [openRelease, setOpenRelease] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);

  const [autoRefreshEnabled] = usePersistedState(
    'hr-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLoanDetailsHandler = useCallback(async () => {
    const [loanRes, approvalsRes, historyRes, documentsRes] = await Promise.all(
      [
        getLoanById(Number(loanId)),
        getLoanApprovals(Number(loanId)),
        getLoanHistory(Number(loanId)),
        getLoanDocuments(Number(loanId)),
      ]
    );

    return {
      loan: loanRes,
      approvals: approvalsRes,
      history: historyRes,
      documents: documentsRes,
    };
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

  const loan = data?.loan;
  const approvals = data?.approvals;
  const history = data?.history;
  const documents = data?.documents.employeeDocuments;

  const {
    can,
    refresh: refreshAccess,
    loading: accessLoading,
  } = useLoanAccess(Number(loanId));

  if (loading || accessLoading)
    return <LoadingSpinner text='Loading loan details...' />;

  if (!loan) return <DataError message='Loan not found' />;

  return (
    <div className='container px-4 pb-8'>
      {/* Header */}
      <div className='mb-8'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => navigate('/hr/loans')}
          className='mb-4'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Loans
        </Button>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>
                Loan Details
              </h1>
              <p className='text-muted-foreground'>
                Manage loan details and actions for Loan ID: {loan.id}
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

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Main Content - Left Column */}
        <div className='space-y-6 lg:col-span-2'>
          {/* Loan Summary */}
          <LoanSummary loan={loan} />

          {/* Approval Chain */}
          <LoanApprovalChain approvals={approvals ?? []} />

          {/* Activity History */}
          <LoanActivityHistory history={history ?? []} />

          {/* Loan Documents Tabs */}
          {/* TODO: Fix responsiveness */}
          <Card>
            <CardHeader className='pb-4'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <Paperclip className='text-primary h-5 w-5' />
                </div>
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className='max-h-[600px] overflow-y-auto'>
              <Tabs defaultValue='supporting' className='w-full'>
                <div className='overflow-x-auto'>
                  <TabsList className='nline-flex w-max min-w-full'>
                    <TabsTrigger
                      value='supporting'
                      className='flex flex-shrink-0 items-center gap-2 px-3 text-sm'
                    >
                      <FileText className='h-4 w-4' />
                      Supporting Documents
                      {documents && documents.length > 0 && (
                        <span className='bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs font-medium'>
                          {documents.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value='verified'
                      className='flex flex-shrink-0 items-center gap-2 px-3 text-sm'
                    >
                      <CheckCircle2 className='h-4 w-4' />
                      Verified Documents
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value='supporting' className='mt-6'>
                  <SupportingLoanDocuments
                    documents={documents ?? []}
                    error={error}
                  />
                </TabsContent>

                <TabsContent value='verified' className='mt-6'>
                  <VerifiedLoanDocuments loanId={loan.id} can={can} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <LoanActions
          can={can}
          actionLoading={actionLoading}
          loanId={loan.id}
          setOpenReady={setOpenReady}
          setOpenIncomplete={setOpenIncomplete}
          setOpenMoveReview={setOpenMoveReview}
          setOpenApprove={setOpenApprove}
          setOpenReject={setOpenReject}
          setOpenRelease={setOpenRelease}
          setOpenCancel={setOpenCancel}
        />
      </div>
      <MarkIncompleteDialog
        open={openIncomplete}
        onOpenChange={setOpenIncomplete}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        loanId={Number(loanId)}
        refetch={refresh}
      />

      <MarkReadyDialog
        open={openReady}
        onOpenChange={setOpenReady}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        loanId={Number(loanId)}
        refetch={refresh}
      />

      <MoveToReviewDialog
        open={openMoveReview}
        onOpenChange={setOpenMoveReview}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        loanId={Number(loanId)}
        refetch={refresh}
      />

      <ApproveLoanDialog
        open={openApprove}
        onOpenChange={setOpenApprove}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        loan={loan}
        refetch={refresh}
      />

      <RejectLoanDialog
        open={openReject}
        onOpenChange={setOpenReject}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        loanId={Number(loanId)}
        refetch={refresh}
      />

      <ReleaseLoanDialog
        open={openRelease}
        onOpenChange={setOpenRelease}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        loan={loan}
        refetch={refresh}
      />

      <CancelLoanDialog
        open={openCancel}
        onOpenChange={setOpenCancel}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        loanId={Number(loanId)}
        refetch={refresh}
      />
    </div>
  );
}
