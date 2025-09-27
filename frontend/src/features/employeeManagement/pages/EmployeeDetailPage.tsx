import { useParams } from 'react-router-dom';
import { EditEmployeeForm } from '../components/EditEmployeeForm';

export const EmployeeDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) return <p>Invalid Employee</p>;

  return (
    <div className=''>
      <EditEmployeeForm id={parseInt(id)} />
    </div>
  );
};
