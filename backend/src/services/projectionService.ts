import { pool } from '../config/db.config.js';
import {
  EMPLOYEE_CONTRIBUTION_RATE,
  EMPLOYER_CONTRIBUTION_RATE,
} from '../config/policy.config.js';
interface ProjectionInputs {
  years: number;
  growthRate?: number; // default 0
  salaryOverride?: number; // optional simulation
}

export async function getFundProjection(
  userId: number,
  inputs: ProjectionInputs
) {
  const { years, growthRate = 0, salaryOverride } = inputs;

  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.employee_id, u.salary, u.date_hired,
            d.name AS department, p.title AS position
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     LEFT JOIN positions p ON p.id = u.position_id
     WHERE u.id = $1`,
    [userId]
  );

  if (rows.length === 0) throw new Error('Employee not found');
  const employee = rows[0];

  const salary = salaryOverride ?? employee.salary;
  const annualEmployeeContribution = salary * EMPLOYEE_CONTRIBUTION_RATE * 12;
  const annualEmployerContribution = salary * EMPLOYER_CONTRIBUTION_RATE * 12;

  // Build projection year-by-year
  const projection = [];
  let cumulative = 0;
  let cumulativeWithGrowth = 0;

  for (let year = 1; year <= years; year++) {
    const employeeContribution = annualEmployeeContribution;
    const employerContribution = annualEmployerContribution;

    // Cliff vesting: before 2 years, employer share = 0
    const isVested = year >= 3; // "after 2 years" means vesting starts year 3

    const vestedAmount = isVested
      ? employeeContribution + employerContribution
      : employeeContribution;

    const unvestedAmount = isVested ? 0 : employerContribution;

    cumulative += employeeContribution + employerContribution;
    cumulativeWithGrowth = Math.floor(
      (cumulativeWithGrowth + employeeContribution + employerContribution) *
        (1 + growthRate)
    );

    projection.push({
      year,
      employee_contribution: employeeContribution,
      employer_contribution: employerContribution,
      vested_amount: vestedAmount,
      unvested_amount: unvestedAmount,
      total_balance: cumulative,
      with_growth: cumulativeWithGrowth,
    });
  }

  // Totals
  const totals = {
    employee: annualEmployeeContribution * years,
    employer: annualEmployerContribution * years,
    vested:
      years < 2
        ? annualEmployeeContribution * years
        : annualEmployeeContribution * years +
          annualEmployerContribution * years,
    unvested: years < 2 ? annualEmployerContribution * years : 0,
    final_balance: cumulative,
    final_with_growth: cumulativeWithGrowth,
  };

  return {
    employee: {
      id: employee.id,
      name: employee.name,
      employee_id: employee.employee_id,
      department: employee.department,
      position: employee.position,
      salary_used: salary,
    },
    inputs: {
      years,
      growthRate,
    },
    projection,
    totals,
  };
}
