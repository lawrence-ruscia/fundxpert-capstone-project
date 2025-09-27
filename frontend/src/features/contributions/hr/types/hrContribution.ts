export type Contribution = {
  id: number;
  user_id: number;
  contribution_date: string;
  employee_amount: number;
  employer_amount: number;
  notes?: string;
};

export type ContributionPayload = Omit<Contribution, 'id'>;
