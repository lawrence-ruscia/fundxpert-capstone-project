import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  AlertCircle,
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
        'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
      variant: 'outline',
      label: 'Pending',
    },
    Incomplete: {
      icon: AlertCircle,
      className:
        'bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 dark:bg-orange-950 dark:hover:bg-orange-900 dark:text-orange-300 dark:border-orange-800',
      variant: 'secondary',
      label: 'Incomplete',
    },
    UnderReviewOfficer: {
      icon: Clock,
      className:
        'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300 dark:border-blue-800',
      variant: 'secondary',
      label: 'Under Review',
    },
    Approved: {
      icon: CheckCircle,
      className:
        'bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 dark:bg-green-950 dark:hover:bg-green-900 dark:text-green-300 dark:border-green-800',
      variant: 'secondary',
      label: 'Approved',
    },
    Released: {
      icon: CheckCircle,
      className:
        'bg-teal-100 hover:bg-teal-200 text-teal-700 border border-teal-300 dark:bg-teal-950 dark:hover:bg-teal-900 dark:text-teal-300 dark:border-teal-800',
      variant: 'secondary',
      label: 'Released',
    },
    Rejected: {
      icon: XCircle,
      className:
        'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-300 dark:border-red-800',
      variant: 'destructive',
      label: 'Rejected',
    },

    Cancelled: {
      icon: MinusCircle,
      className:
        'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 dark:border-neutral-600',
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
