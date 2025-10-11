import type { Role } from '@/shared/types/user';
export interface UserSummary {
  total_users: number;
  active_users: number;
  locked_accounts: number;
  temp_password_users: number;
}

export interface RoleSummary {
  role: Role;
  count: number;
}

export interface LoginTrend {
  date: string;
  success_count: number;
  failed_count: number;
}

export interface RecentAction {
  user_id: number;
  action: string;
  timestamp: string;
}

export interface AdminStats {
  user_summary: UserSummary;
  role_summary: RoleSummary[];
  login_trends: LoginTrend[];
  recent_actions: RecentAction[];
}
