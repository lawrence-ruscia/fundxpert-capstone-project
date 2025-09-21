import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  PlayCircle,
  Trophy,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import type { LoanStatus } from '../types/loan';

interface LoanStatusConfig {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  className: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  label?: string; // Optional custom label
}

const loanStatusConfig: Record<LoanStatus, LoanStatusConfig> = {
  Pending: {
    icon: Clock,
    className:
      'bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700',
    variant: 'secondary',
    label: 'Pending Review',
  },
  Approved: {
    icon: CheckCircle,
    className:
      'bg-teal-500 hover:bg-teal-600 text-white dark:bg-teal-600 dark:hover:bg-teal-700',
    variant: 'secondary',
  },
  Active: {
    icon: CheckCircle,
    className:
      'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700',
    variant: 'secondary',
  },
  Settled: {
    icon: Trophy,
    className:
      'bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700',
    variant: 'secondary',
  },
  Rejected: {
    icon: XCircle,
    className:
      'bg-rose-500 hover:bg-rose-600 text-white dark:bg-rose-600 dark:hover:bg-rose-700',
    variant: 'destructive',
  },
  Cancelled: {
    icon: MinusCircle,
    className:
      'bg-slate-500 hover:bg-slate-600 text-white dark:bg-slate-600 dark:hover:bg-slate-700',
    variant: 'outline',
  },
};

interface LoanStatusBadgeProps {
  status: LoanStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  customLabel?: string;
}

export function LoanStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  customLabel,
}: LoanStatusBadgeProps) {
  const config = loanStatusConfig[status];
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
export function LoanStatusBadgeExamples() {
  const statuses: LoanStatus[] = [
    'Pending',
    'Approved',
    'Active',
    'Settled',
    'Rejected',
    'Cancelled',
  ];

  return (
    <div className='space-y-6 p-6'>
      <div>
        <h3 className='mb-3 text-lg font-semibold'>All Loan Statuses</h3>
        <div className='flex flex-wrap gap-2'>
          {statuses.map(status => (
            <LoanStatusBadge key={status} status={status} />
          ))}
        </div>
      </div>

      <div>
        <h3 className='mb-3 text-lg font-semibold'>Without Icons</h3>
        <div className='flex flex-wrap gap-2'>
          {statuses.slice(0, 4).map(status => (
            <LoanStatusBadge key={status} status={status} showIcon={false} />
          ))}
        </div>
      </div>

      <div>
        <h3 className='mb-3 text-lg font-semibold'>Different Sizes</h3>
        <div className='flex flex-wrap items-center gap-2'>
          <LoanStatusBadge status='Active' size='sm' />
          <LoanStatusBadge status='Active' size='md' />
          <LoanStatusBadge status='Active' size='lg' />
        </div>
      </div>

      <div>
        <h3 className='mb-3 text-lg font-semibold'>Custom Labels</h3>
        <div className='flex flex-wrap gap-2'>
          <LoanStatusBadge status='Pending' customLabel='Awaiting Review' />
          <LoanStatusBadge status='Active' customLabel='Currently Active' />
          <LoanStatusBadge status='Settled' customLabel='Fully Paid' />
        </div>
      </div>
    </div>
  );
}
