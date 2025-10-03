import { Router } from 'express';
import {
  recordContributionController,
  updateContributionController,
  getEmployeeContributionsController,
  getAllContributionsController,
  exportContributionsExcelController,
  exportContributionsPDFController,
  findEmployeeByEmployeeIdController,
  searchEmployeesController,
  getContributionsByIdController,
  getEmployeeByContributionIdController,
  getEmployeeContributionSummary,
  exportEmployeeContributionsPDFController,
  exportContributionsCSVController,
} from '../controllers/hrContributionsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const hrContributionsRouter = Router();

// HR only
hrContributionsRouter.get(
  '/lookup/:id',
  authMiddleware('HR'),
  getContributionsByIdController
);

hrContributionsRouter.post(
  '/',
  authMiddleware('HR'),
  recordContributionController
);

hrContributionsRouter.get(
  '/:id/employee',
  authMiddleware('HR'),
  getEmployeeByContributionIdController
);

hrContributionsRouter.put(
  '/:id',
  authMiddleware('HR'),
  updateContributionController
);

hrContributionsRouter.get(
  '/employee/:userId',
  authMiddleware('HR'),
  getEmployeeContributionsController
);

hrContributionsRouter.get(
  '/',
  authMiddleware('HR'),
  getAllContributionsController
);

hrContributionsRouter.get(
  '/export/csv',
  authMiddleware('HR'),
  exportContributionsCSVController
);

hrContributionsRouter.get(
  '/export/excel',
  authMiddleware('HR'),
  exportContributionsExcelController
);

hrContributionsRouter.get(
  '/export/pdf',
  authMiddleware('HR'),
  exportContributionsPDFController
);

hrContributionsRouter.get(
  '/lookup/:employeeId',
  authMiddleware('HR'),
  findEmployeeByEmployeeIdController
);

hrContributionsRouter.get(
  '/employees/search',
  authMiddleware('HR'),
  searchEmployeesController
);

hrContributionsRouter.get(
  '/employees/:id/summary',
  authMiddleware('HR'),
  getEmployeeContributionSummary
);
