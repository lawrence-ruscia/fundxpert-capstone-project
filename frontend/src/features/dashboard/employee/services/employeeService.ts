export type EmployeeOverview = {
  employee: {
    id: number;
    name: string;
    employee_id: string;
    department_id: number | null;
    position_id: number | null;
    employment_status: string;
    date_hired: string;
  };
  balances: {
    employee_contribution_total: number;
    employer_contribution_total: number;
    vested_amount: number;
    unvested_amount: number;
    total_balance: number;
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

export const employeeService = {
  fetchEmployeeOverview: async (): Promise<EmployeeOverview> => {
    const res = await fetch('http://localhost:3000/employee/overview', {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {  
      throw new Error('Failed to fetch employee overview');
    }

    return res.json();
  },
};
