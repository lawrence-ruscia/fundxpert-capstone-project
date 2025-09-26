import { useState, useEffect } from 'react';
import * as hrService from '../services/hrService.js';
import { toast } from 'sonner';
import { useEmployeeForm } from '../hooks/useEmployeeForm.js';
import { useNavigate } from 'react-router-dom';

type EmployeeEditFormProps = {
  id: number;
};

type UpdateEmployeeFields = Partial<{
  name: string;
  email: string;
  employee_id: number;
  department_id: number;
  position_id: number;
  salary: number;
  employment_status: 'Active' | 'Resigned' | 'Retired' | 'Terminated';
  date_hired: string;
}>;

export const EditEmployeeForm = ({ id }: EmployeeEditFormProps) => {
  const [employee, setEmployee] = useState<UpdateEmployeeFields | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const {
    data: optionsData,
    loading: optionsLoading,
    error: optionsError,
  } = useEmployeeForm();
  // departments - {id: name}
  // positions - {id: title}
  const departments = optionsData.departments;
  const positions = optionsData.positions;

  useEffect(() => {
    async function fetchEmployee() {
      setLoading(true);
      const employeeData = await hrService.getEmployeeById(id);
      setEmployee(employeeData);
      setLoading(false);
    }
    fetchEmployee();
  }, [id]);

  if (loading || !employee) return <p>Loading...</p>;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEmployee({ ...employee, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await hrService.updateEmployee(id, {
        name: employee.name,
        email: employee.email,
        employee_id: employee.employee_id,
        department_id: employee.department_id,
        position_id: employee.position_id,
        salary: Number(employee.salary),
        employment_status: employee.employment_status,
        date_hired: new Date(employee.date_hired ?? Date.now()),
      });
      navigate('/hr/employees');
      toast.success(`Employee ${employee.employee_id} updated successfully`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const res = await hrService.resetEmployeePassword(id);
      alert(`Temporary password: ${res.tempPassword}`);
    } catch {
      alert('Failed to reset password');
    }
  };

  return (
    <div className='max-w-xl space-y-4 rounded-lg p-6 shadow'>
      <h2 className='text-lg font-semibold'>Edit Employee</h2>

      {/* Basic Info */}
      <div>
        <label className='block text-sm'>Name</label>
        <input
          name='name'
          value={employee.name}
          onChange={handleChange}
          className='w-full rounded border p-2'
        />
      </div>

      <div>
        <label className='block text-sm'>Email</label>
        <input
          type='email'
          name='email'
          value={employee.email}
          onChange={handleChange}
          className='w-full rounded border p-2'
        />
      </div>

      <div>
        <label className='block text-sm'>Employee ID</label>
        <input
          name='employee_id'
          value={employee.employee_id}
          onChange={handleChange}
          className='w-full rounded border p-2'
        />
      </div>

      {/* Job Info */}
      <div>
        <label className='block text-sm'>Department</label>
        {!optionsLoading && optionsData.departments && (
          <select
            name='department_id'
            value={employee.department_id}
            onChange={handleChange}
            className='w-full rounded border p-2'
          >
            {departments?.map(d => (
              <option value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className='block text-sm'>Position</label>
        {!optionsLoading && optionsData.positions && (
          <select
            name='positions_id'
            value={employee.position_id}
            onChange={handleChange}
            className='w-full rounded border p-2'
          >
            {positions?.map(d => (
              <option value={d.id}>{d.title}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className='block text-sm'>Salary</label>
        <input
          type='number'
          name='salary'
          value={employee.salary}
          onChange={handleChange}
          className='w-full rounded border p-2'
        />
      </div>

      {/* Employment Status */}
      <div>
        <label className='block text-sm'>Employment Status</label>
        <select
          name='employment_status'
          value={employee.employment_status}
          onChange={handleChange}
          className='w-full rounded border p-2'
        >
          <option value='Active'>Active</option>
          <option value='Resigned'>Resigned</option>
          <option value='Retired'>Retired</option>
          <option value='Terminated'>Terminated</option>
        </select>
      </div>

      <div>
        <label className='block text-sm'>Date Hired</label>
        <input
          type='date'
          name='date_hired'
          value={
            new Date(employee.date_hired ?? Date.now())
              .toISOString()
              .split('T')[0]
          }
          onChange={handleChange}
          className='w-full rounded border p-2'
        />
      </div>

      {/* Actions */}
      <div className='mt-6 flex justify-between'>
        <button
          onClick={handleResetPassword}
          className='rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700'
        >
          Reset Password
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
