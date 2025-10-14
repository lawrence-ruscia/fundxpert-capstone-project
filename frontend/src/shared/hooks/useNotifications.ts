import { useCallback, useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { useSmartPolling } from './useSmartPolling';
import { toast } from 'sonner';

export function useNotifications() {
  const fetchNotifications = useCallback(async () => {
    return await notificationService.getNotifications();
  }, []);

  const { data, loading, error, refresh, lastUpdated } = useSmartPolling(
    fetchNotifications,
    {
      context: 'custom',
      interval: 30_000, // Poll every 30 seconds
      enabled: true,
      pauseWhenHidden: false, // Keep polling even when tab is hidden
      pauseWhenInactive: false, // Keep polling even when inactive
    }
  );

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: number) => {
    await notificationService.markAsRead(id);
    refresh(); // Refresh to update UI
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    refresh();
  };

  const deleteNotification = async (id: number) => {
    await notificationService.deleteNotification(id);
    refresh();
  };

  const previousUnreadCountRef = useRef(unreadCount);

  useEffect(() => {
    if (previousUnreadCountRef.current < unreadCount) {
      const newNotifications = notifications
        .filter(n => !n.is_read)
        .slice(0, unreadCount - previousUnreadCountRef.current);

      newNotifications.forEach(notification => {
        toast.success(notification.title, {
          description: notification.message,
        });
      });
    }
    previousUnreadCountRef.current = unreadCount;
  }, [unreadCount, notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    lastUpdated,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
