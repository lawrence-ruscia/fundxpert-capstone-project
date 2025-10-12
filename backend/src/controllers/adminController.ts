import {
  createUser,
  getAdminStats,
  getAllUsers,
  getAuditLogs,
  getUserById,
  getUserSummary,
  logUserAction,
  toggleLockuser,
  updateUser,
} from '../services/adminService.js';
import { resetEmployeePassword } from '../services/hrService.js';
import type { User } from '../types/user.js';
import { isAuthenticatedRequest } from './employeeControllers.js';
import type { Request, Response } from 'express';

/**
 * GET /admin/users
 * List all users (fil`ter by ro  , status, or search)
 */
export async function getAllUsersHandler(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req) || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { role, status, search, startDate, endDate } = req.query;

    const users = await getAllUsers({
      role: role?.toString(),
      status: status?.toString(),
      search: search?.toString(),
      startDate: startDate?.toString(),
      endDate: endDate?.toString(),
    });

    res.json({ users });
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/**
 * GET /admin/users/:userId
 * Get user by id
 */
export async function getUserByIdHandler(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req) || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { userId } = req.params;

    const users = await getUserById(Number(userId));

    res.json({ users });
  } catch (err) {
    console.error('❌ Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
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

    const {
      name,
      email,
      employee_id,
      department_id,
      position_id,
      salary,
      date_hired,
      role,
      generatedTempPassword,
    } = req.body;
    if (
      !name ||
      !email ||
      !employee_id ||
      !department_id ||
      !position_id ||
      !salary ||
      !date_hired ||
      !role ||
      !generatedTempPassword
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = (await createUser({
      name,
      email,
      employee_id,
      department_id,
      position_id,
      salary,
      date_hired,
      role,
      generatedTempPassword,
    })) as Partial<User>;

    await logUserAction(
      req.user.id,
      'Created user',
      'UserManagement',
      'Admin',
      {
        targetId: Number(user.id),
        details: {
          role,
        },
        ipAddress: req.ip ?? '::1',
      }
    );

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

    const user = await updateUser(Number(req.params.userId), req.body);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await logUserAction(
      req.user.id,
      'Updated user',
      'UserManagement',
      'Admin',
      {
        targetId: Number(user.id),
        details: { changedFields: Object.keys(req.body) },
        ipAddress: req.ip ?? '::1',
      }
    );

    res.json(user);
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

    await logUserAction(
      req.user.id,
      locked ? 'Locked account' : 'Unlocked account',
      'System',
      'Admin',
      {
        targetId: Number(userId),
        ipAddress: req.ip ?? '::1',
      }
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

    const result = await resetEmployeePassword(
      Number(req.params.userId),
      req.body.generatedTempPassword
    );
    if (!result) return res.status(404).json({ error: 'User not found' });

    await logUserAction(req.user.id, 'Reset user password', 'Auth', 'Admin', {
      targetId: Number(req.params.id),
      ipAddress: req.ip ?? '::1',
    });

    res.json({
      message: 'Temporary password generated',
      tempPassword: result.temp_password,
      expiresAt: result.expires_at,
    });
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
    const logs = await getAuditLogs();

    res.json({ logs });
  } catch (err) {
    console.error('❌ Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}

/**
 * GET /admin/stats
 * Returns summary statistics for dashboard cards
 */
export async function getAdminStatsHandler(req: Request, res: Response) {
  try {
    const stats = await getAdminStats();

    return res.json(stats);
  } catch (err) {
    console.error('❌ Error fetching admin stats:', err);
    return res.status(500).json({ error: 'Failed to fetch system stats' });
  }
}

export async function getUserSummaryHandler(req: Request, res: Response) {
  try {
    const summary = await getUserSummary();

    return res.json(summary);
  } catch (err) {
    console.error('❌ Error fetching user summary:', err);
    return res.status(500).json({ error: 'Failed to fetch user summary' });
  }
}
