import type { Request, Response } from 'express';
import {
  getEmployeeOverview,
  getContributionsSummary,
} from '../services/employeeService.js';
import type { UserRequest } from '../middleware/authMiddleware.js';
import { getEmployeeContributions } from '../services/hrContributionsService.js';

// Type guard
export function isAuthenticatedRequest(
  req: Request
): req is Request & { user: UserRequest } {
  return req.user !== undefined;
}

export async function getOverview(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // user.id comes from authMiddleware
    const userId = req.user.id;

    const overview = await getEmployeeOverview(userId);

    res.json(overview);
  } catch (err) {
    console.error('Error fetching employee overview:', err);

    res.status(500).json({
      error: 'Failed to fetch employee overview',
    });
  }
}

export async function getContributionsHandler(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { period } = req.query;

    const contributions = await getEmployeeContributions(
      userId,
      period?.toString() ?? 'all'
    );

    res.json(contributions);
  } catch (err) {
    console.error('Error fetching contributions:', err);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
}

export async function getContributionsSummaryHandler(
  req: Request,
  res: Response
) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;

    const contributions = await getContributionsSummary(userId);

    res.json(contributions);
  } catch (err) {
    console.error('Error fetching contributions:', err);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
}
