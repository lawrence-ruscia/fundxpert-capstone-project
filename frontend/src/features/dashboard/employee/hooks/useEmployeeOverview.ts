import { fetchEmployeeOverview } from '../services/employeeService.js';
import type { EmployeeOverview } from '../types/employeeOverview.js';
import { useApi } from '@/shared/hooks/useApi.js';

export const useEmployeeOverview = () => {
  return useApi<EmployeeOverview>(fetchEmployeeOverview, []);
};
