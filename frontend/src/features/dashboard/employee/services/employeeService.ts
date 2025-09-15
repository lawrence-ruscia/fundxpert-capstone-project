import type { EmployeeOverview } from '../types/employeeOverview';

export const fetchEmployeeOverview = async (): Promise<EmployeeOverview> => {
  const res = await fetch('http://localhost:3000/employee/overview', {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch employee overview');
  }

  return res.json();
};
