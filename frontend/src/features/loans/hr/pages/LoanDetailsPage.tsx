import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Separator } from '@radix-ui/react-select';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate } from 'react-router-dom';
import { useLoanAccess } from '../hooks/useLoanAccess';
import {
  getLoanById,
  getLoanApprovals,
  getLoanHistory,
  markLoanReady,
  markLoanIncomplete,
  moveLoanToReview,
  cancelLoanRequest,
  getLoanDocuments,
} from '../services/hrLoanService';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import type { Loan, LoanDocument } from '../../employee/types/loan';
import type { LoanApproval, LoanHistory } from '../types/hrLoanType';
import { useMultiFetch } from '@/shared/hooks/useMultiFetch';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  FileText,
  History,
  Paperclip,
  Shield,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { LoanStatusBadge } from '../../employee/components/LoanStatusBadge';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { MarkIncompleteDialog } from '../components/MarkIncompleteDialog';

export default function LoanDetailsPage() {
  const { loanId } = useParams();
  const navigate = useNavigate();

  const [actionLoading, setActionLoading] = useState(false);
  const [openIncomplete, setOpenIncomplete] = useState(false);

  const { data, loading, error, refetch } = useMultiFetch<{
    loan: Loan;
    approvals: LoanApproval[];
    history: LoanHistory[];
    documents: LoanDocument[];
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
  const documents = data?.documents;

  const {
    can,
    access,
    refresh: refreshAccess,
    loading: accessLoading,
  } = useLoanAccess(Number(loanId));

  // --- Action Handlers ---
  const handleMarkReady = async () => {
    try {
      setActionLoading(true);
      await markLoanReady(Number(loanId));
      await refreshAccess();
      setActionLoading(false);
      toast.success(
        `Loan #${loanId} marked as ready for review. The HR Officer has been notified.`
      );
      refetch();
    } catch (err) {
      console.error(err);
      toast.error(
        (err as Error).message ??
          'Failed to mark loan as ready. Please try again or contact system support'
      );
      refetch();
    }
  };

  const handleMoveToReview = async () => {
    setActionLoading(true);
    await moveLoanToReview(Number(loanId));
    await refreshAccess();
    setActionLoading(false);
  };

  const handleCancelLoan = async () => {
    if (!confirm('Are you sure you want to cancel this loan?')) return;
    setActionLoading(true);
    await cancelLoanRequest(Number(loanId));
    navigate('/hr/loans');
  };

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
          <Card>
            <CardHeader className='pb-4'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <FileText className='text-primary h-5 w-5' />
                </div>
                Loan Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {/* Employee Information */}
                <div className='space-y-4'>
                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <User className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Employee
                      </span>
                    </div>
                    <p className='text-base font-semibold'>
                      {loan.employee_name}
                    </p>
                  </div>

                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <User className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Employee ID
                      </span>
                    </div>
                    <p className='font-mono text-base'>{loan.employee_id}</p>
                  </div>

                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <FileText className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Purpose
                      </span>
                    </div>
                    <p className='text-base'>{loan.purpose_category}</p>
                  </div>
                </div>

                {/* Loan Details */}
                <div className='space-y-4'>
                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <DollarSign className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Loan Amount
                      </span>
                    </div>
                    <p className='text-2xl font-bold'>
                      {formatCurrency(Number(loan.amount))}
                    </p>
                  </div>

                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <Calendar className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Repayment Term
                      </span>
                    </div>
                    <p className='text-base font-semibold'>
                      {loan.repayment_term_months} months
                    </p>
                  </div>

                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <AlertCircle className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground text-sm font-medium'>
                        Current Status
                      </span>
                    </div>
                    <LoanStatusBadge status={loan.status} size='sm' />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Chain */}
          <Card>
            <CardHeader className='pb-4'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <Shield className='text-primary h-5 w-5' />
                </div>
                Approval Chain
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!approvals || approvals.length === 0 ? (
                <div className='py-8 text-center'>
                  <Shield className='text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-50' />
                  <p className='text-muted-foreground text-sm'>
                    No approvers assigned yet.
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {approvals.map((approval, index) => (
                    <div
                      key={approval.id}
                      className='hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors'
                    >
                      <div className='flex items-center gap-4'>
                        <div className='bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold'>
                          {approval.sequence_order}
                        </div>
                        <div>
                          <p className='font-medium'>
                            {approval.approver_name || 'Unknown Approver'}
                          </p>
                          {approval.approver_email && (
                            <p className='text-muted-foreground text-xs'>
                              {approval.approver_email}
                            </p>
                          )}
                          {approval.reviewed_at && (
                            <p className='text-muted-foreground mt-1 text-xs'>
                              Reviewed:{' '}
                              {new Date(
                                approval.reviewed_at
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        {approval.is_current && (
                          <Badge variant='outline' className='text-xs'>
                            Current
                          </Badge>
                        )}
                        <div className='flex items-center gap-2'>
                          <LoanStatusBadge status={approval.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity History */}
          <Card>
            <CardHeader className='pb-4'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <History className='text-primary h-5 w-5' />
                </div>
                Activity History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!history || history.length === 0 ? (
                <div className='py-8 text-center'>
                  <History className='text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-50' />
                  <p className='text-muted-foreground text-sm'>
                    No activity recorded yet.
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {history.map((item, index) => (
                    <div
                      key={item.id}
                      className='relative border-l-2 pb-4 pl-6 last:border-l-0 last:pb-0'
                    >
                      <div className='bg-primary border-background absolute top-0 left-0 h-3 w-3 -translate-x-1/2 rounded-full border-2' />
                      <div className='space-y-1'>
                        <p className='text-base font-medium'>{item.action}</p>
                        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                          <span>{item.actor_name || 'Unknown'}</span>
                          <span>•</span>
                          <span>
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                        {item.comments && (
                          <p className='text-muted-foreground mt-2 text-sm italic'>
                            "{item.comments}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loan Documents */}
          <Card className='w-full'>
            <CardHeader>
              <div className='flex items-center space-x-2'>
                <Paperclip className='text-primary h-5 w-5' />
                <CardTitle className='text-lg font-semibold'>
                  Supporting Documents
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className='space-y-6'>
              {error && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Documents List */}
              {documents && documents?.length > 0 && (
                <div className='space-y-4'>
                  <Separator />
                  <div className='space-y-3'>
                    <h4 className='text-foreground text-sm font-medium'>
                      Uploaded Documents ({documents?.length})
                    </h4>
                    <div className='space-y-2'>
                      {documents?.map(doc => (
                        <div
                          key={doc.id}
                          className='bg-muted/30 flex items-center justify-between rounded-lg border p-3'
                        >
                          <div className='flex min-w-0 flex-1 items-center space-x-3'>
                            <div className='flex min-w-0 flex-1 items-center gap-3'>
                              <div className='bg-background border-border/50 rounded border p-2'>
                                <FileText className='text-muted-foreground h-4 w-4' />
                              </div>
                              <div className='min-w-0 flex-1'>
                                <a
                                  className='truncate font-medium'
                                  href={doc.file_url}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  title='Download document'
                                >
                                  {doc.file_name}
                                </a>
                              </div>

                              <div className='hidden flex-shrink-0 items-center sm:flex'>
                                <p className='text-muted-foreground mr-1 text-xs whitespace-nowrap'>
                                  {new Date(doc.uploaded_at).toLocaleDateString(
                                    'en-US',
                                    {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className='flex items-center space-x-1'>
                            <Button
                              variant='ghost'
                              size='sm'
                              asChild
                              className='h-8 w-8 p-0'
                            >
                              <a
                                href={doc.file_url}
                                target='_blank'
                                rel='noopener noreferrer'
                                title='Download document'
                              >
                                <Download className='h-4 w-4' />
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {documents?.length === 0 && (
                <div className='py-6 text-center'>
                  <FileText className='text-muted-foreground/50 mx-auto mb-3 h-12 w-12' />
                  <p className='text-muted-foreground text-sm'>
                    No documents uploaded yet
                  </p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    Upload your first document to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <div className='lg:col-span-1'>
          <Card className='sticky top-6'>
            <CardHeader>
              <CardTitle className='text-lg'>Actions</CardTitle>
              <CardDescription>
                Manage the loan's current status and process flow.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {can('canMarkReady') && (
                <Button
                  onClick={handleMarkReady}
                  disabled={actionLoading}
                  className='w-full justify-start'
                >
                  <CheckCircle2 className='mr-2 h-4 w-4' />
                  Mark Ready
                </Button>
              )}

              {can('canMarkIncomplete') && (
                <Button
                  variant='outline'
                  onClick={() => setOpenIncomplete(true)}
                  disabled={actionLoading}
                  className='w-full justify-start'
                >
                  <AlertCircle className='mr-2 h-4 w-4' />
                  Mark Incomplete
                </Button>
              )}

              {
                /**can('canMoveToReview') &&**/ <Button
                  onClick={handleMoveToReview}
                  disabled={actionLoading}
                  className='w-full justify-start'
                >
                  <FileText className='mr-2 h-4 w-4' />
                  Move to Review
                </Button>
              }

              {
                /**can('canAssignApprovers') && **/ <Button
                  onClick={() => navigate(`/hr/loans/${loan.id}/review`)}
                  disabled={actionLoading}
                  className='w-full justify-start'
                >
                  <Shield className='mr-2 h-4 w-4' />
                  Assign Approvers
                </Button>
              }

              {
                /**can('canApprove') && **/ <Button
                  onClick={() => navigate(`/hr/loans/${loan.id}/approval`)}
                  disabled={actionLoading}
                  className='w-full justify-start'
                >
                  <CheckCircle2 className='mr-2 h-4 w-4' />
                  Approve / Reject
                </Button>
              }

              {
                /** can('canRelease') && **/ <Button
                  variant='secondary'
                  onClick={() => navigate(`/hr/loans/${loan.id}/release`)}
                  disabled={actionLoading}
                  className='w-full justify-start'
                >
                  <DollarSign className='mr-2 h-4 w-4' />
                  Release Loan
                </Button>
              }

              {
                /** can('canCancel') && **/ <>
                  <Separator className='my-4' />
                  <Button
                    variant='destructive'
                    onClick={handleCancelLoan}
                    disabled={actionLoading}
                    className='w-full justify-start'
                  >
                    <XCircle className='mr-2 h-4 w-4' />
                    Cancel Loan
                  </Button>
                </>
              }

              {!can('canMarkReady') &&
                !can('canMarkIncomplete') &&
                !can('canMoveToReview') &&
                !can('canAssignApprovers') &&
                !can('canApprove') &&
                !can('canRelease') &&
                !can('canCancel') && (
                  <div className='py-6 text-center'>
                    <p className='text-muted-foreground text-sm'>
                      No actions available for this loan at the moment.
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
      <MarkIncompleteDialog
        open={openIncomplete}
        onOpenChange={setOpenIncomplete}
        setActionLoading={setActionLoading}
        refreshAccess={refreshAccess}
        loanId={Number(loanId)}
        refetch={refetch}
      />
    </div>
  );
}
