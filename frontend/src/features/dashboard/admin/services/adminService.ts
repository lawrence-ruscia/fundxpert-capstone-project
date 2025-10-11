import { api } from '@/shared/api/api';
import type { EmploymentStatus } from '../../employee/types/employeeOverview';
import type { AuditLog, Role, User } from '@/shared/types/user';
import type { UserSummary } from '../types/admin';

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

  return res.data;
}

/**
 * Create a new system user (HR or Admin)
 */
export async function createUser(data: {
  employee_id: string;
  name: string;
  email: string;
  password: string;
  role: 'HR' | 'Admin';
}): Promise<User> {
  const res = await api.post('/admin/users', data);
  return res.data.user;
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
 * Reset a user’s password — returns a temporary password
 */
export async function resetUserPassword(
  userId: number
): Promise<{ success: boolean; tempPassword: string }> {
  const res = await api.post(`/admin/users/${userId}/reset-password`);
  return res.data;
}

/**
 * Get latest 100 audit logs
 */
export async function getAuditLogs(): Promise<AuditLog[]> {
  const res = await api.get('/admin/logs');
  return res.data.logs;
}

export async function getAdminStats() {
  const res = await api.get('/admin/stats');
  return res.data;
}

export async function getUserSummary(): Promise<UserSummary> {
  const res = await api.get('/admin/users/summary');
  return res.data;
}
