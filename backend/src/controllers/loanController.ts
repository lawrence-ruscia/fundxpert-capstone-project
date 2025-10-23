import type { Request, Response } from 'express';
import * as loanService from '../services/empLoanService.js';
import {
  cancelLoanRequest,
  recordLoanHistory,
} from '../services/hrLoanService.js';
import { isAuthenticatedRequest } from './employeeControllers.js';
import {
  createNotification,
  notifyHRByRole,
  notifyUsersByRole,
} from '../utils/notificationHelper.js';
import { getUserById } from '../services/adminService.js';

export async function getLoanEligibility(req: Request, res: Response) {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user.id; // populated by authMiddleware
    const eligibility = await loanService.checkLoanEligibility(userId);
    res.json(eligibility);
  } catch (err) {
    console.error('❌ Error checking loan eligibility:', err);
    res.status(500).json({ error: 'Failed to check loan eligibility' });
  }
}

export async function applyLoan(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.user.id;

    const {
      amount,
      repayment_term_months,
      purpose_category,
      purpose_detail,
      consent_acknowledged,
      co_maker_employee_id,
    } = req.body;

    const loan = await loanService.applyForLoan(
      userId,
      Number(amount),
      Number(repayment_term_months),
      purpose_category,
      consent_acknowledged,
      co_maker_employee_id,
      purpose_detail
    );

    await recordLoanHistory(
      Number(loan.id),
      'Employee applied for loan',
      userId
    );

    const loanId = loan.id;
    const employee = await getUserById(req.user.id);

    // Notify employee
    await createNotification(
      userId,
      'Loan Request Submitted',
      `Your loan request for ₱${parseFloat(amount).toLocaleString()} has been successfully submitted and is awaiting HR review.`,
      'success',
      {
        loanId,
        amount: loan.amount,
        link: `/employee/loans/${loanId}`,

        emailTemplate: 'loan-submitted',
      }
    );

    // Notify all HR Benefits Assitant
    await notifyHRByRole(
      'BenefitsAssistant',
      'New Loan Submitted',
      `A new loan request from ${req.user.name} (${employee.id}) is awaiting initial review.`,
      'info',
      {
        loanId: loan.id,
        employeeName: employee.name,
        employeeId: employee.employee_Id,
        amount: loan.amount,
        loanType: loan.purpose_category,
        purpose: loan.purpose_detail,
        link: `/hr/loans/${loanId}`,
        emailTemplate: 'hr-loan-submitted',
      },
      true // send email as well
    );

    res.status(201).json({ success: true, loan });
  } catch (err) {
    console.error('❌ Error applying for loan:', err);
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function getLoanStatus(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.user.id;
    const loan = await loanService.getActiveLoan(userId);

    if (!loan) {
      return res.json({ activeLoan: false });
    }

    res.json({
      activeLoan: true,
      loan,
    });
  } catch (err) {
    console.error('❌ Error fetching loan status:', err);
    res.status(500).json({ error: 'Failed to fetch loan status' });
  }
}

export async function getLoanHistory(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.user.id;
    const loans = await loanService.getLoanHistory(userId);

    res.json({ loans });
  } catch (err) {
    console.error('❌ Error fetching loan history:', err);
    res.status(500).json({ error: 'Failed to fetch loan history' });
  }
}

export async function getLoanById(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const loanId = parseInt(req.params.id ?? '', 10);

    const loan = await loanService.getLoanDetails(userId, loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    res.json(loan);
  } catch (err) {
    console.error('❌ Error fetching loan details:', err);
    res.status(500).json({ error: 'Failed to fetch loan details' });
  }
}

export async function cancelLoanRequestHandler(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { id } = req.params;
    const { remarks } = req.body;
    const loan = await cancelLoanRequest(
      Number(id),
      userId,
      'Employee',
      remarks
    );

    await recordLoanHistory(
      Number(id),
      'Loan cancelled by Employee',
      userId,
      remarks
    );

    const loanId = loan.id;

    //  NOTIFICATION: Notify employee
    await createNotification(
      loan.user_id,
      'Loan Cancelled',
      `Loan cancelled by Employee. You may submit a new request if necessary.`,
      'warning',
      {
        loanId,
        link: `/employee/loans/${loanId}`,
        cancelledBy: 'Employee',
        amount: loan.amount,
        reason: remarks,
        emailTemplate: 'loan-cancelled',
      }
    );

    res.json({ success: true, message: 'Loan cancelled' });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
