import { pool } from '../config/db.config.js';
import type {
  Contribution,
  ContributionSummary,
} from '../types/contribution.js';

/**
 * Record a new contribution
 */
export async function recordContribution(payload: {
  user_id: number;
  contribution_date: string; // YYYY-MM-DD
  employee_amount: number;
  employer_amount: number;
  created_by: number; // HR ID
  notes?: string;
}): Promise<Contribution> {
  const query = `
    INSERT INTO contributions
      (user_id, contribution_date, employee_amount, employer_amount, created_by, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    payload.user_id,
    payload.contribution_date,
    payload.employee_amount,
    payload.employer_amount,
    payload.created_by,
    payload.notes || null,
  ]);

  return rows[0];
}

/**
 * Update (adjust) a contribution
 * - Marks the old record as adjusted
 * - Creates a new corrected entry
 */
export async function updateContribution(
  contributionId: number,
  updates: {
    employee_amount: number;
    employer_amount: number;
    updated_by: number; // HR ID
    notes?: string;
  }
): Promise<Contribution> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Mark the old record as adjusted
    const oldRes = await client.query(
      `UPDATE contributions
       SET is_adjusted = true, updated_by = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [updates.updated_by, contributionId]
    );

    console.log();

    if (oldRes.rowCount === 0) {
      throw new Error('Contribution not found');
    }

    const oldRecord = oldRes.rows[0];

    // Insert the corrected entry
    const insertRes = await client.query(
      `INSERT INTO contributions
        (user_id, contribution_date, employee_amount, employer_amount, created_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        oldRecord.user_id,
        oldRecord.contribution_date,
        updates.employee_amount,
        updates.employer_amount,
        updates.updated_by,
        updates.notes || 'Correction of previous entry',
      ]
    );

    await client.query('COMMIT');
    return insertRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get contribution history for an employee
 */
export async function getEmployeeContributions(
  userId: number,
  period: string
): Promise<Contribution[]> {
  // Start with the base query.
  let query = `
    SELECT 
      *, 
      employee_amount + employer_amount AS total,
      SUM(employee_amount + employer_amount) OVER () AS grand_total,
      EXTRACT(YEAR FROM contribution_date) AS year,
      TO_CHAR(contribution_date, 'MM') AS month
    FROM contributions
    WHERE user_id = $1
  `;
  const params: (number | string)[] = [userId];

  //  Dynamically add the date filter based on the 'period' parameter.
  switch (period) {
    case '1y':
      query += ` AND contribution_date >= NOW() - INTERVAL '1 year'`;
      break;
    case 'year':
      // This gets all records from the beginning of the current calendar year.
      query += ` AND EXTRACT(YEAR FROM contribution_date) = EXTRACT(YEAR FROM NOW())`;
      break;
    case '6m':
      query += ` AND contribution_date >= NOW() - INTERVAL '6 months'`;
      break;
    case '3m':
      query += ` AND contribution_date >= NOW() - INTERVAL '3 months'`;
      break;
    // For 'all', no additional WHERE clause is needed.
    case 'all':
    default:
      break;
  }

  // Add the final ordering clause.
  query += ` ORDER BY contribution_date DESC;`;

  const { rows } = await pool.query(query, params);
  return rows;
}

/**
 * Get all contributions
 */
export async function getAllContributions(
  userId?: number | null,
  startDate?: string | null,
  endDate?: string | null
): Promise<Contribution[]> {
  let query = `
     SELECT
      c.*,
      u.employee_id,
      u.name AS employee_name,
      d.name AS department_name,
      p.title AS position_title
    FROM contributions c
    INNER JOIN users u ON c.user_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN positions p ON u.position_id = p.id
  `;
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (userId) {
    params.push(userId);
    conditions.push(`c.user_id = $${params.length}`);
  }

  if (startDate) {
    params.push(startDate);
    conditions.push(`c.contribution_date >= $${params.length}`);
  }

  if (endDate) {
    params.push(endDate);
    conditions.push(`c.contribution_date <= $${params.length}`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY c.contribution_date DESC`;

  const { rows } = await pool.query(query, params);

  return rows.map(c => ({
    ...c,
    employee_amount: Number(c.employee_amount),
    employer_amount: Number(c.employer_amount),
    employee_id: c.employee_id, // added from users table
  }));
}

export async function getContributionsById(
  contribution_id: number
): Promise<Contribution> {
  const query = `
    SELECT * FROM 
    contributions
    WHERE id=$1
  `;

  const { rows } = await pool.query(query, [contribution_id]);

  const contributions = rows[0];
  return {
    ...contributions,
    employee_amount: Number(contributions.employee_amount),
    employer_amount: Number(contributions.employer_amount),
  };
}

export async function findEmployeeByEmployeeId(employee_id: string) {
  const { rows } = await pool.query(
    `
    SELECT 
      u.id, 
      u.employee_id, 
      u.name, 
      d.name AS department, 
      p.title AS position
    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
    LEFT JOIN positions p ON p.id = u.position_id
    WHERE u.employee_id = $1
    `,
    [employee_id]
  );

  return rows[0] || null;
}

export async function searchEmployees(query: string) {
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
    WHERE u.role = 'Employee'
      AND (u.name ILIKE $1 OR u.employee_id ILIKE $1)
    ORDER BY u.name
    LIMIT 10;
  `;

  const { rows } = await pool.query(sql, [`%${query}%`]);
  return rows;
}

export async function getEmployeeByContributionId(contribution_id: number) {
  const query = `
   SELECT 
  u.id,
  u.employee_id,
  u.name,
  u.email,
  u.department_id,
  COALESCE(d.name, 'N/A') AS department,
  u.position_id,
  COALESCE(p.title, 'N/A') AS position,
  u.salary,
  u.employment_status,
  u.date_hired,
  c.id AS contribution_id,
  c.contribution_date,
  c.employee_amount,
  c.employer_amount,
  (c.employee_amount + c.employer_amount) AS total_amount,
  
  -- Optional: Include audit fields from contributions
  c.created_by,
  c.created_at,
  c.is_adjusted,
  c.notes
  FROM contributions c
  INNER JOIN users u ON u.id = c.user_id
  LEFT JOIN departments d ON d.id = u.department_id
  LEFT JOIN positions p ON p.id = u.position_id
  WHERE c.id = $1
  LIMIT 1;
  `;

  const { rows } = await pool.query(query, [contribution_id]);
  return rows[0] || null;
}

export async function getContributionSummary(
  userId?: number | null
): Promise<ContributionSummary> {
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
