export type EmployeeOverview = {
  employee: {
    id: number;
    name: string;
    employee_id: string;
    department: string;
    position: string;
    employment_status: string;
    date_hired: string;
    salary: number;
  };
  balances: {
    employee_contribution_total: number;
    employer_contribution_total: number;
    vested_amount: number;
    unvested_amount: number;
    total_balance: number;
    comparisons: {
      growth_percentage: string;
      vesting_percentage: string;
    };
  };
  loan_status: {
    active_loan: boolean;
    loan_id?: number;
    outstanding_balance?: number;
    repayment_due_date?: string | null;
  };
  eligibility: {
    can_withdraw: boolean;
    can_request_loan: boolean;
    max_loan_amount: number;
  };
};
