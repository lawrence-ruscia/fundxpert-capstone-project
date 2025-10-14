import type { Request, Response } from 'express';
import {
  cancelWithdrawal,
  getAllWithdrawals,
  getWithdrawalAccess,
  getWithdrawalById,
  getWithdrawalHistory,
  getWithdrawalStatusSummary,
  markWithdrawalIncomplete,
  markWithdrawalReady,
  moveWithdrawalToReview,
  recordWithdrawalHistory,
  releaseWithdrawalFunds,
  reviewWithdrawalDecision,
} from '../services/hrWithdrawalService.js';
import { isAuthenticatedRequest } from './employeeControllers.js';
import { getEmployeeById } from '../services/hrService.js';
import { Parser as Json2CsvParser } from 'json2csv';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { SHEET_PASSWORD } from '../config/security.config.js';
import path from 'path';
import { createNotification } from '../utils/notificationHelper.js';
import { logUserAction } from '../services/adminService.js';

export const markWithdrawalReadyHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user || req.user.role !== 'HR')
      return res.status(403).json({ error: 'Access denied' });

    const { withdrawalId } = req.params;
    const assistantId = req.user.id;

    const access = await getWithdrawalAccess(assistantId, Number(withdrawalId));
    if (!access.canMarkReady) {
      return res.status(403).json({
        error:
          'You are not authorized to mark this withdrawal request as ready',
      });
    }

    const request = await markWithdrawalReady(
      Number(withdrawalId),
      assistantId
    );
    if (!request)
      return res.status(400).json({
        error: 'Withdrawal request not found or not in Pending state',
      });

    await recordWithdrawalHistory(
      request.id,
      'Marked ready for review',
      assistantId
    );

    // Notify employee
    await createNotification(
      request.user_id,
      'Withdrawal Request Incomplete',
      `Your withdrawal request is missing required documents. Please update and resubmit.`,
      'warning',
      {
        withdrawalId: Number(withdrawalId),
        link: `/employee/withdrawals/${withdrawalId}`,
      }
    );

    res.json({ success: true, withdrawal: request });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: 'Failed to mark withdrawal request as ready' });
  }
};

export const markWithdrawalIncompleteHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user || req.user.role !== 'HR')
      return res.status(403).json({ error: 'Access denied' });

    const { withdrawalId } = req.params;
    const { remarks } = req.body;
    const assistantId = req.user.id;

    const access = await getWithdrawalAccess(assistantId, Number(withdrawalId));
    if (!access.canMarkIncomplete) {
      return res.status(403).json({
        error:
          'You are not authorized to mark this withdrawal request as incomplete',
      });
    }

    const request = await markWithdrawalIncomplete(
      Number(withdrawalId),
      assistantId,
      remarks
    );
    if (!request)
      return res
        .status(400)
        .json({ error: 'Withdrawal not found or not in Pending state' });

    await recordWithdrawalHistory(
      request.id,
      'Marked incomplete by HR assistant',
      assistantId,
      remarks
    );

    // NOTIFICATION: Notify employee
    await createNotification(
      request.user_id,
      'Withdrawal Request Incomplete',
      `Your loan request requires additional documents. Please upload the missing files to continue.`,
      'warning',
      {
        withdrawalId: Number(withdrawalId),
        link: `/employee/withdrawals/${withdrawalId}`,
      }
    );
    res.json({ success: true, withdrawal: request });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: 'Failed to mark withdrawal request as incomplete' });
  }
};

export const moveWithdrawalToReviewHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { withdrawalId } = req.params;
    const officerId = req.user.id;

    const access = await getWithdrawalAccess(officerId, Number(withdrawalId));
    if (!access.canMoveToReview) {
      return res.status(403).json({
        error:
          'You are not authorized to move this withdrawal request for officer review',
      });
    }

    const request = await moveWithdrawalToReview(
      Number(withdrawalId),
      officerId
    );

    if (!request)
      return res
        .status(400)
        .json({ error: 'Withdrawal request not eligible for review' });

    await recordWithdrawalHistory(
      Number(withdrawalId),
      'Moved to HR review',
      officerId
    );
    res.json({ success: true, withdrawal: request });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({
        error: err?.message ?? 'Failed to move withdrawal to review stage',
      });
    }
  }
};

export const reviewWithdrawalDecisionHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { withdrawalId } = req.params;
    const approverId = req.user.id;
    const { decision, comments } = req.body; // 'Approved' | 'Rejected'

    const access = await getWithdrawalAccess(approverId, Number(withdrawalId));
    if (!access.canApprove) {
      return res.status(403).json({
        error: 'You are not authorized to approve this withdrawal request',
      });
    }

    const approval = await reviewWithdrawalDecision(
      Number(withdrawalId),
      approverId,
      decision,
      comments
    );

    if (!approval)
      return res.status(403).json({ error: 'Not authorized or invalid stage' });

    await recordWithdrawalHistory(
      Number(withdrawalId),
      `Decision: ${decision}`,
      approverId,
      comments
    );

    // Notify employee

    res.json(approval);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res
        .status(500)
        .json({ error: err?.message ?? 'Failed to review withdrawal request' });
    }
  }
};

export const releaseWithdrawalFundsHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { withdrawalId } = req.params;
    const { payment_reference } = req.body;
    const releasedBy = req.user.id;

    const access = await getWithdrawalAccess(releasedBy, Number(withdrawalId));
    if (!access.canRelease) {
      return res.status(403).json({
        error: 'You are not authorized to release this withdrawal request',
      });
    }

    const request = await releaseWithdrawalFunds(
      Number(withdrawalId),
      releasedBy,
      payment_reference
    );
    if (!request)
      return res
        .status(400)
        .json({ error: 'Withdrawal not approved or already released' });

    await recordWithdrawalHistory(
      Number(withdrawalId),
      'Withdrawal funds released',
      releasedBy,
      payment_reference || null
    );

    res.json({ success: true, withdrawal: request });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res
        .status(500)
        .json({ error: err?.message ?? 'Failed to release withdrawal funds' });
    }
  }
};

export const cancelWithdrawalRequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { withdrawalId } = req.params;
    const userId = req.user.id;
    const { remarks } = req.body;

    const request = await cancelWithdrawal(
      Number(withdrawalId),
      userId,
      'HR',
      remarks
    );
    if (!request)
      return res
        .status(400)
        .json({ error: 'Withdrawal request not eligible for cancellation' });

    await recordWithdrawalHistory(
      Number(withdrawalId),
      'Withdrawal request cancelled by HR',
      userId
    );

    if (req.user.role === 'HR' && request.user_id !== userId) {
      await createNotification(
        request.user_id,
        'Withdrawal Request Cancelled',
        `Your withdrawal request was cancelled by HR.`,
        'warning',
        { request, link: `/employee/withdrawals/${withdrawalId}` }
      );
    }

    res.json({ success: true, withdrawal: request });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res
        .status(500)
        .json({ error: err?.message ?? 'Failed to cancel withdrawal request' });
    }
  }
};

export const getWithdrawalStatusSummaryHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const summary = await getWithdrawalStatusSummary();
    return res.json({ summary });
  } catch (err) {
    console.error('Failed to fetch withdrawal status summary:', err);
    res
      .status(500)
      .json({ error: 'Failed to fetch withdrawal status summary' });
  }
};

export const getAllWithdrawalsHandler = async (req: Request, res: Response) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, search, startDate, endDate } = req.query;

    const filters = {
      status: status ? String(status) : null,
      search: search ? String(search) : null,
      startDate: startDate ? String(startDate) : null,
      endDate: endDate ? String(endDate) : null,
    };

    const withdrawals = await getAllWithdrawals(filters);

    res.json(withdrawals);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res
        .status(500)
        .json({ error: err?.message ?? 'Failed to get withdrawals' });
    }
  }
};

export const getWithdrawalByIdHandler = async (req: Request, res: Response) => {
  try {
    const { withdrawalId } = req.params;
    const request = await getWithdrawalById(Number(withdrawalId));

    if (!request)
      return res.status(404).json({ error: 'Withdrawal request not found' });
    res.json(request);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res
        .status(500)
        .json({ error: err?.message ?? 'Failed to get withdrawal' });
    }
  }
};

export const getWithdrawalHistoryHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { withdrawalId } = req.params;
    const history = await getWithdrawalHistory(Number(withdrawalId));

    res.json(history);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res
        .status(500)
        .json({ error: err?.message ?? 'Failed to get withdrawal history' });
    }
  }
};

export const getWithdrawalAccessHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user || req.user.role !== 'HR') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { withdrawalId } = req.params;
    const access = await getWithdrawalAccess(req.user.id, Number(withdrawalId));

    res.json({ userId: req.user.id, access });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch access permissions' });
  }
};

