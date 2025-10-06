import type { Request, Response } from 'express';
import { isAuthenticatedRequest } from './employeeControllers.js';
import {
  assignLoanApprovers,
  cancelLoanRequest,
  getAllLoans,
  getLoanAccess,
  getLoanApprovals,
  getLoanById,
  getLoanHistory,
  getLoanStatusSummary,
  markLoanIncomplete,
  markLoanReadyForReview,
  moveLoanToReview,
  recordLoanHistory,
  releaseLoanToTrustBank,
  reviewLoanApproval,
} from '../services/hrLoanService.js';
import { Parser as Json2CsvParser } from 'json2csv';
import PDFDocument from 'pdfkit';

import ExcelJS from 'exceljs';

import { getEmployeeById } from '../services/hrService.js';
import type { Loan } from '../types/loan.js';
import path from 'path';
import { SHEET_PASSWORD } from '../config/security.config.js';
import { getLoanDocuments } from '../services/loanDocumentService.js';

export const markLoanReadyHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'HR')
      return res.status(403).json({ error: 'Access denied' });

    const { loanId } = req.params;
    const assistantId = req.user.id;

    const access = await getLoanAccess(assistantId, Number(loanId));
    if (!access.canMarkReady) {
      return res.status(403).json({
        error: 'You are not authorized to mark this loan as ready',
      });
    }

    const loan = await markLoanReadyForReview(Number(loanId), assistantId);
    if (!loan)
      return res
        .status(400)
        .json({ error: 'Loan not found or not in Pending state' });

    await recordLoanHistory(loan.id, 'Marked ready for review', assistantId);
    res.json({ success: true, loan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark loan as ready' });
  }
};

export const markLoanIncompleteHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user || req.user.role !== 'HR')
      return res.status(403).json({ error: 'Access denied' });

    const { loanId } = req.params;
    const { remarks } = req.body;
    const assistantId = req.user.id;

    const access = await getLoanAccess(assistantId, Number(loanId));
    if (!access.canMarkIncomplete) {
      return res.status(403).json({
        error: 'You are not authorized to mark this loan as incomplete',
      });
    }

    const loan = await markLoanIncomplete(Number(loanId), assistantId, remarks);
    if (!loan)
      return res
        .status(400)
        .json({ error: 'Loan not found or not in Pending state' });

    await recordLoanHistory(
      loan.id,
      'Marked incomplete by HR assistant',
      assistantId,
      remarks
    );
    res.json({ success: true, loan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark loan as incomplete' });
  }
};

export const moveLoanToReviewHandler = async (req: Request, res: Response) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { loanId } = req.params;
    const officerId = req.user.id;

    const access = await getLoanAccess(officerId, Number(loanId));
    if (!access.canMoveToReview) {
      return res.status(403).json({
        error: 'You are not authorized to move this loan for officer review',
      });
    }

    const loan = await moveLoanToReview(Number(loanId), officerId);

    if (!loan)
      return res.status(400).json({ error: 'Loan not eligible for review' });

    await recordLoanHistory(Number(loanId), 'Moved to HR review', officerId);
    res.json({ success: true, loan });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const assignLoanApproversHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { loanId } = req.params;
    const { approvers } = req.body; // e.g. [{ approverId: 12, sequence: 1 }, { approverId: 15, sequence: 2 }]

    // Check officer access
    const access = await getLoanAccess(userId, Number(loanId));
    if (!access.canAssignApprovers) {
      return res.status(403).json({
        error: 'You are not authorized to assign approvers for this loan',
      });
    }

    // Prevent self-inclusion as approver
    const selfIncluded = approvers.some(
      (a: { approverId: number; sequence: number }) => a.approverId === userId
    );

    if (selfIncluded) {
      return res.status(400).json({
        error:
          'You cannot assign yourself as an approver. Approvers must be other HR officers.',
      });
    }
    // Prevent duplicate approvers
    const approverIds = approvers.map(
      (a: { approverId: number; sequence: number }) => a.approverId
    );
    const hasDuplicates = new Set(approverIds).size !== approverIds.length;
    if (hasDuplicates) {
      return res.status(400).json({
        error: 'Duplicate approvers detected. Each approver must be unique.',
      });
    }

    //  Require at least 2 approvers (per loan policy)
    if (approvers.length < 2) {
      return res.status(400).json({
        error:
          'At least two approvers are required for Provident Fund loans per policy.',
      });
    }

    const result = await assignLoanApprovers(Number(loanId), userId, approvers);

    await recordLoanHistory(Number(loanId), 'Approvers assigned', req.user.id);
    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({
        error: err?.message ?? 'Failed to assign approvers',
      });
    }
  }
};

