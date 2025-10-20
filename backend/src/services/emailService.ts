import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Email template types
export type EmailTemplate =
  // Employee Templates
  | 'loan-submitted'
  | 'loan-incomplete'
  | 'loan-prescreened'
  | 'loan-approved'
  | 'loan-rejected'
  | 'loan-released'
  | 'loan-disbursed'
  | 'loan-cancelled'
  | 'withdrawal-submitted'
  | 'withdrawal-incomplete'
  | 'withdrawal-approved'
  | 'withdrawal-rejected'
  | 'withdrawal-released'
  | 'withdrawal-processed'
  | 'contribution-posted'
  // HR Templates
  | 'hr-loan-submitted'
  | 'hr-loan-ready'
  | 'hr-loan-pending-approval'
  | 'hr-loan-rejected-by-approver'
  | 'hr-loan-fully-approved'
  | 'hr-loan-released-notification'
  | 'hr-withdrawal-submitted'
  | 'hr-withdrawal-ready'
  | 'hr-withdrawal-approved-notification'
  | 'hr-withdrawal-released-notification'
  // System Templates
  | 'password-reset'
  | 'temporary-password'
  | '2fa-reset'
  | 'account-locked'
  | 'account-unlocked'
  | 'general-notification';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Check if email is configured
      if (
        !process.env.SMTP_HOST ||
        !process.env.SMTP_USER ||
        !process.env.SMTP_PASSWORD
      ) {
        console.warn(
          '⚠️ Email service not configured. Email notifications will be disabled.'
        );
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      this.isConfigured = true;
      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.warn('⚠️ Email service not configured. Skipping email send.');
      return false;
    }

    try {
      this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      console.log(`✅ Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Singleton instance
export const emailService = new EmailService();
