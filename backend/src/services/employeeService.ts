import { pool } from '../config/db.config.js';
import { calculateVesting } from './utils/getEmployeeOverviewUtil.js';

export async function getEmployeeOverview(userId: number) {
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
    active_loan AS (
      SELECT
        id,
        amount,
        status,
        created_at
      FROM loans
      WHERE user_id = $1 AND status = 'Active'
      LIMIT 1
    )
    SELECT
      u.id,
      u.employee_id,
      u.name,
      u.department_id,
      u.position_id,
      u.employment_status,
      u.date_hired,
      cs.employee_total,
      cs.employer_total,
      (cs.employee_total + cs.employer_total) AS total_balance,
      al.id AS loan_id,
      al.amount AS loan_amount,
      al.status AS loan_status,
      al.created_at AS loan_created_at
    FROM users u
    LEFT JOIN contribution_summary cs ON cs.user_id = u.id
    LEFT JOIN active_loan al ON al.id IS NOT NULL
    WHERE u.id = $1;
  `;

  const { rows } = await pool.query(query, [userId]);
  const row = rows[0];

  if (!row) throw new Error('Employee not found');

  // Calculate vesting (2 years)
  const { vestedAmount, unvestedAmount } = calculateVesting(
    row.date_hired,
    row.employee_total
  );

  // Loan eligibility (50% of vested)
  const maxLoanAmount = Math.floor(vestedAmount * 0.5);

  return {
    employee: {
      id: row.id,
      name: row.name,
      employee_id: row.employee_id,
      department_id: row.department_id,
      position_id: row.position_id,
      employment_status: row.employment_status,
      date_hired: row.date_hired,
    },
    balances: {
      employee_contribution_total: row.employee_total,
      employer_contribution_total: row.employer_total,
      vested_amount: vestedAmount,
      unvested_amount: unvestedAmount,
      total_balance: row.total_balance,
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
