export interface AuditLog {
  id: number;
  user_id?: number | null;
  category: 'Auth' | 'UserManagement' | 'System';
  performed_by_role: 'Admin' | 'HR' | 'Employee' | 'System';
  action: string;
  target_id?: number | null;
  ip_address?: string | null;
  details?: Record<string, unknown> | null;
  timestamp: string;

  actor_name: string;
}

export type AuditSummaryCategory = {
  category: AuditLog['category'];
  total_actions: number;
};
