import { type ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { DataTableColumnHeader } from '@/shared/components/DataTableColummHeader';
import { LongText } from '@/shared/components/LongText';
import type { Loan } from '../../employee/types/loan';
import { LoanTableRowActions } from './LoansTableRowActions';
import { LoanStatusBadge } from '../../employee/components/LoanStatusBadge';

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

export const loansDataColumns: ColumnDef<Loan>[] = [
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
        'w-16',
        'sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableSorting: false,
  },

  {
    accessorKey: 'employee_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Employee ID' />
    ),
    cell: ({ row }) => {
      return (
        <LongText className='max-w-36 text-left font-medium'>
          {row.getValue('employee_id')}
        </LongText>
      );
    },
    meta: { className: 'w-36' },
    enableSorting: false,
  },

  {
    accessorKey: 'employee_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Employee Name' />
    ),
    cell: ({ row }) => {
      return (
        <LongText className='max-w-36 text-left font-medium'>
          {row.getValue('employee_name')}
        </LongText>
      );
    },
    meta: { className: 'w-48' },
    enableSorting: true,
  },

  {
    accessorKey: 'purpose_category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Purpose' />
    ),
    cell: ({ row }) => {
      return (
        <LongText className='max-w-36 text-left font-medium'>
          {row.getValue('purpose_category')}
        </LongText>
      );
    },
    meta: { className: 'w-36' },
    enableSorting: false,
  },

  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Amount' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-left font-medium text-nowrap'>
        {formatCurrency(row.getValue('amount'))}
      </div>
    ),
    enableSorting: false,
  },

  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Date Applied' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3'>
        {formatDisplayDate(new Date(row.getValue('created_at')))}
      </LongText>
    ),
    filterFn: (row, id, value) => {
      const createdAt = new Date(row.getValue(id) as string);

      const formattedDate = formatDisplayDate(createdAt);

      // Handle date range filter (object with start/end)
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const { start, end } = value;
        const rowDate = new Date(
          createdAt.getFullYear(),
          createdAt.getMonth(),
          createdAt.getDate()
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
        return createdAt.getFullYear().toString() === value;
      }

      // Handle quarterly filters (e.g., "2024-q1", "2023-q3")
      if (/^\d{4}-q[1-4]$/.test(value)) {
        const [year, quarter] = value.split('-q');
        const contributionYear = createdAt.getFullYear().toString();
        const contributionMonth = createdAt.getMonth() + 1; // getMonth() returns 0-11

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
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]'
      ),
    },
    enableSorting: true,
    enableHiding: false,
  },

  {
    accessorKey: 'officer_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='HR Officer' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-left font-medium text-nowrap'>
        {row.getValue('officer_name') ?? '-'}
      </div>
    ),
    enableSorting: true,
  },

  {
    accessorKey: 'updated_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Last Updated' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3'>
        {formatDisplayDate(new Date(row.getValue('updated_at')))}
      </LongText>
    ),
    filterFn: (row, id, value) => {
      const updatedAt = new Date(row.getValue(id) as string);

      const formattedDate = formatDisplayDate(updatedAt);

      // Handle date range filter (object with start/end)
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const { start, end } = value;
        const rowDate = new Date(
          updatedAt.getFullYear(),
          updatedAt.getMonth(),
          updatedAt.getDate()
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
        return updatedAt.getFullYear().toString() === value;
      }

      // Handle quarterly filters (e.g., "2024-q1", "2023-q3")
      if (/^\d{4}-q[1-4]$/.test(value)) {
        const [year, quarter] = value.split('-q');
        const contributionYear = updatedAt.getFullYear().toString();
        const contributionMonth = updatedAt.getMonth() + 1; // getMonth() returns 0-11

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
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]'
      ),
    },
    enableSorting: true,
    enableHiding: false,
  },

  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      return (
        <div className='flex items-center gap-x-2'>
          <LoanStatusBadge
            status={row.getValue('status')}
            showIcon={false}
            size='sm'
          />
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
    id: 'actions',
    cell: LoanTableRowActions,
  },
];
