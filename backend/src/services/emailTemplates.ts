import type { EmailTemplate } from './emailService';

const APP_NAME = process.env.APP_NAME || 'FundXpert';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface TemplateData {
  userName: string;
  [key: string]: any;
}

/**
 * Base email template with consistent styling
 */
function getBaseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${APP_NAME} Notification</title>
      <style>
      a.button {
        display: inline-block;
        padding: 14px 28px;
        background: #0033A0;
        color: #ffffff !important;
        text-decoration: none !important; 
        border-radius: 6px;
        margin: 20px 0;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(0,51,160,0.2);
        transition: all 0.3s ease;
      }
      a.button:hover {
        background: #002776;
        color: #ffffff !important; 
        text-decoration: none !important;
        box-shadow: 0 4px 8px rgba(0,51,160,0.3);
        transform: translateY(-1px);
      }
      a.button:visited {
        color: #ffffff !important; 
      }
      a.button:active {
        color: #ffffff !important; 
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #1a1a1a;
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .header {
        background: linear-gradient(135deg, #0033A0 0%, #002776 100%);
        color: white;
        padding: 30px 20px;
        text-align: center;
        border-top: 4px solid #FFD100;
      }
      .header h1 {
        margin: 0;
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      .content {
        padding: 30px 20px;
      }
      .button {
        display: inline-block;
        padding: 14px 28px;
        background: #0033A0;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        margin: 20px 0;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(0,51,160,0.2);
        transition: all 0.3s ease;
      }
      .button:hover {
        background: #002776;
        box-shadow: 0 4px 8px rgba(0,51,160,0.3);
        transform: translateY(-1px);
      }
      .alert {
        padding: 16px;
        border-radius: 6px;
        margin: 20px 0;
        border-left: 4px solid;
      }
      .alert-warning {
        background: #FFF8E1;
        border-left-color: #FFD100;
        color: #7D6608;
      }
      .alert-success {
        background: #E8F5E9;
        border-left-color: #4CAF50;
        color: #2E7D32;
      }
      .alert-danger {
        background: #FFEBEE;
        border-left-color: #D32F2F;
        color: #C62828;
      }
      .alert-info {
        background: #E3F2FD;
        border-left-color: #0033A0;
        color: #002776;
      }
      .footer {
        background: #f8f9fa;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #6c757d;
        border-top: 1px solid #dee2e6;
      }
      .details {
        background: #F5F7FA;
        padding: 18px;
        border-radius: 6px;
        margin: 15px 0;
        border: 1px solid #E5E9F0;
      }
      .details-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #E5E9F0;
      }
      .details-row:last-child {
        border-bottom: none;
      }
      .label {
        font-weight: 600;
        color: #0033A0;
      }
      .value {
        color: #1a1a1a;
        font-weight: 500;
        padding-left: 4px
      }

      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${APP_NAME}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated message from ${APP_NAME}. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get email template content
 */
export function getEmailTemplate(
  template: EmailTemplate,
  data: TemplateData
): { subject: string; html: string } {
  switch (template) {
    case 'loan-submitted':
      return {
        subject: `Loan Application Submitted - #${data.loanId}`,
        html: getBaseTemplate(`
          <h2>Hello ${data.userName},</h2>
          <p>Your loan application has been successfully submitted and is now pending review.</p>
          
          <div class="details">
            <div class="details-row">
              <span class="label">Loan ID:</span>
              <span class="value">#${data.loanId}</span>
            </div>
            <div class="details-row">
              <span class="label">Amount Requested:</span>
              <span class="value">₱${data.amount?.toLocaleString()}</span>
            </div>
            <div class="details-row">
              <span class="label">Submission Date:</span>
              <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          <div class="alert alert-info">
            <strong>📋 What's Next?</strong><br>
            Your loan application will be reviewed by our HR team. You'll receive a notification once a decision has been made.
          </div>

          <a href="${FRONTEND_URL}/employee/loans/${data.loanId}" class="button">View Application</a>
          
          <p style="color: #6c757d; margin-top: 20px;">If you have any questions, please contact the HR department.</p>
        `),
      };

    case 'loan-approved':
      return {
        subject: `✅ Loan Application Approved - #${data.loanId}`,
        html: getBaseTemplate(`
          <h2>Great News, ${data.userName}!</h2>
          <p>Your loan application has been <strong style="color: #4CAF50;">approved</strong>.</p>
          
          <div class="details">
            <div class="details-row">
              <span class="label">Loan ID:</span>
              <span class="value">#${data.loanId}</span>
            </div>
            <div class="details-row">
              <span class="label">Approved Amount:</span>
              <span class="value" style="color: #4CAF50; font-weight: 700;">₱${data.amount?.toLocaleString()}</span>
            </div>
            <div class="details-row">
              <span class="label">Approval Date:</span>
              <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          <div class="alert alert-success">
            <strong>🎉 Congratulations!</strong><br>
            Your loan has been approved. The amount will be disbursed according to the payment schedule.
          </div>

          <a href="${FRONTEND_URL}/employee/loans/${data.loanId}" class="button">View Details</a>
          
          <p style="color: #6c757d; margin-top: 20px;">Thank you for choosing Metrobank's employee loan program.</p>
        `),
      };

    case 'loan-rejected':
      return {
        subject: `Loan Application Update - #${data.loanId}`,
        html: getBaseTemplate(`
          <h2>Hello ${data.userName},</h2>
          <p>We regret to inform you that your loan application has not been approved at this time.</p>
          
          <div class="details">
            <div class="details-row">
              <span class="label">Loan ID:</span>
              <span class="value">#${data.loanId}</span>
            </div>
            <div class="details-row">
              <span class="label">Review Date:</span>
              <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            ${
              data.reason
                ? `
            <div class="details-row">
              <span class="label">Reason:</span>
              <span class="value">${data.reason}</span>
            </div>
            `
                : ''
            }
          </div>

          <div class="alert alert-warning">
            <strong>📌 Next Steps:</strong><br>
            You may reapply after addressing the concerns mentioned. Contact HR for more information about eligibility requirements.
          </div>

          <a href="${FRONTEND_URL}/employee/loans/${data.loanId}" class="button">View Details</a>
          
          <p style="color: #6c757d; margin-top: 20px;">We appreciate your understanding and encourage you to reach out to HR for guidance.</p>
        `),
      };

    case 'loan-incomplete':
      return {
        subject: `⚠️ Loan Application Requires Correction - #${data.loanId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>Your loan application has been marked as <strong style="color: #f59e0b;">incomplete</strong> and requires your attention.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Loan ID:</span>
          <span class="value">#${data.loanId}</span>
        </div>
        <div class="details-row">
          <span class="label">Requested Amount:</span>
          <span class="value">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Review Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        ${
          data.reviewedBy
            ? `
        <div class="details-row">
          <span class="label">Reviewed By:</span>
          <span class="value">${data.reviewedBy}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="alert alert-warning">
        <strong>⚠️ Action Required:</strong><br>
        Your application is missing required information or documents. Please review and update your application to proceed with the approval process.
      </div>

      ${
        data.missingItems && data.missingItems.length > 0
          ? `
      <div style="background: #FFF8E1; padding: 18px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #FFD100;">
        <strong style="color: #7D6608;">📋 Missing Requirements:</strong>
        <ul style="margin: 12px 0 0 0; padding-left: 20px; color: #7D6608;">
          ${data.missingItems.map((item: string) => `<li style="margin: 8px 0;">${item}</li>`).join('')}
        </ul>
      </div>
      `
          : data.remarks
            ? `
      <div style="background: #FFF8E1; padding: 18px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #FFD100;">
        <strong style="color: #7D6608;">📝 HR Remarks:</strong>
        <p style="margin: 8px 0 0 0; color: #7D6608;">${data.remarks}</p>
      </div>
      `
            : ''
      }

      <a href="${FRONTEND_URL}/employee/loans/${data.loanId}/edit" class="button">Update Application</a>
      
      <p style="color: #6c757d; margin-top: 20px;">Please complete the requirements as soon as possible to avoid delays in processing your loan application.</p>
    `),
      };

    case 'loan-prescreened':
      return {
        subject: `✓ Loan Application Pre-Screened - #${data.loanId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>Good news! Your loan application has been <strong style="color: #0033A0;">pre-screened</strong> and is now under HR review.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Loan ID:</span>
          <span class="value">#${data.loanId}</span>
        </div>
        <div class="details-row">
          <span class="label">Amount:</span>
          <span class="value" style="color: #0033A0; font-weight: 700;">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Pre-Screen Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="details-row">
          <span class="label">Status:</span>
          <span class="value" style="color: #0033A0; font-weight: 600;">Ready for HR Review</span>
        </div>
      </div>

      <div class="alert alert-info">
        <strong>📋 Application Status Update:</strong><br>
        Your loan application has passed the initial pre-screening and all required documents have been verified. It is now being reviewed by the HR department for final approval.
      </div>

      <div style="background: #E3F2FD; padding: 18px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0033A0;">
        <strong style="color: #002776;">⏱️ What's Next:</strong>
        <p style="margin: 8px 0 0 0; color: #002776; line-height: 1.6;">
          The HR team will review your application and make a final decision. This typically takes 2-3 business days. You'll be notified once a decision has been made.
        </p>
      </div>

      <a href="${FRONTEND_URL}/employee/loans/${data.loanId}" class="button">View Application Status</a>
      
      <p style="color: #6c757d; margin-top: 20px;">Thank you for your patience. We'll keep you updated on your application progress.</p>
    `),
      };

    case 'loan-released':
      return {
        subject: `🏦 Loan Released to Trust Bank - #${data.loanId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>Your approved loan has been <strong style="color: #4CAF50;">released to Trust Bank</strong> for processing.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Loan ID:</span>
          <span class="value">#${data.loanId}</span>
        </div>
        <div class="details-row">
          <span class="label">Amount Released:</span>
          <span class="value" style="color: #4CAF50; font-weight: 700;">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Release Date:</span>
          <span class="value">${new Date().toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${
          data.transactionReference
            ? `
        <div class="details-row">
          <span class="label">Transaction Ref:</span>
          <span class="value" style="font-family: monospace; color: #0033A0; font-weight: 600;">${data.transactionReference}</span>
        </div>
        `
            : ''
        }
        ${
          data.bankReferenceNumber
            ? `
        <div class="details-row">
          <span class="label">Bank Reference:</span>
          <span class="value" style="font-family: monospace;">${data.bankReferenceNumber}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="alert alert-success">
        <strong>✅ Release Confirmed!</strong><br>
        Your loan has been successfully released to Trust Bank. The funds will be processed and credited to your designated account.
      </div>

      <div class="alert alert-info">
        <strong>⏱️ Expected Crediting Time:</strong><br>
        ${data.estimatedCreditDate ? `The funds should be available in your account by <strong>${new Date(data.estimatedCreditDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.` : 'Please allow 2-3 business days for the funds to be credited to your account.'}
      </div>

      <a href="${FRONTEND_URL}/employee/loans/${data.loanId}" class="button">View Loan Details</a>
      
      <p style="color: #6c757d; margin-top: 20px;">If you have any questions about the release or crediting process, please contact the HR department or Trust Bank directly.</p>
    `),
      };

    case 'loan-disbursed':
      return {
        subject: `💰 Loan Disbursed - #${data.loanId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>Your approved loan amount has been <strong style="color: #4CAF50;">successfully disbursed</strong>.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Loan ID:</span>
          <span class="value">#${data.loanId}</span>
        </div>
        <div class="details-row">
          <span class="label">Disbursed Amount:</span>
          <span class="value" style="color: #4CAF50; font-weight: 700;">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Disbursement Date:</span>
          <span class="value">${new Date().toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${
          data.paymentMethod
            ? `
        <div class="details-row">
          <span class="label">Payment Method:</span>
          <span class="value">${data.paymentMethod}</span>
        </div>
        `
            : ''
        }
        ${
          data.referenceNumber
            ? `
        <div class="details-row">
          <span class="label">Reference Number:</span>
          <span class="value" style="font-family: monospace; color: #0033A0; font-weight: 600;">${data.referenceNumber}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="alert alert-success">
        <strong>✅ Disbursement Complete!</strong><br>
        The loan amount has been processed and should reflect in your account shortly. Please allow 1-2 business days for the transaction to complete.
      </div>

      ${
        data.repaymentStartDate
          ? `
      <div class="alert alert-info">
        <strong>📅 Repayment Schedule:</strong><br>
        Your first repayment will be deducted on <strong>${new Date(data.repaymentStartDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>. 
        ${data.monthlyDeduction ? `Monthly deduction: <strong>₱${data.monthlyDeduction.toLocaleString()}</strong>` : ''}
      </div>
      `
          : ''
      }

      <a href="${FRONTEND_URL}/employee/loans/${data.loanId}" class="button">View Loan Details</a>
      
      <p style="color: #6c757d; margin-top: 20px;">Keep this email for your records. If you have any questions about the disbursement, please contact the HR department.</p>
    `),
      };

    case 'loan-cancelled':
      return {
        subject: `Loan Request Cancelled - #${data.loanId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>Your loan request has been <strong style="color: #f59e0b;">cancelled</strong>.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Loan ID:</span>
          <span class="value">#${data.loanId}</span>
        </div>
        <div class="details-row">
          <span class="label">Amount:</span>
          <span class="value">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Cancellation Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        ${
          data.cancelledBy
            ? `
        <div class="details-row">
          <span class="label">Cancelled By:</span>
          <span class="value">${data.cancelledBy}</span>
        </div>
        `
            : ''
        }
        ${
          data.reason
            ? `
        <div class="details-row">
          <span class="label">Reason:</span>
          <span class="value">${data.reason}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="alert alert-warning">
        <strong>ℹ️ Cancellation Notice:</strong><br>
        ${data.cancelledBy === 'System' || data.cancelledBy === 'Admin' ? 'This loan request has been cancelled by the system administrator.' : 'Your loan request has been cancelled.'}
        ${data.reason ? '' : ' No specific reason was provided.'}
      </div>

      ${
        data.canReapply !== false
          ? `
      <div style="background: #E3F2FD; padding: 18px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0033A0;">
        <strong style="color: #002776;">💡 You can still apply:</strong>
        <p style="margin: 8px 0 0 0; color: #002776;">
          You're welcome to submit a new loan application anytime. If you need assistance or have questions, please contact the HR department.
        </p>
      </div>
      `
          : ''
      }

      <a href="${FRONTEND_URL}/employee/loans" class="button">View My Loans</a>
      
      <p style="color: #6c757d; margin-top: 20px;">For questions or clarifications about this cancellation, please reach out to the HR department.</p>
    `),
      };

    case 'withdrawal-incomplete':
      return {
        subject: `⚠️ Withdrawal Request Incomplete - #${data.withdrawalId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>Your provident fund withdrawal request has been marked as <strong style="color: #f59e0b;">incomplete</strong> and requires additional information.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Withdrawal ID:</span>
          <span class="value">#${data.withdrawalId}</span>
        </div>
        <div class="details-row">
          <span class="label">Amount:</span>
          <span class="value">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Review Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div class="alert alert-warning">
        <strong>⚠️ Action Required:</strong><br>
        Please provide the missing information or documents to continue processing your withdrawal request.
      </div>

      ${
        data.missingItems && data.missingItems.length > 0
          ? `
      <div style="background: #FFF8E1; padding: 18px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #FFD100;">
        <strong style="color: #7D6608;">📋 Required Items:</strong>
        <ul style="margin: 12px 0 0 0; padding-left: 20px; color: #7D6608;">
          ${data.missingItems.map((item: string) => `<li style="margin: 8px 0;">${item}</li>`).join('')}
        </ul>
      </div>
      `
          : data.remarks
            ? `
      <div style="background: #FFF8E1; padding: 18px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #FFD100;">
        <strong style="color: #7D6608;">📝 HR Notes:</strong>
        <p style="margin: 8px 0 0 0; color: #7D6608;">${data.remarks}</p>
      </div>
      `
            : ''
      }

      <a href="${FRONTEND_URL}/employee/withdrawals/${data.withdrawalId}/edit" class="button">Complete Request</a>
      
      <p style="color: #6c757d; margin-top: 20px;">Please submit the required information promptly to avoid delays in processing your withdrawal.</p>
    `),
      };

    case 'withdrawal-submitted':
      return {
        subject: `Withdrawal Request Submitted - #${data.withdrawalId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>Your withdrawal request has been successfully submitted and is now pending review.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Withdrawal ID:</span>
          <span class="value">#${data.withdrawalId}</span>
        </div>
        <div class="details-row">
          <span class="label">Amount Requested:</span>
          <span class="value" style="color: #0033A0; font-weight: 700;">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Submission Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        ${
          data.withdrawalType
            ? `
        <div class="details-row">
          <span class="label">Type:</span>
          <span class="value">${data.withdrawalType}</span>
        </div>
        `
            : ''
        }
        ${
          data.purpose
            ? `
        <div class="details-row">
          <span class="label">Purpose:</span>
          <span class="value">${data.purpose}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="alert alert-info">
        <strong>📋 What's Next?</strong><br>
        Your withdrawal request will be reviewed by the HR team. You'll receive a notification once a decision has been made. This typically takes 1-3 business days.
      </div>

      <a href="${FRONTEND_URL}/employee/withdrawals/${data.withdrawalId}" class="button">View Request</a>
      
      <p style="color: #6c757d; margin-top: 20px;">If you need to make changes to this request, please contact the HR department immediately.</p>
    `),
      };

    case 'withdrawal-approved':
      return {
        subject: `✅ Withdrawal Request Approved - #${data.withdrawalId}`,
        html: getBaseTemplate(`
      <h2>Great News, ${data.userName}!</h2>
      <p>Your withdrawal request has been <strong style="color: #4CAF50;">approved</strong>.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Withdrawal ID:</span>
          <span class="value">#${data.withdrawalId}</span>
        </div>
        <div class="details-row">
          <span class="label">Approved Amount:</span>
          <span class="value" style="color: #4CAF50; font-weight: 700;">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Approval Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        ${
          data.approvedBy
            ? `
        <div class="details-row">
          <span class="label">Approved By:</span>
          <span class="value">${data.approvedBy}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="alert alert-success">
        <strong>🎉 Approval Confirmed!</strong><br>
        Your withdrawal request has been approved. The amount will be processed and disbursed according to the standard timeline.
      </div>

      <div class="alert alert-info">
        <strong>⏱️ Processing Timeline:</strong><br>
        ${data.estimatedProcessingDate ? `Expected processing date: <strong>${new Date(data.estimatedProcessingDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>` : 'The withdrawal will be processed within 3-5 business days.'}
      </div>

      <a href="${FRONTEND_URL}/employee/withdrawals/${data.withdrawalId}" class="button">View Details</a>
      
      <p style="color: #6c757d; margin-top: 20px;">You will receive another notification once the withdrawal has been processed and disbursed.</p>
    `),
      };

    case 'withdrawal-rejected':
      return {
        subject: `Withdrawal Request Update - #${data.withdrawalId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>We regret to inform you that your withdrawal request could not be approved at this time.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Withdrawal ID:</span>
          <span class="value">#${data.withdrawalId}</span>
        </div>
        <div class="details-row">
          <span class="label">Requested Amount:</span>
          <span class="value">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Review Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        ${
          data.reviewedBy
            ? `
        <div class="details-row">
          <span class="label">Reviewed By:</span>
          <span class="value">${data.reviewedBy}</span>
        </div>
        `
            : ''
        }
        ${
          data.reason
            ? `
        <div class="details-row">
          <span class="label">Reason:</span>
          <span class="value">${data.reason}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="alert alert-warning">
        <strong>📌 Next Steps:</strong><br>
        ${data.reason || 'Your request did not meet the approval criteria.'}
        ${data.canReapply !== false ? ' You may submit a new request after addressing the concerns mentioned.' : ' Please contact HR for more information.'}
      </div>

      <a href="${FRONTEND_URL}/employee/withdrawals/${data.withdrawalId}" class="button">View Details</a>
      
      <p style="color: #6c757d; margin-top: 20px;">If you have questions about this decision or need clarification, please contact the HR department.</p>
    `),
      };

    case 'withdrawal-processed':
      return {
        subject: `💸 Withdrawal Processed - #${data.withdrawalId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>Your withdrawal request has been <strong style="color: #4CAF50;">successfully processed and disbursed</strong>.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Withdrawal ID:</span>
          <span class="value">#${data.withdrawalId}</span>
        </div>
        <div class="details-row">
          <span class="label">Amount Disbursed:</span>
          <span class="value" style="color: #4CAF50; font-weight: 700;">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Processing Date:</span>
          <span class="value">${new Date().toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${
          data.paymentMethod
            ? `
        <div class="details-row">
          <span class="label">Payment Method:</span>
          <span class="value">${data.paymentMethod}</span>
        </div>
        `
            : ''
        }
        ${
          data.referenceNumber
            ? `
        <div class="details-row">
          <span class="label">Reference Number:</span>
          <span class="value" style="font-family: monospace; color: #0033A0; font-weight: 600;">${data.referenceNumber}</span>
        </div>
        `
            : ''
        }
        ${
          data.accountNumber
            ? `
        <div class="details-row">
          <span class="label">Credited To:</span>
          <span class="value">Account ending in ${data.accountNumber.slice(-4)}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="alert alert-success">
        <strong>✅ Disbursement Complete!</strong><br>
        The withdrawal amount has been processed successfully. 
        ${data.paymentMethod === 'Bank Transfer' ? 'Please allow 1-2 business days for the amount to reflect in your account.' : 'The amount should be available immediately.'}
      </div>

      ${
        data.remainingBalance !== undefined
          ? `
      <div class="alert alert-info">
        <strong>💰 Updated Balance:</strong><br>
        Your remaining fund balance: <strong>₱${data.remainingBalance.toLocaleString()}</strong>
      </div>
      `
          : ''
      }

      <a href="${FRONTEND_URL}/employee/withdrawals/${data.withdrawalId}" class="button">View Transaction</a>
      
      <p style="color: #6c757d; margin-top: 20px;">Keep this email for your records. If you notice any discrepancies or have questions, please contact the HR department immediately.</p>
    `),
      };

    case 'contribution-posted':
      return {
        subject: `💰 Monthly Contribution Posted - ${data.month || 'This Month'}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>Your provident fund contribution for <strong>${data.month || new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })}</strong> has been successfully posted.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Contribution Period:</span>
          <span class="value">${data.month || new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })}</span>
        </div>
        <div class="details-row">
          <span class="label">Employee Contribution:</span>
          <span class="value" style="color: #0033A0; font-weight: 700;">₱${data.employeeContribution?.toLocaleString()}</span>
        </div>
        ${
          data.employerContribution
            ? `
        <div class="details-row">
          <span class="label">Employer Contribution:</span>
          <span class="value" style="color: #0033A0; font-weight: 700;">₱${data.employerContribution.toLocaleString()}</span>
        </div>
        `
            : ''
        }
        ${
          data.totalContribution
            ? `
        <div class="details-row">
          <span class="label">Total Contribution:</span>
          <span class="value" style="color: #4CAF50; font-weight: 700; font-size: 18px;">₱${data.totalContribution.toLocaleString()}</span>
        </div>
        `
            : ''
        }
        <div class="details-row">
          <span class="label">Posting Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        ${
          data.newBalance
            ? `
        <div class="details-row">
          <span class="label">Updated Balance:</span>
          <span class="value" style="color: #0033A0; font-weight: 700; font-size: 18px;">₱${data.newBalance.toLocaleString()}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="alert alert-success">
        <strong>✅ Contribution Confirmed!</strong><br>
        Your monthly contribution has been successfully added to your provident fund account.
      </div>

      <a href="${FRONTEND_URL}/employee/contributions" class="button">View All Contributions</a>
      
      <p style="color: #6c757d; margin-top: 20px;">Thank you for your continued participation in the employee provident fund program.</p>
    `),
      };

    case 'temporary-password':
      return {
        subject: `🔐 Temporary Password Assigned`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>A temporary password has been assigned to your ${APP_NAME} account.</p>
      
      <div class="alert alert-warning">
        <strong>⚠️ Important Security Notice:</strong><br>
        For your account security, you must change this temporary password immediately upon your first login.
      </div>

      <div class="details">
        <div class="details-row">
          <span class="label">Username/Email:</span>
          <span class="value">${data.email || data.userName}</span>
        </div>
        ${
          data.temporaryPassword
            ? `
        <div class="details-row">
          <span class="label">Temporary Password:</span>
          <span class="value" style="font-family: monospace; background: #FFF8E1; padding: 8px 12px; border-radius: 4px; font-size: 16px; font-weight: 600; color: #7D6608;">${data.temporaryPassword}</span>
        </div>
        `
            : ''
        }
        <div class="details-row">
          <span class="label">Password Expires:</span>
          <span class="value" style="color: #D32F2F; font-weight: 600;">${data.expiresAt ? new Date(data.expiresAt).toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '24 hours from now'}</span>
        </div>
      </div>

      <p><strong>Steps to access your account:</strong></p>
      <ol style="line-height: 1.8; color: #495057;">
        <li>Click the login button below or visit the ${APP_NAME} portal</li>
        <li>Enter your username and the temporary password provided above</li>
        <li>You will be prompted to create a new secure password</li>
        <li>Choose a strong password that meets the security requirements</li>
      </ol>

      <a href="${FRONTEND_URL}/auth/login" class="button">Login Now</a>

      <div style="background: #FFEBEE; padding: 18px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #D32F2F;">
        <strong style="color: #C62828;">🔒 Security Tips:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #C62828; line-height: 1.6;">
          <li>Never share your password with anyone</li>
          <li>Use a unique password that you don't use elsewhere</li>
          <li>Include uppercase, lowercase, numbers, and special characters</li>
          <li>Avoid using personal information in your password</li>
        </ul>
      </div>

      <p style="color: #6c757d; margin-top: 20px;">If you did not request this password or have concerns about your account security, please contact the IT department immediately.</p>
    `),
      };

    case 'hr-loan-submitted':
      return {
        subject: `🔔 New Loan Application Submitted - #${data.loanId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>A new loan application has been submitted and requires your pre-screening.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Loan ID:</span>
          <span class="value">#${data.loanId}</span>
        </div>
        <div class="details-row">
          <span class="label">Employee:</span>
          <span class="value">${data.employeeName}${data.employeeId ? ` (ID: ${data.employeeId})` : ''}</span>
        </div>
        <div class="details-row">
          <span class="label">Amount Requested:</span>
          <span class="value" style="color: #0033A0; font-weight: 700;">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Submission Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${
          data.loanType
            ? `
        <div class="details-row">
          <span class="label">Loan Type:</span>
          <span class="value">${data.loanType}</span>
        </div>
        `
            : ''
        }
        ${
          data.purpose
            ? `
        <div class="details-row">
          <span class="label">Purpose:</span>
          <span class="value">${data.purpose}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="alert alert-warning">
        <strong>⚠️ Action Required:</strong><br>
        Please review this loan application and verify that all required documents are complete. Pre-screen the application before forwarding to the HR Officer.
      </div>

      <div style="background: #E3F2FD; padding: 18px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0033A0;">
        <strong style="color: #002776;">📋 Your Tasks:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #002776; line-height: 1.6;">
          <li>Verify employee eligibility</li>
          <li>Check document completeness</li>
          <li>Review loan amount against policy limits</li>
          <li>Mark as "Ready" or "Incomplete"</li>
        </ul>
      </div>

      <a href="${FRONTEND_URL}/hr/loans/${data.loanId}" class="button">Review Application</a>
      
      <p style="color: #6c757d; margin-top: 20px;">Expected SLA: Pre-screen within 1 business day of submission.</p>
    `),
      };

    case 'hr-loan-ready':
      return {
        subject: `✅ Loan Ready for Review - #${data.loanId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>A loan application has been pre-screened and is now <strong style="color: #4CAF50;">ready for your review</strong>.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Loan ID:</span>
          <span class="value">#${data.loanId}</span>
        </div>
        <div class="details-row">
          <span class="label">Employee:</span>
          <span class="value">${data.employeeName}${data.employeeId ? ` (ID: ${data.employeeId})` : ''}</span>
        </div>
        <div class="details-row">
          <span class="label">Amount:</span>
          <span class="value" style="color: #0033A0; font-weight: 700;">₱${data.amount?.toLocaleString()}</span>
        </div>
        ${
          data.prescreenedBy
            ? `
        <div class="details-row">
          <span class="label">Pre-Screened By:</span>
          <span class="value">${data.prescreenedBy}</span>
        </div>
        `
            : ''
        }
        <div class="details-row">
          <span class="label">Pre-Screen Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="details-row">
          <span class="label">Status:</span>
          <span class="value" style="color: #4CAF50; font-weight: 600;">✓ Ready for HR Officer Review</span>
        </div>
      </div>

      <div class="alert alert-info">
        <strong>📋 Pre-Screening Summary:</strong><br>
        All required documents have been verified and the application meets initial eligibility criteria. Ready for your detailed review and decision.
      </div>

      ${
        data.prescreenNotes
          ? `
      <div style="background: #F5F7FA; padding: 18px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0033A0;">
        <strong style="color: #002776;">📝 Assistant Notes:</strong>
        <p style="margin: 8px 0 0 0; color: #495057;">${data.prescreenNotes}</p>
      </div>
      `
          : ''
      }

      <a href="${FRONTEND_URL}/hr/loans/${data.loanId}/review" class="button">Review & Assign Approver</a>
      
      <p style="color: #6c757d; margin-top: 20px;">Please review and assign the appropriate approver based on the loan amount and type.</p>
    `),
      };

    case 'hr-loan-pending-approval':
      return {
        subject: `📝 Loan Awaiting Your Approval - #${data.loanId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>A loan application has been assigned to you for approval.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Loan ID:</span>
          <span class="value">#${data.loanId}</span>
        </div>
        <div class="details-row">
          <span class="label">Employee:</span>
          <span class="value" style="font-weight: 600;">${data.employeeName}${data.employeeId ? ` (ID: ${data.employeeId})` : ''}</span>
        </div>
        <div class="details-row">
          <span class="label">Amount:</span>
          <span class="value" style="color: #0033A0; font-weight: 700; font-size: 18px;">₱${data.amount?.toLocaleString()}</span>
        </div>
        ${
          data.loanType
            ? `
        <div class="details-row">
          <span class="label">Loan Type:</span>
          <span class="value">${data.loanType}</span>
        </div>
        `
            : ''
        }
        <div class="details-row">
          <span class="label">Assigned Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${
          data.assignedBy
            ? `
        <div class="details-row">
          <span class="label">Assigned By:</span>
          <span class="value">${data.assignedBy}</span>
        </div>
        `
            : ''
        }
        ${
          data.approvalLevel
            ? `
        <div class="details-row">
          <span class="label">Approval Level:</span>
          <span class="value" style="color: #0033A0; font-weight: 600;">${data.approvalLevel}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="alert alert-warning">
        <strong>⚠️ Your Approval Required:</strong><br>
        This loan application requires your review and approval decision. Please review the application details, supporting documents, and employee eligibility before making your decision.
      </div>

      ${
        data.employeeDetails
          ? `
      <div style="background: #F5F7FA; padding: 18px; border-radius: 6px; margin: 20px 0; border: 1px solid #E5E9F0;">
        <strong style="color: #0033A0;">👤 Employee Information:</strong>
        <div style="margin-top: 12px; line-height: 1.8; color: #495057;">
          ${data.employeeDetails.department ? `<div>Department: <strong>${data.employeeDetails.department}</strong></div>` : ''}
          ${data.employeeDetails.position ? `<div>Position: <strong>${data.employeeDetails.position}</strong></div>` : ''}
          ${data.employeeDetails.tenure ? `<div>Tenure: <strong>${data.employeeDetails.tenure}</strong></div>` : ''}
          ${data.employeeDetails.outstandingLoans !== undefined ? `<div>Outstanding Loans: <strong>${data.employeeDetails.outstandingLoans}</strong></div>` : ''}
        </div>
      </div>
      `
          : ''
      }

      <a href="${FRONTEND_URL}/hr/loans/${data.loanId}/approval" class="button">Review & Approve/Reject</a>
      
      <p style="color: #6c757d; margin-top: 20px;">Expected SLA: Please review within 2 business days. Contact the HR Officer if you need additional information.</p>
    `),
      };

    case 'hr-loan-rejected-by-approver':
      return {
        subject: `❌ Loan Rejected by Approver - #${data.loanId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>A loan application has been <strong style="color: #D32F2F;">rejected</strong> by the approver.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Loan ID:</span>
          <span class="value">#${data.loanId}</span>
        </div>
        <div class="details-row">
          <span class="label">Employee:</span>
          <span class="value">${data.employeeName}${data.employeeId ? ` (ID: ${data.employeeId})` : ''}</span>
        </div>
        <div class="details-row">
          <span class="label">Amount:</span>
          <span class="value">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Rejected By:</span>
          <span class="value" style="color: #D32F2F; font-weight: 600;">${data.rejectedBy || data.approverName}</span>
        </div>
        <div class="details-row">
          <span class="label">Rejection Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${
          data.reason
            ? `
        <div class="details-row">
          <span class="label">Reason:</span>
          <span class="value">${data.reason}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="alert alert-danger">
        <strong>❌ Rejection Notice:</strong><br>
        This loan application did not receive approval. The employee has been notified of the decision.
      </div>

      ${
        data.remarks
          ? `
      <div style="background: #FFEBEE; padding: 18px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #D32F2F;">
        <strong style="color: #C62828;">📝 Approver's Remarks:</strong>
        <p style="margin: 8px 0 0 0; color: #C62828;">${data.remarks}</p>
      </div>
      `
          : ''
      }

      <a href="${FRONTEND_URL}/hr/loans/${data.loanId}" class="button">View Details</a>
      
      <p style="color: #6c757d; margin-top: 20px;">No further action is required from you at this time. The loan status has been updated in the system.</p>
    `),
      };

    case 'hr-loan-fully-approved':
      return {
        subject: `✅ Loan Fully Approved - Ready for Release #${data.loanId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>Great news! A loan application has received <strong style="color: #4CAF50;">all required approvals</strong> and is ready for release.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Loan ID:</span>
          <span class="value">#${data.loanId}</span>
        </div>
        <div class="details-row">
          <span class="label">Employee:</span>
          <span class="value">${data.employeeName}${data.employeeId ? ` (ID: ${data.employeeId})` : ''}</span>
        </div>
        <div class="details-row">
          <span class="label">Approved Amount:</span>
          <span class="value" style="color: #4CAF50; font-weight: 700; font-size: 18px;">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Final Approval Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="details-row">
          <span class="label">Status:</span>
          <span class="value" style="color: #4CAF50; font-weight: 600;">✓ Ready for Trust Bank Release</span>
        </div>
      </div>

      <div class="alert alert-success">
        <strong>🎉 All Approvals Complete!</strong><br>
        This loan has been approved by all required signatories and is now ready to be released to Trust Bank for disbursement.
      </div>

      ${
        data.approvers && data.approvers.length > 0
          ? `
      <div style="background: #E8F5E9; padding: 18px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4CAF50;">
        <strong style="color: #2E7D32;">✓ Approval Chain:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #2E7D32; line-height: 1.6;">
          ${data.approvers.map((approver: any) => `<li>${approver.name} (${approver.role}) - ${new Date(approver.approvedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</li>`).join('')}
        </ul>
      </div>
      `
          : ''
      }

      <div class="alert alert-warning">
        <strong>⚠️ Next Step Required:</strong><br>
        Please proceed to release this loan to Trust Bank for processing and disbursement to the employee.
      </div>

      <a href="${FRONTEND_URL}/hr/loans/${data.loanId}/release" class="button">Release to Trust Bank</a>
      
      <p style="color: #6c757d; margin-top: 20px;">The employee has been notified of the approval. Please process the release within 1 business day.</p>
    `),
      };

    case 'hr-loan-released-notification':
      return {
        subject: `🏦 Loan Released Successfully - #${data.loanId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>A loan has been successfully released to Trust Bank.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Loan ID:</span>
          <span class="value">#${data.loanId}</span>
        </div>
        <div class="details-row">
          <span class="label">Employee:</span>
          <span class="value">${data.employeeName}${data.employeeId ? ` (ID: ${data.employeeId})` : ''}</span>
        </div>
        <div class="details-row">
          <span class="label">Amount Released:</span>
          <span class="value" style="color: #4CAF50; font-weight: 700;">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Released By:</span>
          <span class="value">${data.releasedBy || data.officerName}</span>
        </div>
        <div class="details-row">
          <span class="label">Release Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${
          data.transactionReference
            ? `
        <div class="details-row">
          <span class="label">Transaction Ref:</span>
          <span class="value" style="font-family: monospace; color: #0033A0; font-weight: 600;">${data.transactionReference}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="alert alert-success">
        <strong>✅ Release Confirmed:</strong><br>
        The loan has been successfully released to Trust Bank. The employee and relevant parties have been notified.
      </div>

      <a href="${FRONTEND_URL}/hr/loans/${data.loanId}" class="button">View Loan Details</a>
      
      <p style="color: #6c757d; margin-top: 20px;">The loan record has been updated with the release information and is now in the disbursement tracking phase.</p>
    `),
      };

    // HR Withdrawal Notifications

    case 'hr-withdrawal-submitted':
      return {
        subject: `🔔 New Withdrawal Request Submitted - #${data.withdrawalId}`,
        html: getBaseTemplate(`
      <h2>Hello ${data.userName},</h2>
      <p>A new provident fund withdrawal request has been submitted and requires your pre-screening.</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Withdrawal ID:</span>
          <span class="value">#${data.withdrawalId}</span>
        </div>
        <div class="details-row">
          <span class="label">Employee:</span>
          <span class="value">${data.employeeName}${data.employeeId ? ` (ID: ${data.employeeId})` : ''}</span>
        </div>
        <div class="details-row">
          <span class="label">Amount Requested:</span>
          <span class="value" style="color: #0033A0; font-weight: 700;">₱${data.amount?.toLocaleString()}</span>
        </div>
        <div class="details-row">
          <span class="label">Submission Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${
          data.withdrawalType
            ? `
        <div class="details-row">
          <span class="label">Type:</span>
          <span class="value">${data.withdrawalType}</span>
        </div>
        `
            : ''
        }
        ${
          data.reason
            ? `
        <div class="details-row">
          <span class="label">Reason:</span>
          <span class="value">${data.reason}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="alert alert-warning">
        <strong>⚠️ Action Required:</strong><br>
        Please review this withdrawal request and verify that all required supporting documents are complete.
      </div>

      <div style="background: #E3F2FD; padding: 18px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0033A0;">
        <strong style="color: #002776;">📋 Pre-Screening Checklist:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #002776; line-height: 1.6;">
          <li>Verify employee fund balance</li>
          <li>Check withdrawal eligibility</li>
          <li>Review supporting documentation</li>
          <li>Confirm withdrawal type and amount</li>
        </ul>
      </div>

      <a href="${FRONTEND_URL}/hr/withdrawals/${data.withdrawalId}" class="button">Review Request</a>
      
      <p style="color: #6c757d; margin-top: 20px;">Expected SLA: Pre-screen within 1 business day of submission.</p>
    `),
      };

    case 'hr-withdrawal-ready':
      return {
        subject: `✅ Withdrawal Ready for Review - #${data.withdrawalId}`,
        html: getBaseTemplate(` 
          <h2>Hello ${data.userName},</h2>
          <p>A withdrawal request has been pre-screened and is now <strong style="color: #4CAF50;">ready for your review</strong>.</p>

           <div class="details">
        <div class="details-row">
          <span class="label">Withdrawal ID:</span>
          <span class="value">#${data.withdrawalId}</span>
        </div>
        <div class="details-row">
          <span class="label">Employee:</span>
          <span class="value">${data.employeeName}${data.employeeId ? ` (ID: ${data.employeeId})` : ''}</span>
        </div>
        <div class="details-row">
          <span class="label">Amount:</span>
          <span class="value" style="color: #0033A0; font-weight: 700;">₱${data.amount?.toLocaleString()}</span>
        </div>
        ${
          data.prescreenedBy
            ? `
        <div class="details-row">
          <span class="label">Pre-Screened By:</span>
          <span class="value">${data.prescreenedBy}</span>
        </div>
        `
            : ''
        }
        <div class="details-row">
          <span class="label">Pre-Screen Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="details-row">
          <span class="label">Status:</span>
          <span class="value" style="color: #4CAF50; font-weight: 600;">✓ Ready for HR Officer Review</span>
        </div>
      </div>

       <div class="alert alert-info">
        <strong>📋 Pre-Screening Complete:</strong><br>
        All required documents have been verified and the request meets eligibility criteria. Ready for your approval decision.
      </div>

       ${
         data.prescreenNotes
           ? `
      <div style="background: #F5F7FA; padding: 18px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0033A0;">
        <strong style="color: #002776;">📝 Assistant Notes:</strong>
        <p style="margin: 8px 0 0 0; color: #495057;">${data.prescreenNotes}</p>
      </div>
      `
           : ''
       }


      <a href="${FRONTEND_URL}/hr/withdrawals/${data.withdrawalId}" class="button">Review & Make Decision</a>
      
      <p style="color: #6c757d; margin-top: 20px;">Please review and approve or reject this withdrawal request.</p>
      `),
      };

    case '2fa-reset':
      return {
        subject: '🔐 Two-Factor Authentication Reset',
        html: getBaseTemplate(`
          <h2>Hello ${data.userName},</h2>
          <p>Your two-factor authentication (2FA) has been reset by a system administrator.</p>
          
          <div class="alert alert-warning">
            <strong>⚠️ Action Required:</strong><br>
            For security reasons, you have been logged out of all sessions. You will need to set up 2FA again on your next login.
          </div>

          <div class="details">
            <div class="details-row">
              <span class="label">Reset Date:</span>
              <span class="value">${new Date().toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="details-row">
              <span class="label">Reset By:</span>
              <span class="value">System Administrator</span>
            </div>
          </div>

          <p><strong>What to do next:</strong></p>
          <ol style="line-height: 1.8; color: #495057;">
            <li>Log in to your account using your credentials</li>
            <li>Scan the new QR code with your authenticator app (Google Authenticator or similar)</li>
            <li>Enter the 6-digit code to complete setup</li>
          </ol>

          <a href="${FRONTEND_URL}/auth/login" class="button">Login Now</a>

          <p style="background: #FFF8E1; padding: 12px; border-left: 4px solid #FFD100; border-radius: 4px; margin-top: 20px;">
            <strong style="color: #7D6608;">🔒 Security Notice:</strong><br>
            <span style="color: #7D6608;">If you did not request this change or have concerns, please contact the IT department immediately.</span>
          </p>
        `),
      };

    case 'password-reset':
      return {
        subject: '🔑 Password Reset Confirmation',
        html: getBaseTemplate(`
          <h2>Hello ${data.userName},</h2>
          <p>Your password has been reset by a system administrator.</p>
          
          <div class="alert alert-warning">
            <strong>⚠️ Action Required:</strong><br>
            A temporary password has been set for your account. You must change it on your next login for security purposes.
          </div>

          <div class="details">
            <div class="details-row">
              <span class="label">Reset Date:</span>
              <span class="value">${new Date().toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="details-row">
              <span class="label">Reset By:</span>
              <span class="value">System Administrator</span>
            </div>
          </div>

          <p><strong>Next steps:</strong></p>
          <ol style="line-height: 1.8; color: #495057;">
            <li>Contact your administrator to receive your temporary password</li>
            <li>Log in using the temporary password</li>
            <li>You will be automatically prompted to create a new secure password</li>
          </ol>

          <a href="${FRONTEND_URL}/auth/login" class="button">Login Now</a>

          <p style="background: #FFEBEE; padding: 12px; border-left: 4px solid #D32F2F; border-radius: 4px; margin-top: 20px;">
            <strong style="color: #C62828;">🚨 Security Notice:</strong><br>
            <span style="color: #C62828;">If you did not request this password reset, please contact the IT department immediately.</span>
          </p>
        `),
      };

    case 'account-locked':
      return {
        subject: '🔒 Account Temporarily Locked',
        html: getBaseTemplate(`
          <h2>Hello ${data.userName},</h2>
          <p>Your account has been temporarily locked by a system administrator.</p>
          
          <div class="alert alert-danger">
            <strong>🔒 Account Status: Locked</strong><br>
            You will not be able to access the system until ${data.lockedUntil ? new Date(data.lockedUntil).toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'the lock is manually removed'}.
          </div>

          <div class="details">
            <div class="details-row">
              <span class="label">Lock Date:</span>
              <span class="value">${new Date().toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            ${
              data.lockedUntil
                ? `
            <div class="details-row">
              <span class="label">Unlock Time:</span>
              <span class="value" style="color: #D32F2F; font-weight: 600;">${new Date(data.lockedUntil).toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            `
                : ''
            }
            ${
              data.reason
                ? `
            <div class="details-row">
              <span class="label">Reason:</span>
              <span class="value">${data.reason}</span>
            </div>
            `
                : ''
            }
          </div>

          <p style="color: #6c757d;">If you believe this is a mistake or need immediate access, please contact your supervisor or the IT department.</p>
          
          <p style="background: #E3F2FD; padding: 12px; border-left: 4px solid #0033A0; border-radius: 4px; margin-top: 20px;">
            <strong style="color: #002776;">ℹ️ Need Help?</strong><br>
            <span style="color: #002776;">Contact IT Support for assistance or clarification regarding this account lock.</span>
          </p>
        `),
      };

    case 'account-unlocked':
      return {
        subject: '✅ Account Unlocked',
        html: getBaseTemplate(`
          <h2>Hello ${data.userName},</h2>
          <p>Good news! Your account has been unlocked and you can now access the system.</p>
          
          <div class="alert alert-success">
            <strong>✅ Account Status: Active</strong><br>
            You can now log in and access all features normally.
          </div>

          <div class="details">
            <div class="detais-row">
              <span class="label">Unlock Date:</span>
              <span class="value">${new Date().toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="details-row">
              <span class="label">Status:</span>
              <span class="value" style="color: #4CAF50; font-weight: 600;">Full Access Restored</span>
            </div>
          </div>

          <a href="${FRONTEND_URL}/auth/login" class="button">Login Now</a>

          <p style="color: #6c757d; margin-top: 20px;">If you continue to experience issues logging in, please contact the IT department for assistance.</p>
        `),
      };

    case 'general-notification':
    default:
      return {
        subject: data.title || 'Notification from FundXpert',
        html: getBaseTemplate(`
          <h2>Hello ${data.userName},</h2>
          <p>${data.message}</p>
          
          ${
            data.link
              ? `
            <a href="${data.link}" class="button">View Details</a>
          `
              : ''
          }
          
          <p style="color: #6c757d; margin-top: 20px;">This is an automated notification from the FundXpert system.</p>
        `),
      };
  }
}
