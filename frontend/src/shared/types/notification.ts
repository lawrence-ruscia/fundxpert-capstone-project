// types/notification.ts
export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'loan'
  | 'withdrawal';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  data?: {
    loanId?: number;
    withdrawalId?: number;
    link?: string;
    [key: string]: unknown;
  };
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
}

export interface UnreadCountResponse {
  unreadCount: number;
}
