import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { toast } from 'sonner';
import type { HREmployeeRecord } from '../types/employeeTypes';
import { deleteEmployeeById, getEmployeeById } from '../services/hrService';
import { useApi } from '@/shared/hooks/useApi';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import { useNavigate } from 'react-router-dom';

type UserDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: number;
};

export function EmployeeDeleteDialog({
  open,
  onOpenChange,
  id,
}: UserDeleteDialogProps) {
  const [value, setValue] = useState('');
  const navigate = useNavigate();
  const {
    data: employee,
    loading,
    error,
  } = useApi<HREmployeeRecord>(() => getEmployeeById(id));

  if (loading) {
    return <LoadingSpinner text='Loading employee data....' />;
  }

  if (error) {
    return <DataError />;
  }

  const handleDelete = () => {
    try {
      if (value.trim() !== employee?.email) return;

      const res = deleteEmployeeById(id);
      onOpenChange(false);
      toast.success(`Employee ${employee.employee_id} has been deleted`);
      navigate('/hr/employees', { replace: true });
    } catch (err) {
      console.error('Failed to delete employee', (err as Error).message);
      toast.error('Failed to delete employee');
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== employee?.email}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          Delete Employee
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Are you sure you want to delete EMP:{' '}
            <span className='font-bold'>{employee?.employee_id}</span>?
            <br />
            This action will permanently remove the employee with the email of{' '}
            <span className='font-bold'>{employee?.email}</span> from the
            system. This cannot be undone.
          </p>

          <Label className='my-2'>
            Email:
            <Input
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Enter the employee's email to confirm deletion."
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Delete'
      destructive
    />
  );
}
