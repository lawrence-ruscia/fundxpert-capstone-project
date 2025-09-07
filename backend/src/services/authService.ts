import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.config.js';
import type { User } from '../types/user.js';
import {
  LOCKOUT_DURATION_MINUTES,
  MAX_FAILED_ATTEMPTS,
  PASSWORD_EXPIRY_DAYS,
  PASSWORD_HISTORY_LIMIT,
} from '../config/security.config.js';

export type LoginResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    role: string;
  };
};

export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: string,
  date_hired: string | undefined
): Promise<User> {
  const hash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, date_hired) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, date_hired`,
    [name, email, hash, role, date_hired]
  );

  return result.rows[0];
}

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  // 1. Find User
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // 2. Security checks
  checkAccountLockout(user);

  // 3. Password validation
  const isValidPassword = await validateUserPassword(
    password,
    user.password_hash
  );

  if (!isValidPassword) {
    await handleFailedLoginAttempt(user);
  }

  // 4. Password expiry check
  checkPasswordExpiry(user);

  // 5. Successful login cleanup
  await resetFailedAttempts(user.id);

  // 6. Generate token and response
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  );

  return { token, user: { id: user.id, name: user.name, role: user.role } };
}

export async function resetPassword(userId: number, newPassword: string) {
  // 1. Fetch last N password hashes from history
  const historyResult = await pool.query(
    `
    SELECT password_hash 
    FROM password_history
    WHERE user_id = $1
    ORDER BY changed_at DESC
    LIMIT $2
    `,
    [userId, PASSWORD_HISTORY_LIMIT]
  );

  console.log(historyResult.rows);

  const oldHashes = historyResult.rows.map(row => row.password_hash);

  // 2. Check if new password matches any old password
  for (const oldHash of oldHashes) {
    if (await bcrypt.compare(newPassword, oldHash)) {
      throw new Error('New password must not match last used passwords.');
    }
  }

  // 3. Hash new password
  const hash = await bcrypt.hash(newPassword, 10);

  // 4. Update user's password + reset expiration
  await pool.query(
    `
    UPDATE users
    SET password_hash = $1, password_last_changed = NOW(), password_expired = false
    WHERE id = $2
    `,
    [hash, userId]
  );

  // 5. Insert into password history
  await pool.query(
    `
    INSERT INTO password_history (user_id, password_hash)
    VALUES ($1, $2)
    `,
    [userId, hash]
  );

  return { message: 'Password updated successfully' };
}

/**
 * Helper functions
 */
async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);
  return result.rows[0] || null;
}

function checkAccountLockout(user: User): void {
  if (!user.locked_until) return;

  const lockedUntil = new Date(user.locked_until);
  const now = new Date();

  if (lockedUntil > now) {
    const minutesRemaining = Math.ceil(
      (lockedUntil.getTime() - now.getTime()) / 60000
    );
    throw new Error(
      `Account locked. Try again in ${minutesRemaining} minute(s).`
    );
  }
}

async function validateUserPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

async function handleFailedLoginAttempt(user: User): Promise<never> {
  const failedAttempts = user.failed_attempts + 1;

  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000);

    await pool.query(
      `UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3`,
      [failedAttempts, lockedUntil, user.id]
    );

    throw new Error(
      `Account locked due to too many failed attempts. Try again after ${LOCKOUT_DURATION_MINUTES} minutes.`
    );
  }

  await pool.query(`UPDATE users SET failed_attempts = $1 WHERE id = $2`, [
    failedAttempts,
    user.id,
  ]);

  throw new Error(
    `Invalid email or password. ${MAX_FAILED_ATTEMPTS - failedAttempts} attempts left.`
  );
}

function checkPasswordExpiry(user: User): void {
  if (!user.password_last_changed) return;

  const passwordAge = Math.floor(
    (Date.now() - new Date(user.password_last_changed).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (passwordAge > PASSWORD_EXPIRY_DAYS || user.password_expired) {
    throw new Error('Password expired. Please reset your password.');
  }
}

async function resetFailedAttempts(userId: number): Promise<void> {
  await pool.query(
    `UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1`,
    [userId]
  );
}
