import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.config.js';
import type { User } from '../types/user.js';
import {
  LOCKOUT_DURATION_MINUTES,
  MAX_FAILED_ATTEMPTS,
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
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);

  const user = result.rows[0];

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // 1. Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minutesRemaining = Math.ceil(
      (new Date(user.locked_until).getTime() - Date.now()) / 60000
    );

    throw new Error(
      `Account locked. Try again in ${minutesRemaining} minute(s).`
    );
  }

  // 2. Validate password
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    // Increment failed attempts
    const failedAttempts = user.failed_attempts + 1;

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      // Then lock account
      const lockedUntil = new Date(
        Date.now() + LOCKOUT_DURATION_MINUTES * 60000
      );

      await pool.query(
        `UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3`,
        [failedAttempts, lockedUntil, user.id]
      );

      throw new Error(
        `Account locked due to too many failed attempts. Try again after ${LOCKOUT_DURATION_MINUTES} minutes.`
      );
    } else {
      // Just increment failed attempts
      await pool.query(`UPDATE users SET failed_attempts = $1 WHERE id = $2`, [
        failedAttempts,
        user.id,
      ]);

      throw new Error(
        `Invalid email or password. ${MAX_FAILED_ATTEMPTS - failedAttempts} attempts left.`
      );
    }
  }

  // 3. Reset failed attempts on successful login
  await pool.query(
    `UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1`,
    [user.id]
  );

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  );

  return { token, user: { id: user.id, name: user.name, role: user.role } };
}
