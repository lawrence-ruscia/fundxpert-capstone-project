// utils/notificationHelper.ts
import { pool } from '../config/db.config.js';

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'action_required';

export interface NotificationData {
  loanId?: number;
  withdrawalId?: number;
  userId?: number;
  amount?: number;
  link?: string;
  [key: string]: unknown;
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: NotificationType,
  data?: NotificationData
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, message, type, data ? JSON.stringify(data) : null]
    );
    console.log(`Notification created for user ${userId}: ${title}`);
  } catch (err) {
    console.error('Create notification error:', err);
  }
}

/**
 * Helper to notify all users with a specific role
 */
export async function notifyUsersByRole(
  role: 'Employee' | 'HR' | 'Admin',
  title: string,
  message: string,
  type: NotificationType,
  data?: NotificationData
): Promise<void> {
  try {
    const { rows } = await pool.query(`SELECT id FROM users WHERE role = $1`, [
      role,
    ]);

    for (const user of rows) {
      await createNotification(user.id, title, message, type, data);
    }
  } catch (err) {
    console.error('❌ Notify users by role error:', err);
  }
}

/**
 * Helper to get user details
 */
export async function getUserDetails(userId: number) {
  const { rows } = await pool.query(
    `SELECT id, name, email, employee_id FROM users WHERE id = $1`,
    [userId]
  );
  return rows[0];
}
