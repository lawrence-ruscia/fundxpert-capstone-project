import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from '@/components/ui/table';
import { contributionsColumns } from '@/features/contributions/employee/components/ContributionColumns';

import { type Table as TableType, flexRender } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { DataTableToolbar } from '@/shared/components/DataTableToolbar';
import { DataTablePagination } from '@/shared/components/Pagination';
import type { User } from '@/shared/types/user';

type UsersTableProps = {
  table: TableType<User>;
};

export const UsersTable = ({ table }: UsersTableProps) => {
  return (
    <div className='space-y-4 max-sm:has-[div[role="toolbar"]]:mb-16'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Search by employee name...'
        searchKey='name'
        includeSearch={true}
        filters={[
          {
            columnId: 'role',
            title: 'Role',
            options: [
              { label: 'Employee', value: 'Employee' },
              { label: 'HR', value: 'HR' },
              { label: 'Admin', value: 'Admin' },
            ],
          },

          {
            columnId: 'hr_role',
            title: 'HR Role',
            options: [
              { label: 'Benefits Assistnat', value: 'BenefitsAssistant' },
              { label: 'Benefits Officer', value: 'BenefitsOfficer' },
              { label: 'Department Head', value: 'DeptHead' },
              { label: 'Management Approver', value: 'MgmtApprover' },
              { label: 'General HR', value: 'GeneralHR' },
            ],
          },

          {
            columnId: 'is_twofa_enabled',
            title: '2FA Enabled',
            options: [
              { label: 'Enabled', value: true },
              { label: 'Disabled', value: false },
            ],
          },

          {
            columnId: 'temp_password',
            title: 'Temporary Password',
            options: [
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ],
          },

          {
            columnId: 'created_at',
            title: 'Account Creation',
            type: 'date-range', // Add this type to distinguish from regular select filters
            options: [], // Empty since this will be a date picker
          },
        ]}
      />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        header.column.columnDef.meta?.className ?? ''
                      )}
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='group/row'
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.className ?? ''
                      )}
                    >
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
                  colSpan={contributionsColumns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
};
