import {
  createUser,
  getAdminStats,
  getAllUsers,
  getAuditLogs,
  getUserById,
  getUserSummary,
  logUserAction,
  toggleLockUser,
  updateUser,
} from '../services/adminService.js';
import { resetEmployeePassword } from '../services/hrService.js';
import type { User } from '../types/user.js';
import {
  createNotification,
  notifyUsersByRole,
} from '../utils/notificationHelper.js';
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
      employment_status,
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
      !employment_status ||
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
      employment_status,
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

    if (user.role === 'HR') {
      // Notify new HR user
      await createNotification(
        Number(user.id),
        'Welcome to the System',
        `Your HR account has been created. Please log in with your temporary password and change it immediately.`,
        'info',
        { link: '/auth/login' }
      );

      // Notify all admins
      await notifyUsersByRole(
        'Admin',
        'New HR Account Created',
        `A new HR user (${email}) has been successfully created.`,
        'info',
        { userId: Number(user.id), link: `/admin/users/${user.id}` }
      );
    }

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
 * Lock or unlock user account with configurable duration
 *
 * Request body:
 * - locked: boolean - whether to lock or unlock the account
 * - duration?: number - lock duration in minutes (optional, defaults to 1440 = 24 hours)
 * - lockUntil?: string - specific unlock date/time in ISO format (optional, overrides duration)
 */
export async function toggleLockUserHandler(req: Request, res: Response) {
  try {
    // Authorization check
    if (!isAuthenticatedRequest(req) || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { userId } = req.params;
    const { locked, duration, lockUntil } = req.body;

    // Validation
    if (typeof locked !== 'boolean') {
      return res.status(400).json({ error: 'locked must be a boolean' });
    }

    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    // Validate duration if provided
    if (locked && duration !== undefined) {
      if (typeof duration !== 'number' || duration <= 0) {
        return res.status(400).json({
          error: 'duration must be a positive number (in minutes)',
        });
      }
      // Set a maximum lock duration (e.g., 1 year)
      const MAX_DURATION_MINUTES = 365 * 24 * 60;
      if (duration > MAX_DURATION_MINUTES) {
        return res.status(400).json({
          error: `duration cannot exceed ${MAX_DURATION_MINUTES} minutes (1 year)`,
        });
      }
    }

    // Validate lockUntil if provided
    if (locked && lockUntil) {
      const lockDate = new Date(lockUntil);
      if (isNaN(lockDate.getTime())) {
        return res.status(400).json({
          error: 'lockUntil must be a valid ISO date string',
        });
      }
      if (lockDate <= new Date()) {
        return res.status(400).json({
          error: 'lockUntil must be in the future',
        });
      }
    }

    // Execute lock/unlock
    const result = await toggleLockUser(userId, locked, duration, lockUntil);

    // Prepare audit log details
    let actionDescription = locked ? 'Locked account' : 'Unlocked account';
    const auditDetails: any = {
      targetId: Number(userId),
      ipAddress: req.ip ?? '::1',
    };

    if (locked && result.lockUntil) {
      auditDetails.lockUntil = result.lockUntil.toISOString();
      auditDetails.durationMinutes = duration;
      actionDescription += ` until ${result.lockUntil.toISOString()}`;
    }

    // Log the action
    await logUserAction(
      req.user.id,
      actionDescription,
      'System',
      'Admin',
      auditDetails
    );

    await createNotification(
      Number(userId),
      actionDescription,
      locked
        ? `Account locked until ${result.lockUntil?.toLocaleString()}`
        : 'Account unlocked',
      'error',
      {
        lockUntil: result.lockUntil,
      }
    );

    if (!locked) {
      const user = await getUserById(Number(userId));
      // Notify user
      await createNotification(
        parseInt(userId),
        'Account Unlocked',
        `Your account is now unlocked. You may log in again.`,
        'success',
        { link: '/auth/login' }
      );

      // Notify admin who unlocked
      await createNotification(
        req.user.id,
        'Account Unlocked',
        `User ${user.email} has been unlocked.`,
        'info',
        { userId: parseInt(userId) }
      );
    }

    res.json({
      success: true,
      locked: locked,
      lockUntil: result.lockUntil?.toISOString() ?? null,
      message: locked
        ? `Account locked until ${result.lockUntil?.toLocaleString()}`
        : 'Account unlocked',
    });
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

    const user = await getUserById(Number(req.params.userId));

    // Notify user
    await createNotification(
      user.id,
      'Password Reset',
      `Your password was successfully reset by an hr. Please log in with your temporary password and change it immediately.`,
      'warning',
      { link: '/auth/login' }
    );

    // Notify admin who performed action
    await createNotification(
      req.user.id,
      'Password Reset Performed',
      `A password reset was performed for ${user.email}.`,
      'info',
      { userId: user.id }
    );

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
