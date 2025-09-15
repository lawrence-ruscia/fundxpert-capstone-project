import type {
  ContributionPeriod,
  EmployeeContributionsResponse,
} from '../types/employeeContributions';

export const fetchEmployeeContributions = async (
  period?: ContributionPeriod | null
): Promise<EmployeeContributionsResponse> => {
  const url = new URL('http://localhost:3000/employee/contributions');

  if (period) {
    url.searchParams.set('period', period.toString());
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch employee overview');
  }

  return res.json();
};
