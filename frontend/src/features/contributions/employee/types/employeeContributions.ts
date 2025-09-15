export type EmployeeContributionsResponse = {
  period?: ContributionPeriod;
  contributions: ContributionRecord[];
  totals: ContributionTotals;
};

export type ContributionPeriod = '3m' | '6m' | '1y' | 'all' | 'year';

export type ContributionRecord = {
  month: string;
  year: string;
  employee: number;
  employer: number;
  vested: number;
  total: number;
};

export type ContributionTotals = {
  employee: number;
  employer: number;
  vested: number;
  grand_total: number;
};
