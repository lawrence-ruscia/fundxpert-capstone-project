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
} from '../services/hrService.js';
import type { HRContributionPeriod } from '../types/hrTypes.js';

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
    const employee = await createEmployee(req.body);
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
    const employee = await updateEmployee(Number(req.params.id), req.body);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function deleteEmployeeHandler(req: Request, res: Response) {
  try {
    const employee = await deleteEmployee(Number(req.params.id));
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
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
    const result = await resetEmployeePassword(
      Number(req.params.id),
      req.body.generatedTempPassword
    );
    if (!result) return res.status(404).json({ error: 'Employee not found' });

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
    const employee = await updateEmploymentStatus(
      Number(req.params.id),
      req.body.status
    );
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
