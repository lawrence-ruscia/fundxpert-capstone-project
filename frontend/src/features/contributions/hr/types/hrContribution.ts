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
