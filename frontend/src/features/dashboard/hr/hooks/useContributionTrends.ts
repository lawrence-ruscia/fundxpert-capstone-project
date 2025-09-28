import { useApi } from '@/shared/hooks/useApi';
import { fetchContributionTrends } from '../services/hrDashboardService';
import type {
  HRContributionPeriod,
  HRContributionsResponse,
} from '../types/hrDashboardTypes';

export const useContributionTrends = (period?: HRContributionPeriod) => {
  return useApi<HRContributionsResponse>(
    () => fetchContributionTrends(period),
    [period]
  );
};
