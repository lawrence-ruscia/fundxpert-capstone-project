import { pool } from '../config/db.config.js';
import type { Contribution } from '../types/contribution.js';

/**
 * Record a new contribution
 */
export async function recordContribution(payload: {
  userId: number;
  contributionDate: string; // YYYY-MM-DD
  employeeAmount: number;
  employerAmount: number;
  createdBy: number; // HR ID
  notes?: string;
}): Promise<Contribution> {
  const query = `
    INSERT INTO contributions
      (user_id, contribution_date, employee_amount, employer_amount, created_by, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    payload.userId,
    payload.contributionDate,
    payload.employeeAmount,
    payload.employerAmount,
    payload.createdBy,
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
    employeeAmount: number;
    employerAmount: number;
    updatedBy: number; // HR ID
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
      [updates.updatedBy, contributionId]
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
        updates.employeeAmount,
        updates.employerAmount,
        updates.updatedBy,
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
export async function getContributionsByEmployee(
  userId: number
): Promise<Contribution[]> {
  const query = `
    SELECT *
    FROM contributions
    WHERE user_id = $1
    ORDER BY contribution_date DESC;
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows;
}

/**
 * Get all contributions
 */
export async function getAllContributions(
  employeeId?: number,
  startDate?: string,
  endDate?: string
): Promise<Contribution[]> {
  let query = `SELECT * FROM contributions`;
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (employeeId) {
    params.push(employeeId);
    conditions.push(`user_id = $${params.length}`);
  }

  if (startDate && endDate) {
    params.push(startDate, endDate);
    conditions.push(
      `contribution_date BETWEEN $${params.length - 1} AND $${params.length}`
    );
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY contribution_date DESC`;

  const { rows } = await pool.query(query, params);
  return rows.map(c => {
    return {
      ...c,
      employee_amount: Number(c.employee_amount),
      employer_amount: Number(c.employer_amount),
    };
  });
}

export async function findEmployeeByEmployeeId(employeeId: string) {
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
    [employeeId]
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
