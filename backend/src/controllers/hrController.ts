import type { Request, Response } from 'express';
import {
  getHRContributions,
  getHRDashboardOverview,
  getLoanSummary,
  getPendingLoans,
  getPendingWithdrawals,
  getWithdrawalSummary,
} from '../services/hrService.js';
import type { HRContributionPeriod } from '../types/hrTypes.js';

// Overview
export async function getOverviewHandler(req: Request, res: Response) {
  try {
    const result = await getHRDashboardOverview();
    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching HR overview:', err);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
}

// Contribution trends
export async function getContributionTrendsHandler(
  req: Request,
  res: Response
) {
  try {
    const period = (req.query.period as HRContributionPeriod) || 'year';
    const result = await getHRContributions(period);
    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching contribution trends:', err);
    res.status(500).json({ error: 'Failed to fetch contribution trends' });
  }
}

// Loan summary
export async function getLoanSummaryHandler(req: Request, res: Response) {
  try {
    const result = await getLoanSummary();
    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching loan summary:', err);
    res.status(500).json({ error: 'Failed to fetch loan summary' });
  }
}

// Withdrawal summary
export async function getWithdrawalSummaryHandler(req: Request, res: Response) {
  try {
    const result = await getWithdrawalSummary();
    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching withdrawal summary:', err);
    res.status(500).json({ error: 'Failed to fetch withdrawal summary' });
  }
}

// Pending loans
export async function getPendingLoansHandler(req: Request, res: Response) {
  try {
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const result = await getPendingLoans(limit);
    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching pending loans:', err);
    res.status(500).json({ error: 'Failed to fetch pending loans' });
  }
}

// Pending withdrawals
export async function getPendingWithdrawalsHandler(
  req: Request,
  res: Response
) {
  try {
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const result = await getPendingWithdrawals(limit);
    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching pending withdrawals:', err);
    res.status(500).json({ error: 'Failed to fetch pending withdrawals' });
  }
}
