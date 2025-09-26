import { Router } from 'express';
import {
  getOverviewHandler,
  getLoanSummaryHandler,
  getWithdrawalSummaryHandler,
  getPendingLoansHandler,
  getPendingWithdrawalsHandler,
  getContributionTrendsHandler,
  createEmployeeHandler,
  getEmployeeByIdHandler,
  getEmployeesHandler,
  resetEmployeePasswordHandler,
  updateEmployeeHandler,
  updateEmploymentStatusHandler,
  getDepartmentsHandler,
  getPositionsHandler,
} from '../controllers/hrController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const hrRouter = Router();

// Protect all routes
hrRouter.use(authMiddleware('HR'));

// Dashboard
hrRouter.get('/overview', getOverviewHandler);
hrRouter.get('/contributions/trends', getContributionTrendsHandler);
hrRouter.get('/loans/summary', getLoanSummaryHandler);
hrRouter.get('/withdrawals/summary', getWithdrawalSummaryHandler);
hrRouter.get('/loans/pending', getPendingLoansHandler);
hrRouter.get('/withdrawals/pending', getPendingWithdrawalsHandler);

// Employee Management
hrRouter.post('/employees', authMiddleware('HR'), createEmployeeHandler);
hrRouter.get('/employees', authMiddleware('HR'), getEmployeesHandler);
hrRouter.get('/departments', authMiddleware('HR'), getDepartmentsHandler);
hrRouter.get('/positions', authMiddleware('HR'), getPositionsHandler);
hrRouter.get('/employees/:id', authMiddleware('HR'), getEmployeeByIdHandler);
hrRouter.put('/employees/:id', authMiddleware('HR'), updateEmployeeHandler);
hrRouter.put(
  '/employees/:id/reset-password',
  authMiddleware('HR'),
  resetEmployeePasswordHandler
);
hrRouter.put(
  '/employees/:id/status',
  authMiddleware('HR'),
  updateEmploymentStatusHandler
);
