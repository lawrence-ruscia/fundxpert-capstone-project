import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getLoanEligibility,
  applyLoan,
  getLoanStatus,
  getLoanHistory,
  getLoanById,
} from '../controllers/loanController.js';

export const empLoanRouter = Router();

empLoanRouter.get(
  '/eligibility',
  authMiddleware('Employee'),
  getLoanEligibility
);

empLoanRouter.get('/', authMiddleware('Employee'), getLoanHistory);
empLoanRouter.post('/apply', authMiddleware('Employee'), applyLoan);
empLoanRouter.get('/status', authMiddleware('Employee'), getLoanStatus);
empLoanRouter.get('/history', authMiddleware('Employee'), getLoanHistory);
empLoanRouter.get('/:id', authMiddleware('Employee'), getLoanById);
