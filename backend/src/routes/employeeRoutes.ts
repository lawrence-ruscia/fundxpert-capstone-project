import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as employeeController from '../controllers/employeeControllers.js';
import * as projectionController from '../controllers/projectionController.js';

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

employeeRouter.post(
  '/projection',
  authMiddleware('Employee'),
  projectionController.projectionHandler
);
