import { pool } from '../config/db.config.js';
import type {
  HRContributionsResponse,
  HrOverviewResponse,
} from '../types/hrTypes.js';
import type { UserResponse } from '../types/userResponse.js';
import bcrypt from 'bcryptjs';

import { getDateRange } from './utils/getEmployeeContributionsUtils.js';
import type { EmploymentStatus } from '../types/user.js';

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

/**
 * Employee Account Management
 */
export async function createEmployee(payload: {
  name: string;
  email: string;
  employee_id: string;
  department_id: number;
  position_id: number;
  salary: number;
  date_hired: string;
  generatedTempPassword: string;
}): Promise<UserResponse> {
  try {
    const hash = await bcrypt.hash(payload.generatedTempPassword, 10);
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days

    const query = `
    INSERT INTO users 
      (name, email, employee_id, password_hash, role, department_id, position_id, 
       salary, date_hired, employment_status, temp_password, temp_password_expires)
    VALUES ($1,$2,$3,$4,'Employee',$5,$6,$7,$8,'Active',true,$9)
    RETURNING id, name, email, employee_id, role, salary, department_id, position_id, 
              employment_status, date_hired, temp_password, temp_password_expires;
  `;

    const { rows } = await pool.query(query, [
      payload.name,
      payload.email,
      payload.employee_id,
      hash,
      payload.department_id,
      payload.position_id,
      payload.salary,
      payload.date_hired,
      expiresAt,
    ]);

    return rows[0];
  } catch (err: unknown) {
    if (err.code === '23505') {
      // unique_violation
      if (err.detail.includes('employee_id')) {
        throw new Error('Employee ID must be unique.');
      }
      if (err.detail.includes('email')) {
        throw new Error('Email must be unique.');
      }
    }
    throw err;
  }
}

