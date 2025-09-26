import { api } from '@/shared/api/api';
import type { EmployeeOverview } from '../types/employeeOverview';

export const fetchEmployeeOverview = async (): Promise<EmployeeOverview> => {
  try {
    const { data } = await api.get('/employee/overview');
    return data;
  } catch (err) {
    throw new Error(
      (err as Error).message || 'Failed to fetch employee overview'
    );
  }
};
