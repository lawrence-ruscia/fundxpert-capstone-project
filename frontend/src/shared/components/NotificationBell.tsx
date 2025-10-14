import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Notification } from '../types/notification';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate if there's a link
    if (notification.data?.link) {
      navigate(notification.data.link);
    }
  };

  // Get notification icon color based on type
  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs'
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-[380px] p-0'>
        {/* Header */}
        <div className='flex items-center justify-between border-b px-4 py-3'>
          <div className='flex items-center gap-2'>
            <h3 className='text-base font-semibold'>Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant='secondary' className='text-xs'>
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant='ghost'
              size='sm'
              className='h-8 px-2 text-xs'
              onClick={e => {
                e.stopPropagation();
                markAllAsRead();
              }}
            >
              <CheckCheck className='mr-1 h-3.5 w-3.5' />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className='h-[400px]'>
          {loading && notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2' />
              <p className='text-muted-foreground mt-3 text-sm'>
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <div className='bg-muted mb-3 rounded-full p-4'>
                <Inbox className='text-muted-foreground h-8 w-8' />
              </div>
              <p className='text-muted-foreground text-sm font-medium'>
                No notifications
              </p>
              <p className='text-muted-foreground mt-1 text-xs'>
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className='divide-y'>
              {notifications.map(notification => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex cursor-pointer gap-3 p-4 transition-colors ${
                    !notification.is_read
                      ? 'bg-50/50 hover:bg-100/50'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Icon */}
                  <div
                    className={`bg-primary/10 flex-shrink-0 rounded-lg p-2 ${getNotificationColor(notification.type)}`}
                  >
                    <Bell className='h-4 w-4' />
                  </div>

                  {/* Content */}
                  <div className='min-w-0 flex-1 space-y-1'>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='truncate text-sm font-semibold'>
                        {notification.title}
                      </span>
                      {!notification.is_read && (
                        <span className='h-2 w-2 flex-shrink-0 rounded-full bg-blue-500' />
                      )}
                    </div>
                    <p className='text-muted-foreground line-clamp-2 text-sm leading-relaxed'>
                      {notification.message}
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer - Optional: View All */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className='p-2'>
              <Button
                variant='ghost'
                className='h-9 w-full text-sm'
                onClick={() => navigate('/notifications')}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
