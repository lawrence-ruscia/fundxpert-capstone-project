import type { Role } from '@/shared/types/user';

export interface AdminStats {
  user_summary: {
    total_users: number;
    active_users: number;
    locked_accoutns: number;
    temp_password_users: number;
  };
  role_summary: { role: Role; count: number }[];
  login_trends: { date: string; success_count: number; failed_count: number }[];
  recent_actions: { user_id: number; action: string; created_at: string }[];
}




