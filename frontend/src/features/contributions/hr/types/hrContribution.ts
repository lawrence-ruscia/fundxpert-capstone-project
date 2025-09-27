export type Contribution = {
  id: number;
  user_id: number;
  contribution_date: string;
  employee_amount: number;
  employer_amount: number;
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
