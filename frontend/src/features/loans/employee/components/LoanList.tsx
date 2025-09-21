import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CreditCard, Activity } from 'lucide-react';
import type { Loan } from '../types/loan';
import { ActiveLoanItem } from './ActiveLoanItem';
import { HistoryLoanItem } from './HistoryLoanItem';
import { History } from 'lucide-react';

export function LoansList({ loans }: { loans: Loan[] }) {
  const activeLoans =
    loans?.filter(
      loan => loan.status === 'Active' || loan.status === 'Approved'
    ) || [];
  const loanHistory =
    loans?.filter(
      loan =>
        loan.status === 'Settled' ||
        loan.status === 'Rejected' ||
        loan.status === 'Pending' ||
        loan.status === 'Approved' ||
        loan.status === 'Cancelled'
    ) || [];

  if (!loans || loans.length === 0) {
    return (
      <div className='space-y-6'>
        <Card className='border-0 shadow-lg'>
          <CardHeader className='pb-4 text-center'>
            <div className='bg-muted mx-auto flex h-16 w-16 items-center justify-center rounded-full'>
              <CreditCard className='text-muted-foreground h-8 w-8' />
            </div>
            <CardTitle className='text-2xl font-bold'>No Loans Yet</CardTitle>
            <CardDescription className='text-muted-foreground'>
              You haven't applied for any loans. Get started by applying for
              your first loan.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-3 text-xl font-bold'>
            <div className='rounded-lg p-2'>
              <Activity className='h-5 w-5' />
            </div>
            Active Loan
          </CardTitle>
          <CardDescription>Your current active loan</CardDescription>
        </CardHeader>
        <CardContent>
          {activeLoans.length === 0 ? (
            <div className='py-8 text-center'>
              <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl'>
                <Activity className='h-6 w-6' />
              </div>
              <p className='font-medium'>No active loans</p>
              <p className='mt-1 text-sm'>
                Apply for a new loan to get started
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {activeLoans.map(loan => (
                <ActiveLoanItem key={loan.id} loan={loan} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-3 text-xl'>
            <div className='rounded-lg p-2'>
              <History className='h-5 w-5' />
            </div>
            Loan History
          </CardTitle>
          <CardDescription>
            View your past loan applications and completed loans
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loanHistory.length === 0 ? (
            <div className='py-8 text-center'>
              <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl'>
                <History className='0 h-6 w-6' />
              </div>
              <p className='font-medium'>No loan history</p>
              <p className='mt-1 text-sm'>
                Your completed and past applications will appear here
              </p>
            </div>
          ) : (
            <Tabs defaultValue='all' className='w-full'>
              <div className='mb-6 overflow-x-auto'>
                <TabsList className='inline-flex w-max min-w-full lg:grid lg:w-full lg:grid-cols-6'>
                  <TabsTrigger
                    value='all'
                    className='flex-shrink-0 px-3 text-xs sm:text-sm'
                  >
                    All ({loanHistory.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value='settled'
                    className='flex-shrink-0 px-3 text-xs sm:text-sm'
                  >
                    Settled (
                    {loanHistory.filter(l => l.status === 'Settled').length})
                  </TabsTrigger>
                  <TabsTrigger
                    value='pending'
                    className='flex-shrink-0 px-3 text-xs sm:text-sm'
                  >
                    Pending (
                    {loanHistory.filter(l => l.status === 'Pending').length})
                  </TabsTrigger>
                  <TabsTrigger
                    value='approved'
                    className='flex-shrink-0 px-3 text-xs sm:text-sm'
                  >
                    Approved (
                    {loanHistory.filter(l => l.status === 'Approved').length})
                  </TabsTrigger>
                  <TabsTrigger
                    value='rejected'
                    className='flex-shrink-0 px-3 text-xs sm:text-sm'
                  >
                    Rejected (
                    {loanHistory.filter(l => l.status === 'Rejected').length})
                  </TabsTrigger>
                  <TabsTrigger
                    value='cancelled'
                    className='flex-shrink-0 px-3 text-xs sm:text-sm'
                  >
                    Cancelled (
                    {loanHistory.filter(l => l.status === 'Cancelled').length})
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value='all' className='space-y-3'>
                {loanHistory.map(loan => (
                  <HistoryLoanItem key={loan.id} loan={loan} />
                ))}
              </TabsContent>

              <TabsContent value='settled' className='space-y-3'>
                {loanHistory
                  .filter(l => l.status === 'Settled')
                  .map(loan => (
                    <HistoryLoanItem key={loan.id} loan={loan} />
                  ))}
              </TabsContent>

              <TabsContent value='pending' className='space-y-3'>
                {loanHistory
                  .filter(l => l.status === 'Pending')
                  .map(loan => (
                    <HistoryLoanItem key={loan.id} loan={loan} />
                  ))}
              </TabsContent>

              <TabsContent value='approved' className='space-y-3'>
                {loanHistory
                  .filter(l => l.status === 'Approved')
                  .map(loan => (
                    <HistoryLoanItem key={loan.id} loan={loan} />
                  ))}
              </TabsContent>

              <TabsContent value='rejected' className='space-y-3'>
                {loanHistory
                  .filter(l => l.status === 'Rejected')
                  .map(loan => (
                    <HistoryLoanItem key={loan.id} loan={loan} />
                  ))}
              </TabsContent>
              <TabsContent value='cancelled' className='space-y-3'>
                {loanHistory
                  .filter(l => l.status === 'Cancelled')
                  .map(loan => (
                    <HistoryLoanItem key={loan.id} loan={loan} />
                  ))}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