export async function updateEmployee(
  id: number,
  updates: Partial<{
    name: string;
    email: string;
    employee_id: number;
    department_id: number;
    position_id: number;
    salary: number;
    employment_status: 'Active' | 'Resigned' | 'Retired' | 'Terminated';
    date_hired: string;
    generatedTempPassword: string;
  }>
): Promise<UserResponse | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const fields: string[] = [];
    const values: unknown[] = [id];

    const sensitiveChange =
      updates.generatedTempPassword || updates.employment_status;

    // Build SET clause dynamically
    let index = 2;
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'generatedTempPassword' && value) {
        // If resetting password, hash it + set temp flags
        const hash = await bcrypt.hash(value, 10);
        const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days
        fields.push(`password_hash = $${index}`);
        values.push(hash);
        index++;

        fields.push(`temp_password = true`);
        fields.push(`temp_password_expires = $${index}`);
        values.push(expiresAt);
        index++;
      } else {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    }

    if (fields.length === 0) return null;

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, email, employee_id, role, department_id, position_id, salary, employment_status, date_hired;
    `;

    if (sensitiveChange) {
      await client.query(
        `UPDATE users SET token_version = token_version + 1 WHERE id = $1`,
        [id]
      );
    }

    const { rows } = await client.query(query, values);

    await client.query('COMMIT');
    return rows[0] || null;
  } catch (err: unknown) {
    await client.query('ROLLBACK');

    if (err.code === '23505') {
      // unique_violation
      if (err.detail.includes('employee_id')) {
        throw new Error('Employee ID must be unique.');
      }
      if (err.detail.includes('email')) {
        throw new Error('Email must be unique.');
      }
    }
    throw err;
  } finally {
    client.release();
  }
}
export async function deleteEmployee(
  id: number
): Promise<{ success: boolean }> {
  try {
    const query = `
      DELETE FROM users
      WHERE id = $1
      RETURNING id;
    `;

    const { rows } = await pool.query(query, [id]);
    return { success: rows.length > 0 };
  } catch (err) {
    console.error('Error permanently deleting employee:', err);
    throw new Error('Failed to permanently delete employee');
  }
}

export async function resetEmployeePassword(
  id: number,
  generatedPassword: string
): Promise<{ temp_password: string; expires_at: Date } | null> {
  const hash = await bcrypt.hash(generatedPassword, 10);
  const expiresAt = new Date(Date.now()); // Immediately

  const query = `
    UPDATE users 
    SET password_hash = $2, 
        temp_password = true, 
        temp_password_expires = $3, 
        password_last_changed = NOW(),
        updated_at = NOW()
    WHERE id = $1
    RETURNING id;
  `;

  await pool.query(
    `INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)`,
    [id, hash]
  );

  const { rows } = await pool.query(query, [id, hash, expiresAt]);
  if (!rows[0]) return null;

  return { temp_password: generatedPassword, expires_at: expiresAt };
}

export async function updateEmploymentStatus(
  id: number,
  status: EmploymentStatus
): Promise<UserResponse | null> {
  const query = `
    UPDATE users 
    SET employment_status = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING id, employee_id, name, employment_status, date_hired;
  `;

  const { rows } = await pool.query(query, [id, status]);
  return rows[0] || null;
}

export async function getEmployees(filters?: {
  status?: string;
  department_id?: number;
}): Promise<UserResponse[]> {
  let query = `
    SELECT u.id, u.employee_id, u.name, u.email, u.role,
           u.salary, u.employment_status, u.date_hired,
           d.name AS department, p.title AS position
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN positions p ON u.position_id = p.id
    WHERE role = 'Employee'
  `;
  const values: unknown[] = [];
  let i = 1;

  if (filters?.status) {
    query += ` AND u.employment_status = $${i++}`;
    values.push(filters.status);
  }
  if (filters?.department_id) {
    query += ` AND u.department_id = $${i++}`;
    values.push(filters.department_id);
  }

  query += ' ORDER BY u.date_hired DESC';

  const { rows } = await pool.query(query, values);
  return rows;
}

export async function getDepartments() {
  const query = `
  SELECT *
  FROM departments
  `;

  const { rows } = await pool.query(query);

  return rows;
}

export async function getPositions() {
  const query = `
  SELECT *
  FROM positions
  `;

  const { rows } = await pool.query(query);

  return rows;
}

export async function getEmployeeById(id: number) {
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
      SELECT id, amount, status, created_at
      FROM loans
      WHERE user_id = $1 AND status IN ('Pending','Approved','Active')
      LIMIT 1
    ),
    withdrawal_request AS (
      SELECT id, request_type, status, created_at
      FROM withdrawal_requests
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    )
    SELECT
      u.id,
      u.employee_id,
      u.name,
      u.email,
      u.department_id,
      u.position_id,
      u.salary,
      u.date_hired,
      u.employment_status,
      d.name AS department,
      p.title AS position,

      cs.employee_total,
      cs.employer_total,
      (cs.employee_total + cs.employer_total) AS total_balance,

      al.id AS loan_id,
      al.amount AS loan_amount,
      al.status AS loan_status,
      al.created_at AS loan_created_at,

      wr.id AS withdrawal_id,
      wr.request_type AS withdrawal_type,
      wr.status AS withdrawal_status,
      wr.created_at AS withdrawal_created_at

    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
    LEFT JOIN positions p ON p.id = u.position_id
    LEFT JOIN contribution_summary cs ON cs.user_id = u.id
    LEFT JOIN active_loan al ON al.id IS NOT NULL
    LEFT JOIN withdrawal_request wr ON wr.id IS NOT NULL
    WHERE u.id = $1;
  `;

  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

export async function searchHR(query: string) {
  const sql = `
    SELECT 
      u.id,
      u.employee_id,
      u.name,
      d.name AS department,
      p.title AS position
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN positions p ON u.position_id = p.id
    WHERE u.role = 'HR'
      AND (u.name ILIKE $1 OR u.employee_id ILIKE $1)
    ORDER BY u.name
    LIMIT 10;
  `;

  const { rows } = await pool.query(sql, [`%${query}%`]);
  return rows;
}
