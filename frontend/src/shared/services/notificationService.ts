import { api } from '../api/api';
import type {
  NotificationsResponse,
  UnreadCountResponse,
} from '../types/notification';

export const notificationService = {
  getNotifications: async (): Promise<NotificationsResponse> => {
    const res = await api.get('/notifications');
    return res.data;
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.post(`/notifications/${id}/mark-read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/mark-all-read');
  },

  deleteNotification: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
