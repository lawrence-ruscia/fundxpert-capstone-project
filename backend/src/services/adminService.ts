import bcrypt from 'bcryptjs';
import { pool } from '../config/db.config.js';
import { generateTempPassword } from '../utils/generateTempPassword.js';
import type { UserResponse } from '../types/userResponse.js';
import { createNotification } from '../utils/notificationHelper.js';

export async function logUserAction(
  userId: number,
  action: string,
  category: 'Auth' | 'UserManagement' | 'System',
  performed_by_role: 'Admin' | 'HR' | 'Employee' | 'System',
  meta: {
    targetId?: number | null;
    details?: Record<string, unknown> | null;
    ipAddress?: string | null;
  }
) {
  await pool.query(
    `INSERT INTO audit_logs (user_id, category, action, target_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      category,
      action,
      meta.targetId || null,
      meta.details || null,
      meta.ipAddress || null,
    ]
  );
}

export async function getAllUsers(query: {
  role?: string | null;
  status?: string | null;
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const params: unknown[] = [];
  const filters: string[] = [];

  if (query.role) {
    params.push(query.role);
    filters.push(`role = $${params.length}`);
  }

  if (query.status) {
    params.push(query.status);
    filters.push(`employment_status = $${params.length}`);
  }

  if (query.search) {
    params.push(`%${query.search}%`);
    filters.push(
      `(name ILIKE $${params.length} OR email ILIKE $${params.length} OR employee_id ILIKE $${params.length})`
    );
  }

  if (query.startDate) {
    params.push(query.startDate);
    filters.push(`u.created_at >= $${params.length}`);
  }

  if (query.endDate) {
    params.push(query.endDate);
    filters.push(`u.created_at <= $${params.length}`);
  }

  const sqlquery = `
      SELECT u.id, u.employee_id, u.name, u.email, u.role, u.employment_status, u.failed_attempts, u.locked_until, u.password_expired, u.temp_password, u.is_twofa_enabled, u.password_last_changed, u.created_at, u.last_login, d.name AS department, p.title AS position
      FROM users u 
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN positions p ON u.position_id = p.id
      ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
      ORDER BY created_at DESC
    `;

  const { rows } = await pool.query(sqlquery, params);
  return rows;
}

export async function getUserById(userId: number) {
  const query = `
      SELECT 
        u.*,
        d.name AS department, p.title AS position, u.created_at
      FROM users u 
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN positions p ON u.position_id = p.id
      WHERE u.id = $1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0];
}

export async function createUser(payload: {
  name: string;
  email: string;
  employee_id: string;
  department_id: number;
  position_id: number;
  salary: number;
  date_hired: string;
  role: string;
  generatedTempPassword: string;
}) {
  try {
    const hashedPassword = await bcrypt.hash(payload.generatedTempPassword, 10);
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days

    const { rows } = await pool.query(
      `INSERT INTO users 
     (name, email, employee_id, password_hash, role, department_id, position_id, 
      salary, date_hired, employment_status, temp_password, temp_password_expires)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active', true, $10)
   RETURNING id, name, email, employee_id, role, salary, department_id, position_id, 
             employment_status, date_hired, temp_password, temp_password_expires;`,
      [
        payload.name,
        payload.email,
        payload.employee_id,
        hashedPassword,
        payload.role,
        payload.department_id,
        payload.position_id,
        payload.salary,
        payload.date_hired,
        expiresAt,
      ]
    );

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

export async function updateUser(
  id: number,
  updates: Partial<{
    name: string;
    email: string;
    employee_id: string;
    role: string;
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

    // STEP 1: Fetch current user data
    const { rows: currentRows } = await client.query(
      `SELECT id, name, email, employee_id, role, department_id, position_id, 
              salary, employment_status, date_hired
       FROM users WHERE id = $1`,
      [id]
    );

    if (currentRows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const currentUser = currentRows[0];

    // STEP 2: Detect actual changes and sensitive changes
    const fields: string[] = [];
    const values: unknown[] = [id];
    let index = 2;
    let hasSensitiveChange = false;
    const actualChanges: string[] = [];

    // Sensitive fields that trigger token version increment
    const sensitiveFields = ['role', 'employment_status'];

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'generatedTempPassword' && value) {
        // Password reset is always sensitive
        const hash = await bcrypt.hash(value, 10);
        const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days

        fields.push(`password_hash = $${index}`);
        values.push(hash);
        index++;

        fields.push(`temp_password = true`);
        fields.push(`temp_password_expires = $${index}`);
        values.push(expiresAt);
        index++;

        hasSensitiveChange = true;
        actualChanges.push('password_hash');
      } else {
        // Only add field if value actually changed
        if (currentUser[key] !== value) {
          fields.push(`${key} = $${index}`);
          values.push(value);
          index++;
          actualChanges.push(key);

          // Check if this is a sensitive field
          if (sensitiveFields.includes(key)) {
            hasSensitiveChange = true;
          }
        }
      }
    }

    // STEP 3: If no actual changes, return early
    if (fields.length === 0) {
      await client.query('COMMIT');
      return currentUser;
    }
    // STEP 4: Increment token version ONLY for sensitive changes
    if (hasSensitiveChange) {
      await client.query(
        `UPDATE users SET token_version = token_version + 1 WHERE id = $1`,
        [id]
      );
      console.log(
        `Token version incremented for user ${id} due to sensitive change:`,
        actualChanges
      );
    } else {
      console.log(
        `ℹNo token version increment for user ${id}. Non-sensitive changes:`,
        actualChanges
      );
    }

    // STEP 5: Update user
    const query = `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, email, employee_id, role, department_id, position_id, 
                salary, employment_status, date_hired;
    `;

    const { rows } = await client.query(query, values);
    await client.query('COMMIT');

    return rows[0] || null;
  } catch (err: any) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      // unique_violation
      if (err.detail?.includes('employee_id')) {
        throw new Error('Employee ID must be unique.');
      }
      if (err.detail?.includes('email')) {
        throw new Error('Email must be unique.');
      }
    }
    throw err;
  } finally {
    client.release();
  }
}

