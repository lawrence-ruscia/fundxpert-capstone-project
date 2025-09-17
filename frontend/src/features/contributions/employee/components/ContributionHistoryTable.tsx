import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  getFilteredRowModel,
  type ColumnFiltersState,
  getPaginationRowModel,
} from '@tanstack/react-table';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';

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
import type { EmployeeContributionsResponse } from '../types/employeeContributions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent } from '@radix-ui/react-tabs';
import { Label } from '@/components/ui/label';
import { columns } from './Data-Columns';

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
        sortDate: new Date(`${record.month} 1, ${record.year}`),
      };
    });
  }, [validatedData.contributions]);

  // Table states
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'monthYear',
      desc: false,
    },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

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
      columnVisibility,
      columnFilters,
      pagination,
    },
  });

  return (
    <Tabs
      defaultValue='outline'
      className='flex w-full flex-col justify-start gap-6'
    >
      <TabsContent
        value='outline'
        className='relative flex flex-col gap-4 overflow-auto'
      >
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader className='sticky top-0 z-10'>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className={`px-5 ${
                          header.column.id === 'cumulative' ? 'text-right' : ''
                        }`}
                      >
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
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell className='px-5 py-3' key={cell.id}>
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
              <TableRow>
                <TableCell className='py-3 pl-8 font-semibold'>
                  Totals
                </TableCell>
                <TableCell className='px-5 py-3 font-semibold'>
                  {data.totals.employee.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className='px-5 py-3 font-semibold'>
                  {data.totals.employer.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className='px-5 py-3 font-semibold'>
                  {data.totals.vested.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className='px-5 py-3'>—</TableCell>
                <TableCell className='py-3 pr-20 text-right text-blue-500'>
                  <p className='font-bold'>
                    ₱
                    {data.totals.grand_total.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <div className='mt-0.5 text-xs text-blue-500'>
                    Grand Total
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <div className='flex items-center justify-end px-4'>
          <div className='flex w-full items-center gap-8 lg:w-fit'>
            <div className='hidden items-center gap-2 lg:flex'>
              <Label htmlFor='rows-per-page' className='text-sm font-medium'>
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={value => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className='w-20' id='rows-per-page'>
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side='top'>
                  {[10, 20, 30, 40, 50].map(pageSize => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex w-fit items-center justify-center text-sm font-medium'>
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </div>
            <div className='ml-auto flex items-center gap-2 lg:ml-0'>
              <Button
                variant='outline'
                className='hidden h-8 w-8 p-0 lg:flex'
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className='sr-only'>Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant='outline'
                className='size-8'
                size='icon'
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className='sr-only'>Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant='outline'
                className='size-8'
                size='icon'
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className='sr-only'>Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant='outline'
                className='hidden size-8 lg:flex'
                size='icon'
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className='sr-only'>Go to last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};
