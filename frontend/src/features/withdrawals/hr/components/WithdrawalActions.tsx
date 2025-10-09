import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@radix-ui/react-select';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  XCircle,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { WithdrawalAccess } from '../../employee/types/withdrawal';

export const LoanActions = ({
  can,
  actionLoading,
  loanId,
  setOpenReady,
  setOpenIncomplete,
  setOpenMoveReview,
  setOpenApprove,
  setOpenReject,
  setOpenRelease,
  setOpenCancel,
}: {
  can: (key: keyof WithdrawalAccess) => boolean;
  actionLoading: boolean;
  loanId: number;
  setOpenReady: (open: boolean) => void;
  setOpenIncomplete: (open: boolean) => void;
  setOpenMoveReview: (open: boolean) => void;
  setOpenApprove: (open: boolean) => void;
  setOpenReject: (open: boolean) => void;
  setOpenRelease: (open: boolean) => void;
  setOpenCancel: (open: boolean) => void;
}) => {
  const navigate = useNavigate();
  return (
    <div className='lg:col-span-1'>
      <Card className='sticky top-6'>
        <CardHeader>
          <CardTitle className='text-lg'>Actions</CardTitle>
          <CardDescription>
            Manage the loan's current status and process flow
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {can('canMarkReady') && (
            <Button
              onClick={() => setOpenReady(true)}
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
          {can('canMoveToReview') && (
            <Button
              onClick={() => setOpenMoveReview(true)}
              disabled={actionLoading}
              className='w-full justify-start'
            >
              <FileText className='mr-2 h-4 w-4' />
              Move to Review
            </Button>
          )}
          {can('canAssignApprovers') && (
            <Button
              onClick={() => navigate(`/hr/loans/${loanId}/review`)}
              disabled={actionLoading}
              className='w-full justify-start'
            >
              <Shield className='mr-2 h-4 w-4' />
              Assign Approvers
            </Button>
          )}
          {can('canApprove') && (
            <Button
              onClick={() => setOpenApprove(true)}
              disabled={actionLoading}
              className='w-full justify-start'
            >
              <CheckCircle2 className='mr-2 h-4 w-4' />
              Approve
            </Button>
          )}

          {can('canApprove') && (
            <Button
              variant='outline'
              onClick={() => setOpenReject(true)}
              disabled={actionLoading}
              className='text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 w-full justify-start'
            >
              <XCircle className='mr-2 h-4 w-4' />
              Reject
            </Button>
          )}
          {can('canRelease') && (
            <Button
              variant='secondary'
              onClick={() => setOpenRelease(true)}
              disabled={actionLoading}
              className='w-full justify-start'
            >
              <DollarSign className='mr-2 h-4 w-4' />
              Release Loan
            </Button>
          )}
          {can('canCancel') && (
            <>
              <Separator className='my-4' />
              <Button
                variant='destructive'
                onClick={() => setOpenCancel(true)}
                disabled={actionLoading}
                className='w-full justify-start'
              >
                <XCircle className='mr-2 h-4 w-4' />
                Cancel Loan
              </Button>
            </>
          )}
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
  );
};
