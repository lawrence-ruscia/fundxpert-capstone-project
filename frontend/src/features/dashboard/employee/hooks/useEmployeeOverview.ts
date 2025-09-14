
import {
  fetchEmployeeOverview,
  type EmployeeOverview,
} from '../services/employeeService.js';
import { useApi } from '@/hooks/useApi';

export const useEmployeeOverview = () => {
  return useApi<EmployeeOverview>(fetchEmployeeOverview, []);
};