interface LockUserResult {
  lockUntil: Date | null;
}

export async function toggleLockUser(
  userId: string,
  locked: boolean,
  durationMinutes?: number,
  lockUntil?: string
): Promise<LockUserResult> {
  const client = await pool.connect();
  try {
    let lockUntilDate: Date | null = null;

    if (locked) {
      if (lockUntil) {
        // Use specific date if provided
        lockUntilDate = new Date(lockUntil);
      } else {
        // Use duration (default to 24 hours = 1440 minutes)
        const duration = durationMinutes ?? 1440;
        const durationMs = duration * 60 * 1000;
        lockUntilDate = new Date(Date.now() + durationMs);
      }
    }

    await client.query(
      `UPDATE users 
     SET locked_until = $2, updated_at = NOW() 
     WHERE id = $1`,
      [userId, lockUntilDate]
    );

    await client.query(
      `UPDATE users SET token_version = token_version + 1 WHERE id = $1`,
      [userId]
    );

    await client.query('COMMIT');
    return { lockUntil: lockUntilDate };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getAuditLogs() {
  const { rows } = await pool.query(
    `SELECT al.*, u.name AS actor_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY timestamp DESC
       LIMIT 100`
  );

  return rows;
}

export async function getAdminStats() {
  const query = `
    WITH user_counts AS (
      SELECT 
        COUNT(*) AS total_users,
        COUNT(*) FILTER (WHERE employment_status = 'Active') AS active_users,
        COUNT(*) FILTER (WHERE (locked_until AT TIME ZONE 'UTC') >= NOW()) AS locked_accounts,
        COUNT(*) FILTER (WHERE temp_password = TRUE) AS temp_password_users
      FROM users
    ),
    role_distribution AS (
      SELECT role, COUNT(*) AS count FROM users GROUP BY role
    ),
    login_activity AS (
      SELECT 
        DATE(timestamp) AS date,
        SUM(CASE WHEN action = 'Successful Login' THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN action = 'Failed Login Attempt' THEN 1 ELSE 0 END) AS failed_count
      FROM audit_logs
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(timestamp)
      ORDER BY DATE(timestamp)
    ),
    recent_admin_actions AS (
      SELECT user_id, action, details, timestamp
      FROM audit_logs
      WHERE category = 'UserManagement'
      ORDER BY timestamp DESC
      LIMIT 10
    )
    SELECT 
     (SELECT row_to_json(uc) FROM user_counts uc) AS user_summary,
      (SELECT json_agg(role_distribution) FROM role_distribution) AS role_summary,
      (SELECT json_agg(login_activity) FROM login_activity) AS login_trends,
      (SELECT json_agg(recent_admin_actions) FROM recent_admin_actions) AS recent_actions;
  `;

  const { rows } = await pool.query(query);
  return rows[0];
}

export async function getUserSummary() {
  const query = `SELECT 
        COUNT(*) AS total_users,
        COUNT(*) FILTER (WHERE employment_status = 'Active') AS active_users,
        COUNT(*) FILTER (WHERE (locked_until AT TIME ZONE 'UTC') >= NOW()) AS locked_accounts,
        COUNT(*) FILTER (WHERE temp_password = TRUE) AS temp_password_users
      FROM users`;
  const { rows } = await pool.query(query);

  return rows[0];
}
