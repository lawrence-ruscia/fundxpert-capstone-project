import { api } from '@/shared/api/api';
import type {
  Contribution,
  ContributionPeriod,
  ContributionSummary,
} from '../../shared/types/contributions';

export const fetchEmployeeContributionsSummary = async (
  period?: ContributionPeriod | null
): Promise<ContributionSummary> => {
  const res = await api.get('/employee/contributions/summary');

  console.log(res.data);

  return res.data;
};

export const fetchEmployeeContributions = async (
  period: ContributionPeriod
): Promise<Contribution[]> => {
  const res = await api.get('/employee/contributions', {
    params: {
      period,
    },
  });

  return res.data;
};
