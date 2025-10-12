import type { UserResponse } from '../types/userResponse.js';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.config.js';
import { PASSWORD_HISTORY_LIMIT } from '../config/security.config.js';
import {
  findUserByEmail,
  checkAccountLockout,
  validateUserPassword,
  handleFailedLoginAttempt,
  checkPasswordExpiry,
  resetFailedAttempts,
  validateTemporaryPassword,
} from './utils/loginUserUtils.js';

export type JWTLoginResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    role: string;
  };
};

export type TwoFALoginResponse =
  | {
      twofaRequired: boolean;
      userId: number;
    }
  | { twofaSetupRequired: boolean; userId: number };

export type TempPassLoginResponse = {
  forcePasswordChange: boolean;
  userId: number;
};
export type LoginResponse =
  | JWTLoginResponse
  | TwoFALoginResponse
  | TempPassLoginResponse;

export async function registerUser(
  employee_id: string,
  name: string,
  email: string,
  password: string,
  role: string,
  date_hired?: string,
  salary: number = 0
): Promise<UserResponse> {
  const hash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users 
     (employee_id, name, email, password_hash, role, date_hired, department_id, position_id, salary, employment_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, employee_id, name, email, role, salary, employment_status, date_hired, department_id, position_id, created_at`,
    [
      employee_id,
      name,
      email,
      hash,
      role,
      date_hired || new Date(),
      salary, // default salary 0 (can be updated later)
      'Active', // default status
    ]
  );

  return result.rows[0];
}

export async function loginUser(
  email: string,
  password: string,
  ipAddress?: string | null
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
    await handleFailedLoginAttempt(user, ipAddress);
  }

  if (user.temp_password) {
    // Skip 2FA setup for temp logins
    return { forcePasswordChange: true, userId: user.id };
  }

  // 4. Password expiry check
  checkPasswordExpiry(user);

  // 5. Successful login cleanup
  await resetFailedAttempts(user.id);

  //  If 2FA is not enabled yet → require setup
  if (!user.is_twofa_enabled) {
    return { twofaSetupRequired: true, userId: user.id };
  }

  // 4. If 2FA enabled → require OTP verification
  return { twofaRequired: true, userId: user.id };
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

  // 4. Update user's password + reset expiration and temp password
  await pool.query(
    `
    UPDATE users
    SET password_hash = $1, 
      password_last_changed = NOW(), 
      password_expired = false,
      temp_password = false,
      temp_password_expires = NULL
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
