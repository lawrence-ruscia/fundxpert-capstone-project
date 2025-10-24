import useDialogState from '@/shared/hooks/useDialogState';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SignOutDialog } from './sign-out-dialog';
import { useAuth } from '@/features/auth/context/AuthContext';
import { getInitials } from '@/utils/getInitials';
import { KeyRound, LogOut, QrCode } from 'lucide-react';
import { ResetQRDialog } from './reset-qr-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';
export const hrRoles = {
  BenefitsAssistant: 'Benefits Assistant',
  BenefitsOfficer: 'Benefits Officer',
  DeptHead: 'Department Head',
  MgmtApprover: 'Management Approver',
  GeneralHR: 'General HR',
};
export function ProfileDropdown() {
  const { user, loading } = useAuth();
  const [resetOpen, setResetOpen] = useDialogState();
  const [qrOpen, setQrOpen] = useDialogState();
  const [signOutOpen, setSignOutOpen] = useDialogState();

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src='/avatars/01.png' alt='@shadcn' />
              <AvatarFallback>{getInitials(user?.name ?? '??')}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            {user && !loading && (
              <div className='flex flex-col gap-1.5'>
                <p className='text-sm leading-none font-medium'>{user?.name}</p>
                <p className='text-muted-foreground text-xs leading-none'>
                  {user?.role} | {hrRoles[user?.hr_role]}
                </p>
              </div>
            )}
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
            onClick={() => setQrOpen(true)}
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

      <ResetPasswordDialog open={!!resetOpen} onOpenChange={setResetOpen} />
      <ResetQRDialog open={!!qrOpen} onOpenChange={setQrOpen} />
      <SignOutDialog open={!!signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  );
}
