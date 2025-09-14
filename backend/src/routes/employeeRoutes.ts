import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as employeeController from '../controllers/employeeControllers.js';

export const employeeRouter = Router();

employeeRouter.get(
  '/overview',
  authMiddleware(),
  employeeController.getOverview
);

employeeRouter.get(
  '/contributions',
  authMiddleware(),
  employeeController.getContributions
);
