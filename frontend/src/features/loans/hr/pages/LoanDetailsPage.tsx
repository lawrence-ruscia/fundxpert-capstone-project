import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate } from 'react-router-dom';
import { useLoanAccess } from '../hooks/useLoanAccess';
import {
  getLoanById,
  getLoanApprovals,
  getLoanHistory,
  getLoanDocuments,
} from '../services/hrLoanService';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import type {
  Loan,
  LoanDocument,
  LoanDocumentResponse,
} from '../../employee/types/loan';
import type { LoanApproval, LoanHistory } from '../types/hrLoanType';
import { useMultiFetch } from '@/shared/hooks/useMultiFetch';
import { ArrowLeft, CheckCircle2, FileText, Paperclip } from 'lucide-react';
import { LoanStatusBadge } from '../../employee/components/LoanStatusBadge';
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

  const { data, loading, error, refetch } = useMultiFetch<{
    loan: Loan;
    approvals: LoanApproval[];
    history: LoanHistory[];
    documents: LoanDocumentResponse;
  }>(async () => {
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
          onClick={() => navigate('/hr/loans', { replace: true })}
          className='p-2'
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div className='mb-2 flex items-center justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Loan Details</h1>
            <p className='text-muted-foreground'>
              Manage loan details and actions for Loan ID: {loan.id}
            </p>
          </div>
          <LoanStatusBadge status={loan.status} />
        </div>
      </div>

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
        refetch={refetch}
      />

      <MarkReadyDialog
        open={openReady}
        onOpenChange={setOpenReady}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        loanId={Number(loanId)}
        refetch={refetch}
      />

      <MoveToReviewDialog
        open={openMoveReview}
        onOpenChange={setOpenMoveReview}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        loanId={Number(loanId)}
        refetch={refetch}
      />

      <ApproveLoanDialog
        open={openApprove}
        onOpenChange={setOpenApprove}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        loan={loan}
        refetch={refetch}
      />

      <RejectLoanDialog
        open={openReject}
        onOpenChange={setOpenReject}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        loanId={Number(loanId)}
        refetch={refetch}
      />

      <ReleaseLoanDialog
        open={openRelease}
        onOpenChange={setOpenRelease}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        loan={loan}
        refetch={refetch}
      />

      <CancelLoanDialog
        open={openCancel}
        onOpenChange={setOpenCancel}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        loanId={Number(loanId)}
        refetch={refetch}
      />
    </div>
  );
}