export async function exportWithdrawalsCSVController(
  req: Request,
  res: Response
) {
  try {
    if (!req.user || req.user.role !== 'HR') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const {
      userId: employee_id,
      start,
      end,
    } = req.query as {
      userId?: string;
      start?: string;
      end?: string;
    };

    // Determine if this is a single employee or all employees export
    const isSingleEmployee = !!employee_id;

    // Fetch data based on export type
    const employee = isSingleEmployee
      ? await getEmployeeById(Number(employee_id))
      : null;

    const withdrawals = await getAllWithdrawals({
      startDate: start ?? '',
      endDate: end ?? '',
    });

    if (withdrawals.length === 0) {
      return res.status(404).json({
        error: 'No withdrawals found for the specified criteria',
      });
    }

    // Create professional CSV structure with metadata header
    const csvData = [];

    // ========== REPORT METADATA SECTION ==========
    csvData.push(['PROVIDENT FUND WITHDRAWAL REQUESTS REPORT']);
    csvData.push(['Generated by', 'FundXpert System']);
    csvData.push([
      'Report Date',
      new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }),
    ]);
    csvData.push([
      'Report Type',
      isSingleEmployee
        ? 'Individual Employee Withdrawal Request History'
        : 'All Employees Withdrawal Requests',
    ]);
    csvData.push(['']); // Empty row for spacing

    // ========== EMPLOYEE/SCOPE INFORMATION SECTION ==========
    if (isSingleEmployee && employee) {
      // Single employee detailed information
      csvData.push(['EMPLOYEE INFORMATION']);
      csvData.push(['Employee Name', employee.name]);
      csvData.push(['Employee ID', employee.employee_id]);
      csvData.push(['Department', employee.department]);
      csvData.push(['Position', employee.position]);
      csvData.push(['Employment Status', employee.employment_status]);
      csvData.push([
        'Base Salary',
        `₱${Number(employee.salary).toLocaleString()}`,
      ]);
    } else {
      // All employees summary information
      csvData.push(['REPORT SCOPE']);
      csvData.push(['Coverage', 'All Employees']);

      // Get unique employee count
      const uniqueEmployees = new Set(withdrawals.map(l => l.employee_id)).size;
      csvData.push(['Employees Included', uniqueEmployees.toString()]);
      csvData.push(['Total Records', withdrawals.length.toString()]);
    }

    // Report period
    if (start && end) {
      csvData.push([
        'Report Period',
        `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`,
      ]);
    } else {
      csvData.push(['Report Period', 'All Time']);
    }

    if (isSingleEmployee) {
      csvData.push(['Total Records', withdrawals.length.toString()]);
    }

    csvData.push(['']); // Empty row for spacing

    // ========== DATA TABLE SECTION ==========
    csvData.push(['WITHDRAWAL DETAILS']);

    // Column headers based on export type
    if (isSingleEmployee) {
      csvData.push([
        'ID',
        'Type',
        'Amount (₱)',
        'Status',
        'Approving Officer',
        'Date Requested',
        'Date Released',
      ]);
    } else {
      csvData.push([
        'ID',
        'Employee ID',
        'Employee Name',
        'Deparment',
        'Position',
        'Type',
        'Amount (₱)',
        'Status',
        'Approving Officer',
        'Date Requested',
        'Date Released',
      ]);
    }

    // Format loan rows
    withdrawals.forEach(w => {
      const rowData = [
        w.id.toString(),
        ...(isSingleEmployee ? [] : [w.employee_id.toString()]),
        ...(isSingleEmployee ? [] : [w.employee_name]),
        ...(isSingleEmployee ? [] : [w.department_name]),
        ...(isSingleEmployee ? [] : [w.position_title]),
        w.request_type,

        Number(w.payout_amount).toFixed(2),
        w.status,
        w.officer_name || '-',
        new Date(w.created_at).toISOString().split('T')[0],
        w.processed_at
          ? new Date(w.processed_at).toISOString().split('T')[0]
          : '-',
      ];
      csvData.push(rowData);
    });

    // Calculate totals
    const totalWithdrawalAmount = withdrawals.reduce(
      (sum, l) => sum + Number(l.payout_amount),
      0
    );

    // Add totals row with visual separator
    csvData.push(['']); // Empty row
    const totalsRow = [
      '',
      ...(isSingleEmployee ? [] : ['']),
      'TOTAL',
      totalWithdrawalAmount.toFixed(2),
      '',
      '',
      '',
      '',
      '',
    ];
    csvData.push(totalsRow);

    // ========== SUMMARY SECTION ==========
    csvData.push(['']); // Empty row
    csvData.push(['SUMMARY']);

    if (!isSingleEmployee) {
      const uniqueEmployees = new Set(withdrawals.map(l => l.employee_id)).size;
      csvData.push(['Number of Employees', uniqueEmployees.toString()]);
    }

    csvData.push([
      'Total Withdrawal Amount',
      `₱${totalWithdrawalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ]);
    csvData.push([
      'Average Withdrawal Amount',
      `₱${(totalWithdrawalAmount / withdrawals.length).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ]);

    // Status breakdown
    csvData.push(['']); // Empty row
    csvData.push(['STATUS BREAKDOWN']);
    const statusCounts: Record<string, number> = {};
    withdrawals.forEach(l => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      csvData.push([status, count.toString()]);
    });

    // ========== AUDIT INFORMATION SECTION ==========
    csvData.push(['']); // Empty row
    csvData.push(['AUDIT INFORMATION']);
    csvData.push(['Document Classification', 'CONFIDENTIAL - HR USE ONLY']);
    csvData.push([
      'System Source',
      'FundXpert Provident Fund Management System',
    ]);
    csvData.push(['Export Timestamp', new Date().toISOString()]);
    csvData.push(['Exported By', 'HR Department']);
    csvData.push([
      'File Integrity',
      'This report is generated directly from the system database',
    ]);

    csvData.push(['']); // Empty row

    csvData.push(['LEGAL NOTICE']);
    csvData.push([
      'This report contains confidential user information and financial data.',
    ]);
    csvData.push([
      '',
      'Unauthorized access, disclosure, or distribution is strictly prohibited.',
    ]);
    csvData.push([
      '',
      'All access to this document is logged and monitored for compliance purposes.',
    ]);

    // Convert to CSV format
    const parser = new Json2CsvParser({
      fields: undefined,
      header: false,
      quote: '"',
      delimiter: ',',
      eol: '\r\n',
    });

    const csv = parser.parse(csvData);

    // ========== GENERATE FILENAME ==========
    const timestamp = new Date().toISOString().split('T')[0];
    const dateRange = start && end ? `_${start}_to_${end}` : '';

    let filename: string;
    if (isSingleEmployee && employee) {
      const lastName = employee.name.split(' ').pop() || 'Employee';
      filename = `PF_Withdrawals_${lastName}_${employee.employee_id}${dateRange}_${timestamp}.csv`;
    } else {
      filename = `PF_PF_Withdrawals__AllEmployees${dateRange}_${timestamp}.csv`;
    }

    // ========== SET RESPONSE HEADERS ==========
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    let reportPeriod = 'All Time';
    if (start && end) {
      reportPeriod = `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
    }

    await logUserAction(
      req.user.id,
      'Exported Loans as Excel',
      'System',
      'HR',
      {
        ipAddress: req.ip ?? '::1',
        details: {
          reportPeriod,
        },
      }
    );

    // Add BOM for proper Excel UTF-8 handling
    res.send('\ufeff' + csv);
  } catch (err) {
    console.error('❌ CSV export error:', err);
    res.status(500).json({
      error: 'Failed to export CSV',
      message: err instanceof Error ? err.message : 'Unknown error occurred',
    });
  }
}

export async function exportWithdrawalsExcelController(
  req: Request,
  res: Response
) {
  try {
    if (!req.user || req.user.role !== 'HR') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const {
      user_id: employee_id,
      start,
      end,
    } = req.query as {
      user_id?: string;
      start?: string | null;
      end?: string | null;
    };

    // Determine if this is a single employee or all employees export
    const isSingleEmployee = !!employee_id;

    // Fetch data based on export type
    const employee = isSingleEmployee
      ? await getEmployeeById(Number(employee_id))
      : null;
    const withdrawals = await getAllWithdrawals({
      startDate: start ?? '',
      endDate: end ?? '',
    });

    if (withdrawals.length === 0) {
      return res.status(404).json({
        error: 'No withdrawal requests found for the specified criteria',
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FundXpert System';
    workbook.lastModifiedBy = 'HR Department';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.subject =
      'Provident Fund Withdrawal Requests Report - Banking Audit';

    // ========== COVER SHEET ==========
    const cover = workbook.addWorksheet('Report Information');

    cover.addRow(['PROVIDENT FUND WITHDRAWAL REQUESTS REPORT']);
    cover.addRow(['']);
    cover.addRow(['DOCUMENT CLASSIFICATION: CONFIDENTIAL - HR USE ONLY']);
    cover.addRow(['']);
    cover.addRow(['REPORT GENERATION']);
    cover.addRow(['Generated By:', 'FundXpert System']);
    cover.addRow(['Report Date:', new Date().toLocaleString()]);
    cover.addRow([
      'Report Type:',
      isSingleEmployee
        ? 'Individual Employee Withdrawal Request History'
        : 'All Employees Withdrawal Requests',
    ]);
    cover.addRow(['']);

    if (isSingleEmployee && employee) {
      // Single employee detailed information
      cover.addRow(['EMPLOYEE INFORMATION']);
      cover.addRow(['Full Name:', employee.name]);
      cover.addRow(['Employee ID:', employee.employee_id]);
      cover.addRow(['Department:', employee.department]);
      cover.addRow(['Position:', employee.position]);
      cover.addRow(['Employment Status:', employee.employment_status]);
      cover.addRow([
        'Base Salary:',
        `₱${Number(employee.salary).toLocaleString()}`,
      ]);
      cover.addRow(['']);
    } else {
      // All employees summary information
      cover.addRow(['REPORT SCOPE']);
      cover.addRow(['Coverage:', 'All Employees']);
      cover.addRow(['Total Records:', withdrawals.length]);

      cover.addRow(['']);
      cover.addRow(['LEGAL NOTICE']);
      cover.addRow([
        '',
        'This report contains confidential user information and financial data.',
      ]);
      cover.addRow([
        '',
        'Unauthorized access, disclosure, or distribution is strictly prohibited.',
      ]);
      cover.addRow([
        '',
        'All access to this document is logged and monitored for compliance purposes.',
      ]);

      // Get unique employee count
      const uniqueEmployees = new Set(withdrawals.map(l => l.employee_id)).size;
      cover.addRow(['Employees Included:', uniqueEmployees]);
      cover.addRow(['']);
    }

    cover.addRow(['REPORTING PERIOD']);
    if (start && end) {
      cover.addRow([
        'Date Range:',
        `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`,
      ]);
    } else {
      cover.addRow(['Date Range:', 'All Time']);
    }

    if (!isSingleEmployee) {
      cover.addRow(['Total Records:', withdrawals.length]);
    }

    // Style cover sheet
    cover.getRow(1).font = { bold: true, size: 16 };
    cover.getRow(3).font = {
      bold: true,
      size: 11,
      color: { argb: 'FFDC2626' },
    };
    cover.getRow(5).font = { bold: true, size: 11 };

    if (isSingleEmployee) {
      cover.getRow(10).font = { bold: true, size: 11 };
      cover.getRow(18).font = { bold: true, size: 11 };
    } else {
      cover.getRow(10).font = { bold: true, size: 11 };
      const periodRowIndex = 10 + 6;
      cover.getRow(periodRowIndex).font = { bold: true, size: 11 };
    }

    cover.columns = [{ width: 25 }, { width: 50 }];

    // ========== MAIN LOANS SHEET ==========
    const sheet = workbook.addWorksheet('Withdrawal Details');

    // Column configuration based on export type
    const columns = isSingleEmployee
      ? [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Type', key: 'type', width: 30 },
          { header: 'Amount (₱)', key: 'amount', width: 18 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Approving Officer', key: 'officer', width: 25 },
          { header: 'Date Requested', key: 'date_requested', width: 18 },
          { header: 'Date Released', key: 'date_released', width: 18 },
        ]
      : [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Employee ID', key: 'employee_id', width: 15 },
          { header: 'Employee Name', key: 'employee_name', width: 20 },
          { header: 'Department', key: 'department_name', width: 20 },
          { header: 'Position', key: 'position_title', width: 20 },
          { header: 'Type', key: 'type', width: 30 },
          { header: 'Amount (₱)', key: 'amount', width: 18 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Approving Officer', key: 'officer', width: 25 },
          { header: 'Date Requested', key: 'date_requested', width: 18 },
          { header: 'Date Released', key: 'date_released', width: 18 },
        ];

    sheet.columns = columns;

    // Freeze header row
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1f2937' },
    };

    // Add loan data
    withdrawals.forEach((l, index) => {
      const rowData: any = {
        id: l.id,
        type: l.request_type,
        amount: Number(l.payout_amount),
        status: l.status,
        officer: l.officer_name || '-',
        date_requested: new Date(l.created_at).toISOString().split('T')[0],
        date_released: l.processed_at
          ? new Date(l.processed_at).toISOString().split('T')[0]
          : '-',
      };

      // Include user_id for all employees export
      if (!isSingleEmployee) {
        rowData.employee_id = l.employee_id;
        rowData.employee_name = l.employee_name;
        rowData.department_name = l.department_name;
        rowData.position_title = l.position_title;
      }

      const row = sheet.addRow(rowData);

      // Alternate row colors
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };
      }
    });

    // Calculate totals
    const totalWithdrawalAmount = withdrawals.reduce(
      (sum, l) => sum + Number(l.payout_amount),
      0
    );

    // Add totals row
    const totalRowData: any = {
      id: '',
      type: 'TOTAL',
      amount: totalWithdrawalAmount,
      status: '',
      officer: '',
      date_requested: '',
      date_released: '',
    };

    if (!isSingleEmployee) {
      totalRowData.user_id = '';
    }

    const totalRow = sheet.addRow(totalRowData);

    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDBEAFE' },
    };

    // Format currency columns
    sheet.getColumn('amount').numFmt = '"₱"#,##0.00';

    // Add borders
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // ========== SUMMARY SHEET ==========
    const summarySheet = workbook.addWorksheet('Financial Summary');
    summarySheet.addRow(['FINANCIAL SUMMARY']);
    summarySheet.addRow(['']);

    if (isSingleEmployee && employee) {
      summarySheet.addRow(['Employee:', employee.name]);
      summarySheet.addRow(['Employee ID:', employee.employee_id]);
      summarySheet.addRow(['']);
    } else {
      summarySheet.addRow(['Report Type:', 'All Employees']);
      summarySheet.addRow([
        'Number of Employees:',
        new Set(withdrawals.map(l => l.employee_id)).size,
      ]);
      summarySheet.addRow(['']);
    }

    summarySheet.addRow(['Total Withdrawal Amount:', totalWithdrawalAmount]);
    summarySheet.addRow(['']);
    summarySheet.addRow([
      'Average Withdrawal Amount:',
      totalWithdrawalAmount / withdrawals.length,
    ]);

    // Status breakdown
    summarySheet.addRow(['']);
    summarySheet.addRow(['STATUS BREAKDOWN']);
    const statusCounts: Record<string, number> = {};
    withdrawals.forEach(l => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      summarySheet.addRow([`${status}:`, count]);
    });

    summarySheet.getRow(1).font = { bold: true, size: 14 };
    summarySheet.getRow(8).font = { bold: true, size: 11 };
    summarySheet.getRow(6).numFmt = '"₱"#,##0.00';
    summarySheet.getRow(7).numFmt = '"₱"#,##0.00';
    summarySheet.getRow(9).numFmt = '"₱"#,##0.00';
    summarySheet.columns = [{ width: 30 }, { width: 20 }];

    // Protect sheets (bank-grade security)
    await cover.protect(SHEET_PASSWORD, {
      selectLockedCells: true,
      selectUnlockedCells: true,
    });

    await sheet.protect(SHEET_PASSWORD, {
      selectLockedCells: true,
      selectUnlockedCells: true,
    });

    await summarySheet.protect(SHEET_PASSWORD, {
      selectLockedCells: true,
      selectUnlockedCells: true,
    });

    // ========== GENERATE FILENAME ==========
    const timestamp = new Date().toISOString().split('T')[0];
    const dateRange = start && end ? `_${start}_to_${end}` : '';

    let filename: string;
    if (isSingleEmployee && employee) {
      const lastName = employee.name.split(' ').pop() || 'Employee';
      filename = `PF_Withdrawals_${lastName}_${employee.employee_id}${dateRange}_${timestamp}.xlsx`;
    } else {
      filename = `PF_Withdrawals_AllEmployees${dateRange}_${timestamp}.xlsx`;
    }

    // ========== SEND RESPONSE ==========
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    let reportPeriod = 'All Time';
    if (start && end) {
      reportPeriod = `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
    }

    await logUserAction(
      req.user.id,
      'Exported Loans as Excel',
      'System',
      'HR',
      {
        ipAddress: req.ip ?? '::1',
        details: {
          reportPeriod,
        },
      }
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('❌ Excel export error:', err);
    res.status(500).json({
      error: 'Failed to export Excel',
      message: err instanceof Error ? err.message : 'Unknown error occurred',
    });
  }
}

