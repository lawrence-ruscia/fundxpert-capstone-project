import {
  createUser,
  getAllUsers,
  getAuditLogs,
  logAdminAction,
  resetUserPassword,
  toggleLockuser,
  updateUser,
} from '../services/adminService.js';
import type { User } from '../types/user.js';
import { isAuthenticatedRequest } from './employeeControllers.js';
import type { Request, Response } from 'express';
/**
 *  GET /admin/users
 * List all users (filter by role, status, or search)
 */
export async function getAllUsersHandler(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req) || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { role, status, search } = req.query;

    const users = await getAllUsers(
      role?.toString(),
      status?.toString(),
      search?.toString()
    );

    res.json({ users });
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/**
 * POST /admin/users
 * Create new HR/Admin account
 */
export async function createUserHandler(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req) || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { employee_id, name, email, password, role } = req.body;
    if (!employee_id || !name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = (await createUser(
      employee_id,
      name,
      email,
      password,
      role
    )) as Partial<User>;

    await logAdminAction(req.user.id, 'Created user', user.id, { role });

    res.status(201).json({ user });
  } catch (err) {
    console.error('❌ Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

/**
 * PATCH /admin/users/:userId
 * Update role or employment status
 */
export async function updateUserHandler(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req) || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { userId } = req.params;
    const { role, employment_status } = req.body;

    if (!role && !employment_status) {
      return res.status(400).json({ error: 'No update fields provided' });
    }

    await updateUser(userId ?? '', role, employment_status);

    await logAdminAction(req.user.id, 'Updated user', Number(userId), {
      role,
      employment_status,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

/**
 * POST /admin/users/:userId/lock
 * Lock or unlock account
 */
export async function toggleLockUserHandler(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req) || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { userId } = req.params;
    const { locked } = req.body;

    await toggleLockuser(userId ?? '', locked);

    await logAdminAction(
      req.user.id,
      locked ? 'Locked account' : 'Unlocked account',
      Number(userId)
    );

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error locking/unlocking user:', err);
    res.status(500).json({ error: 'Failed to lock/unlock account' });
  }
}

/**
 * POST /admin/users/:userId/reset-password
 * Reset password and generate a temporary one
 */
export async function resetUserPasswordHandler(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req) || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { userId } = req.params;

    const tempPassword = await resetUserPassword(userId ?? '');

    await logAdminAction(req.user.id, 'Reset password', Number(userId));

    res.json({ success: true, tempPassword });
  } catch (err) {
    console.error('❌ Error resetting password:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

/**
 * GET /admin/logs
 * Fetch admin action logs
 */
export async function getAuditLogsHandler(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req) || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const logs = await getAuditLogs();

    res.json({ logs });
  } catch (err) {
    console.error('❌ Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
}
