import { useState } from 'react';
import { toast } from 'sonner';
import { Shield, UserCog, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { updateUser } from '../services/usersManagementService';
import { type Role } from '@/shared/types/user';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setActionLoading: (loading: boolean) => void;
  userId: number;
  userName?: string;
  employeeId?: string;
  currentRole: Role;
  refresh: () => Promise<void>;
}

const ROLE_DESCRIPTIONS = {
  Employee: {
    label: 'Employee',
    description: 'Standard employee access with basic permissions',
    permissions: [
      'View own profile and information',
      'Submit leave requests and time-off',
      'Access employee self-service features',
      'View own payroll and benefits',
    ],
  },
  HR: {
    label: 'HR',
    description: 'Human Resources staff with elevated permissions',
    permissions: [
      'View and manage all employee records',
      'Approve/reject leave requests',
      'Access payroll and benefits data',
      'Generate HR reports and analytics',
      'Manage employee onboarding/offboarding',
    ],
  },
  Admin: {
    label: 'System Admin',
    description: 'Full system administrator access',
    permissions: [
      'All HR permissions',
      'Manage user accounts and roles',
      'Configure system settings',
      'Access audit logs and security features',
      'Manage departments and positions',
      'Full administrative control',
    ],
  },
};

export function ChangeRoleDialog({
  open,
  onOpenChange,
  setActionLoading,
  userId,
  userName,
  employeeId,
  currentRole,
  refresh,
}: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole);

  const handleChangeRole = async () => {
    if (selectedRole === currentRole) {
      toast.info('No changes made. The role is already set to this value.');
      onOpenChange(false);
      return;
    }

    try {
      onOpenChange(false);
      setActionLoading(true);

      await updateUser(userId, { role: selectedRole });
      await refresh();

      setActionLoading(false);

      toast.success(
        `${userName || 'User'}'s role has been changed from ${currentRole} to ${selectedRole}. They may need to log out and back in for changes to take effect.`
      );
    } catch (err) {
      setActionLoading(false);
      console.error(err);
      toast.error(
        (err as Error).message ||
          'Failed to change user role. Please try again or contact system support.'
      );
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset to current role when dialog closes
      setSelectedRole(currentRole);
    }
    onOpenChange(isOpen);
  };

  const isRoleChanged = selectedRole !== currentRole;
  const selectedRoleInfo = ROLE_DESCRIPTIONS[selectedRole];

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={handleOpenChange}
      handleConfirm={handleChangeRole}
      disabled={!isRoleChanged}
      title={
        <span className='flex items-center gap-2'>
          <UserCog className='me-1 inline-block' size={18} />
          Change User Role?
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            Change the role for <strong>{userName ?? 'this user'}</strong>
            {employeeId && (
              <>
                {' '}
                (<code className='text-sm'>{employeeId}</code>)
              </>
            )}
            . This will modify their access permissions and capabilities within
            the system.
          </p>

          <div className='space-y-2'>
            <Label htmlFor='role'>Select New Role:</Label>
            <Select
              value={selectedRole}
              onValueChange={value => setSelectedRole(value as Role)}
            >
              <SelectTrigger className='w-full' id='role'>
                <SelectValue placeholder='Select a role' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Employee'>
                  <div className='flex items-center gap-2'>
                    <Shield className='h-4 w-4 text-blue-500' />
                    Employee
                  </div>
                </SelectItem>
                <SelectItem value='HR'>
                  <div className='flex items-center gap-2'>
                    <Shield className='h-4 w-4 text-purple-500' />
                    HR
                  </div>
                </SelectItem>
                <SelectItem value='Admin'>
                  <div className='flex items-center gap-2'>
                    <Shield className='h-4 w-4 text-red-500' />
                    System Admin
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Role Information Card */}
          <div className='bg-muted/50 rounded-lg border p-4'>
            <div className='mb-2 flex items-center gap-2'>
              <Shield className='text-primary h-4 w-4' />
              <h4 className='font-semibold'>{selectedRoleInfo.label}</h4>
            </div>
            <p className='text-muted-foreground mb-3 text-sm'>
              {selectedRoleInfo.description}
            </p>
            <div className='space-y-1'>
              <p className='text-sm font-medium'>Permissions:</p>
              <ul className='text-muted-foreground list-inside list-disc space-y-1 text-xs'>
                {selectedRoleInfo.permissions.map((permission, idx) => (
                  <li key={idx}>{permission}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Current vs New Role Comparison */}
          {isRoleChanged && (
            <div className='rounded-lg border bg-blue-50 p-3 dark:bg-blue-900/20'>
              <div className='flex items-start gap-2 text-sm'>
                <div className='flex-1'>
                  <p className='font-medium text-blue-900 dark:text-blue-100'>
                    Role Change Summary
                  </p>
                  <p className='mt-1 text-xs text-blue-700 dark:text-blue-300'>
                    From: <span className='font-semibold'>{currentRole}</span> →
                    To: <span className='font-semibold'>{selectedRole}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <Alert className='rounded-lg border-0 border-l-4 border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/20'>
            <AlertTriangle className='h-4 w-4' />
            <AlertTitle className='font-semibold'>Important</AlertTitle>
            <AlertDescription className='text-amber-800'>
              <ul className='mt-2 list-inside list-disc space-y-1 text-sm'>
                <li>Role changes take effect immediately</li>
                <li>The user may need to log out and back in</li>
                <li>
                  Existing sessions may retain old permissions until refresh
                </li>
                <li>
                  Ensure the user should have access to the new role's features
                </li>
                {selectedRole === 'Admin' && (
                  <li className='font-semibold'>
                    ⚠️ Admin role grants full system access
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>

          {!isRoleChanged && (
            <p className='text-muted-foreground text-sm italic'>
              Please select a different role to proceed.
            </p>
          )}
        </div>
      }
      confirmText='Change Role'
    />
  );
}
