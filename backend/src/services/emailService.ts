import { Resend } from 'resend';

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
  private resend: Resend | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Check if Resend API key is configured
      if (!process.env.RESEND_API_KEY) {
        console.warn(
          '⚠️ RESEND_API_KEY not configured. Email notifications will be disabled.'
        );
        return;
      }

      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.isConfigured = true;
      console.log('✅ Resend email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Resend email service:', error);
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.resend) {
      console.warn('⚠️ Email service not configured. Skipping email send.');
      return false;
    }

    try {
      console.log(`📧 Sending email to ${options.to}: ${options.subject}`);

      const { data, error } = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'FundXpert <onboarding@resend.dev>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error('❌ Resend API error:', error);
        return false;
      }

      console.log(`✅ Email sent successfully!`, {
        id: data?.id,
        to: options.to,
      });

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
    if (!this.isConfigured || !this.resend) {
      console.warn('⚠️ Resend not configured');
      return false;
    }

    try {
      // Resend doesn't have a verify endpoint, so we just check if it's initialized
      console.log('✅ Resend email service ready');
      return true;
    } catch (error) {
      console.error('❌ Resend verification failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const emailService = new EmailService();
