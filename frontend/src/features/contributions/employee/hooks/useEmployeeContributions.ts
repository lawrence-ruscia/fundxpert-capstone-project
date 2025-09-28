import { fetchEmployeeContributions } from '@/features/contributions/employee/services/employeeContributionsService.js';
import type {
  ContributionPeriod,
  EmployeeContributionsResponse,
} from '../types/employeeContributions';
import { useApi } from '@/shared/hooks/useApi';

export const useEmployeeContributions = (period?: ContributionPeriod) => {
  return useApi<EmployeeContributionsResponse>(
    () => fetchEmployeeContributions(period),
    [period]
  );
};
