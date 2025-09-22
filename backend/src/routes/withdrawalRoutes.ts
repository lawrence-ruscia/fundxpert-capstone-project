import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getEligibility,
  createWithdrawal,
  listWithdrawals,
  getWithdrawal,
  cancelWithdrawalRequest,
} from '../controllers/withdrawalController.js';

export const empWithdrawalRouter = Router();

empWithdrawalRouter.use(authMiddleware('Employee'));

empWithdrawalRouter.get('/eligibility', getEligibility);

empWithdrawalRouter.post('/apply', createWithdrawal);

empWithdrawalRouter.get('/history', listWithdrawals);

empWithdrawalRouter.get('/:id', getWithdrawal);

empWithdrawalRouter.post('/:id/cancel', cancelWithdrawalRequest);
