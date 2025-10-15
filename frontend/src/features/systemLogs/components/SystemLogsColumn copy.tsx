import { type ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/shared/components/DataTableColummHeader';
import { LongText } from '@/shared/components/LongText';
import { SystemLogsTableRowActions } from './SystemLogsTableRowActions';
import type { AuditLog } from '../types/audit';
import { Settings, Shield, User } from 'lucide-react';

const formatDisplayDate = (dateString: Date) => {
  return dateString.toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const formatDisplayTime = (dateString: Date) => {
  return dateString.toLocaleTimeString('en-us', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const systemLogsColumns: ColumnDef<AuditLog>[] = [
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
    accessorKey: 'timestamp',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Timestamp' />
    ),
    cell: ({ row }) => {
      const timestamp = new Date(row.getValue('timestamp'));
      return (
        <div className='flex flex-col'>
          <span className='text-sm font-medium'>
            {formatDisplayDate(timestamp)}
          </span>
          <span className='text-muted-foreground text-xs'>
            {formatDisplayTime(timestamp)}
          </span>
        </div>
      );
    },
    meta: { className: 'w-40' },
    enableSorting: true,
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
  },

  {
    accessorKey: 'actor_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Actor' />
    ),
    cell: ({ row }) => {
      const userId = row.original.user_id;
      return (
        <div className='flex items-center gap-2'>
          <div className='bg-primary/10 rounded-full p-1.5'>
            <User className='text-primary h-3 w-3' />
          </div>
          <div className='flex flex-col'>
            <span className='text-sm font-medium'>
              {row.getValue('actor_name')}
            </span>
            {userId && (
              <span className='text-muted-foreground font-mono text-xs'>
                ID: {userId}
              </span>
            )}
          </div>
        </div>
      );
    },
    meta: { className: 'w-48' },
    enableSorting: true,
  },

  {
    accessorKey: 'performed_by_role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => {
      const role = row.getValue(
        'performed_by_role'
      ) as AuditLog['performed_by_role'];

      const roleConfig = {
        Admin: {
          icon: Shield,
          className: 'border-red-200 bg-red-50 text-red-800',
        },
        HR: {
          icon: User,
          className: 'border-green-200 bg-green-50 text-green-800',
        },
        Employee: {
          icon: User,
          className: 'border-blue-200 bg-blue-50 text-blue-800',
        },
        System: {
          icon: Settings,
          className: 'border-gray-200 bg-gray-50 text-gray-800',
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
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
    cell: ({ row }) => {
      const category = row.getValue('category') as AuditLog['category'];

      const categoryConfig = {
        Auth: 'border-blue-200 bg-blue-50 text-blue-800',
        UserManagement: 'border-purple-200 bg-purple-50 text-purple-800',
        System: 'border-gray-200 bg-gray-50 text-gray-800',
      };

      return (
        <Badge variant='outline' className={cn(categoryConfig[category])}>
          {category === 'UserManagement' ? 'User Mgmt' : category}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    meta: { className: 'w-36' },
    enableSorting: true,
  },

  {
    accessorKey: 'action',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Action' />
    ),
    cell: ({ row }) => {
      return (
        <LongText className='max-w-64 text-left font-medium'>
          {row.getValue('action')}
        </LongText>
      );
    },
    meta: { className: 'w-64' },
    enableSorting: true,
  },

  {
    accessorKey: 'target_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Target ID' />
    ),
    cell: ({ row }) => {
      const targetId = row.getValue('target_id') as number | null;
      return (
        <span className='text-muted-foreground font-mono text-sm'>
          {targetId ?? 'N/A'}
        </span>
      );
    },
    meta: { className: 'w-28' },
    enableSorting: true,
  },

  {
    accessorKey: 'ip_address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='IP Address' />
    ),
    cell: ({ row }) => {
      const ipAddress = row.getValue('ip_address') as string | null;
      return (
        <span className='text-muted-foreground font-mono text-sm'>
          {ipAddress ?? 'N/A'}
        </span>
      );
    },
    meta: { className: 'w-36' },
    enableSorting: false,
  },

  {
    accessorKey: 'details',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Details' />
    ),
    cell: ({ row }) => {
      const details = row.getValue('details') as string | null;

      if (!details) {
        return <span className='text-muted-foreground text-sm'>—</span>;
      }

      return (
        <LongText className='max-w-48 text-left text-sm'>{details}</LongText>
      );
    },
    meta: {
      className: cn(
        'w-48',
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]'
      ),
    },
    enableSorting: false,
  },

  {
    id: 'actions',
    cell: SystemLogsTableRowActions,
  },
];
