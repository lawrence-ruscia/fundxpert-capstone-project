import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useUsers } from './UsersProvider';

export function UsersPrimaryButtons() {
  const { setOpen } = useUsers();
  const navigate = useNavigate();

  return (
    <div className='flex gap-2'>
      <Button
        className='space-x-1'
        onClick={() => {
          setOpen('add');
          navigate('/admin/users/add');
        }}
      >
        <span>Add User</span> <UserPlus size={18} />
      </Button>
    </div>
  );
}
