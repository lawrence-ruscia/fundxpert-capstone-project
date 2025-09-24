import { fetchEmployeeOverview } from '../services/employeeService.js';
import type { EmployeeOverview } from '../types/employeeOverview.js';
import { useApi } from '@/hooks/useApi';

export const useEmployeeOverview = (deps: unknown) => {
  return useApi<EmployeeOverview>(fetchEmployeeOverview, [deps]);
};
