import type { Request, Response } from 'express';
import * as loanService from '../services/loanService.js';
import { isAuthenticatedRequest } from './employeeControllers.js';

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

    console.log(`Request body: ${req.body}`);
    const {
      amount,
      repayment_term_months,
      purpose,
      consent_acknowledged,
      co_maker_employee_id,
      notes,
    } = req.body;

    const loan = await loanService.applyForLoan(
      userId,
      Number(amount),
      Number(repayment_term_months),
      purpose,
      consent_acknowledged,
      co_maker_employee_id ? Number(co_maker_employee_id) : undefined,
      notes
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
