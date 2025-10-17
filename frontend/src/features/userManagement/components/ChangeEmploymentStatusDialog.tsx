import { useState } from 'react';
import { toast } from 'sonner';
import {
  Briefcase,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
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
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import type { EmploymentStatus } from '@/features/dashboard/employee/types/employeeOverview';

interface ChangeEmploymentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setActionLoading: (loading: boolean) => void;
  userId: number;
  userName?: string;
  employeeId?: string;
  currentStatus: EmploymentStatus;
  refresh: () => Promise<void>;
}

const EMPLOYMENT_STATUS_INFO = {
  Active: {
    label: 'Active',
    description:
      'The employee is currently employed and in good standing with the company.',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    access: [
      'Full system access',
      'Can apply for loans, withdrawals, and update personal info',
      'Included in all HR and payroll processes',
      'All features and transactions enabled',
    ],
    impact: 'normal',
  },
  Resigned: {
    label: 'Resigned',
    description: 'The employee has voluntarily left the company.',
    icon: XCircle,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    access: [
      'Account automatically locked — cannot log in or transact',
      'Data retained for auditing and compliance purposes',
      'All system access immediately revoked',
      'Profile preserved for legal and audit requirements',
    ],
    impact: 'critical',
  },
  Retired: {
    label: 'Retired',
    description: 'The employee has completed service and retired officially.',
    icon: Clock,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    access: [
      'Read-only access to view records',
      'Can view contributions and withdrawal history',
      'Cannot apply for new loans or withdrawals',
      'Limited to viewing personal historical data',
    ],
    impact: 'moderate',
  },
  Terminated: {
    label: 'Terminated',
    description:
      "The employee's employment was involuntarily ended by the company (e.g., disciplinary or redundancy).",
    icon: XCircle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    access: [
      'Account automatically locked — cannot log in or transact',
      'Data retained for auditing and compliance purposes',
      'All system access immediately revoked',
      'Profile preserved for legal and audit requirements',
    ],
    impact: 'critical',
  },
};

