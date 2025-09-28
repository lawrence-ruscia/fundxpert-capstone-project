import { useMultiFetch } from '@/shared/hooks/useMultiFetch';
import { hrContributionsService } from '../services/hrContributionService';
import { getEmployeeById } from '@/features/employeeManagement/services/hrService';

export function useEmployeeContributionsData(userId: number) {
  return useMultiFetch(async () => {
    if (!userId) throw new Error('User ID is required');

    const [employee, contributions, summary] = await Promise.all([
      getEmployeeById(userId),
      hrContributionsService.getAllContributions({ userId }),
      hrContributionsService.getEmployeeContributionsSummary(userId),
    ]);

    return { employee, contributions, summary };
  }, [userId]);
}
