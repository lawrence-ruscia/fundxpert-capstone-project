import { fetchEmployeeOverview } from '../services/employeeService.js';
import type { EmployeeOverview } from '../types/employeeOverview.js';
import { useApi } from '@/hooks/useApi';

export const useEmployeeOverview = () => {
  return useApi<EmployeeOverview>(fetchEmployeeOverview, []);
};
