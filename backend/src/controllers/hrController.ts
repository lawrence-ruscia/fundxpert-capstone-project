import type { Request, Response } from 'express';
import {
  createEmployee,
  getEmployees,
  getHRContributions,
  getHRDashboardOverview,
  getLoanSummary,
  getPendingLoans,
  getPendingWithdrawals,
  getWithdrawalSummary,
  resetEmployeePassword,
  updateEmployee,
  updateEmploymentStatus,
  getEmployeeById,
  getDepartments,
  getPositions,
  deleteEmployee,
  searchHR,
} from '../services/hrService.js';
import type { HRContributionPeriod } from '../types/hrTypes.js';
import { logUserAction } from '../services/adminService.js';
import { isAuthenticatedRequest } from './employeeControllers.js';

// Overview
export async function getOverviewHandler(req: Request, res: Response) {
  try {
    const result = await getHRDashboardOverview();
    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching HR overview:', err);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
}

// Contribution trends
export async function getContributionTrendsHandler(
  req: Request,
  res: Response
) {
  try {
    const period = (req.query.period as HRContributionPeriod) || 'year';
    const result = await getHRContributions(period);
    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching contribution trends:', err);
    res.status(500).json({ error: 'Failed to fetch contribution trends' });
  }
}

// Loan summary
export async function getLoanSummaryHandler(req: Request, res: Response) {
  try {
    const result = await getLoanSummary();
    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching loan summary:', err);
    res.status(500).json({ error: 'Failed to fetch loan summary' });
  }
}

// Withdrawal summary
export async function getWithdrawalSummaryHandler(req: Request, res: Response) {
  try {
    const result = await getWithdrawalSummary();
    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching withdrawal summary:', err);
    res.status(500).json({ error: 'Failed to fetch withdrawal summary' });
  }
}

// Pending loans
export async function getPendingLoansHandler(req: Request, res: Response) {
  try {
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const result = await getPendingLoans(limit);
    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching pending loans:', err);
    res.status(500).json({ error: 'Failed to fetch pending loans' });
  }
}

// Pending withdrawals
export async function getPendingWithdrawalsHandler(
  req: Request,
  res: Response
) {
  try {
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const result = await getPendingWithdrawals(limit);
    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching pending withdrawals:', err);
    res.status(500).json({ error: 'Failed to fetch pending withdrawals' });
  }
}

export async function createEmployeeHandler(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const employee = await createEmployee(req.body);

    await logUserAction(
      req.user.id,
      'Created employee',
      'UserManagement',
      'HR',
      {
        targetId: Number(employee.id),
        details: {
          department: employee.department,
          position: employee.position,
        },
        ipAddress: req.ip ?? '::1',
      }
    );

    res.status(201).json(employee);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function getEmployeesHandler(req: Request, res: Response) {
  try {
    const employees = await getEmployees(req.query);
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getDepartmentsHandler(req: Request, res: Response) {
  try {
    const departments = await getDepartments();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getPositionsHandler(req: Request, res: Response) {
  try {
    const positions = await getPositions();
    res.json(positions);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getEmployeeByIdHandler(req: Request, res: Response) {
  try {
    const employee = await getEmployeeById(Number(req.params.id));
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function updateEmployeeHandler(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const employee = await updateEmployee(Number(req.params.id), req.body);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    await logUserAction(
      req.user.id,
      'Updated employee',
      'UserManagement',
      'HR',
      {
        targetId: Number(employee.id),
        details: {
          changedFields: Object.keys(req.body),
        },

        ipAddress: req.ip ?? '::1',
      }
    );

    res.json(employee);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function deleteEmployeeHandler(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const employee = await deleteEmployee(Number(req.params.id));
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    await logUserAction(
      req.user.id,
      'Deleted employee',
      'UserManagement',
      'HR',
      {
        targetId: Number(req.params.id),
        ipAddress: req.ip ?? '::1',
      }
    );

    res.json(employee);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function resetEmployeePasswordHandler(
  req: Request,
  res: Response
) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await resetEmployeePassword(
      Number(req.params.id),
      req.body.generatedTempPassword
    );

    if (!result) return res.status(404).json({ error: 'Employee not found' });

    await logUserAction(
      req.user.id,
      'Reset employee password',
      'System',
      'HR',
      {
        targetId: Number(req.params.id),

        ipAddress: req.ip ?? '::1',
      }
    );

    // Send temp password back to HR (they will relay securely to employee)
    res.json({
      message: 'Temporary password generated',
      tempPassword: result.temp_password,
      expiresAt: result.expires_at,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function updateEmploymentStatusHandler(
  req: Request,
  res: Response
) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const employee = await updateEmploymentStatus(
      Number(req.params.id),
      req.body.status
    );

    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    await logUserAction(
      req.user.id,
      'Update employee employment status',
      'UserManagement',
      'HR',
      {
        targetId: Number(req.params.id),
        details: {
          updatedStatus: req.body.status,
        },
        ipAddress: req.ip ?? '::1',
      }
    );
    res.json(employee);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function searchHRHandler(req: Request, res: Response) {
  try {
    const q = (req.query.q as string) || '';
    if (q.length < 2) {
      return res
        .status(400)
        .json({ error: 'Query must be at least 2 characters' });
    }

    const hr = await searchHR(q);
    res.json(hr);
  } catch (err) {
    console.error('❌ Error searching HRs:', err);
    res.status(500).json({ error: 'Failed to search HRs' });
  }
}
