import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmployees } from './EmployeesProvider';
import { useNavigate } from 'react-router-dom';

export function EmployeesPrimaryButtons() {
  const { setOpen } = useEmployees();
  const navigate = useNavigate();

  return (
    <div className='flex gap-2'>
      <Button
        className='space-x-1'
        onClick={() => {
          setOpen('add');
          navigate('/hr/employees/add');
        }}
      >
        <span>Add Employee</span> <UserPlus size={18} />
      </Button>
    </div>
  );
}
