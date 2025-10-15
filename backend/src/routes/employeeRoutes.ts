import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as employeeController from '../controllers/employeeControllers.js';
import * as projectionController from '../controllers/projectionController.js';
import {
  exportEmpContributionsCSV,
  exportEmpContributionsExcel,
  exportEmpContributionsPDF,
} from '../controllers/employeeContributionsExportController.js';

export const employeeRouter = Router();

employeeRouter.get(
  '/overview',
  authMiddleware('Employee'),
  employeeController.getOverview
);

employeeRouter.get(
  '/contributions',
  authMiddleware('Employee'),
  employeeController.getContributionsHandler
);

employeeRouter.get(
  '/contributions/summary',
  authMiddleware('Employee'),
  employeeController.getContributionsSummaryHandler
);

employeeRouter.get(
  '/contributions/export/csv',
  authMiddleware('Employee'),
  exportEmpContributionsCSV
);

employeeRouter.get(
  '/contributions/export/excel',
  authMiddleware('Employee'),
  exportEmpContributionsExcel
);

employeeRouter.get(
  '/contributions/export/pdf',
  authMiddleware('Employee'),
  exportEmpContributionsPDF
);

employeeRouter.post(
  '/projection',
  authMiddleware('Employee'),
  projectionController.projectionHandler
);
