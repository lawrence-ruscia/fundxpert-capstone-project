import type { User } from '../../types/user.js';
import { pool } from '../../config/db.config.js';
import bcrypt from 'bcryptjs';
import {
  LOCKOUT_DURATION_MINUTES,
  MAX_FAILED_ATTEMPTS,
  PASSWORD_EXPIRY_DAYS,
} from '../../config/security.config.js';
import { logUserAction } from '../adminService.js';
import {
  createNotification,
  notifyUsersByRole,
} from '../../utils/notificationHelper.js';

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);
  return result.rows[0] || null;
};

export const checkAccountLockout = async (user: User) => {
  if (!user.locked_until) return;

  const lockedUntil = new Date(user.locked_until);
  const now = new Date();

  if (lockedUntil > now) {
    const msRemaining = lockedUntil.getTime() - now.getTime();
    const timeMessage = formatLockoutDuration(msRemaining);

    // Notify user
    await createNotification(
      user.id,
      'Account Locked',
      `Your account has been temporarily locked due to multiple failed login attempts. Please try again later or contact support.`,
      'error',
      { link: '/auth/login' }
    );

    // Notify all admins
    await notifyUsersByRole(
      'Admin',
      'User Account Locked',
      `User ${user.email} has been automatically locked due to repeated failed login attempts.`,
      'warning',
      { userId: user.id, link: `/admin/users/${user.id}` }
    );

    throw new Error(`Account locked. Try again in ${timeMessage}.`);
  }
};

function formatLockoutDuration(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  const minutes = Math.ceil(ms / 60000);
  const hours = Math.ceil(ms / 3600000);
  const days = Math.ceil(ms / 86400000);

  if (days > 1) {
    return `${days} days`;
  }

  if (hours >= 2) {
    return `${hours} hours`;
  }

  if (hours === 1) {
    const remainingMinutes = minutes - 60;
    if (remainingMinutes > 0) {
      return `1 hour and ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
    }
    return '1 hour';
  }

  if (minutes >= 2) {
    return `${minutes} minutes`;
  }

  if (minutes === 1) {
    return '1 minute';
  }

  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

export const validateUserPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const validateTemporaryPassword = (user: User) => {
  const now = new Date();

  if (
    user.temp_password_expires &&
    new Date(user.temp_password_expires) < now
  ) {
    throw new Error('Temporary password expired. Please reset your password.');
  }
};

export const handleFailedLoginAttempt = async (
  user: User,
  ipAddress?: string | null
): Promise<never> => {
  const failedAttempts = user.failed_attempts + 1;

  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000);

    await pool.query(
      `UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3`,
      [failedAttempts, lockedUntil, user.id]
    );

    await logUserAction(
      user.id,
      'Account locked due to failed attempts',
      'Auth',
      'System',
      {
        details: { role: user.role },
        ipAddress: ipAddress ?? '::1',
      }
    );

    throw new Error(
      `Account locked due to too many failed attempts. Try again after ${LOCKOUT_DURATION_MINUTES} minutes.`
    );
  }

  await pool.query(`UPDATE users SET failed_attempts = $1 WHERE id = $2`, [
    failedAttempts,
    user.id,
  ]);

  await logUserAction(user.id, 'Failed Login Attempt', 'Auth', 'System', {
    details: { role: user.role, failedAttempts },
    ipAddress: ipAddress ?? '::1',
  });

  throw new Error(
    `Invalid email or password. ${MAX_FAILED_ATTEMPTS - failedAttempts} attempts left.`
  );
};

export const checkPasswordExpiry = (user: User): void => {
  if (!user.password_last_changed) return;

  const passwordAge = Math.floor(
    (Date.now() - new Date(user.password_last_changed).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (passwordAge > PASSWORD_EXPIRY_DAYS || user.password_expired) {
    throw new Error('Password expired. Please reset your password.');
  }
};

export const resetFailedAttempts = async (userId: number): Promise<void> => {
  await pool.query(
    `UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1`,
    [userId]
  );
};
