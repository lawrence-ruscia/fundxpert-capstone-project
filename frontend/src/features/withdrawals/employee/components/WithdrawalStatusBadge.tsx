import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  CreditCard,
} from 'lucide-react';
import type { WithdrawalStatus } from '../types/withdrawal';

interface WithdrawalStatusConfig {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  className: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  label?: string; // Optional custom label
}

const withdrawalStatusConfig: Record<WithdrawalStatus, WithdrawalStatusConfig> =
  {
    Pending: {
      icon: Clock,
      className:
        'bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700',
      variant: 'secondary',
      label: 'Under Review',
    },
    Approved: {
      icon: CheckCircle,
      className:
        'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700',
      variant: 'secondary',
      label: 'Approved',
    },
    Processed: {
      icon: CreditCard,
      className:
        'bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700',
      variant: 'secondary',
      label: 'Payment Released',
    },
    Rejected: {
      icon: XCircle,
      className:
        'bg-rose-500 hover:bg-rose-600 text-white dark:bg-rose-600 dark:hover:bg-rose-700',
      variant: 'destructive',
      label: 'Request Denied',
    },
    Cancelled: {
      icon: MinusCircle,
      className:
        'bg-slate-500 hover:bg-slate-600 text-white dark:bg-slate-600 dark:hover:bg-slate-700',
      variant: 'outline',
      label: 'Cancelled',
    },
  };

interface WithdrawalStatusBadgeProps {
  status: WithdrawalStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  customLabel?: string;
}

export function WithdrawalStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  customLabel,
}: WithdrawalStatusBadgeProps) {
  const config = withdrawalStatusConfig[status];
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  const displayLabel = customLabel || config.label || status;

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} font-semibold transition-colors`}
    >
      <div className='flex items-center gap-2'>
        {showIcon && <IconComponent size={iconSizes[size]} />}
        <span>{displayLabel}</span>
      </div>
    </Badge>
  );
}

// Usage Examples Component
export function WithdrawalStatusBadgeExamples() {
  const statuses: WithdrawalStatus[] = [
    'Pending',
    'Approved',
    'Processed',
    'Rejected',
    'Cancelled',
  ];

  return (
    <div className='space-y-6 p-6'>
      <div>
        <h3 className='mb-3 text-lg font-semibold'>All Withdrawal Statuses</h3>
        <div className='flex flex-wrap gap-2'>
          {statuses.map(status => (
            <WithdrawalStatusBadge key={status} status={status} />
          ))}
        </div>
      </div>

      <div>
        <h3 className='mb-3 text-lg font-semibold'>Without Icons</h3>
        <div className='flex flex-wrap gap-2'>
          {statuses.slice(0, 4).map(status => (
            <WithdrawalStatusBadge
              key={status}
              status={status}
              showIcon={false}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className='mb-3 text-lg font-semibold'>Different Sizes</h3>
        <div className='flex flex-wrap items-center gap-2'>
          <WithdrawalStatusBadge status='Processed' size='sm' />
          <WithdrawalStatusBadge status='Processed' size='md' />
          <WithdrawalStatusBadge status='Processed' size='lg' />
        </div>
      </div>

      <div>
        <h3 className='mb-3 text-lg font-semibold'>Custom Labels</h3>
        <div className='flex flex-wrap gap-2'>
          <WithdrawalStatusBadge
            status='Pending'
            customLabel='Awaiting HR Review'
          />
          <WithdrawalStatusBadge
            status='Approved'
            customLabel='Ready for Payment'
          />
          <WithdrawalStatusBadge
            status='Processed'
            customLabel='Funds Disbursed'
          />
          <WithdrawalStatusBadge
            status='Rejected'
            customLabel='Documentation Required'
          />
        </div>
      </div>

      <div>
        <h3 className='mb-3 text-lg font-semibold'>Contextual Usage</h3>
        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <span className='text-muted-foreground text-sm'>
              Initial submission:
            </span>
            <WithdrawalStatusBadge status='Pending' size='sm' />
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-muted-foreground text-sm'>HR approved:</span>
            <WithdrawalStatusBadge status='Approved' size='sm' />
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-muted-foreground text-sm'>
              Payment complete:
            </span>
            <WithdrawalStatusBadge status='Processed' size='sm' />
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-muted-foreground text-sm'>
              Request denied:
            </span>
            <WithdrawalStatusBadge status='Rejected' size='sm' />
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-muted-foreground text-sm'>
              User cancelled:
            </span>
            <WithdrawalStatusBadge status='Cancelled' size='sm' />
          </div>
        </div>
      </div>
    </div>
  );
}
