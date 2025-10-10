import bcrypt from 'bcryptjs';
import { pool } from '../config/db.config.js';
import { generateTempPassword } from '../utils/generateTempPassword.js';

// Utility function for logging admin actions
export async function logAdminAction(
  adminId: number,
  action: string,
  targetId?: number,
  details?: Record<string, unknown>
) {
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, target_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminId, action, targetId || null, details || null, '::1']
  );
}

export async function getAllUsers(
  role?: string | null,
  status?: string | null,
  search?: string | null
) {
  const params: unknown[] = [];
  const filters: string[] = [];

  if (role) {
    params.push(role);
    filters.push(`role = $${params.length}`);
  }

  if (status) {
    params.push(status);
    filters.push(`employment_status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    filters.push(
      `(name ILIKE $${params.length} OR email ILIKE $${params.length} OR employee_id ILIKE $${params.length})`
    );
  }

  const query = `
      SELECT id, employee_id, name, email, role, employment_status, department_id, position_id, created_at
      FROM users
      ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
      ORDER BY created_at DESC
    `;

  const { rows } = await pool.query(query, params);
  return rows;
}

export async function createUser(
  employee_id: string,
  name: string,
  email: string,
  password: string,
  role: string
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const { rows } = await pool.query(
    `INSERT INTO users (employee_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, employee_id, name, email, role`,
    [employee_id, name, email, hashedPassword, role]
  );

  return rows;
}

export async function updateUser(
  userId: string,
  role: string,
  employment_status: string
) {
  const fields = [];
  const params: unknown[] = [];

  if (role) {
    params.push(role);
    fields.push(`role = $${params.length}`);
  }

  if (employment_status) {
    params.push(employment_status);
    fields.push(`employment_status = $${params.length}`);
  }

  params.push(userId);

  await pool.query(
    `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
    params
  );
}

export async function toggleLockuser(userId: string, locked: string) {
  // Lock account for one day
  const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
  const lockUntil = locked ? new Date(Date.now() + ONE_DAY_IN_MS) : null;

  await pool.query(
    `UPDATE users SET locked_until = $2, updated_at = NOW() WHERE id = $1`,
    [userId, lockUntil]
  );
}

export async function resetUserPassword(userId: string) {
  const tempPassword = generateTempPassword();
  const hashed = await bcrypt.hash(tempPassword, 10);

  await pool.query(
    `UPDATE users
       SET password_hash = $1,
           temp_password = TRUE,
           temp_password_expires = NOW() + INTERVAL '3 days',
           password_last_changed = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
    [hashed, userId]
  );

  await pool.query(
    `INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)`,
    [userId, hashed]
  );

  return tempPassword;
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
