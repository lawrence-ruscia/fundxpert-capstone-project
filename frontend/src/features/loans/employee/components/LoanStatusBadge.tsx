import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
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
      'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
    variant: 'outline',
    label: 'Pending',
  },
  UnderReview: {
    icon: Clock,
    className:
      'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300 dark:border-blue-800',
    variant: 'secondary',
    label: 'Under Review',
  },
  AwaitingApprovals: {
    icon: Clock,
    className:
      'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300 dark:bg-yellow-950 dark:hover:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800',
    variant: 'secondary',
    label: 'Awaiting Approvals',
  },
  Approved: {
    icon: CheckCircle,
    className:
      'bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 dark:bg-green-950 dark:hover:bg-green-900 dark:text-green-300 dark:border-green-800',
    variant: 'secondary',
    label: 'Approved',
  },
  Rejected: {
    icon: XCircle,
    className:
      'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-300 dark:border-red-800',
    variant: 'destructive',
    label: 'Rejected',
  },
  Released: {
    icon: CheckCircle,
    className:
      'bg-teal-100 hover:bg-teal-200 text-teal-700 border border-teal-300 dark:bg-teal-950 dark:hover:bg-teal-900 dark:text-teal-300 dark:border-teal-800',
    variant: 'secondary',
    label: 'Released',
  },
  Cancelled: {
    icon: MinusCircle,
    className:
      'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 dark:border-neutral-600',
    variant: 'outline',
    label: 'Cancelled',
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
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  const displayLabel = customLabel || config.label || status;

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} rounded-md font-medium transition-all duration-200`}
    >
      <div className='flex items-center gap-1.5'>
        {showIcon && <IconComponent size={iconSizes[size]} />}
        <span>{displayLabel}</span>
      </div>
    </Badge>
  );
}
