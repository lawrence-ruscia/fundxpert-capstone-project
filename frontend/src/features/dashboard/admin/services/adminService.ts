import { api } from '@/shared/api/api';
import type { EmploymentStatus } from '../../employee/types/employeeOverview';
import type { Role, User } from '@/shared/types/user';
import type { UserSummary } from '../types/admin';
import type {
  AuditLog,
  AuditSummaryCategory,
} from '@/features/systemLogs/types/audit';

/**
 * Fetch all users with optional filters (role, status, search)
 */
export async function getAllUsers(filters?: {
  role?: Role;
  status?: EmploymentStatus;
  search?: string;
}): Promise<User[]> {
  const params = new URLSearchParams();

  if (filters?.role) params.append('role', filters.role);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);

  const res = await api.get('/admin/users', { params });
  return res.data.users;
}

/**
 * Fetch a single user
 */
export async function getUserById(userId: number): Promise<User> {
  const res = await api.get(`/admin/users/${userId}`);

  return res.data.users;
}

/**
 * Update user role or employment status
 */
export async function updateUser(
  userId: number,
  data: {
    role?: Role;
    employment_status?: EmploymentStatus;
  }
): Promise<{ success: boolean }> {
  const res = await api.patch(`/admin/users/${userId}`, data);
  return res.data;
}

/**
 * Lock or unlock a user account
 */
export async function toggleLockUser(userId: number, locked: boolean) {
  const res = await api.post(`/admin/users/${userId}/lock`, { locked });
  return res.data;
}

/**
 * Get latest 100 audit logs
 */
export async function getAuditLogs(): Promise<AuditLog[]> {
  const res = await api.get('/admin/logs');

  return res.data;
}

export async function getAdminStats() {
  const res = await api.get('/admin/stats');
  return res.data;
}

export async function getUserSummary(): Promise<UserSummary> {
  const res = await api.get('/admin/users/summary');
  return res.data;
}

export async function getAuditSummaryCategory(): Promise<
  AuditSummaryCategory[]
> {
  const res = await api.get('/admin/audit/summary');

  return res.data;
}