export async function exportWithdrawalsPDFController(
  req: Request,
  res: Response
) {
  try {
    if (!req.user || req.user.role !== 'HR') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { employee_id, start, end } = req.query as {
      employee_id?: string;
      start?: string;
      end?: string;
    };

    // Determine if this is a single employee or all employees export
    const isSingleEmployee = !!employee_id;

    // Fetch data based on export type
    const employee = isSingleEmployee
      ? await getEmployeeById(Number(employee_id))
      : null;

    const withdrawals = await getAllWithdrawals({
      startDate: start ?? '',
      endDate: end ?? '',
    });

    if (withdrawals.length === 0) {
      return res.status(404).json({
        error: 'No withdrawal requests found for the specified criteria',
      });
    }

    // Helper function to truncate text
    const truncateText = (text: string, maxLength: number) => {
      if (!text) return '-';
      return text.length > maxLength
        ? text.substring(0, maxLength - 3) + '...'
        : text;
    };

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      info: {
        Title: 'Provident Fund Withdrawal Requests Report - Banking Audit',
        Author: 'FundXpert System',
        Subject: isSingleEmployee
          ? 'Employee Withdrawal Requests Report - Confidential'
          : 'All Employees Withdrawal Requests Report - Confidential',
        Creator: 'FundXpert',
        Keywords:
          'Provident Fund, Withdrawals, Audit, Banking, Financial Report',
      },
    });

    // ========== GENERATE FILENAME ==========
    const timestamp = new Date().toISOString().split('T')[0];
    const dateRange = start && end ? `_${start}_to_${end}` : '';

    let filename: string;
    if (isSingleEmployee && employee) {
      const lastName = employee.name.split(' ').pop() || 'Employee';
      filename = `PF_Withdrawals_${lastName}_${employee.employee_id}${dateRange}_${timestamp}.pdf`;
    } else {
      filename = `PF_Withdrawals_AllEmployees${dateRange}_${timestamp}.pdf`;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // Enhanced colors and styling
    const colors = {
      primary: '#1f2937',
      secondary: '#6b7280',
      accent: '#001A88',
      border: '#e5e7eb',
      background: '#f9fafb',
      confidential: '#DC2626',
      success: '#065f46',
      warning: '#d97706',
    };

    const addHorizontalLine = (y: number, color = colors.border, width = 1) => {
      doc
        .strokeColor(color)
        .lineWidth(width)
        .moveTo(40, y)
        .lineTo(555, y)
        .stroke();
    };

    const addFooter = () => {
      const footerY = doc.page.height - 65;
      addHorizontalLine(footerY - 20, colors.border);
      doc
        .fillColor(colors.secondary)
        .fontSize(8)
        .font('Helvetica')
        .text(
          'CONFIDENTIAL - HR USE ONLY | This document contains sensitive financial information for audit purposes only.',
          40,
          footerY,
          { align: 'center', width: 515 }
        )
        .text(
          `Generated by FundXpert System | ${new Date().toISOString()}`,
          40,
          footerY + 15,
          {
            align: 'center',
            width: 515,
          }
        );
    };

    let currentY = 40;
    const __dirname = import.meta.dirname;

    // ========== COMPANY HEADER WITH LOGO ==========
    try {
      const clientLogo = path.join(__dirname, 'client-logo.png');
      doc.image(clientLogo, 40, 40, { width: 140, height: 40 });
    } catch (logoError) {
      console.warn('Logo not found, continuing without logo:', logoError);
    }

    // Confidential marking
    doc
      .fillColor(colors.confidential)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('CONFIDENTIAL', 450, currentY, { align: 'right' });

    doc
      .fillColor(colors.secondary)
      .fontSize(10)
      .font('Helvetica')
      .text('Human Resources Department', 40, currentY + 40);

    currentY += 80;
    addHorizontalLine(currentY, colors.accent, 2);
    currentY += 25;

    // ========== ENHANCED REPORT TITLE ==========
    doc
      .fillColor(colors.primary)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('PROVIDENT FUND WITHDRAWAL REQUESTS', 40, currentY, {
        align: 'center',
      });

    currentY += 25;
    doc
      .fontSize(16)
      .text(
        isSingleEmployee && employee
          ? `${employee.name} - Withdrawal History`
          : 'All Employees - Withdrawal History',
        40,
        currentY,
        { align: 'center' }
      );

    currentY += 35;

    // ========== METADATA BOX ==========
    const metadataHeight = isSingleEmployee ? 200 : 180;
    doc
      .rect(40, currentY, 515, metadataHeight)
      .fillAndStroke(colors.background, colors.border);

    currentY += 15;
    doc
      .fillColor(colors.primary)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('REPORT INFORMATION', 60, currentY);

    currentY += 25;
    doc
      .fillColor(colors.secondary)
      .fontSize(10)
      .font('Helvetica')
      .text('Generated:', 60, currentY)
      .font('Helvetica-Bold')
      .text(
        new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short',
        }),
        150,
        currentY
      );

    currentY += 15;
    doc
      .font('Helvetica')
      .text('Report Type:', 60, currentY)
      .font('Helvetica-Bold')
      .text(
        isSingleEmployee
          ? 'Individual Employee Withdrawal History (Banking Audit)'
          : 'All Employees Withdrawals (Banking Audit)',
        150,
        currentY
      );

    currentY += 20;

    if (isSingleEmployee && employee) {
      // Single employee detailed information
      doc
        .fillColor(colors.primary)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('EMPLOYEE DETAILS', 60, currentY);

      currentY += 15;
      doc
        .fillColor(colors.secondary)
        .fontSize(10)
        .font('Helvetica')
        .text(
          `Full Name: ${employee.name} | Employee ID: ${employee.employee_id}`,
          60,
          currentY
        );

      currentY += 12;
      doc.text(
        `Department: ${employee.department} | Position: ${employee.position}`,
        60,
        currentY
      );

      currentY += 12;
      doc.text(
        `Employment Status: ${employee.employment_status} | Base Salary: P${Number(employee.salary).toLocaleString()}`,
        60,
        currentY
      );

      currentY += 20;
    } else {
      // All employees summary information
      doc
        .fillColor(colors.primary)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('REPORT SCOPE', 60, currentY);

      currentY += 15;
      doc
        .fillColor(colors.secondary)
        .fontSize(10)
        .font('Helvetica')
        .text('Coverage: All Employees', 60, currentY);

      currentY += 12;
      const uniqueEmployees = new Set(withdrawals.map(w => w.employee_id)).size;
      doc.text(
        `Employees Included: ${uniqueEmployees} | Total Records: ${withdrawals.length}`,
        60,
        currentY
      );

      currentY += 20;
    }

    doc
      .fillColor(colors.primary)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('REPORTING PERIOD', 60, currentY);

    currentY += 15;
    doc.fillColor(colors.secondary).fontSize(10).font('Helvetica');

    if (start && end) {
      doc.text(
        `Period: ${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`,
        60,
        currentY
      );
    } else {
      doc.text('Period: All Time (Complete History)', 60, currentY);
    }

    currentY += 12;
    doc.text(
      `Total Records: ${withdrawals.length} | Data Source: FundXpert Database`,
      60,
      currentY
    );

    currentY += metadataHeight - (isSingleEmployee ? 120 : 95);

    // ========== TABLE STRUCTURE ==========
    const tableWidth = 515;

    // Column widths based on export type (total width: 515 for A4)
    const columnWidths = isSingleEmployee
      ? {
          id: 30,
          type: 85,
          purpose: 110,
          amount: 70,
          status: 75,
          officer: 75,
          dateRequested: 70,
        }
      : {
          id: 30,
          employeeId: 50,
          employeeName: 95,
          type: 70,
          purpose: 75,
          amount: 65,
          status: 70,
          dateRequested: 60,
        };

    // Calculate column positions
    const calculatePositions = () => {
      const positions: any = { id: 40 };
      let currentPos = 40;

      Object.entries(columnWidths).forEach(([key, width]) => {
        positions[key] = currentPos;
        currentPos += width;
      });

      return positions;
    };

    const columnPositions = calculatePositions();

    // ========== TABLE HEADER ==========
    doc
      .rect(40, currentY, tableWidth, 35)
      .fillAndStroke(colors.accent, colors.accent);

    currentY += 10;
    doc
      .fillColor('#ffffff')
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text('ID', columnPositions.id + 2, currentY, {
        width: columnWidths.id - 4,
        align: 'center',
      });

    if (!isSingleEmployee) {
      doc
        .text('Emp ID', columnPositions.employeeId + 2, currentY, {
          width: columnWidths.employeeId - 4,
          align: 'center',
        })
        .text('Employee Name', columnPositions.employeeName + 2, currentY, {
          width: columnWidths.employeeName - 4,
          align: 'left',
        });
    }

    doc
      .text('Request Type', columnPositions.type + 2, currentY, {
        width: columnWidths.type - 4,
        align: 'left',
      })
      .text('Purpose Detail', columnPositions.purpose + 2, currentY, {
        width: columnWidths.purpose - 4,
        align: 'left',
      })
      .text('Amount (P)', columnPositions.amount + 2, currentY, {
        width: columnWidths.amount - 4,
        align: 'center',
      })
      .text('Status', columnPositions.status + 2, currentY, {
        width: columnWidths.status - 4,
        align: 'center',
      });

    if (isSingleEmployee) {
      doc
        .text('Officer', columnPositions.officer + 2, currentY, {
          width: columnWidths.officer - 4,
          align: 'center',
        })
        .text('Requested', columnPositions.dateRequested + 2, currentY, {
          width: columnWidths.dateRequested - 4,
          align: 'center',
        });
    } else {
      doc.text('Requested', columnPositions.dateRequested + 2, currentY, {
        width: columnWidths.dateRequested - 4,
        align: 'center',
      });
    }

    currentY += 25;

    // ========== TABLE DATA ==========
    let totalPayoutAmount = 0;
    const rowHeight = 32;

    const drawTableHeader = (y: number) => {
      doc
        .rect(40, y, tableWidth, 35)
        .fillAndStroke(colors.accent, colors.accent);

      const headerY = y + 10;
      doc
        .fillColor('#ffffff')
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text('ID', columnPositions.id + 2, headerY, {
          width: columnWidths.id - 4,
          align: 'center',
        });

      if (!isSingleEmployee) {
        doc
          .text('Emp ID', columnPositions.employeeId + 2, headerY, {
            width: columnWidths.employeeId - 4,
            align: 'center',
          })
          .text('Employee Name', columnPositions.employeeName + 2, headerY, {
            width: columnWidths.employeeName - 4,
            align: 'left',
          });
      }

      doc
        .text('Request Type', columnPositions.type + 2, headerY, {
          width: columnWidths.type - 4,
          align: 'left',
        })
        .text('Purpose Detail', columnPositions.purpose + 2, headerY, {
          width: columnWidths.purpose - 4,
          align: 'left',
        })
        .text('Amount (P)', columnPositions.amount + 2, headerY, {
          width: columnWidths.amount - 4,
          align: 'center',
        })
        .text('Status', columnPositions.status + 2, headerY, {
          width: columnWidths.status - 4,
          align: 'center',
        });

      if (isSingleEmployee) {
        doc
          .text('Officer', columnPositions.officer + 2, headerY, {
            width: columnWidths.officer - 4,
            align: 'center',
          })
          .text('Requested', columnPositions.dateRequested + 2, headerY, {
            width: columnWidths.dateRequested - 4,
            align: 'center',
          });
      } else {
        doc.text('Requested', columnPositions.dateRequested + 2, headerY, {
          width: columnWidths.dateRequested - 4,
          align: 'center',
        });
      }

      return y + 35;
    };

    withdrawals.forEach((withdrawal, index) => {
      // Check for new page
      if (currentY + rowHeight > doc.page.height - 100) {
        addFooter();
        doc.addPage();
        currentY = 40;
        currentY = drawTableHeader(currentY);
      }

      // Enhanced alternating row colors
      const rowColor = index % 2 === 0 ? '#ffffff' : colors.background;
      doc
        .rect(40, currentY, tableWidth, rowHeight)
        .fillAndStroke(rowColor, colors.border);

      const textY = currentY + 12;

      doc
        .fillColor(colors.primary)
        .fontSize(7)
        .font('Helvetica')
        .text(String(withdrawal.id), columnPositions.id + 2, textY, {
          width: columnWidths.id - 4,
          align: 'center',
        });

      if (!isSingleEmployee) {
        doc
          .text(
            String(withdrawal.employee_id),
            columnPositions.employeeId + 2,
            textY,
            {
              width: columnWidths.employeeId - 4,
              align: 'center',
            }
          )
          .text(
            truncateText(withdrawal.employee_name || '-', 28),
            columnPositions.employeeName + 2,
            textY,
            { width: columnWidths.employeeName - 4, align: 'left' }
          );
      }

      doc
        .text(
          truncateText(withdrawal.request_type, isSingleEmployee ? 20 : 18),
          columnPositions.type + 2,
          textY,
          { width: columnWidths.type - 4, align: 'left' }
        )
        .text(
          truncateText(
            withdrawal.purpose_detail || '-',
            isSingleEmployee ? 30 : 22
          ),
          columnPositions.purpose + 2,
          textY,
          { width: columnWidths.purpose - 4, align: 'left' }
        )
        .text(
          Number(withdrawal.payout_amount).toLocaleString(),
          columnPositions.amount + 2,
          textY,
          { width: columnWidths.amount - 4, align: 'center' }
        )
        .font('Helvetica-Bold')
        .text(withdrawal.status, columnPositions.status + 2, textY, {
          width: columnWidths.status - 4,
          align: 'center',
        });

      if (isSingleEmployee) {
        doc
          .fillColor(colors.primary)
          .font('Helvetica')
          .text(
            truncateText(withdrawal.officer_name || '-', 20),
            columnPositions.officer + 2,
            textY,
            { width: columnWidths.officer - 4, align: 'left' }
          )
          .text(
            new Date(withdrawal.created_at).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: '2-digit',
            }),
            columnPositions.dateRequested + 2,
            textY,
            { width: columnWidths.dateRequested - 4, align: 'center' }
          );
      } else {
        doc
          .fillColor(colors.primary)
          .font('Helvetica')
          .text(
            new Date(withdrawal.created_at).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: '2-digit',
            }),
            columnPositions.dateRequested + 2,
            textY,
            { width: columnWidths.dateRequested - 4, align: 'center' }
          );
      }

      totalPayoutAmount += Number(withdrawal.payout_amount);
      currentY += rowHeight;
    });

    // ========== ENHANCED SUMMARY SECTION ==========
    const summaryHeight = 200;
    if (currentY + summaryHeight > doc.page.height - 100) {
      addFooter();
      doc.addPage();
      currentY = 40;
    }

    currentY += 25;
    addHorizontalLine(currentY, colors.accent, 2);
    currentY += 25;

    const summaryBoxHeight = isSingleEmployee ? 100 : 150;
    const summaryBoxY = currentY;
    doc
      .rect(40, summaryBoxY, 515, summaryBoxHeight)
      .fillAndStroke(colors.background, colors.accent);

    let contentY = summaryBoxY + 20;
    const labelX = 60;
    const valueX = 320;
    const valueWidth = 215;

    doc
      .fillColor(colors.primary)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('FINANCIAL SUMMARY', labelX, contentY);

    contentY += 25;

    if (!isSingleEmployee) {
      const uniqueEmployees = new Set(withdrawals.map(w => w.employee_id)).size;
      doc
        .fontSize(11)
        .font('Helvetica')
        .text('Number of Employees:', labelX, contentY)
        .font('Helvetica-Bold')
        .text(uniqueEmployees.toString(), valueX, contentY, {
          width: valueWidth,
          align: 'right',
        });

      contentY += 18;
    }

    doc
      .fontSize(11)
      .font('Helvetica')
      .text('Total Payout Amount:', labelX, contentY)
      .font('Helvetica-Bold')
      .text(
        `P${totalPayoutAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        valueX,
        contentY,
        { width: valueWidth, align: 'right' }
      );

    contentY += 18;
    doc
      .font('Helvetica')
      .text('Average Payout Amount:', labelX, contentY)
      .font('Helvetica-Bold')
      .text(
        `P${(totalPayoutAmount / withdrawals.length).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        valueX,
        contentY,
        { width: valueWidth, align: 'right' }
      );

    contentY += 18;
    const statusCounts = withdrawals.reduce(
      (acc, w) => {
        acc[w.status] = (acc[w.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    doc
      .font('Helvetica')
      .text('Status Breakdown:', labelX, contentY)
      .font('Helvetica-Bold')
      .text(
        Object.entries(statusCounts)
          .map(([status, count]) => `${status}: ${count}`)
          .join(', '),
        valueX,
        contentY,
        { width: valueWidth, align: 'right' }
      );

    addFooter();

    let reportPeriod = 'All Time';
    if (start && end) {
      reportPeriod = `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
    }

    await logUserAction(
      req.user.id,
      'Exported Loans as Excel',
      'System',
      'HR',
      {
        ipAddress: req.ip ?? '::1',
        details: {
          reportPeriod,
        },
      }
    );
    doc.end();
  } catch (err) {
    console.error('❌ PDF export error:', err);
    res.status(500).json({
      error: 'Failed to export PDF',
      message: err instanceof Error ? err.message : 'Unknown error occurred',
    });
  }
}
