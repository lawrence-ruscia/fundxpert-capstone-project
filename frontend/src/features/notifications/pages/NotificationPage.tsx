import { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Inbox,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  Notification,
  NotificationType,
} from '@/shared/types/notification';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import { Switch } from '@/components/ui/switch';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    error,
    refresh,
    lastUpdated,
  } = useNotifications();

  const [filter, setFilter] = useState('all');

  const getNotificationColor = (type: NotificationType) => {
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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    // Navigate if there's a link
    if (notification.data?.link) {
      navigate(notification.data.link);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  if (loading) {
    return <LoadingSpinner text={'Loading notifications...'} />;
  }

  if (error) {
    return <DataError message={error} />;
  }

  return (
    <div className='bg-background min-h-screen'>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>
                Notifications
              </h1>
              <p className='text-muted-foreground'>
                Manage and view all your notifications
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant='outline'
                size='sm'
                onClick={markAllAsRead}
                className='gap-2'
              >
                <CheckCheck className='h-4 w-4' />
                Mark all read
              </Button>
            )}
          </div>
          {/* Refresh Controls */}
          <div className='flex flex-wrap items-center gap-3'>
            {/* Last Updated */}
            {lastUpdated && (
              <div className='text-muted-foreground text-right text-sm'>
                <p className='font-medium'>Last updated</p>
                <p className='text-xs'>
                  {lastUpdated.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
            {/* Manual Refresh Button */}
            <Button
              variant='outline'
              size='sm'
              onClick={refresh}
              disabled={loading}
              className='gap-2'
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Loading Overlay for Background Refresh */}
        {loading && notifications && (
          <div className='bg-background/80 fixed inset-0 z-50 flex items-start justify-center pt-20 backdrop-blur-sm'>
            <div className='bg-card flex items-center gap-2 rounded-lg border p-4 shadow-lg'>
              <RefreshCw className='h-4 w-4 animate-spin' />
              <span className='text-sm font-medium'>Updating data...</span>
            </div>
          </div>
        )}

        {/* Tabs Filter */}
        <Tabs value={filter} onValueChange={setFilter} className='mt-6 mb-6'>
          <TabsList>
            <TabsTrigger value='all'>
              All
              <Badge variant='secondary' className='ml-2 text-xs'>
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value='unread'>
              Unread
              {unreadCount > 0 && (
                <Badge variant='secondary' className='ml-2 text-xs'>
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='read'>Read</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <Card className='overflow-hidden'>
          {filteredNotifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-16'>
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
            <div className='divide-border divide-y'>
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`flex cursor-pointer gap-3 p-4 transition-colors ${
                    !notification.is_read
                      ? 'bg-accent/50 hover:bg-accent'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Icon */}
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg p-2 ${getNotificationColor(notification.type)}`}
                  >
                    <Bell className='h-4 w-4' />
                  </div>

                  {/* Content */}
                  <div className='min-w-0 flex-1 space-y-1'>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='text-sm font-semibold'>
                        {notification.title}
                      </span>
                      {!notification.is_read && (
                        <span className='bg-primary h-2 w-2 flex-shrink-0 rounded-full' />
                      )}
                    </div>
                    <p className='text-muted-foreground text-sm leading-relaxed'>
                      {notification.message}
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className='flex flex-shrink-0 items-start gap-1'>
                    {!notification.is_read && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8'
                        onClick={e => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <CheckCheck className='h-4 w-4' />
                      </Button>
                    )}
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-destructive hover:bg-destructive/10 h-8 w-8'
                      onClick={e => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
