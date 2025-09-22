import type { Request, Response } from 'express';
import {
  checkWithdrawalEligibility,
  applyWithdrawal,
  getWithdrawalHistory,
  getWithdrawalDetails,
  cancelWithdrawal,
} from '../services/withdrawalService.js';
import { isAuthenticatedRequest } from './employeeControllers.js';

export async function getEligibility(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const eligibility = await checkWithdrawalEligibility(userId);
    res.json(eligibility);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function createWithdrawal(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const withdrawal = await applyWithdrawal(userId, req.body);
    res.status(201).json(withdrawal);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function listWithdrawals(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const withdrawals = await getWithdrawalHistory(userId);
    res.json(withdrawals);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function getWithdrawal(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { id } = req.params;
    const withdrawal = await getWithdrawalDetails(userId, Number(id));
    res.json(withdrawal);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}

export async function cancelWithdrawalRequest(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { id } = req.params;
    const result = await cancelWithdrawal(userId, Number(id));

    if (!result.success) {
      return res.status(400).json({ error: 'Cannot cancel withdrawal' });
    }

    res.json({ success: true, message: 'Withdrawal cancelled' });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
