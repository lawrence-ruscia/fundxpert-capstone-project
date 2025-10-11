import { Router } from 'express';
import {
  getAllUsersHandler,
  createUserHandler,
  updateUserHandler,
  toggleLockUserHandler,
  resetUserPasswordHandler,
  getUserByIdHandler,
  getAdminStatsHandler,
  getAuditLogsHandler,
} from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const adminRouter = Router();
adminRouter.use(authMiddleware('Admin'));

adminRouter.get('/users', getAllUsersHandler);
adminRouter.get('/users/:userId', getUserByIdHandler);
adminRouter.post('/users', createUserHandler);
adminRouter.patch('/users/:userId', updateUserHandler);
adminRouter.post('/users/:userId/lock', toggleLockUserHandler);
adminRouter.post('/users/:userId/reset-password', resetUserPasswordHandler);
adminRouter.get('/logs', getAuditLogsHandler);
adminRouter.get('/stats', getAdminStatsHandler);