export const reviewLoanApprovalHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { loanId } = req.params;
    const approverId = req.user.id;
    const { decision, comments } = req.body; // 'Approved' | 'Rejected'

    const access = await getLoanAccess(approverId, Number(loanId));
    if (!access.canApprove) {
      return res.status(403).json({
        error: 'You are not authorized to approve this loan',
      });
    }

    const approval = await reviewLoanApproval(
      Number(loanId),
      approverId,
      decision,
      comments
    );

    if (!approval)
      return res.status(403).json({ error: 'Not authorized or invalid stage' });

    await recordLoanHistory(
      Number(loanId),
      `Decision: ${decision}`,
      approverId,
      comments
    );
    res.json({ success: true, approval });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const releaseLoanToTrustBankHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { loanId } = req.params;
    const { txRef } = req.body;
    const releasedBy = req.user.id;

    const access = await getLoanAccess(releasedBy, Number(loanId));
    if (!access.canRelease) {
      return res.status(403).json({
        error: 'You are not authorized to release this loan',
      });
    }

    const loan = await releaseLoanToTrustBank(
      Number(loanId),
      txRef,
      releasedBy
    );
    if (!loan)
      return res
        .status(400)
        .json({ error: 'Loan not approved or already released' });

    await recordLoanHistory(
      Number(loanId),
      'Loan released to Trust Bank',
      releasedBy,
      txRef
    );
    res.json({ success: true, loan });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const cancelLoanRequestHandler = async (req: Request, res: Response) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { loanId } = req.params;
    const userId = req.user.id;

    const loan = await cancelLoanRequest(Number(loanId), userId, 'HR');
    if (!loan)
      return res
        .status(400)
        .json({ error: 'Loan not eligible for cancellation' });

    await recordLoanHistory(Number(loanId), 'Loan cancelled by HR', userId);
    res.json({ success: true, loan });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const getAllLoansHandler = async (req: Request, res: Response) => {
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

    const loans = await getAllLoans(filters);

    res.json(loans);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const getLoanByIdHandler = async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;
    const loan = await getLoanById(Number(loanId));

    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json(loan);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const getLoanApprovalsHandler = async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;
    const approvals = await getLoanApprovals(Number(loanId));

    res.json(approvals);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const getLoanHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;
    const history = await getLoanHistory(Number(loanId));

    res.json(history);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const getLoanAccessHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'HR') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { loanId } = req.params;
    const access = await getLoanAccess(req.user.id, Number(loanId));

    res.json({ userId: req.user.id, access });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch access permissions' });
  }
};

export const getLoanStatusSummaryHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const summary = await getLoanStatusSummary();
    return res.json({ summary });
  } catch (err) {
    console.error('Failed to fetch loan status summary:', err);
    res.status(500).json({ error: 'Failed to fetch loan status summary' });
  }
};

/**
 * GET /hr/loans/export/excel
 */

