import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import {
  CheckCircle,
  Calendar,
  TrendingUp,
  CreditCard,
  Clock,
  Eye,
  XCircle,
  Briefcase,
  FileText,
  Heart,
  LogOut,
  Shield,
  UserCheck,
  Users,
  Wallet,
  Info,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import type {
  WithdrawalRequest,
  WithdrawalStatus,
  WithdrawalType,
} from '../types/withdrawal';
import { WithdrawalStatusBadge } from './WithdrawalStatusBadge';

export function WithdrawalItem({
  withdrawal,
}: {
  withdrawal: WithdrawalRequest;
}) {
  const getStatusIcon = (status: WithdrawalStatus) => {
    switch (status) {
      case 'Approved':
      case 'Processed':
        return <CheckCircle className='h-5 w-5' />;
      case 'Rejected':
      case 'Cancelled':
        return <XCircle className='h-5 w-5' />;
      case 'Pending':
      default:
        return <Clock className='h-5 w-5' />;
    }
  };

  const getWithdrawalTypeIcon = (type: WithdrawalType) => {
    switch (type) {
      case 'Retirement':
        return <UserCheck className='h-4 w-4' />;
      case 'Resignation':
        return <LogOut className='h-4 w-4' />;
      case 'Redundancy':
        return <Briefcase className='h-4 w-4' />;
      case 'Disability':
        return <Heart className='h-4 w-4' />;
      case 'Death':
        return <Users className='h-4 w-4' />;
      default:
        return <FileText className='h-4 w-4' />;
    }
  };

  return (
    <Card className='group from-background via-background to-muted/20 relative overflow-hidden border-0 bg-gradient-to-br shadow-md transition-all duration-300'>
      {/* Subtle accent border */}
      <div className='from-primary/5 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300' />

      <CardHeader className='relative pb-4'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex items-center gap-4'>
            {/* Enhanced icon container */}
            <div className='bg-primary/10 ring-primary/20 group-hover:bg-primary/15 flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-colors'>
              {getStatusIcon(withdrawal.status)}
            </div>

            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <h3 className='text-xl font-semibold tracking-tight'>
                  Withdrawal #{withdrawal.id}
                </h3>
              </div>
              <div className='text-muted-foreground flex items-center gap-1 text-sm'>
                <Calendar className='h-4 w-4' />
                <span>
                  Requested:{' '}
                  {new Date(withdrawal.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          <WithdrawalStatusBadge size='sm' status={withdrawal.status} />
        </div>
      </CardHeader>

      <CardContent className='relative space-y-6'>
        {/* Key metrics cards */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {/* Payout Amount */}
          <div className='group/card bg-card/50 hover:bg-card/80 relative overflow-hidden rounded-lg border p-4 transition-colors'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <p className='text-muted-foreground text-sm font-medium'>
                  Payout Amount
                </p>
                <p className='text-2xl font-bold tracking-tight'>
                  {formatCurrency(
                    Number(withdrawal.payout_amount.toLocaleString())
                  )}
                </p>
              </div>
              <div className='rounded-full bg-green-100 p-2 dark:bg-green-900/20'>
                <TrendingUp className='h-4 w-4 text-green-600 dark:text-green-400' />
              </div>
            </div>
          </div>

          {/* Vested Amount */}
          <div className='group/card bg-card/50 hover:bg-card/80 relative overflow-hidden rounded-lg border p-4 transition-colors'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <p className='text-muted-foreground text-sm font-medium'>
                  Vested Amount
                </p>
                <p className='text-2xl font-bold tracking-tight'>
                  {formatCurrency(
                    Number(withdrawal.vested_amount.toLocaleString())
                  )}
                </p>
              </div>
              <div className='rounded-full bg-blue-100 p-2 dark:bg-blue-900/20'>
                <Shield className='h-4 w-4 text-blue-600 dark:text-blue-400' />
              </div>
            </div>
          </div>

          {/* Total Balance */}
          <div className='group/card bg-card/50 hover:bg-card/80 relative overflow-hidden rounded-lg border p-4 transition-colors'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <p className='text-muted-foreground text-sm font-medium'>
                  Total Balance
                </p>
                <p className='text-2xl font-bold tracking-tight'>
                  {formatCurrency(
                    Number(withdrawal.total_balance.toLocaleString())
                  )}
                </p>
              </div>
              <div className='rounded-full bg-purple-100 p-2 dark:bg-purple-900/20'>
                <Wallet className='h-4 w-4 text-purple-600 dark:text-purple-400' />
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Type Section */}
        <div className='bg-muted/30 rounded-lg border p-4'>
          <div className='flex items-start gap-3'>
            <div className='bg-muted/30 rounded-md p-1.5'>
              {getWithdrawalTypeIcon(withdrawal.request_type)}
            </div>
            <div className='flex-1 space-y-2'>
              <div className='flex items-center gap-2'>
                <h4 className='font-medium'>Withdrawal Type</h4>
                <Badge variant='secondary' className='text-xs'>
                  {withdrawal.request_type}
                </Badge>
              </div>
              {withdrawal.purpose_detail && (
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {withdrawal.purpose_detail}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Beneficiary Information (for Death withdrawals) */}
        {withdrawal.request_type === 'Death' && withdrawal.beneficiary_name && (
          <div className='bg-muted/30 rounded-lg border p-4'>
            <div className='flex items-start gap-3'>
              <div className='bg-muted/30 rounded-md p-1.5'>
                <Users className='h-4 w-4' />
              </div>
              <div className='flex-1 space-y-2'>
                <h4 className='font-medium'>Beneficiary Information</h4>
                <div className='space-y-1 text-sm'>
                  <p>
                    <span className='font-medium'>Name:</span>{' '}
                    {withdrawal.beneficiary_name}
                  </p>
                  {withdrawal.beneficiary_relationship && (
                    <p>
                      <span className='font-medium'>Relationship:</span>{' '}
                      {withdrawal.beneficiary_relationship}
                    </p>
                  )}
                  {withdrawal.beneficiary_contact && (
                    <p>
                      <span className='font-medium'>Contact:</span>{' '}
                      {withdrawal.beneficiary_contact}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Reference (if processed) */}
        {withdrawal.payment_reference && (
          <div className='bg-muted/30 rounded-lg border p-4'>
            <div className='flex items-start gap-3'>
              <div className='bg-muted/30 rounded-md p-1.5'>
                <CreditCard className='h-4 w-4' />
              </div>
              <div className='flex-1 space-y-2'>
                <h4 className='font-medium'>Payment Reference</h4>
                <p className='text-muted-foreground font-mono text-sm'>
                  {withdrawal.payment_reference}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Processing Dates */}
        {(withdrawal.reviewed_at || withdrawal.processed_at) && (
          <div className='grid gap-4 sm:grid-cols-2'>
            {withdrawal.reviewed_at && (
              <div className='space-y-1'>
                <p className='text-muted-foreground text-sm font-medium'>
                  Reviewed Date
                </p>
                <p className='text-sm'>
                  {new Date(withdrawal.reviewed_at).toLocaleDateString(
                    'en-US',
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }
                  )}
                </p>
              </div>
            )}
            {withdrawal.processed_at && (
              <div className='space-y-1'>
                <p className='text-muted-foreground text-sm font-medium'>
                  Processed Date
                </p>
                <p className='text-sm'>
                  {new Date(withdrawal.processed_at).toLocaleDateString(
                    'en-US',
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className='pt-2'>
          <Button
            variant='default'
            size='lg'
            className='bg-primary/90 hover:bg-primary hover:shadow-primary/20 w-full transition-all duration-200 hover:shadow-md'
          >
            <Link
              className='flex items-center gap-2'
              to={`/dashboard/withdrawals/${withdrawal.id}`}
            >
              <Eye className='mr-2 h-4 w-4' />
              View Withdrawal Details
            </Link>
          </Button>
        </div>

        {/* Status-specific alerts */}
        {withdrawal.status === 'Pending' && (
          <Alert className='rounded-lg border-0 border-l-4 border-yellow-500 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20'>
            <Clock className='h-4 w-4' />
            <AlertTitle className='font-semibold'>Pending Review</AlertTitle>
            <AlertDescription className='text-yellow-800'>
              Your withdrawal request is being reviewed by HR/Admin
            </AlertDescription>
          </Alert>
        )}

        {withdrawal.status === 'Approved' && (
          <Alert className='rounded-lg border-0 border-l-6 border-blue-500 bg-blue-600/10 text-blue-500'>
            <Info className='h-4 w-4 text-blue-500' />
            <AlertTitle className='font-semibold text-blue-500'>
              Approved - Pending Release
            </AlertTitle>

            <AlertDescription className='text-blue-500 dark:text-blue-700'>
              Your withdrawal has been approved and is being processed for
              payment
            </AlertDescription>
          </Alert>
        )}

        {withdrawal.status === 'Processed' && (
          <Alert className='rounded-lg border-0 border-l-4 border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20'>
            <CheckCircle className='h-4 w-4' />
            <AlertTitle className='font-semibold'>Payment Released</AlertTitle>
            <AlertDescription className='text-green-800'>
              Your withdrawal has been successfully processed and paid out
            </AlertDescription>
          </Alert>
        )}

        {withdrawal.status === 'Rejected' && (
          <Alert className='rounded-lg border-0 border-l-4 border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20'>
            <XCircle className='h-4 w-4' />
            <AlertTitle className='font-semibold'>Request Rejected</AlertTitle>
            <AlertDescription className='text-red-800'>
              {withdrawal.notes ||
                'Your withdrawal request has been rejected. Contact HR for more information.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Notes from admin */}
        {withdrawal.notes && withdrawal.status !== 'Rejected' && (
          <div className='bg-muted/30 rounded-lg border p-4'>
            <div className='flex items-start gap-3'>
              <div className='bg-muted/30 rounded-md p-1.5'>
                <FileText className='h-4 w-4' />
              </div>
              <div className='flex-1 space-y-2'>
                <h4 className='font-medium'>Admin Notes</h4>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {withdrawal.notes}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
