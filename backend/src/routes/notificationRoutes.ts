import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const notifRouter = Router();

// All notification routes require authentication
notifRouter.get('/', authMiddleware(), getNotifications);
notifRouter.get('/unread-count', authMiddleware(), getUnreadCount);
notifRouter.post('/:id/mark-read', authMiddleware(), markAsRead);
notifRouter.post('/mark-all-read', authMiddleware(), markAllAsRead);
notifRouter.delete('/:id', authMiddleware(), deleteNotification);
