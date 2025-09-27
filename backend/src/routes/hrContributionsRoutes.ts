import { Router } from 'express';
import {
  recordContributionController,
  updateContributionController,
  getEmployeeContributionsController,
  getAllContributionsController,
  exportContributionsCSVController,
  exportContributionsExcelController,
  exportContributionsPDFController,
} from '../controllers/hrContributionsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const hrContributionsRouter = Router();

// HR only
hrContributionsRouter.post(
  '/',
  authMiddleware('HR'),
  recordContributionController
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
