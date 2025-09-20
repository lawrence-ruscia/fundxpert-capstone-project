import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getLoanEligibility,
  applyLoan,
  getLoanStatus,
  getLoanHistory,
} from '../controllers/loanController.js';

export const empLoanRouter = Router();

empLoanRouter.get(
  '/eligibility',
  authMiddleware('Employee'),
  getLoanEligibility
);
empLoanRouter.post('/apply', authMiddleware('Employee'), applyLoan);
empLoanRouter.get('/status', authMiddleware('Employee'), getLoanStatus);
empLoanRouter.get('/history', authMiddleware('Employee'), getLoanHistory);
