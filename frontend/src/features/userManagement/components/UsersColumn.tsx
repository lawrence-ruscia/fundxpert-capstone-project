import { type ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/shared/components/DataTableColummHeader';
import { LongText } from '@/shared/components/LongText';
import type { HRRole, User } from '@/shared/types/user';
import { UsersTableRowActions } from './UsersTableRowActions';
import { Shield, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HRRoleBadge } from '@/features/dashboard/hr/components/HRRoleBadge';

const formatDisplayDate = (dateString: Date) => {
  return dateString.toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

export const usersColumns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => <div className='w-[8px]'> </div>,
    meta: {
      className: cn('sticky md:table-cell start-0 z-10 rounded-tl-[inherit]'),
    },
    cell: ({ row }) => <div className='w-[8px]'></div>,
    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='ID' />
    ),
    cell: ({ row }) => {
      return (
        <LongText className='max-w-36 text-left font-medium'>
          {row.getValue('id')}
        </LongText>
      );
    },
    meta: {
      className: cn(
        'w-36',
        'sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: 'employee_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Employee ID' />
    ),
    cell: ({ row }) => {
      return (
        <Link to={`/admin/users/${row.original.id}`}>
          <LongText className='max-w-36 text-left font-medium'>
            {row.getValue('employee_id') || (
              <span className='text-muted-foreground italic'>N/A</span>
            )}
          </LongText>
        </Link>
      );
    },
    meta: { className: 'w-36' },
    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Full Name' />
    ),
    cell: ({ row }) => {
      return (
        <Link to={`/admin/users/${row.original.id}`}>
          <LongText className='max-w-36 text-left font-medium'>
            {row.getValue('name')}
          </LongText>
        </Link>
      );
    },
    meta: { className: 'w-48' },
    enableSorting: true,
  },

  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email Address' />
    ),
    cell: ({ row }) => {
      return (
        <LongText className='max-w-48 text-left font-medium'>
          {row.getValue('email')}
        </LongText>
      );
    },
    meta: { className: 'w-56' },
    enableSorting: true,
  },

  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => {
      const role = row.getValue('role') as string;
      const roleConfig = {
        Admin: {
          icon: Shield,
          className: 'border-red-200 bg-red-50 text-red-800 font-semibold',
        },
        HR: {
          icon: UserIcon,
          className:
            'border-green-200 bg-green-50 text-green-800 font-semibold',
        },
        Employee: {
          icon: UserIcon,
          className: 'border-blue-200 bg-blue-50 text-blue-800 font-semibold',
        },
      };
      const config = roleConfig[role];
      const Icon = config.icon;

      return (
        <Badge variant='outline' className={cn('gap-1', config.className)}>
          <Icon className='h-3 w-3' />
          {role}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    meta: { className: 'w-32' },
    enableSorting: true,
  },

  {
    accessorKey: 'hr_role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='HR Role' />
    ),
    cell: ({ row }) => {
      const hrRole = row.getValue('hr_role') as string | null;
      const userRole = row.getValue('role') as string;

      // Only show HR role badge if user is HR and has an HR role assigned
      if (userRole !== 'HR' || !hrRole) {
        return <span className='text-muted-foreground text-xs'>—</span>;
      }

      return <HRRoleBadge hrRole={hrRole as HRRole} size='xs' />;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    meta: { className: 'w-40' },
    enableSorting: true,
  },

  {
    accessorKey: 'department',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Department' />
    ),
    cell: ({ row }) => {
      return (
        <LongText className='max-w-36 text-left font-medium'>
          {row.getValue('department') || 'Unassigned'}
        </LongText>
      );
    },
    meta: { className: 'w-48' },
    enableSorting: true,
  },

  {
    accessorKey: 'position',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Position' />
    ),
    cell: ({ row }) => {
      return (
        <LongText className='max-w-36 text-left font-medium'>
          {row.getValue('position') || 'Unassigned'}
        </LongText>
      );
    },
    meta: { className: 'w-48' },
    enableSorting: true,
  },

  {
    id: 'account_status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Account Status' />
    ),
    cell: ({ row }) => {
      const user = row.original;
      const status = getAccountStatus(user);

      const badgeColor =
        status === 'LOCKED'
          ? 'border-red-200 bg-red-50 text-red-800'
          : status === 'AT RISK'
            ? 'border-orange-200 bg-orange-50 text-orange-800'
            : status === 'TEMP PASSWORD'
              ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
              : status === 'PASSWORD EXPIRED'
                ? 'border-purple-200 bg-purple-50 text-purple-800'
                : status === 'READ-ONLY'
                  ? 'border-blue-200 bg-blue-50 text-blue-800'
                  : status === 'DEACTIVATED'
                    ? 'border-gray-300 bg-gray-100 text-gray-600'
                    : 'border-green-200 bg-green-50 text-green-800';

      return (
        <Badge variant='outline' className={cn('capitalize', badgeColor)}>
          {status}
        </Badge>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: 'failed_attempts',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Failed Attempts' />
    ),
    cell: ({ row }) => {
      const attempts = row.getValue('failed_attempts') as number;
      const textColor = attempts >= 3 ? 'text-red-600 font-bold' : '';

      return (
        <div className={cn('text-center font-medium', textColor)}>
          {attempts}
        </div>
      );
    },
    meta: { className: 'w-32' },
    enableSorting: true,
  },

  {
    accessorKey: 'is_twofa_enabled',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='2FA Status' />
    ),
    cell: ({ row }) => {
      const isEnabled = Boolean(row.getValue('is_twofa_enabled'));
      const badgeColor = isEnabled
        ? 'border-green-200 bg-green-50 text-green-800'
        : 'border-yellow-200 bg-yellow-50 text-yellow-800';

      return (
        <Badge variant='outline' className={cn('capitalize', badgeColor)}>
          {isEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    meta: { className: 'w-32' },
    enableSorting: false,
  },

  {
    accessorKey: 'temp_password',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Temp Password' />
    ),
    cell: ({ row }) => {
      const isTemp = Boolean(row.getValue('temp_password'));
      const badgeColor = isTemp
        ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
        : 'border-gray-200 bg-gray-50 text-gray-800';

      return (
        <Badge variant='outline' className={cn('capitalize', badgeColor)}>
          {isTemp ? 'Yes' : 'No'}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    meta: { className: 'w-32' },
    enableSorting: false,
  },

  {
    accessorKey: 'password_last_changed',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Last Password Change' />
    ),
    cell: ({ row }) => {
      const lastChange = row.getValue('password_last_changed') as string | null;

      return (
        <LongText className='max-w-36 ps-3'>
          {lastChange
            ? formatDisplayDate(new Date(lastChange))
            : 'Never Changed'}
        </LongText>
      );
    },
    meta: { className: 'w-40' },
    enableSorting: true,
  },

  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Account Created' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3'>
        {formatDisplayDate(new Date(row.getValue('created_at')))}
      </LongText>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]'
      ),
    },
    filterFn: (row, id, value) => {
      const contributionDate = new Date(row.getValue(id) as string);

      const formattedDate = formatDisplayDate(contributionDate);

      // Handle date range filter (object with start/end)
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const { start, end } = value;
        const rowDate = new Date(
          contributionDate.getFullYear(),
          contributionDate.getMonth(),
          contributionDate.getDate()
        );

        if (start && end) {
          const startDate = new Date(start);
          const endDate = new Date(end);
          const result = rowDate >= startDate && rowDate <= endDate;

          return result;
        } else if (start) {
          const startDate = new Date(start);
          return rowDate >= startDate;
        } else if (end) {
          const endDate = new Date(end);
          return rowDate <= endDate;
        }
        return true;
      }

      // Handle year-based filters from dropdown
      if (/^\d{4}$/.test(value)) {
        return contributionDate.getFullYear().toString() === value;
      }

      // Handle quarterly filters (e.g., "2024-q1", "2023-q3")
      if (/^\d{4}-q[1-4]$/.test(value)) {
        const [year, quarter] = value.split('-q');
        const contributionYear = contributionDate.getFullYear().toString();
        const contributionMonth = contributionDate.getMonth() + 1; // getMonth() returns 0-11

        if (contributionYear !== year) return false;

        switch (quarter) {
          case '1':
            return contributionMonth >= 1 && contributionMonth <= 3;
          case '2':
            return contributionMonth >= 4 && contributionMonth <= 6;
          case '3':
            return contributionMonth >= 7 && contributionMonth <= 9;
          case '4':
            return contributionMonth >= 10 && contributionMonth <= 12;
          default:
            return false;
        }
      }
      // Handle text search - search in formatted date display
      // Users can search: "Sept", "September", "2025", "Sept 2025", etc.
      return formattedDate.toLowerCase().includes(value.toLowerCase());
    },
    enableSorting: true,
  },

  {
    id: 'actions',
    cell: UsersTableRowActions,
  },
];

// Helper function - same as in export
function getAccountStatus(user: User): string {
  // 1️. Employment-based restrictions first
  if (['Terminated', 'Resigned'].includes(user.employment_status)) {
    return 'DEACTIVATED';
  }

  if (user.employment_status === 'Retired') {
    return 'READ-ONLY';
  }

  // 2. System flags (take precedence for active users)
  if (user.locked_until) {
    return 'LOCKED';
  }

  if (user.password_expired) {
    return 'PASSWORD EXPIRED';
  }

  if (user.temp_password) {
    return 'TEMP PASSWORD';
  }

  if (user.failed_attempts >= 3) {
    return 'AT RISK';
  }

  // 3️. Default
  return 'ACTIVE';
}
