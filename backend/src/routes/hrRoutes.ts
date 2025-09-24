import { Router } from 'express';
import {
  getOverviewHandler,
  getLoanSummaryHandler,
  getWithdrawalSummaryHandler,
  getPendingLoansHandler,
  getPendingWithdrawalsHandler,
  getContributionTrendsHandler,
} from '../controllers/hrController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const hrRouter = Router();

// Protect all routes → HR-only
hrRouter.use(authMiddleware('HR'));

// Dashboard overview
hrRouter.get('/overview', getOverviewHandler);

// Contribution trends
hrRouter.get('/contributions/trends', getContributionTrendsHandler);

// Loan + Withdrawal summaries
hrRouter.get('/loans/summary', getLoanSummaryHandler);
hrRouter.get('/withdrawals/summary', getWithdrawalSummaryHandler);

// Pending lists
hrRouter.get('/loans/pending', getPendingLoansHandler);
hrRouter.get('/withdrawals/pending', getPendingWithdrawalsHandler);
