import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import { useMultiFetch } from '@/shared/hooks/useMultiFetch';
import { ArrowLeft, CheckCircle2, FileText, Paperclip } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type {
  WithdrawalDocumentResponse,
  WithdrawalRequest,
} from '../../employee/types/withdrawal';
import {
  getWithdrawalById,
  getWithdrawalDocumentsHR,
  getWithdrawalHistory,
} from '../services/hrWithdrawalService';
import { WithdrawalActions } from '../components/WithdrawalActions';
import type { LoanHistory } from '@/features/loans/hr/types/hrLoanType';
import { useWithdrawalAccess } from '../hooks/useWithdrawalAccess';
import { MarkIncompleteDialog } from '../components/MarkIncompleteDialog';
import { MarkReadyDialog } from '../components/MarkReadyDialog';
import { MoveToReviewDialog } from '../components/MoveToReviewDialog';
import { ApproveWithdrawalDialog } from '../components/ApproveWithdrawalDialog';
import { RejectWithdrawalDialog } from '../components/RejectWithdrawalDialog';
import { ReleaseWithdrawalDialog } from '../components/ReleaseWithdrawalDialog';
import { CancelWithdrawalDialog } from '../components/CancelWithdrawalDialog';
import { WithdrawalStatusBadge } from '../../employee/components/WithdrawalStatusBadge';
import { WithdrawalActivityHistory } from '../components/WithdrawalActivityHistory';
import { WithdrawalSummary } from '../components/WithdrawalSummary';
import { SupportingWithdrawalDocuments } from '../components/SupportingWithdrawalDocuments';
import { VerifiedWithdrawalDocuments } from '../components/VerfiedWithdrawalDocuments';

export default function WithdrawalDetailsPage() {
  const { withdrawalId } = useParams();

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

  const { data, loading, error, refetch } = useMultiFetch<{
    request: WithdrawalRequest;
    history: LoanHistory[];
    documents: WithdrawalDocumentResponse;
  }>(async () => {
    try {
      const [withdrawalRes, historyRes, documentsRes] = await Promise.all([
        getWithdrawalById(Number(withdrawalId)),
        getWithdrawalHistory(Number(withdrawalId)),
        getWithdrawalDocumentsHR(Number(withdrawalId)),
      ]);

      return {
        request: withdrawalRes,
        history: historyRes,
        documents: documentsRes,
      };
    } catch (err) {
      console.error('❌ Error in fetch:', err);
      throw err;
    }
  }, [withdrawalId]);

  const request = data?.request;
  const history = data?.history;
  const documents = data?.documents.employeeDocuments ?? [];
  const {
    can,
    refresh: refreshAccess,
    loading: accessLoading,
  } = useWithdrawalAccess(Number(withdrawalId));

  if (loading || accessLoading)
    return <LoadingSpinner text='Loading request details...' />;

  if (!request) return <DataError message='Request not found' />;

  return (
    <div className='container px-4 pb-8'>
      {/* Header */}
      <div className='mb-8'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => navigate('/hr/withdrawals', { replace: true })}
          className='p-2'
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div className='mb-2 flex items-center justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Withdrawal Request Details
            </h1>
            <p className='text-muted-foreground'>
              Manage withdrawal details and actions for Withdrawal Request ID:{' '}
              {request.id}
            </p>
          </div>
          <WithdrawalStatusBadge status={request.status} />
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Main Content - Left Column */}
        <div className='space-y-6 lg:col-span-2'>
          {/* Loan Summary */}
          <WithdrawalSummary request={request} />

          {/* Activity History */}
          <WithdrawalActivityHistory history={history ?? []} />

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
                  <SupportingWithdrawalDocuments
                    documents={documents ?? []}
                    error={error}
                  />
                </TabsContent>

                <TabsContent value='verified' className='mt-6'>
                  <VerifiedWithdrawalDocuments withdrawalId={request.id} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <WithdrawalActions
          can={can}
          actionLoading={actionLoading}
          setOpenReady={setOpenReady}
          setOpenIncomplete={setOpenIncomplete}
          setOpenMoveReview={setOpenMoveReview}
          setOpenApprove={setOpenApprove}
          setOpenReject={setOpenReject}
          setOpenRelease={setOpenRelease}
          setOpenCancel={setOpenCancel}
        />
      </div>
      <MarkReadyDialog
        open={openReady}
        onOpenChange={setOpenReady}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        withdrawalId={Number(withdrawalId)}
        refetch={refetch}
      />

      <MarkIncompleteDialog
        open={openIncomplete}
        onOpenChange={setOpenIncomplete}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        withdrawalId={Number(withdrawalId)}
        refetch={refetch}
      />

      <MoveToReviewDialog
        open={openMoveReview}
        onOpenChange={setOpenMoveReview}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        withdrawalId={Number(withdrawalId)}
        refetch={refetch}
      />

      <ApproveWithdrawalDialog
        open={openApprove}
        onOpenChange={setOpenApprove}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        request={request}
        refetch={refetch}
      />

      <RejectWithdrawalDialog
        open={openReject}
        onOpenChange={setOpenReject}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        withdrawalId={Number(withdrawalId)}
        refetch={refetch}
      />

      <ReleaseWithdrawalDialog
        open={openRelease}
        onOpenChange={setOpenRelease}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        request={request}
        refetch={refetch}
      />

      <CancelWithdrawalDialog
        open={openCancel}
        onOpenChange={setOpenCancel}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        withdrawalId={Number(withdrawalId)}
        refetch={refetch}
      />
    </div>
  );
}
