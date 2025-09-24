import type {
  HRLoanPendingResponse,
  HRWithdrawalPendingResponse,
} from '../types/hrDashboardTypes';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '../../employee/utils/formatters';
import { Button } from '@/components/ui/button';

export const PendingActions = ({
  pendingLoans,
  pendingWithdrawals,
}: {
  pendingLoans: HRLoanPendingResponse[];
  pendingWithdrawals: HRWithdrawalPendingResponse[];
}) => {
  return (
    <section className='space-y-6'>
      <div className='flex items-center gap-3'>
        <Clock className='text-primary h-6 w-6' />
        <h2 className='text-2xl font-semibold'>Pending Actions</h2>
      </div>

      <Card>
        <CardContent className='p-6'>
          <Tabs defaultValue='loans' className='w-full'>
            <div className='overflow-x-auto'>
              <TabsList className='inline-flex w-max min-w-full lg:grid lg:w-full lg:grid-cols-2'>
                <TabsTrigger value='loans' className='flex items-center gap-2'>
                  Pending Loan Applications
                  <Badge variant='secondary' className='ml-1 text-xs'>
                    {pendingLoans.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value='withdrawals'
                  className='flex items-center gap-2'
                >
                  Pending Withdrawal Requests
                  <Badge variant='secondary' className='ml-1 text-xs'>
                    {pendingWithdrawals.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value='loans' className='mt-6 space-y-4'>
              <div className='max-h-96 space-y-4 overflow-y-auto'>
                {/* // TODO: Make loan items route to their loan details */}
                {pendingLoans.map((loan, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between rounded-lg border p-4'
                  >
                    <div className='space-y-1'>
                      <h4 className='font-medium'>Loan #{loan.id}</h4>
                      <div className='flex items-center gap-2'>
                        <p className='text-muted-foreground text-sm'>
                          Applied on{' '}
                          {new Date(loan.created_at).toLocaleString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </p>
                        <span className='text-muted-foreground/70 text-xs'>
                          • EMP-{loan.user_id}
                        </span>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-lg font-semibold'>
                        {formatCurrency(Number(loan.amount))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant='outline' className='w-full'>
                View All Pending Loans
                <ArrowRight className='h-4 w-4' />
              </Button>
            </TabsContent>
            <TabsContent value='withdrawals' className='mt-6 space-y-4'>
              <div className='max-h-96 space-y-4 overflow-y-auto'>
                {/* // TODO: Make withdrawal items route to their loan details */}
                {pendingWithdrawals.map((withdrawal, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between rounded-lg border p-4'
                  >
                    <div className='space-y-1'>
                      <h4 className='font-medium'>
                        Employee #{withdrawal.user_id}
                      </h4>
                      <div className='flex items-center gap-2'>
                        <p className='text-muted-foreground text-sm'>
                          Requested on{' '}
                          {new Date(withdrawal.created_at).toLocaleString(
                            'en-US',
                            {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            }
                          )}
                        </p>
                        <span className='text-muted-foreground/70 text-xs'>
                          • EMP-{withdrawal.user_id}
                        </span>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-lg font-semibold'>
                        {formatCurrency(Number(withdrawal.total_balance))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant='outline' className='w-full'>
                View All Pending Withdrawals
                <ArrowRight className='h-4 w-4' />
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
};
