import { pool } from '../config/db.config.js';
import { getDateRange } from './utils/getEmployeeContributionsUtils.js';
export async function getHRDashboardOverview() {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM users WHERE role='Employee') AS total_employees,
      (SELECT COUNT(*) FROM users WHERE employment_status='Active' AND role='Employee') AS active_employees,
      (SELECT SUM(employee_amount) FROM contributions) AS total_employee_contributions,
      (SELECT SUM(employer_amount) FROM contributions) AS total_employer_contributions,
      (SELECT COUNT(*) FROM loans WHERE status='Pending') AS pending_loans,
      (SELECT COUNT(*) FROM withdrawal_requests WHERE status='Pending') AS pending_withdrawals;
  `;
  const { rows } = await pool.query(query);
  return rows[0];
}

export async function getHRContributions(period: string = 'year') {
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

  return {
    period,
    contributions,
    totals: {
      employee: totalEmployee,
      employer: totalEmployer,
      grand_total: totalEmployee + totalEmployer,
    },
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
