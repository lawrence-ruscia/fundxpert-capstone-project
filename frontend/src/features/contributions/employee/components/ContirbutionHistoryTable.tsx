import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  getFilteredRowModel,
  type ColumnFiltersState,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMemo, useState } from 'react';
import type {
  ContributionRecord,
  EmployeeContributionsResponse,
} from '../types/employeeContributions';

// Zod schemas for type validation
const ContributionPeriodSchema = z.enum(['3m', '6m', '1y', 'all', 'year']);

const ContributionRecordSchema = z.object({
  month: z.string(),
  year: z.string(),
  employee: z.number(),
  employer: z.number(),
  vested: z.number(),
  total: z.number(),
});

const ContributionTotalsSchema = z.object({
  employee: z.number(),
  employer: z.number(),
  vested: z.number(),
  grand_total: z.number(),
});

const EmployeeContributionsResponseSchema = z.object({
  period: ContributionPeriodSchema.optional(),
  contributions: z.array(ContributionRecordSchema),
  totals: ContributionTotalsSchema,
});

// Extended type for table rows with cumulative calculation
type ContributionTableRow = ContributionRecord & {
  cumulative: number;
  monthYear: string;
};

interface ContributionHistoryTableProps {
  data: EmployeeContributionsResponse;
}

export const ContributionHistoryTable = ({
  data,
}: ContributionHistoryTableProps) => {
  // Validate data with Zod
  const validatedData = useMemo(() => {
    try {
      return EmployeeContributionsResponseSchema.parse(data);
    } catch (error) {
      console.error('Invalid contribution data:', error);
      return {
        contributions: [],
        totals: { employee: 0, employer: 0, vested: 0, grand_total: 0 },
      };
    }
  }, [data]);

  // Transform data with cumulative calculation
  const tableData = useMemo(() => {
    let cumulative = 0;
    return validatedData.contributions.map(record => {
      cumulative += record.total;
      return {
        ...record,
        cumulative,
        monthYear: `${record.month} ${record.year}`,
      };
    });
  }, [validatedData.contributions]);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Column definitions
  const columns: ColumnDef<ContributionTableRow>[] = [
    {
      accessorKey: 'monthYear',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className='h-auto p-0 font-semibold'
        >
          Month / Year
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => (
        <div className='font-medium'>{row.getValue('monthYear')}</div>
      ),
    },
    {
      accessorKey: 'employee',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className='h-auto justify-end p-0 font-semibold'
        >
          Employee (₱)
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('employee'));
        return <div className='text-right'>{amount.toLocaleString()}</div>;
      },
    },
    {
      accessorKey: 'employer',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className='h-auto justify-end p-0 font-semibold'
        >
          Employer (₱)
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('employer'));
        return <div className='text-right'>{amount.toLocaleString()}</div>;
      },
    },
    {
      accessorKey: 'vested',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className='h-auto justify-end p-0 font-semibold'
        >
          Vested (₱)
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('vested'));
        return <div className='text-right'>{amount.toLocaleString()}</div>;
      },
    },
    {
      accessorKey: 'total',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className='h-auto justify-end p-0 font-semibold'
        >
          Total (₱)
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('total'));
        return (
          <div className='text-right font-medium'>
            {amount.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'cumulative',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className='h-auto justify-end p-0 font-semibold'
        >
          Cumulative (₱)
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('cumulative'));
        return (
          <div className='text-right font-medium text-blue-600'>
            {amount.toLocaleString()}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
  });

  return (
    <div className='w-full'>
      <div className='flex items-center space-x-2 py-4'>
        <Input
          placeholder='Filter months...'
          value={
            (table.getColumn('monthYear')?.getFilterValue() as string) ?? ''
          }
          onChange={event =>
            table.getColumn('monthYear')?.setFilterValue(event.target.value)
          }
          className='max-w-sm'
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='ml-auto'>
              Columns <ChevronDown className='ml-2 h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {table
              .getAllColumns()
              .filter(column => column.getCanHide())
              .map(column => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className='capitalize'
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id} className='text-left'>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='hover:bg-muted/50'
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow className='bg-muted/50'>
              <TableCell className='font-semibold'>Totals</TableCell>
              <TableCell className='text-right font-semibold'>
                {validatedData.totals.employee.toLocaleString()}
              </TableCell>
              <TableCell className='text-right font-semibold'>
                {validatedData.totals.employer.toLocaleString()}
              </TableCell>
              <TableCell className='text-right font-semibold'>
                {validatedData.totals.vested.toLocaleString()}
              </TableCell>
              <TableCell className='text-right font-semibold'>—</TableCell>
              <TableCell className='text-right font-semibold text-blue-600'>
                {validatedData.totals.grand_total.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <div className='flex items-center justify-end space-x-2 py-4'>
        <div className='text-muted-foreground flex-1 text-sm'>
          {table.getFilteredRowModel().rows.length} of{' '}
          {table.getCoreRowModel().rows.length} contribution(s)
        </div>
        <div className='space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
