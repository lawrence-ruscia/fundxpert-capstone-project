import { ChevronsUpDown, Key, KeyRound, LogOut, QrCode } from 'lucide-react';
import useDialogState from '@/shared/hooks/useDialogState';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { SignOutDialog } from './sign-out-dialog';
import { getInitials } from '@/utils/getInitials';
import { ResetQRDialog } from './reset-qr-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';
import { hrRoles } from './profile-dropdown';
import type { HRRole } from '../types/user';

type NavUserProps = {
  user: {
    id: number;
    name: string;
    role: 'Employee' | 'HR' | 'Admin';
    hr_role: HRRole;
  };
};

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const [resetOpen, setResetOpen] = useDialogState();
  const [qrOpen, setQROpen] = useDialogState();
  const [signOutOpen, setSignOutOpen] = useDialogState();

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <Avatar className='h-8 w-8 rounded-lg'>
                  {/*  // TODO: Add avatar image persistence */}
                  {/* <AvatarImage src={user.avatar} alt={user.name} /> */}
                  <AvatarFallback className='rounded-lg'>
                    {getInitials(user?.name ?? '')}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold'>{user.name}</span>
                  <span className='truncate text-xs'>
                    {user.role} | {hrRoles[user?.hr_role]}
                  </span>
                </div>
                <ChevronsUpDown className='ms-auto size-4' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={4}
            >
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-start text-sm'>
                  <Avatar className='h-8 w-8 rounded-lg'>
                    {/* <AvatarImage src={user.avatar} alt={user.name} /> */}
                    <AvatarFallback className='rounded-lg'>
                      {getInitials(user?.name ?? '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-start text-sm leading-tight'>
                    <span className='truncate font-semibold'>{user.name}</span>
                    <span className='truncate text-xs'>
                      {user.role} | {hrRoles[user?.hr_role]}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='cursor-pointer'
                onClick={() => setResetOpen(true)}
              >
                <KeyRound />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='cursor-pointer'
                onClick={() => setQROpen(true)}
              >
                <QrCode />
                Reset QR / Re-bind 2FA
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='cursor-pointer'
                onClick={() => setSignOutOpen(true)}
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Attach dialogs */}
      <ResetPasswordDialog open={!!resetOpen} onOpenChange={setResetOpen} />
      <ResetQRDialog open={!!qrOpen} onOpenChange={setQROpen} />
      <SignOutDialog open={!!signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  );
}
