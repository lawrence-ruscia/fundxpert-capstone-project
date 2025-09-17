import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

import type { ColumnDef } from '@tanstack/react-table';
import type { ContributionRecord } from '../types/employeeContributions';

type ContributionTableRow = ContributionRecord & {
  cumulative: number;
  monthYear: string;
  sortDate: Date;
};

// TODO:  use the correct sorting algo
export const columns: ColumnDef<ContributionTableRow>[] = [
  {
    accessorKey: 'monthYear',
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.sortDate;
      const dateB = rowB.original.sortDate;
      return dateA.getTime() - dateB.getTime();
    },
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className='h-auto p-0 font-medium hover:bg-transparent'
        >
          Month / Year
          {sorted === 'asc' ? (
            <ArrowUp className='ml-2 h-4 w-4' />
          ) : sorted === 'desc' ? (
            <ArrowDown className='ml-2 h-4 w-4' />
          ) : (
            <ArrowUpDown className='ml-2 h-4 w-4' />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className='pl-3 font-medium'>{row.getValue('monthYear')}</div>
      );
    },
    size: 140,
  },
  {
    accessorKey: 'employee',
    header: 'Employee (₱)',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('employee'));
      return (
        <div className='flex space-x-2'>
          <div className='font-medium'>
            {amount.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      );
    },
    size: 130,
  },
  {
    accessorKey: 'employer',
    header: 'Employer (₱)',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('employer'));
      return (
        <div className='flex space-x-2'>
          <div className='font-medium'>
            {amount.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      );
    },
    size: 130,
  },
  {
    accessorKey: 'vested',
    header: 'Vested (₱)',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('vested'));
      return (
        <div className='flex space-x-2'>
          <div className='font-medium'>
            {amount.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      );
    },
    size: 120,
  },
  {
    accessorKey: 'total',
    header: 'Total (₱)',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('total'));
      return (
        <div>
          <div className='font-semibold'>
            {amount.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      );
    },
    size: 120,
  },
  {
    accessorKey: 'cumulative',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className='h-auto font-medium hover:bg-transparent'
        >
          Cumulative (₱)
          {sorted === 'asc' ? (
            <ArrowUp className='ml-2 h-4 w-4' />
          ) : sorted === 'desc' ? (
            <ArrowDown className='ml-2 h-4 w-4' />
          ) : (
            <ArrowUpDown className='ml-2 h-4 w-4' />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const balance = row.getValue('cumulative') as number;
      return (
        <div className='pr-15 text-right'>
          <div className='font-bold text-blue-500'>
            ₱
            {balance.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className='mt-0.5 text-xs text-blue-500'>Running Total</div>
        </div>
      );
    },
    size: 160,
  },
];
