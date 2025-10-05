import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard';
import { CheckCircle, Clock, TrendingUp, XCircle } from 'lucide-react';
import type { LoanSummary } from '../types/hrLoanType';

export const LoanStatusSummary = ({ summary }: { summary: LoanSummary[] }) => {
  const pendingCount = summary.find(s => s.status === 'Pending')?.count ?? 0;
  const incompleteCount =
    summary.find(s => s.status === 'Incomplete')?.count ?? 0;
  const underReviewCount =
    summary.find(s => s.status === 'UnderReviewOfficer')?.count ?? 0;
  const awaitingCount =
    summary.find(s => s.status === 'AwaitingApprovals')?.count ?? 0;
  const pendingNextCount =
    summary.find(s => s.status === 'PendingNextApproval')?.count ?? 0;
  const approvedCount = summary.find(s => s.status === 'Approved')?.count ?? 0;
  const releasedCount = summary.find(s => s.status === 'Released')?.count ?? 0;
  const rejectedCount = summary.find(s => s.status === 'Rejected')?.count ?? 0;
  const cancelledCount =
    summary.find(s => s.status === 'Cancelled')?.count ?? 0;

  const pendingIncompleteCount = pendingCount + incompleteCount;
  const forApprovalCount = awaitingCount + pendingNextCount;
  const rejectedCancelledCount = rejectedCount + cancelledCount;
  return (
    <Card className='mb-8'>
      <CardHeader className='mb-4 flex items-center gap-2 font-semibold'>
        <div className='bg-primary/10 rounded-lg p-2'>
          <TrendingUp className='h-5 w-5' />
        </div>
        <CardTitle className='text-lg'>Loans Status Summary</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <BalanceCard
          label='Pending / Incomplete '
          value={pendingIncompleteCount.toString()}
          icon={Clock}
          description={`Pending: ${pendingCount} | Incomplete: ${incompleteCount}`}
        />

        <BalanceCard
          label='Under HR Review'
          value={underReviewCount.toString()}
          icon={Clock}
        />

        <BalanceCard
          label='For Approval'
          value={forApprovalCount.toString()}
          icon={Clock}
          description={`Awaiting: ${awaitingCount} | Next Approval: ${pendingNextCount}`}
        />

        <BalanceCard
          label='Approved'
          value={approvedCount.toString()}
          icon={CheckCircle}
        />

        <BalanceCard
          label='Released'
          value={releasedCount.toString()}
          icon={CheckCircle}
        />

        <BalanceCard
          label='Rejected / Cancelled'
          value={rejectedCancelledCount.toString()}
          icon={XCircle}
          description={`Rejected: ${rejectedCount} | Cancelled: ${cancelledCount}`}
        />
      </CardContent>
    </Card>
  );
};