export function ChangeEmploymentStatusDialog({
  open,
  onOpenChange,
  setActionLoading,
  userId,
  userName,
  employeeId,
  currentStatus,
  refresh,
}: ChangeEmploymentStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<EmploymentStatus>(currentStatus);

  const handleChangeStatus = async () => {
    if (selectedStatus === currentStatus) {
      toast.info(
        'No changes made. The employment status is already set to this value.'
      );
      onOpenChange(false);
      return;
    }

    try {
      onOpenChange(false);
      setActionLoading(true);

      await updateUser(userId, { employment_status: selectedStatus });
      await refresh();

      setActionLoading(false);

      toast.success(
        `${userName || 'User'}'s employment status has been changed from ${currentStatus} to ${selectedStatus}. Access rights have been updated accordingly.`
      );
    } catch (err) {
      setActionLoading(false);
      console.error('❌ Change employment status failed:', err);
      toast.error(getErrorMessage(err, 'Failed to change employment status.'));
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset to current status when dialog closes
      setSelectedStatus(currentStatus);
    }
    onOpenChange(isOpen);
  };

  const isStatusChanged = selectedStatus !== currentStatus;
  const selectedStatusInfo = EMPLOYMENT_STATUS_INFO[selectedStatus];
  const StatusIcon = selectedStatusInfo.icon;

  // Determine alert severity
  const getAlertVariant = () => {
    if (!isStatusChanged) return 'default';
    if (selectedStatusInfo.impact === 'critical') return 'destructive';
    return 'default';
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={handleOpenChange}
      handleConfirm={handleChangeStatus}
      disabled={!isStatusChanged}
      title={
        <span className='flex items-center gap-2'>
          <Briefcase className='me-1 inline-block' size={18} />
          Change Employment Status?
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            Change the employment status for{' '}
            <strong>{userName ?? 'this user'}</strong>
            {employeeId && (
              <>
                {' '}
                (<code className='text-sm'>{employeeId}</code>)
              </>
            )}
            . This will modify their access rights and system permissions.
          </p>

          <div className='space-y-2'>
            <Label htmlFor='employment-status'>Select New Status:</Label>
            <Select
              value={selectedStatus}
              onValueChange={value =>
                setSelectedStatus(value as EmploymentStatus)
              }
            >
              <SelectTrigger className='w-full' id='employment-status'>
                <SelectValue placeholder='Select employment status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Active'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-600' />
                    Active
                  </div>
                </SelectItem>
                <SelectItem value='Resigned'>
                  <div className='flex items-center gap-2'>
                    <XCircle className='h-4 w-4 text-orange-600' />
                    Resigned
                  </div>
                </SelectItem>
                <SelectItem value='Retired'>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-blue-600' />
                    Retired
                  </div>
                </SelectItem>
                <SelectItem value='Terminated'>
                  <div className='flex items-center gap-2'>
                    <XCircle className='h-4 w-4 text-red-600' />
                    Terminated
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Information Card */}
          <div
            className={`rounded-lg border p-4 ${selectedStatusInfo.bgColor}/30`}
          >
            <div className='mb-2 flex items-center gap-2'>
              <StatusIcon
                className={`h-5 w-5 ${selectedStatusInfo.iconColor}`}
              />
              <h4 className='font-semibold'>{selectedStatusInfo.label}</h4>
            </div>
            <p className='text-muted-foreground mb-3 text-sm'>
              {selectedStatusInfo.description}
            </p>
            <div className='space-y-1'>
              <p className='text-sm font-medium'>Access & Permissions:</p>
              <ul className='text-muted-foreground list-inside list-disc space-y-1 text-xs'>
                {selectedStatusInfo.access.map((access, idx) => (
                  <li key={idx}>{access}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Status Change Summary */}
          {isStatusChanged && (
            <div className='rounded-lg border bg-blue-50 p-3 dark:bg-blue-900/20'>
              <div className='flex items-start gap-2 text-sm'>
                <div className='flex-1'>
                  <p className='font-medium text-blue-900 dark:text-blue-100'>
                    Status Change Summary
                  </p>
                  <p className='mt-1 text-xs text-blue-700 dark:text-blue-300'>
                    From: <span className='font-semibold'>{currentStatus}</span>{' '}
                    → To:{' '}
                    <span className='font-semibold'>{selectedStatus}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning Alert */}
          <Alert
            variant={getAlertVariant()}
            className={`rounded-lg border-0 border-l-4 ${
              selectedStatusInfo.impact === 'critical'
                ? 'border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20'
                : selectedStatusInfo.impact === 'high'
                  ? 'border-orange-500 bg-orange-50 text-orange-800 dark:bg-orange-900/20'
                  : 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/20'
            }`}
          >
            <AlertTriangle className='h-4 w-4' />
            <AlertTitle className='font-semibold'>Important</AlertTitle>
            <AlertDescription>
              <ul className='mt-2 list-inside list-disc space-y-1 text-sm'>
                <li>Status changes take effect immediately</li>
                {(selectedStatus === 'Resigned' ||
                  selectedStatus === 'Terminated') && (
                  <>
                    <li className='font-semibold'>
                      ⚠️ User will be immediately logged out from all sessions
                    </li>
                    <li className='font-semibold'>
                      ⚠️ All system access will be revoked
                    </li>
                  </>
                )}
                {selectedStatus === 'Retired' && (
                  <li>
                    User will have read-only access to their historical data
                  </li>
                )}
                {selectedStatus === 'Active' && currentStatus !== 'Active' && (
                  <li className='font-semibold'>
                    ✓ User will regain full system access
                  </li>
                )}
                <li>This action will be logged in the audit trail</li>
                <li>
                  Ensure proper offboarding/onboarding procedures are followed
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {!isStatusChanged && (
            <p className='text-muted-foreground text-sm italic'>
              Please select a different status to proceed.
            </p>
          )}
        </div>
      }
      confirmText='Change Status'
    />
  );
}
