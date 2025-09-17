import { getFundProjection } from '../services/projectionService.js';
import type { Request, Response } from 'express';
export async function projectionHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id ?? req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { years, growthRate, salaryOverride } = req.body;

    if (!years || years <= 0) {
      return res.status(400).json({ error: 'Projection years must be > 0' });
    }

    const result = await getFundProjection(userId, {
      years,
      growthRate,
      salaryOverride,
    });

    res.json(result);
  } catch (err) {
    console.error('❌ Projection error:', err);
    res.status(500).json({ error: 'Failed to generate projection' });
  }
}
