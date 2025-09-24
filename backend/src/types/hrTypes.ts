export type TrendPeriod = 'all' | '1y' | 'current_year' | '6m' | '3m';

export interface ContributionTrend {
  month: string;
  employee_total: number;
  employer_total: number;
  monthly_total: number;
  cumulative_employee: number;
  cumulative_employer: number;
  cumulative_total: number;
}
