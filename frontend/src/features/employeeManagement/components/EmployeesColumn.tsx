import { type ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/shared/components/DataTableColummHeader';
import { LongText } from '@/shared/components/LongText';
import type { HREmployeeRecord } from '../types/employeeTypes';
import { DataTableRowActions } from './DataTableRowActions';
import { callTypes } from '../data/data';
import type { EmploymentStatus } from '@/features/dashboard/employee/types/employeeOverview';
import { Link } from 'react-router-dom';

const formatDisplayDate = (dateString: Date) => {
  return dateString.toLocaleDateString('en-us');
};
export const employeesColumns: ColumnDef<HREmployeeRecord>[] = [
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
    accessorKey: 'employee_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Employee Id' />
    ),
    cell: ({ row }) => (
      <Link to={`/hr/employees/${row.original.id}/contributions`}>
        <LongText className='max-w-36 ps-3'>
          {row.getValue('employee_id')}
        </LongText>
      </Link>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      return (
        <Link to={`/hr/employees/${row.original.id}/contributions`}>
          <LongText className='max-w-36'>{row.getValue('name')}</LongText>
        </Link>
      );
    },
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>{row.getValue('email')}</div>
    ),
  },
  {
    accessorKey: 'employment_status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const employment_status = row.getValue(
        'employment_status'
      ) as EmploymentStatus;
      const badgeColor = callTypes.get(employment_status);
      return (
        <div className='flex space-x-2'>
          <Badge variant='outline' className={cn('capitalize', badgeColor)}>
            {employment_status}
            {/* Fixed: use employment_status instead of 'status' */}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: 'department',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Department' />
    ),
    cell: ({ row }) => {
      return (
        <div className='flex items-center gap-x-2'>
          <span className='text-sm capitalize'>
            {row.getValue('department')}
          </span>
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
    accessorKey: 'position',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Position' />
    ),
    cell: ({ row }) => {
      return (
        <div className='flex items-center gap-x-2'>
          <span className='text-sm capitalize'>{row.getValue('position')}</span>
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
    accessorKey: 'date_hired',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Date Hired' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>
        {formatDisplayDate(new Date(row.getValue('date_hired')))}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
];
