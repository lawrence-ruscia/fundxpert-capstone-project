import type { Request, Response } from 'express';
import * as loanService from '../services/loanService.js';

export async function getLoanEligibility(req: Request, res: Response) {
  try {
    const userId = req.body.user.id; // populated by authMiddleware
    const eligibility = await loanService.checkLoanEligibility(userId);
    res.json(eligibility);
  } catch (err) {
    console.error('❌ Error checking loan eligibility:', err);
    res.status(500).json({ error: 'Failed to check loan eligibility' });
  }
}

export async function applyLoan(req: Request, res: Response) {
  try {
    const userId = req.body.user.id;
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
    const userId = req.body.user.id;
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
    const userId = req.body.user.id;
    const loans = await loanService.getLoanHistory(userId);

    res.json({ loans });
  } catch (err) {
    console.error('❌ Error fetching loan history:', err);
    res.status(500).json({ error: 'Failed to fetch loan history' });
  }
}
