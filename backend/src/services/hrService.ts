import { pool } from '../config/db.config.js';
import type {
  HRContributionsResponse,
  HrOverviewResponse,
} from '../types/hrTypes.js';

import { getDateRange } from './utils/getEmployeeContributionsUtils.js';

export async function getHRDashboardOverview(): Promise<HrOverviewResponse> {
  const query = `
      WITH employee_summary AS (
        SELECT 
          COUNT(*) AS total_employees,
          COUNT(*) FILTER (WHERE employment_status = 'Active') AS active_employees
        FROM users
        WHERE role = 'Employee'
      ),
      contribution_summary AS (
        SELECT
          COALESCE(SUM(employee_amount), 0) AS total_employee_contributions,
          COALESCE(SUM(employer_amount), 0) AS total_employer_contributions
        FROM contributions
      ),
      loan_summary AS (
        SELECT
          COUNT(*) FILTER (WHERE status = 'Pending') AS pending_loans,
          COUNT(*) FILTER (
            WHERE status = 'Approved'
              AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
          ) AS approved_loans_this_month
        FROM loans
      ),
      withdrawal_summary AS (
        SELECT
          COUNT(*) FILTER (WHERE status = 'Pending') AS pending_withdrawals,
          COUNT(*) FILTER (
            WHERE status = 'Processed'
              AND DATE_TRUNC('month', processed_at) = DATE_TRUNC('month', CURRENT_DATE)
          ) AS processed_withdrawals_this_month
        FROM withdrawal_requests
      )
      SELECT 
        es.total_employees,
        es.active_employees,
        cs.total_employee_contributions,
        cs.total_employer_contributions,
        ls.pending_loans,
        ls.approved_loans_this_month,
        ws.pending_withdrawals,
        ws.processed_withdrawals_this_month
      FROM employee_summary es
      CROSS JOIN contribution_summary cs
      CROSS JOIN loan_summary ls
      CROSS JOIN withdrawal_summary ws;
  `;
  const { rows } = await pool.query(query);
  return rows[0];
}

export async function getHRContributions(
  period = 'year'
): Promise<HRContributionsResponse> {
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
    WHERE 1=1
  `;

  const params: Date[] = [];
  let paramIndex = 1;

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

  const contributions = rows.map(row => {
    const employee = Number(row.employee);
    const employer = Number(row.employer);

    totalEmployee += employee;
    totalEmployer += employer;

    return {
      month: row.month.trim(),
      year: row.year,
      employee,
      employer,
      total: employee + employer,
    };
  });

  const totals = {
    employee: totalEmployee,
    employer: totalEmployer,
    grand_total: totalEmployee + totalEmployer,
  };

  return {
    period,
    contributions,
    totals,
  };
}

export async function getLoanSummary() {
  const query = `
    SELECT status, COUNT(*) AS count, SUM(amount) AS total_amount
    FROM loans
    GROUP BY status;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

export async function getWithdrawalSummary() {
  const query = `
    SELECT status, COUNT(*) AS count, SUM(total_balance) AS total_amount
    FROM withdrawal_requests
    GROUP BY status;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

export async function getPendingLoans(limit = 20) {
  const query = `
    SELECT id, user_id, amount, created_at
    FROM loans
    WHERE status = 'Pending'
    ORDER BY created_at DESC
    LIMIT $1;
  `;
  const { rows } = await pool.query(query, [limit]);
  return rows;
}

export async function getPendingWithdrawals(limit = 20) {
  const query = `
    SELECT id, user_id, total_balance, created_at
    FROM withdrawal_requests
    WHERE status = 'Pending'
    ORDER BY created_at DESC
    LIMIT $1;
  `;
  const { rows } = await pool.query(query, [limit]);
  return rows;
}
