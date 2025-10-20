// utils/notificationHelper.ts
import { pool } from '../config/db.config.js';
import { emailService, EmailTemplate } from '../services/emailService.js';
import { getEmailTemplate } from '../services/emailTemplates.js';

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
  emailTemplate?: EmailTemplate; // ✅ Add this
  [key: string]: unknown;
}

/**
 * Create a notification for a user and optionally send email
 */
export async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: NotificationType,
  data?: NotificationData,
  sendEmail = true
): Promise<void> {
  try {
    // Create in-app notification
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, message, type, data ? JSON.stringify(data) : null]
    );

    console.log(`✅ Notification created for user ${userId}: ${title}`);

    // Send email notification if enabled
    if (sendEmail && data?.emailTemplate) {
      await sendEmailNotification(userId, data.emailTemplate, data);
    }
  } catch (err) {
    console.error('❌ Create notification error:', err);
  }
}

/** 
 * Send email notification to user
 */
async function sendEmailNotification(
  userId: number,
  template: EmailTemplate,
  data: NotificationData
): Promise<void> {
  try {
    // Get user email
    const { rows } = await pool.query(
      `SELECT email, name FROM users WHERE id = $1`,
      [userId]
    );

    if (rows.length === 0 || !rows[0].email) {
      console.warn(`⚠️ No email found for user ${userId}`);
      return;
    }

    const user = rows[0];

    // Get email template
    const { subject, html } = getEmailTemplate(template, {
      userName: user.name,
      ...data,
    });

    // Send email
    await emailService.sendEmail({
      to: user.email,
      subject,
      html,
    });
  } catch (err) {
    console.error('❌ Send email notification error:', err);
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
  data?: NotificationData,
  sendEmail = false // Usually false for broadcast notifications
): Promise<void> {
  try {
    const { rows } = await pool.query(`SELECT id FROM users WHERE role = $1`, [
      role,
    ]);

    for (const user of rows) {
      await createNotification(user.id, title, message, type, data, sendEmail);
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