export async function exportLoansCSVController(req: Request, res: Response) {
  try {
    const {
      userId: employee_id,
      startDate,
      endDate,
    } = req.query as {
      userId?: string;
      startDate?: string;
      endDate?: string;
    };

    // Determine if this is a single employee or all employees export
    const isSingleEmployee = !!employee_id;

    // Fetch data based on export type
    const employee = isSingleEmployee
      ? await getEmployeeById(Number(employee_id))
      : null;

    const loans = await getAllLoans({
      startDate: startDate ?? '',
      endDate: endDate ?? '',
    });

    if (loans.length === 0) {
      return res.status(404).json({
        error: 'No loans found for the specified criteria',
      });
    }

    // Create professional CSV structure with metadata header
    const csvData = [];

    // ========== REPORT METADATA SECTION ==========
    csvData.push(['PROVIDENT FUND LOANS REPORT']);
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
        ? 'Individual Employee Loan History'
        : 'All Employees Loans',
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
      const uniqueEmployees = new Set(loans.map(l => l.user_id)).size;
      csvData.push(['Employees Included', uniqueEmployees.toString()]);
      csvData.push(['Total Records', loans.length.toString()]);
    }

    // Report period
    if (startDate && endDate) {
      csvData.push([
        'Report Period',
        `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      ]);
    } else {
      csvData.push(['Report Period', 'All Time']);
    }

    if (isSingleEmployee) {
      csvData.push(['Total Records', loans.length.toString()]);
    }

    csvData.push(['']); // Empty row for spacing

    // ========== DATA TABLE SECTION ==========
    csvData.push(['LOAN DETAILS']);

    // Column headers based on export type
    if (isSingleEmployee) {
      csvData.push([
        'ID',
        'Purpose',
        'Amount (₱)',
        'Term (Months)',
        'Amortization (₱)',
        'Status',
        'Approving Officer',
        'Date Applied',
        'Date Approved',
      ]);
    } else {
      csvData.push([
        'ID',
        'Employee ID',
        'Employee Name',
        'Deparment',
        'Position',
        'Purpose',
        'Amount (₱)',
        'Term (Months)',
        'Amortization (₱)',
        'Status',
        'Approving Officer',
        'Date Applied',
        'Date Approved',
      ]);
    }

    // Format loan rows
    loans.forEach(l => {
      const rowData = [
        l.id.toString(),
        ...(isSingleEmployee ? [] : [l.employee_id.toString()]),
        ...(isSingleEmployee ? [] : [l.employee_name]),
        ...(isSingleEmployee ? [] : [l.department_name]),
        ...(isSingleEmployee ? [] : [l.position_title]),
        l.purpose_category,

        Number(l.amount).toFixed(2),
        l.repayment_term_months.toString(),
        Number(l.monthly_amortization).toFixed(2),
        l.status,
        l.officer_name || '-',
        new Date(l.created_at).toISOString().split('T')[0],
        l.approved_at
          ? new Date(l.approved_at).toISOString().split('T')[0]
          : '-',
      ];
      csvData.push(rowData);
    });

    // Calculate totals
    const totalLoanAmount = loans.reduce((sum, l) => sum + Number(l.amount), 0);
    const totalAmortization = loans.reduce(
      (sum, l) => sum + Number(l.monthly_amortization),
      0
    );

    // Add totals row with visual separator
    csvData.push(['']); // Empty row
    const totalsRow = [
      '',
      ...(isSingleEmployee ? [] : ['']),
      'TOTAL',
      totalLoanAmount.toFixed(2),
      '',
      totalAmortization.toFixed(2),
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
      const uniqueEmployees = new Set(loans.map(l => l.user_id)).size;
      csvData.push(['Number of Employees', uniqueEmployees.toString()]);
    }

    csvData.push([
      'Total Loan Amount',
      `₱${totalLoanAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ]);
    csvData.push([
      'Total Monthly Amortization',
      `₱${totalAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ]);
    csvData.push([
      'Average Loan Amount',
      `₱${(totalLoanAmount / loans.length).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ]);
    csvData.push([
      'Average Term',
      `${(loans.reduce((sum, l) => sum + l.repayment_term_months, 0) / loans.length).toFixed(1)} months`,
    ]);

    // Status breakdown
    csvData.push(['']); // Empty row
    csvData.push(['STATUS BREAKDOWN']);
    const statusCounts: Record<string, number> = {};
    loans.forEach(l => {
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
    const dateRange = startDate && endDate ? `_${startDate}_to_${endDate}` : '';

    let filename: string;
    if (isSingleEmployee && employee) {
      const lastName = employee.name.split(' ').pop() || 'Employee';
      filename = `PF_Loans_${lastName}_${employee.employee_id}${dateRange}_${timestamp}.csv`;
    } else {
      filename = `PF_Loans_AllEmployees${dateRange}_${timestamp}.csv`;
    }

    // ========== SET RESPONSE HEADERS ==========
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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

export async function exportLoansExcelController(req: Request, res: Response) {
  try {
    const {
      user_id: employee_id,
      start,
      end,
    } = req.query as {
      user_id?: string;
      start?: string;
      end?: string;
    };

    // Determine if this is a single employee or all employees export
    const isSingleEmployee = !!employee_id;

    // Fetch data based on export type
    const employee = isSingleEmployee
      ? await getEmployeeById(Number(employee_id))
      : null;

    const loans = await getAllLoans({
      userId: employee_id ? Number(employee_id) : undefined,
      startDate: start,
      endDate: end,
    });

    if (loans.length === 0) {
      return res.status(404).json({
        error: 'No loans found for the specified criteria',
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FundXpert System';
    workbook.lastModifiedBy = 'HR Department';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.subject = 'Provident Fund Loans Report - Banking Audit';

    // ========== COVER SHEET ==========
    const cover = workbook.addWorksheet('Report Information');

    cover.addRow(['PROVIDENT FUND LOANS REPORT']);
    cover.addRow(['']);
    cover.addRow(['DOCUMENT CLASSIFICATION: CONFIDENTIAL - HR USE ONLY']);
    cover.addRow(['']);
    cover.addRow(['REPORT GENERATION']);
    cover.addRow(['Generated By:', 'FundXpert System']);
    cover.addRow(['Report Date:', new Date().toLocaleString()]);
    cover.addRow([
      'Report Type:',
      isSingleEmployee
        ? 'Individual Employee Loan History'
        : 'All Employees Loans',
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
      cover.addRow(['Total Records:', loans.length]);

      // Get unique employee count
      const uniqueEmployees = new Set(loans.map(l => l.user_id)).size;
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
      cover.addRow(['Total Records:', loans.length]);
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
    const sheet = workbook.addWorksheet('Loan Details');

    // Column configuration based on export type
    const columns = isSingleEmployee
      ? [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Purpose', key: 'purpose', width: 30 },
          { header: 'Amount (₱)', key: 'amount', width: 18 },
          { header: 'Term (Months)', key: 'term', width: 15 },
          { header: 'Amortization (₱)', key: 'amortization', width: 20 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Approving Officer', key: 'officer', width: 25 },
          { header: 'Date Applied', key: 'date_applied', width: 18 },
          { header: 'Date Approved', key: 'date_approved', width: 18 },
        ]
      : [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Employee ID', key: 'employee_id', width: 15 },
          { header: 'Employee Name', key: 'employee_name', width: 20 },
          { header: 'Department', key: 'department_name', width: 20 },
          { header: 'Position', key: 'position_title', width: 20 },
          { header: 'Purpose', key: 'purpose', width: 30 },
          { header: 'Amount (₱)', key: 'amount', width: 18 },
          { header: 'Term (Months)', key: 'term', width: 15 },
          { header: 'Amortization (₱)', key: 'amortization', width: 20 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Approving Officer', key: 'officer', width: 25 },
          { header: 'Date Applied', key: 'date_applied', width: 18 },
          { header: 'Date Approved', key: 'date_approved', width: 18 },
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
    loans.forEach((l, index) => {
      const rowData: any = {
        id: l.id,
        purpose: l.purpose_category,
        amount: Number(l.amount),
        term: l.repayment_term_months,
        amortization: Number(l.monthly_amortization),
        status: l.status,
        officer: l.officer_name || '-',
        date_applied: new Date(l.created_at).toISOString().split('T')[0],
        date_approved: l.approved_at
          ? new Date(l.approved_at).toISOString().split('T')[0]
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
    const totalLoanAmount = loans.reduce((sum, l) => sum + Number(l.amount), 0);
    const totalAmortization = loans.reduce(
      (sum, l) => sum + Number(l.monthly_amortization),
      0
    );

    // Add totals row
    const totalRowData: any = {
      id: '',
      purpose: 'TOTAL',
      amount: totalLoanAmount,
      term: '',
      amortization: totalAmortization,
      status: '',
      officer: '',
      date_applied: '',
      date_approved: '',
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
    sheet.getColumn('amortization').numFmt = '"₱"#,##0.00';

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
        new Set(loans.map(l => l.user_id)).size,
      ]);
      summarySheet.addRow(['']);
    }

    summarySheet.addRow(['Total Loan Amount:', totalLoanAmount]);
    summarySheet.addRow(['Total Monthly Amortization:', totalAmortization]);
    summarySheet.addRow(['']);
    summarySheet.addRow([
      'Average Loan Amount:',
      totalLoanAmount / loans.length,
    ]);
    summarySheet.addRow([
      'Average Term:',
      `${(loans.reduce((sum, l) => sum + l.repayment_term_months, 0) / loans.length).toFixed(1)} months`,
    ]);

    // Status breakdown
    summarySheet.addRow(['']);
    summarySheet.addRow(['STATUS BREAKDOWN']);
    const statusCounts: Record<string, number> = {};
    loans.forEach(l => {
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
      filename = `PF_Loans_${lastName}_${employee.employee_id}${dateRange}_${timestamp}.xlsx`;
    } else {
      filename = `PF_Loans_AllEmployees${dateRange}_${timestamp}.xlsx`;
    }

    // ========== SEND RESPONSE ==========
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

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

export async function exportLoansPDFController(req: Request, res: Response) {
  try {
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

    const loans = await getAllLoans({
      employeeId: employee_id ? Number(employee_id) : undefined,
      startDate: start,
      endDate: end,
    });

    if (loans.length === 0) {
      return res.status(404).json({
        error: 'No loans found for the specified criteria',
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
        Title: 'Provident Fund Loans Report - Banking Audit',
        Author: 'FundXpert System',
        Subject: isSingleEmployee
          ? 'Employee Loans Report - Confidential'
          : 'All Employees Loans Report - Confidential',
        Creator: 'FundXpert',
        Keywords: 'Provident Fund, Loans, Audit, Banking, Financial Report',
      },
    });

    // ========== GENERATE FILENAME ==========
    const timestamp = new Date().toISOString().split('T')[0];
    const dateRange = start && end ? `_${start}_to_${end}` : '';

    let filename: string;
    if (isSingleEmployee && employee) {
      const lastName = employee.name.split(' ').pop() || 'Employee';
      filename = `PF_Loans_${lastName}_${employee.employee_id}${dateRange}_${timestamp}.pdf`;
    } else {
      filename = `PF_Loans_AllEmployees${dateRange}_${timestamp}.pdf`;
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
      .text('PROVIDENT FUND LOANS REPORT', 40, currentY, {
        align: 'center',
      });

    currentY += 25;
    doc
      .fontSize(16)
      .text(
        isSingleEmployee && employee
          ? `${employee.name} - Loan History`
          : 'All Employees - Loan History',
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
          ? 'Individual Employee Loan History (Banking Audit)'
          : 'All Employees Loans (Banking Audit)',
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
        `Employment Status: ${employee.employment_status} | Base Salary: ₱${Number(employee.salary).toLocaleString()}`,
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
      const uniqueEmployees = new Set(loans.map(l => l.employee_id)).size;
      doc.text(
        `Employees Included: ${uniqueEmployees} | Total Records: ${loans.length}`,
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
      `Total Records: ${loans.length} | Data Source: FundXpert Database`,
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
          purpose: 75,
          amount: 65,
          term: 45,
          amortization: 70,
          status: 75,
          officer: 70,
          dateApplied: 50,
          dateApproved: 50,
        }
      : {
          id: 30,
          employeeId: 50,
          employeeName: 95,
          purpose: 50,
          amount: 60,
          term: 35,
          amortization: 65,
          status: 75,
          dateApplied: 45,
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
      .text('Purpose', columnPositions.purpose + 2, currentY, {
        width: columnWidths.purpose - 4,
        align: 'left',
      })
      .text('Amount (P)', columnPositions.amount + 2, currentY, {
        width: columnWidths.amount - 4,
        align: 'center',
      })
      .text('Term', columnPositions.term + 2, currentY, {
        width: columnWidths.term - 4,
        align: 'center',
      })
      .text('Amort. (P)', columnPositions.amortization + 2, currentY, {
        width: columnWidths.amortization - 4,
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
        .text('Applied', columnPositions.dateApplied + 2, currentY, {
          width: columnWidths.dateApplied - 4,
          align: 'center',
        })
        .text('Approved', columnPositions.dateApproved + 2, currentY, {
          width: columnWidths.dateApproved - 4,
          align: 'center',
        });
    } else {
      doc.text('Applied', columnPositions.dateApplied + 2, currentY, {
        width: columnWidths.dateApplied - 4,
        align: 'center',
      });
    }

    currentY += 25;

    // ========== TABLE DATA ==========
    let totalLoanAmount = 0;
    let totalAmortization = 0;
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
        .text('Purpose', columnPositions.purpose + 2, headerY, {
          width: columnWidths.purpose - 4,
          align: 'left',
        })
        .text('Amount (P)', columnPositions.amount + 2, headerY, {
          width: columnWidths.amount - 4,
          align: 'center',
        })
        .text('Term', columnPositions.term + 2, headerY, {
          width: columnWidths.term - 4,
          align: 'center',
        })
        .text('Amort. (P)', columnPositions.amortization + 2, headerY, {
          width: columnWidths.amortization - 4,
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
          .text('Applied', columnPositions.dateApplied + 2, headerY, {
            width: columnWidths.dateApplied - 4,
            align: 'center',
          })
          .text('Approved', columnPositions.dateApproved + 2, headerY, {
            width: columnWidths.dateApproved - 4,
            align: 'center',
          });
      } else {
        doc.text('Applied', columnPositions.dateApplied + 2, headerY, {
          width: columnWidths.dateApplied - 4,
          align: 'center',
        });
      }

      return y + 35;
    };

    loans.forEach((loan, index) => {
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
        .text(String(loan.id), columnPositions.id + 2, textY, {
          width: columnWidths.id - 4,
          align: 'center',
        });

      if (!isSingleEmployee) {
        doc
          .text(
            String(loan.employee_id),
            columnPositions.employeeId + 2,
            textY,
            {
              width: columnWidths.employeeId - 4,
              align: 'center',
            }
          )
          .text(
            truncateText(loan.employee_name || '-', 28),
            columnPositions.employeeName + 2,
            textY,
            { width: columnWidths.employeeName - 4, align: 'left' }
          );
      }

      const purposeText = loan.purpose_category;

      doc
        .text(
          truncateText(purposeText, isSingleEmployee ? 38 : 32),
          columnPositions.purpose + 2,
          textY,
          { width: columnWidths.purpose - 4, align: 'left' }
        )
        .text(
          Number(loan.amount).toLocaleString(),
          columnPositions.amount + 2,
          textY,
          { width: columnWidths.amount - 4, align: 'center' }
        )
        .text(
          `${loan.repayment_term_months}m`,
          columnPositions.term + 2,
          textY,
          { width: columnWidths.term - 4, align: 'center' }
        )
        .text(
          Number(loan.monthly_amortization).toLocaleString(),
          columnPositions.amortization + 2,
          textY,
          { width: columnWidths.amortization - 4, align: 'center' }
        )
        .font('Helvetica-Bold')
        .text(loan.status, columnPositions.status + 2, textY, {
          width: columnWidths.status - 4,
          align: 'center',
        });

      if (isSingleEmployee) {
        doc
          .fillColor(colors.primary)
          .font('Helvetica')
          .text(
            truncateText(loan.officer_name || '-', 20),
            columnPositions.officer + 2,
            textY,
            { width: columnWidths.officer - 4, align: 'left' }
          )
          .text(
            new Date(loan.created_at).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: '2-digit',
            }),
            columnPositions.dateApplied + 2,
            textY,
            { width: columnWidths.dateApplied - 4, align: 'center' }
          )
          .text(
            loan.approved_at
              ? new Date(loan.approved_at).toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: '2-digit',
                })
              : '-',
            columnPositions.dateApproved + 2,
            textY,
            { width: columnWidths.dateApproved - 4, align: 'center' }
          );
      } else {
        doc
          .fillColor(colors.primary)
          .font('Helvetica')
          .text(
            new Date(loan.created_at).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: '2-digit',
            }),
            columnPositions.dateApplied + 2,
            textY,
            { width: columnWidths.dateApplied - 4, align: 'center' }
          );
      }

      totalLoanAmount += Number(loan.amount);
      totalAmortization += Number(loan.monthly_amortization);
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

    const summaryBoxHeight = isSingleEmployee ? 120 : 170;
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
      const uniqueEmployees = new Set(loans.map(l => l.employee_id)).size;
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
      .text('Total Loan Amount:', labelX, contentY)
      .font('Helvetica-Bold')
      .text(
        `P${totalLoanAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        valueX,
        contentY,
        { width: valueWidth, align: 'right' }
      );

    contentY += 18;
    doc
      .font('Helvetica')
      .text('Total Monthly Amortization:', labelX, contentY)
      .font('Helvetica-Bold')
      .text(
        `P${totalAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        valueX,
        contentY,
        { width: valueWidth, align: 'right' }
      );

    contentY += 18;
    doc
      .font('Helvetica')
      .text('Average Loan Amount:', labelX, contentY)
      .font('Helvetica-Bold')
      .text(
        `P${(totalLoanAmount / loans.length).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        valueX,
        contentY,
        { width: valueWidth, align: 'right' }
      );

    contentY += 18;
    const avgTerm =
      loans.reduce((sum, l) => sum + l.repayment_term_months, 0) / loans.length;
    doc
      .font('Helvetica')
      .text('Average Term:', labelX, contentY)
      .font('Helvetica-Bold')
      .text(`${avgTerm.toFixed(1)} months`, valueX, contentY, {
        width: valueWidth,
        align: 'right',
      });

    addFooter();
    doc.end();
  } catch (err) {
    console.error('❌ PDF export error:', err);
    res.status(500).json({
      error: 'Failed to export PDF',
      message: err instanceof Error ? err.message : 'Unknown error occurred',
    });
  }
}

export async function getLoanDocumentsHandler(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { loanId } = req.params;

    const docs = await getLoanDocuments(Number(loanId));
    res.json({ documents: docs });
  } catch (err) {
    console.error('❌ Error fetching loan documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
}
