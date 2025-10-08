import { useApi } from '@/shared/hooks/useApi';
import { fetchEmployeeContributions } from '../services/employeeContributionsService';
import type {
  Contribution,
  ContributionPeriod,
} from '../../shared/types/contributions';

export const useEmployeeContributions = (
  period: ContributionPeriod = 'all'
) => {
  return useApi<Contribution[]>(
    () => fetchEmployeeContributions(period),
    [period]
  );
};
