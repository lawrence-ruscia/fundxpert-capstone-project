import { useApi } from '@/hooks/useApi';
import {
  fetchEmployeeContributions,
  type ContributionResponse,
} from '../services/employeeContributionsService';

export function useEmployeeContributions(year?: number) {
  return useApi<ContributionResponse>(
    () => fetchEmployeeContributions(year),
    [year]
  );
}
