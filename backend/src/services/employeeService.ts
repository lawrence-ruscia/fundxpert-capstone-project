import { pool } from '../config/db.config.js';
import type { EmployeeOverview } from '../types/employeeOverview.js';
import { checkLoanEligibility } from './empLoanService.js';

import { calculateVesting } from './utils/getEmployeeOverviewUtils.js';
import { checkWithdrawalEligibility } from './withdrawalService.js';

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
      u.salary,
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

  // Loan eligibility check
  const loanEligibility = await checkLoanEligibility(userId);

  // Withdrawal eligibility check
  const withdrawalEligibility = await checkWithdrawalEligibility(userId);

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
      salary: row.salary,
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
      can_withdraw: withdrawalEligibility.eligible, // allow only on exit
      can_request_loan: loanEligibility.eligible,
      eligible_types: withdrawalEligibility.eligibleTypes,
      max_loan_amount: loanEligibility.maxLoanAmount,
    },
  };
}

export async function getContributionsSummary(userId: number) {
  const params: unknown[] = [];
  let whereClause = '';

  if (userId) {
    params.push(userId);
    whereClause = `WHERE user_id = $1`;
  }

  const query = `
    WITH summary AS (
      SELECT
        COALESCE(SUM(employee_amount + employer_amount), 0) AS total_contributions,
        COALESCE(SUM(employee_amount), 0) AS total_employee,
        COALESCE(SUM(employer_amount), 0) AS total_employer,
        COUNT(*) AS contribution_count,
        MAX(contribution_date) AS last_contribution
      FROM contributions
      ${whereClause}
    )
    SELECT
      total_contributions,
      total_employee,
      total_employer,
      contribution_count,
      last_contribution,
      CASE 
        WHEN contribution_count > 0 
        THEN ROUND(total_contributions::numeric / contribution_count, 2)
        ELSE 0
      END AS average_monthly
    FROM summary;
  `;

  const { rows } = await pool.query(query, params);
  return rows[0];
}
