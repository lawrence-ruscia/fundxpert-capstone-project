import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { LoanStatusBadge } from '../../employee/components/LoanStatusBadge';
import type { LoanApproval } from '../types/hrLoanType';
import { Badge } from '@/components/ui/badge';

export const LoanApprovalChain = ({
  approvals,
}: {
  approvals: LoanApproval[];
}) => {
  return (
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
                className='hover:bg-muted/50 flex max-h-96 items-center justify-between overflow-y-auto rounded-lg border p-4 transition-colors'
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
                        {new Date(approval.reviewed_at).toLocaleDateString()}
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
  );
};
