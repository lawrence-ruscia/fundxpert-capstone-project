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

export const LOCK_DURATIONS = {
  ONE_HOUR: 60,
  SIX_HOURS: 360,
  TWELVE_HOURS: 720,
  ONE_DAY: 1440,
  THREE_DAYS: 4320,
  ONE_WEEK: 10080,
  ONE_MONTH: 43200,
  THREE_MONTHS: 129600,
  SIX_MONTHS: 259200,
  ONE_YEAR: 525600,
} as const;
