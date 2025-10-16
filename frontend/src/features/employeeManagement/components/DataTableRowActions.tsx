import { Ellipsis, User } from 'lucide-react';
import { type Row } from '@tanstack/react-table';
import { Trash2, UserPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEmployees } from './EmployeesProvider.js';
import type { HREmployeeRecord } from '../types/employeeTypes';
import { useNavigate } from 'react-router-dom';

type DataTableRowActionsProps = {
  row: Row<HREmployeeRecord>;
};

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useEmployees();
  const navigate = useNavigate();
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
          >
            <Ellipsis className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          {/* <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original);
              setOpen('view');
              navigate(`/hr/employees/${row.original.id}/contributions`);
            }}
          >
            View
            <DropdownMenuShortcut>
              <User size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator /> */}
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original);
              setOpen('edit');
              navigate(`/hr/employees/${row.original.id}`);
            }}
          >
            Edit
            <DropdownMenuShortcut>
              <UserPen size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
