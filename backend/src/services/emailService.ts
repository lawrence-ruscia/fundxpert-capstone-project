import * as SibApiV3Sdk from '@sendinblue/client';

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
  | 'withdrawal-prescreened'
  | 'withdrawal-approved'
  | 'withdrawal-rejected'
  | 'withdrawal-released'
  | 'withdrawal-processed'
  | 'withdrawal-cancelled'
  | 'contribution-posted'
  // HR Templates
  | 'hr-loan-submitted'
  | 'hr-loan-ready'
  | 'hr-loan-pending-approval'
  | 'hr-loan-rejected-by-approver'
  | 'hr-loan-fully-approved'
  | 'hr-loan-released-notification'
  | 'hr-loan-cancelled'
  | 'hr-withdrawal-submitted'
  | 'hr-withdrawal-ready'
  | 'hr-withdrawal-approved-notification'
  | 'hr-withdrawal-released-notification'
  | 'hr-withdrawal-cancelled'
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
  private apiInstance: any = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      if (!process.env.BREVO_API_KEY) {
        console.warn(
          '⚠️ BREVO_API_KEY not configured. Email notifications will be disabled.'
        );
        return;
      }

      this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      const apiKey = this.apiInstance.authentications['apiKey'];
      apiKey.apiKey = process.env.BREVO_API_KEY;

      this.isConfigured = true;
      console.log('✅ Brevo email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Brevo email service:', error);
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.apiInstance) {
      console.warn('⚠️ Email service not configured. Skipping email send.');
      return false;
    }

    try {
      console.log(`📧 Sending email to ${options.to}: ${options.subject}`);

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

      // Sender - no domain needed!
      sendSmtpEmail.sender = {
        email: process.env.EMAIL_FROM_ADDRESS || 'noreply@fundxpert.com',
        name: process.env.APP_NAME || 'FundXpert',
      };

      // Recipient - can be ANY email!
      sendSmtpEmail.to = [{ email: options.to }];

      sendSmtpEmail.subject = options.subject;
      sendSmtpEmail.htmlContent = options.html;

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      console.log(`Email sent successfully!`, {
        messageId: result.messageId,
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
    if (!this.isConfigured) {
      console.warn('⚠️ Brevo not configured');
      return false;
    }
    console.log('✅ Brevo email service ready');
    return true;
  }
}

// Singleton instance
export const emailService = new EmailService();
