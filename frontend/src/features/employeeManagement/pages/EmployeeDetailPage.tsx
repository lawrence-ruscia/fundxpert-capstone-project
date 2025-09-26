import { useParams } from 'react-router-dom';
import { EditEmployeeForm } from '../components/EditEmployeeForm';

export const EmployeeDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) return <p>Invalid Employee</p>;

  return (
    <div className='p-6'>
      <h1 className='mb-4 text-xl font-bold'>Edit Employee #{id}</h1>
      <EditEmployeeForm id={parseInt(id)} />
    </div>
  );
};
