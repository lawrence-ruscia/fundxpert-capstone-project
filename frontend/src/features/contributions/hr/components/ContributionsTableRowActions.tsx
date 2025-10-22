import { Ellipsis, PiggyBank, User } from 'lucide-react';
import { type Row } from '@tanstack/react-table';
import { UserPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useContributions } from './ContributionsProvider.js';
import type { Contribution } from '../../shared/types/contributions.js';
import { useNavigate } from 'react-router-dom';

type DataTableRowActionsProps = {
  row: Row<Contribution>;
};

export function ContributionsTableRowActions({
  row,
}: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useContributions();
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
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original);
              setOpen('view');
              navigate(`/hr/employees/${row.original.user_id}/contributions`);
            }}
          >
            Contributions
            <DropdownMenuShortcut>
              <PiggyBank size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original);
              setOpen('edit');
              navigate(`/hr/contributions/${row.original.id}/edit`);
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
