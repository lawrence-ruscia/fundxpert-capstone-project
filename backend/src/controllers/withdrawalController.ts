import type { Request, Response } from 'express';
import {
  checkWithdrawalEligibility,
  applyWithdrawal,
  getWithdrawalHistory,
  getWithdrawalDetails,
  cancelWithdrawal,
} from '../services/withdrawalService.js';
import { isAuthenticatedRequest } from './employeeControllers.js';
import { recordWithdrawalHistory } from '../services/hrWithdrawalService.js';
import {
  createNotification,
  notifyHRByRole,
  notifyUsersByRole,
} from '../utils/notificationHelper.js';
import { getEmployeeById } from '../services/hrService.js';
import { getUserById } from '../services/adminService.js';

export async function getEligibility(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const eligibility = await checkWithdrawalEligibility(userId);
    res.json(eligibility);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function createWithdrawal(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const withdrawal = await applyWithdrawal(userId, req.body);

    await recordWithdrawalHistory(
      Number(withdrawal.id),
      'Employee requested a withdrawal',
      userId
    );

    const withdrawalId = withdrawal.id;
    const employee = await getEmployeeById(req.user.id);

    // Notify employee
    await createNotification(
      userId,
      'Withdrawal Request Submitted',
      `Your withdrawal request has been submitted for HR review.`,
      'success',
      {
        withdrawalId,
        amount: withdrawal.payout_amount,
        withdrawalType: withdrawal.request_type,
        purpose: withdrawal.purpose_detail,
        link: `/employee/withdrawals/${withdrawalId}`,
        emailTemplate: 'withdrawal-submitted',
      }
    );

    // Notify HR Assistants
    await notifyHRByRole(
      'BenefitsAssistant',
      'New Withdrawal Request',
      `A new withdrawal request from ${req.user.name} (${employee.employee_id}) is awaiting pre-screening.`,
      'info',
      {
        withdrawalId,
        amount: withdrawal.payout_amount,
        withdrawalType: withdrawal.request_type,
        reason: withdrawal.purpose_detail,
        employeeName: employee.name,
        employeeId: employee.employee_id,
        link: `/hr/withdrawals/${withdrawalId}`,
        emailTemplate: 'hr-withdrawal-submitted',
      }
    );

    res.status(201).json(withdrawal);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function listWithdrawals(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const withdrawals = await getWithdrawalHistory(userId);
    res.json(withdrawals);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function getWithdrawal(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { id } = req.params;
    const withdrawal = await getWithdrawalDetails(userId, Number(id));
    res.json(withdrawal);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}

export async function cancelWithdrawalRequest(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { id } = req.params;
    const result = await cancelWithdrawal(userId, Number(id));

    if (!result.success) {
      return res.status(400).json({ error: 'Cannot cancel withdrawal' });
    }

    const request = result.request;
    await recordWithdrawalHistory(
      Number(id),
      'Withdrawal request cancelled by Employee',
      userId,
      request.notes
    );

    const assistantId = request.assistant_id;
    const officerId = request.officer_id;

    const employee = await getUserById(request.user_id);
    // Notify HR assistant
    await createNotification(
      assistantId,
      'Withdrawal Request Cancelled',
      `Withdrawal request #${request.id} was cancelled by the Employee.`,
      'warning',
      {
        withdrawalId: request.id,
        amount: request.payout_amount,
        employeeName: employee.name,
        employeeId: employee.employee_id,
        withdrawalType: request.purpose_category,
        cancelledby: 'HR Benefits Officer',
        reason: request.notes,
        canReapply: true,
        link: `/hr/withdrawals/${request.id}`,
        emailTemplate: 'hr-withdrawal-cancelled',
      }
    );

    if (officerId) {
      // Notify HR officer if request was already pre-screened
      await createNotification(
        assistantId,
        'Withdrawal Request Cancelled',
        `Withdrawal request #${request.id} was cancelled by the Employee.`,
        'warning',
        {
          withdrawalId: request.id,
          amount: request.payout_amount,
          employeeName: employee.name,
          employeeId: employee.employee_id,
          withdrawalType: request.purpose_category,
          cancelledby: 'HR Benefits Officer',
          reason: request.notes,
          canReapply: true,
          link: `/hr/withdrawals/${request.id}`,
          emailTemplate: 'hr-withdrawal-cancelled',
        }
      );
    }

    res.json({ success: true, message: 'Withdrawal cancelled' });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
