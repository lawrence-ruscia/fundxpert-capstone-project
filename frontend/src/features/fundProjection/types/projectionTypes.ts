export type ProjectionResponse = {
  employee: ProjectionEmployee;
  inputs: {
    years: 10;
    growthRate: 0.03;
  };
  projection: ProjectionRecord[];
  totals: ProjectionTotals;
};

export type ProjectionEmployee = {
  id: number;
  name: string;
  employee_id: string;
  department: string;
  position: string;
  salary_used: number;
};

export type ProjectionRecord = {
  year: number;
  employee_contribution: number;
  employer_contribution: number;
  vested_amount: number;
  unvested_amount: number;
  total_balance: number;
  with_growth: number;
};

export type ProjectionTotals = {
  employee: number;
  employer: number;
  vested: number;
  unvested: number;
  final_balance: number;
  final_with_growth: number;
};
