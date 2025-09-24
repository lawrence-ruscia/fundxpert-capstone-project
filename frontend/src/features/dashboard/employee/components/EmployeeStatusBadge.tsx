import { Badge } from '@/components/ui/badge';
import { BadgeCheck, UserMinus, Shield, UserX } from 'lucide-react';
import type { EmploymentStatus } from '../types/employeeOverview';

interface EmploymentStatusConfig {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  className: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}

const employmentStatusConfig: Record<EmploymentStatus, EmploymentStatusConfig> =
  {
    Active: {
      icon: BadgeCheck,
      className:
        'bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700',
      variant: 'secondary',
    },
    Resigned: {
      icon: UserMinus,
      className:
        'bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700',
      variant: 'secondary',
    },
    Retired: {
      icon: Shield,
      className:
        'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700',
      variant: 'secondary',
    },
    Terminated: {
      icon: UserX,
      className:
        'bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700',
      variant: 'destructive',
    },

    
  };

interface EmploymentStatusBadgeProps {
  status: EmploymentStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function EmploymentStatusBadge({
  status,
  size = 'md',
  showIcon = true,
}: EmploymentStatusBadgeProps) {
  const config = employmentStatusConfig[status];
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} font-semibold transition-colors`}
    >
      <div className='flex items-center gap-2'>
        {showIcon && <IconComponent size={iconSizes[size]} />}
        <span>{status}</span>
      </div>
    </Badge>
  );
}
