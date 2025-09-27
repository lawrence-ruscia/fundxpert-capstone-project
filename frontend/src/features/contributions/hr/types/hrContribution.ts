export type Contribution = {
  id: number;
  userId: number;
  contributionDate: string;
  employeeAmount: number;
  employerAmount: number;
  notes?: string;
};

export type ContributionPayload = Omit<Contribution, 'id'>;

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
