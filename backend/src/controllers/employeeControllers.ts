import type { Request, Response } from 'express';
import {
  getEmployeeContributions,
  getEmployeeOverview,
} from '../services/employeeService.js';
import type { UserRequest } from '../middleware/authMiddleware.js';

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

export async function getContributions(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const year = parseInt(
      (req.query.year as string) ?? new Date().getFullYear().toString(),
      10
    ); // Default to current year if no year is provided

    const data = await getEmployeeContributions(userId, year);

    res.json(data);
  } catch (err) {
    console.error('Error fetching contributions:', err);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
}
