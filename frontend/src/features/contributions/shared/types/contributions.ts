export type Contribution = {
  id: number;
  user_id: number;
  contribution_date: string;

  employee_name: string;
  department_name: string;
  position_title: string;
  employee_amount: number;
  employer_amount: number;
  total: number;
  grand_total: number;
  year: number;
  month: string;
  created_by: number;
  created_at: string;
  updated_by?: number;
  updated_at?: string;
  is_adjusted: boolean;
  notes?: string;
};

export type ContributionPayload = Omit<
  Contribution,
  | 'id'
  | 'created_by'
  | 'created_at'
  | 'updated_by'
  | 'updated_at'
  | 'is_adjusted'
>;

export type SearchEmployeesResponse = SearchEmployeesRecord[];

export type SearchEmployeesRecord = {
  id: number;
  employee_id: string;
  name: string;
  department: string;
  position: string;
};

export type EmployeeByContributionId = {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  employment_status: string;
  date_hired: string;
  contribution_id: number;
  contribution_date: string;
  employee_amount: number;
  employer_amount: number;
  total_amount: number;
};

export type ContributionSummary = {
  total_contributions: number;
  total_employee: number;
  total_employer: number;
  average_monthly: number;
  last_contribution: string | null;
  contribution_count: number;
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
