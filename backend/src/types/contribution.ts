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
