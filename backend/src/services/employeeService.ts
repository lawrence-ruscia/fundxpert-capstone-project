import { pool } from '../config/db.config.js';
import type { EmployeeOverview } from '../types/employeeOverview.js';
import {
  getDateRange,
  isContributionVested,
} from './utils/getEmployeeContributionsUtils.js';
import { calculateVesting } from './utils/getEmployeeOverviewUtils.js';

export async function getEmployeeOverview(
  userId: number
): Promise<EmployeeOverview> {
  const query = `
   WITH contribution_summary AS (
      SELECT
        user_id,
        COALESCE(SUM(employee_amount), 0) AS employee_total,
        COALESCE(SUM(employer_amount), 0) AS employer_total
      FROM contributions
      WHERE user_id = $1
      GROUP BY user_id
    ),
    last_year_summary AS (
      SELECT
        user_id,
        COALESCE(SUM(employee_amount + employer_amount), 0) AS last_year_total
      FROM contributions
      WHERE user_id = $1
        AND EXTRACT(YEAR FROM contribution_date) = EXTRACT(YEAR FROM CURRENT_DATE) - 1
      GROUP BY user_id
    ),
    active_loan AS (
      SELECT id, amount, status, created_at
      FROM loans
      WHERE user_id = $1 AND status = 'Active'
      LIMIT 1
    )
    SELECT
      u.id,
      u.employee_id,
      u.name,
      d.name AS department,
      p.title AS position,
      u.employment_status,
      u.date_hired,
      cs.employee_total,
      cs.employer_total,
      (cs.employee_total + cs.employer_total) AS total_balance,
      COALESCE(lys.last_year_total, 0) AS last_year_total,
      al.id AS loan_id,
      al.amount AS loan_amount,
      al.status AS loan_status,
      al.created_at AS loan_created_at
    FROM users u
    LEFT JOIN contribution_summary cs ON cs.user_id = u.id
    LEFT JOIN last_year_summary lys ON lys.user_id = u.id
    LEFT JOIN active_loan al ON al.id IS NOT NULL
    LEFT JOIN departments d ON d.id = u.department_id
    LEFT JOIN positions p ON p.id = u.position_id
    WHERE u.id = $1;
  `;

  const { rows } = await pool.query(query, [userId]);
  const row = rows[0];

  if (!row) throw new Error('Employee not found');

  // Calculate vesting (2 years)
  const { vestedAmount, unvestedAmount } = calculateVesting(
    row.date_hired,
    row.employer_total
  );

  // Loan eligibility (50% of vested)
  const maxLoanAmount = Math.floor(vestedAmount * 0.5);

  // Year-over-Year growth
  const lastYear = Number(row.last_year_total) || 0;
  const currentTotal = Number(row.total_balance) || 0;
  let growthPercentage = null;

  if (lastYear > 0) {
    growthPercentage = (((currentTotal - lastYear) / lastYear) * 100).toFixed(
      1
    );
  }

  // Vesting %
  let vestingPercentage = null;
  if (row.employer_total > 0) {
    vestingPercentage = ((vestedAmount / row.employer_total) * 100).toFixed(1);
  }

  return {
    employee: {
      id: row.id,
      name: row.name,
      employee_id: row.employee_id,
      department: row.department,
      position: row.position,
      employment_status: row.employment_status,
      date_hired: row.date_hired,
    },
    balances: {
      employee_contribution_total: row.employee_total,
      employer_contribution_total: row.employer_total,
      vested_amount: vestedAmount,
      unvested_amount: unvestedAmount,
      total_balance: row.total_balance,
      comparisons: {
        growth_percentage: growthPercentage ?? '0',
        vesting_percentage: vestingPercentage ?? '0',
      },
    },
    loan_status: row.loan_id
      ? {
          active_loan: true,
          loan_id: row.loan_id,
          outstanding_balance: row.loan_amount, // HR will later adjust with repayments
          repayment_due_date: null, // HR will later add repayment schedule
        }
      : {
          active_loan: false,
        },
    eligibility: {
      can_withdraw: row.employment_status !== 'Active', // allow only on exit
      can_request_loan: vestedAmount > 0 && !row.loan_id,
      max_loan_amount: maxLoanAmount,
    },
  };
}

export async function getEmployeeContributions(
  userId: number,
  period: string = 'year'
) {
  // Get user hire date first (needed for vesting)
  const userRes = await pool.query(
    `SELECT date_hired FROM users WHERE id = $1`,
    [userId]
  );

  if (userRes.rows.length === 0) {
    throw new Error('User not found');
  }

  const hireDate = new Date(userRes.rows[0].date_hired);

  const { startDate, endDate } = getDateRange(period);

  let query = `
    SELECT
      contribution_date,
      TO_CHAR(contribution_date, 'Month') AS month,
      EXTRACT(MONTH FROM contribution_date) AS month_number,
      EXTRACT(YEAR FROM contribution_date) AS year,
      SUM(employee_amount) AS employee,
      SUM(employer_amount) AS employer
    FROM contributions
    WHERE user_id = $1
  `;

  const params: (number | Date)[] = [userId];
  let paramIndex = 2;

  if (startDate && endDate) {
    query += ` AND contribution_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
    params.push(startDate, endDate);
    paramIndex += 2;
  } else if (startDate) {
    query += ` AND contribution_date >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  query += `
    GROUP BY contribution_date, month, month_number, year
    ORDER BY year, month_number
  `;

  const { rows } = await pool.query(query, params);

  let totalEmployee = 0;
  let totalEmployer = 0;
  let totalVested = 0;

  const contributions = rows.map(row => {
    const employee = Number(row.employee);
    const employer = Number(row.employer);
    const date = new Date(row.contribution_date);

    totalEmployee += employee;
    totalEmployer += employer;

    const vested = isContributionVested(date, hireDate) ? employer : 0;
    totalVested += vested;

    return {
      month: row.month.trim(),
      year: row.year,
      employee,
      employer,
      vested,
      total: employee + employer,
    };
  });

  return {
    period,
    contributions,
    totals: {
      employee: totalEmployee,
      employer: totalEmployer,
      vested: totalVested,
      grand_total: totalEmployee + totalEmployer,
    },
  };
}
