import { useApi } from '@/hooks/useApi';
import { Link, useNavigate } from 'react-router-dom';
import type { HREmployeesResponse } from '../types/employeeTypes';
import { getEmployees } from '../services/hrService';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';

export const EmployeeListPage = () => {
  const navigate = useNavigate();
  const {
    data: employees,
    loading,
    error,
  } = useApi<HREmployeesResponse>(getEmployees);

  if (loading) {
    return <LoadingSpinner text='Loading employee list...' />;
  }

  if (error) {
    return <DataError message='Failed to fetch employee list' />;
  }

  if (!employees) {
    return <div>No Employee Data</div>;
  }

  return (
    <div className='p-6'>
      <h1 className='mb-4 text-xl font-bold'>Employees</h1>
      <button onClick={() => navigate('/hr/employees/create')}>
        Add Employee
      </button>
      <ul className='space-y-2'>
        {employees.map(e => (
          <li key={e.id} className='flex justify-between border-b pb-2'>
            <span>
              {e.name} – {e.department}
            </span>
            <Link
              to={`/hr/employees/${e.id}`}
              className='text-blue-600 underline'
            >
              View
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
