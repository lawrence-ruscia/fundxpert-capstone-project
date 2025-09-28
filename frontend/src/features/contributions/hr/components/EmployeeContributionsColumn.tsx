import { type ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/shared/components/DataTableColummHeader';
import { LongText } from '@/shared/components/LongText';
import { ContributionsTableRowActions } from './ContributionsTableRowActions';
import type { Contribution } from '../types/hrContribution';

const formatDisplayDate = (dateString: Date) => {
  return dateString.toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

export const contributionsColumns: ColumnDef<Contribution>[] = [
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
    accessorKey: 'contribution_date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Contribution Date' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3'>
        {formatDisplayDate(new Date(row.getValue('contribution_date')))}
      </LongText>
    ),
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

    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableSorting: true,
    enableHiding: false,
  },

  {
    accessorKey: 'employee_amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Employee Contribution' />
    ),
    cell: ({ row }) => {
      return (
        <LongText className='max-w-36 text-right font-medium'>
          {formatCurrency(row.getValue('employee_amount'))}
        </LongText>
      );
    },
    meta: { className: 'w-36' },
    enableSorting: false,
  },
  {
    accessorKey: 'employer_amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Employer Contribution' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-right font-medium text-nowrap'>
        {formatCurrency(row.getValue('employer_amount'))}
      </div>
    ),
    enableSorting: false,
  },
  {
    id: 'total_contribution',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total Contribution' />
    ),
    cell: ({ row }) => {
      const employeeAmount = row.getValue('employee_amount') as number;
      const employerAmount = row.getValue('employer_amount') as number;
      const total = employeeAmount + employerAmount;

      return (
        <div className='flex space-x-2'>
          <div className='text-right font-semibold text-blue-500'>
            {formatCurrency(total)}
          </div>
        </div>
      );
    },
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: 'is_adjusted',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const isAdjusted = Boolean(row.getValue('is_adjusted'));
      const badgeColor = isAdjusted
        ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
        : 'border-green-200 bg-green-50 text-green-800';

      return (
        <div className='flex items-center gap-x-2'>
          <Badge variant='outline' className={cn('capitalize', badgeColor)}>
            {isAdjusted ? 'Adjusted' : 'Original'}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'notes',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Notes' />
    ),
    cell: ({ row }) => {
      const notes = row.getValue('notes') as string;
      return (
        <div className='flex items-center gap-x-2'>
          <span className='text-muted-foreground max-w-48 truncate text-sm'>
            {notes || '-'}
          </span>
        </div>
      );
    },

    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'actions',
    cell: ContributionsTableRowActions,
  },
];
