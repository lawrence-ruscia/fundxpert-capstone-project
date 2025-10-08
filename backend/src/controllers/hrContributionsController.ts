import type { Request, Response } from 'express';
import {
  recordContribution,
  updateContribution,
  getEmployeeContributions,
  getAllContributions,
  findEmployeeByEmployeeId,
  searchEmployees,
  getContributionsById,
  getEmployeeByContributionId,
  getContributionSummary,
} from '../services/hrContributionsService.js';
import { isAuthenticatedRequest } from './employeeControllers.js';
import { Parser as Json2CsvParser } from 'json2csv';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { getEmployeeById } from '../services/hrService.js';
import path from 'path';
import { SHEET_PASSWORD } from '../config/security.config.js';
import type { Contribution } from '../types/contribution.js';

/**
 * POST /hr/contributions
 * Record a new contribution
 */
export async function recordContributionController(
  req: Request,
  res: Response
) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      user_id,
      contribution_date,
      employee_amount,
      employer_amount,
      notes,
    } = req.body;

    const created_by = req.user.id; // HR user from authMiddleware

    const contribution = await recordContribution({
      user_id,
      contribution_date,
      employee_amount,
      employer_amount,
      created_by,
      notes,
    });

    res.status(201).json(contribution);
  } catch (err) {
    console.error('❌ recordContribution error:', err);
    res.status(500).json({ error: 'Failed to record contribution' });
  }
}

/**
 * PUT /hr/contributions/:id
 * Adjust an existing contribution
 */
export async function updateContributionController(
  req: Request,
  res: Response
) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const { employee_amount, employer_amount, notes } = req.body;

    const updated_by = req.user.id;

    const updated = await updateContribution(Number(id), {
      employee_amount,
      employer_amount,
      updated_by,
      notes,
    });

    res.json(updated);
  } catch (err) {
    console.error('❌ updateContribution error:', err);
    res.status(500).json({ error: 'Failed to update contribution' });
  }
}

/**
 * GET /hr/contributions/employee/:userId
 * Get contribution history for a specific employee
 */
export async function getEmployeeContributionsController(
  req: Request,
  res: Response
) {
  try {
    const { userId } = req.params;
    const contributions = await getEmployeeContributions(Number(userId));
    res.json(contributions);
  } catch (err) {
    console.error('❌ getEmployeeContributions error:', err);
    res.status(500).json({ error: 'Failed to fetch employee contributions' });
  }
}

/**
 * GET /hr/contributions
 * Get all contributions (HR-wide view)
 */
export async function getAllContributionsController(
  req: Request,
  res: Response
) {
  try {
    const { userId, startDate, endDate } = req.query;

    const contributions = await getAllContributions(
      userId !== null ? Number(userId) : null,
      startDate ?? '',
      endDate
    );
    res.json(contributions);
  } catch (err) {
    console.error('❌ getAllContributions error:', err);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
}

export async function getContributionsByIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;
    const contributions = await getContributionsById(Number(id));
    res.json(contributions);
  } catch (err) {
    console.error('❌ getContributionsById error:', err);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
}

/**
 * GET /hr/contributions/:id/employee
 * Get employee info by contribution ID
 */
export async function getEmployeeByContributionIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;
    const employee = await getEmployeeByContributionId(Number(id));

    if (!employee) {
      return res
        .status(404)
        .json({ error: 'Contribution or employee not found' });
    }

    res.json(employee);
  } catch (err) {
    console.error('❌ getEmployeeByContributionId error:', err);
    res.status(500).json({ error: 'Failed to fetch employee info' });
  }
}

/**
 * GET /hr/contributions/export/csv
 */
export async function exportContributionsCSVController(
  req: Request,
  res: Response
) {
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

    const contributions = await getAllContributions(
      employee_id ? Number(employee_id) : undefined,
      start,
      end
    );

    if (contributions.length === 0) {
      return res.status(404).json({
        error: 'No contributions found for the specified criteria',
      });
    }

    // Helper function to calculate total
    const getTotal = (c: Contribution) =>
      Number(c.employee_amount) + Number(c.employer_amount);

    // Create professional CSV structure with metadata header
    const csvData = [];

    // ========== REPORT METADATA SECTION ==========
    csvData.push(['PROVIDENT FUND CONTRIBUTIONS REPORT']);
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
        ? 'Individual Employee History'
        : 'All Employees Contributions',
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
      const uniqueEmployees = new Set(contributions.map(c => c.user_id)).size;
      csvData.push(['Employees Included', uniqueEmployees.toString()]);
      csvData.push(['Total Records', contributions.length.toString()]);
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
      csvData.push(['Total Records', contributions.length.toString()]);
    }

    csvData.push(['']); // Empty row for spacing

    // ========== DATA TABLE SECTION ==========
    csvData.push(['CONTRIBUTION DETAILS']);

    // Column headers based on export type
    if (isSingleEmployee) {
      csvData.push([
        'ID',
        'Date',
        'Employee Amount (₱)',
        'Employer Amount (₱)',
        'Total (₱)',
        'Status',
        'Notes',
      ]);
    } else {
      csvData.push([
        'ID',
        'Employee ID',
        'Employee Name',
        'Department',
        'Position',
        'Date',
        'Employee Amount (₱)',
        'Employer Amount (₱)',
        'Total (₱)',
        'Status',
        'Notes',
      ]);
    }

    // Format contribution rows
    contributions.forEach(c => {
      const rowData = [
        c.id.toString(),
        ...(isSingleEmployee ? [] : [c.employee_id]), // Include Employee ID for all employees
        ...(isSingleEmployee ? [] : [c.employee_name]),
        ...(isSingleEmployee ? [] : [c.department_name]),
        ...(isSingleEmployee ? [] : [c.position_title]),
        new Date(c.contribution_date).toISOString().split('T')[0],
        Number(c.employee_amount).toFixed(2),
        Number(c.employer_amount).toFixed(2),
        getTotal(c).toFixed(2),
        c.is_adjusted ? 'Adjusted' : 'Original',
        c.notes?.replace(/[\r\n,]/g, ' ') || '', // Clean notes for CSV compatibility
      ];
      csvData.push(rowData);
    });

    // Calculate totals
    const totalEmployee = contributions.reduce(
      (sum, c) => sum + Number(c.employee_amount),
      0
    );
    const totalEmployer = contributions.reduce(
      (sum, c) => sum + Number(c.employer_amount),
      0
    );
    const grandTotal = totalEmployee + totalEmployer;

    // Add totals row with visual separator
    csvData.push(['']); // Empty row
    const totalsRow = [
      '',
      ...(isSingleEmployee ? [] : ['']), // Extra empty cell for Employee ID column
      'TOTAL',
      totalEmployee.toFixed(2),
      totalEmployer.toFixed(2),
      grandTotal.toFixed(2),
      '',
      '',
    ];
    csvData.push(totalsRow);

    // ========== SUMMARY SECTION ==========
    csvData.push(['']); // Empty row
    csvData.push(['SUMMARY']);

    if (!isSingleEmployee) {
      const uniqueEmployees = new Set(contributions.map(c => c.user_id)).size;
      csvData.push(['Number of Employees', uniqueEmployees.toString()]);
      csvData.push([
        'Average per Record',
        `₱${(grandTotal / contributions.length).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      ]);
    }

    csvData.push([
      'Total Employee Contributions',
      `₱${totalEmployee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ]);
    csvData.push([
      'Total Employer Contributions',
      `₱${totalEmployer.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ]);
    csvData.push([
      'Grand Total',
      `₱${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ]);

    // ========== AUDIT INFORMATION SECTION ==========
    csvData.push(['']); // Empty row
    csvData.push(['AUDIT INFORMATION']);
    csvData.push(['Document Classification', 'CONFIDENTIAL - HR USE ONLY']);
    csvData.push([
      'System Source',
      'FundXpert Provident Fund Management System',
    ]);
    csvData.push(['Export Timestamp', new Date().toISOString()]);
    csvData.push(['Exported By', 'HR Department']); // You could get this from req.user if available
    csvData.push([
      'File Integrity',
      'This report is generated directly from the system database',
    ]);

    // Convert to CSV format
    const parser = new Json2CsvParser({
      fields: undefined, // Let it auto-detect
      header: false, // We're creating custom headers
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
      filename = `PF_Contributions_${lastName}_${employee.employee_id}${dateRange}_${timestamp}.csv`;
    } else {
      filename = `PF_Contributions_AllEmployees${dateRange}_${timestamp}.csv`;
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

/**
 * GET /hr/contributions/export/excel
 */
export async function exportContributionsExcelController(
  req: Request,
  res: Response
) {
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

    const contributions = await getAllContributions(
      employee_id ? Number(employee_id) : undefined,
      start,
      end
    );

    if (contributions.length === 0) {
      return res.status(404).json({
        error: 'No contributions found for the specified criteria',
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FundXpert System';
    workbook.lastModifiedBy = 'HR Department';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.subject =
      'Provident Fund Contributions Report - Banking Audit';

    // ========== COVER SHEET ==========
    const cover = workbook.addWorksheet('Report Information');

    cover.addRow(['PROVIDENT FUND CONTRIBUTIONS REPORT']);
    cover.addRow(['']);
    cover.addRow(['DOCUMENT CLASSIFICATION: CONFIDENTIAL - HR USE ONLY']);
    cover.addRow(['']);
    cover.addRow(['REPORT GENERATION']);
    cover.addRow(['Generated By:', 'FundXpert System']);
    cover.addRow(['Report Date:', new Date().toLocaleString()]);
    cover.addRow([
      'Report Type:',
      isSingleEmployee
        ? 'Individual Employee History'
        : 'All Employees Contributions',
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
      cover.addRow(['Total Records:', contributions.length]);

      // Get unique employee count
      const uniqueEmployees = new Set(contributions.map(c => c.user_id)).size;
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
      cover.addRow(['Total Records:', contributions.length]);
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
      const periodRowIndex = 10 + 6; // Adjusted for all employees layout
      cover.getRow(periodRowIndex).font = { bold: true, size: 11 };
    }

    cover.columns = [{ width: 25 }, { width: 50 }];

    // ========== MAIN CONTRIBUTIONS SHEET ==========
    const sheet = workbook.addWorksheet('Contribution Details');

    // Column configuration based on export type
    const columns = isSingleEmployee
      ? [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Date', key: 'contribution_date', width: 15 },
          { header: 'Employee Amount (₱)', key: 'employee_amount', width: 20 },
          { header: 'Employer Amount (₱)', key: 'employer_amount', width: 20 },
          { header: 'Total (₱)', key: 'total', width: 18 },
          { header: 'Status', key: 'status', width: 18 },
          { header: 'Notes', key: 'notes', width: 35 },
        ]
      : [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Employee ID', key: 'employee_id', width: 15 },
          { header: 'Employee Name', key: 'employee_name', width: 20 },
          { header: 'Department', key: 'department', width: 20 },
          { header: 'Position', key: 'position', width: 20 },
          { header: 'Date', key: 'contribution_date', width: 15 },
          { header: 'Employee Amount (₱)', key: 'employee_amount', width: 20 },
          { header: 'Employer Amount (₱)', key: 'employer_amount', width: 20 },
          { header: 'Total (₱)', key: 'total', width: 18 },
          { header: 'Status', key: 'status', width: 18 },
          { header: 'Notes', key: 'notes', width: 35 },
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

    // Add contribution data
    contributions.forEach((c, index) => {
      const employeeAmount = Number(c.employee_amount);
      const employerAmount = Number(c.employer_amount);

      const rowData: any = {
        id: c.id,
        contribution_date: new Date(c.contribution_date)
          .toISOString()
          .split('T')[0],
        employee_amount: employeeAmount,
        employer_amount: employerAmount,
        total: employeeAmount + employerAmount,
        status: c.is_adjusted ? 'Adjusted' : 'Original',
        notes: c.notes ?? '',
      };

      // Include user_id for all employees export
      if (!isSingleEmployee) {
        rowData.employee_id = c.employee_id;
        rowData.employee_name = c.employee_name;
        rowData.department = c.department_name;
        rowData.position = c.position_title;
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
    const totalEmployee = contributions.reduce(
      (sum, c) => sum + Number(c.employee_amount),
      0
    );
    const totalEmployer = contributions.reduce(
      (sum, c) => sum + Number(c.employer_amount),
      0
    );
    const grandTotal = totalEmployee + totalEmployer;

    // Add totals row
    const totalRowData: any = {
      id: '',
      contribution_date: 'TOTAL',
      employee_amount: totalEmployee,
      employer_amount: totalEmployer,
      total: '',
      status: 'GRAND TOTAL',
      notes: formatCurrency(grandTotal),
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
    sheet.getColumn('employee_amount').numFmt = '"₱"#,##0.00';
    sheet.getColumn('employer_amount').numFmt = '"₱"#,##0.00';
    sheet.getColumn('total').numFmt = '"₱"#,##0.00';

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
        new Set(contributions.map(c => c.user_id)).size,
      ]);
      summarySheet.addRow(['']);
    }

    summarySheet.addRow(['Total Employee Contributions:', totalEmployee]);
    summarySheet.addRow(['Total Employer Contributions:', totalEmployer]);
    summarySheet.addRow(['Grand Total:', grandTotal]);
    summarySheet.addRow(['']);
    summarySheet.addRow([
      'Average per Record:',
      grandTotal / contributions.length,
    ]);

    summarySheet.getRow(1).font = { bold: true, size: 14 };
    summarySheet.getColumn('B').numFmt = '"₱"#,##0.00';
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
      filename = `PF_Contributions_${lastName}_${employee.employee_id}${dateRange}_${timestamp}.xlsx`;
    } else {
      filename = `PF_Contributions_AllEmployees${dateRange}_${timestamp}.xlsx`;
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

export type HREmployeeRecord = {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  department_id: number;
  position_id: number;
  role: 'Employee';
  salary: number;
  employment_status: string;
  date_hired: string;
  department: string;
  position: string;
};

export async function exportContributionsPDFController(
  req: Request,
  res: Response
) {
  try {
    const { user_id, start, end } = req.query as {
      user_id?: string;
      start?: string;
      end?: string;
    };

    // Determine if this is a single employee or all employees export
    const isSingleEmployee = !!user_id;

    // Fetch data based on export type
    const employee = isSingleEmployee
      ? await getEmployeeById(Number(user_id))
      : null;

    const contributions = await getAllContributions(
      user_id ? Number(user_id) : undefined,
      start,
      end
    );

    if (contributions.length === 0) {
      return res.status(404).json({
        error: 'No contributions found for the specified criteria',
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
        Title: 'Provident Fund Contributions Report - Banking Audit',
        Author: 'FundXpert System',
        Subject: isSingleEmployee
          ? 'Employee Contributions Report - Confidential'
          : 'All Employees Contributions Report - Confidential',
        Creator: 'FundXpert',
        Keywords:
          'Provident Fund, Contributions, Audit, Banking, Financial Report',
      },
    });

    // ========== GENERATE FILENAME ==========
    const timestamp = new Date().toISOString().split('T')[0];
    const dateRange = start && end ? `_${start}_to_${end}` : '';

    let filename: string;
    if (isSingleEmployee && employee) {
      const lastName = employee.name.split(' ').pop() || 'Employee';
      filename = `PF_Contributions_${lastName}_${employee.employee_id}${dateRange}_${timestamp}.pdf`;
    } else {
      filename = `PF_Contributions_AllEmployees${dateRange}_${timestamp}.pdf`;
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
      .text('PROVIDENT FUND CONTRIBUTIONS REPORT', 40, currentY, {
        align: 'center',
      });

    currentY += 25;
    doc
      .fontSize(16)
      .text(
        isSingleEmployee && employee
          ? `${employee.name} - Contribution History`
          : 'All Employees - Contribution History',
        40,
        currentY,
        { align: 'center' }
      );

    currentY += 35;

    // ========== METADATA BOX ==========
    const metadataHeight = 180;
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
          ? 'Individual Employee History (Banking Audit)'
          : 'All Employees Contributions (Banking Audit)',
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
      const uniqueEmployees = new Set(contributions.map(c => c.user_id)).size;
      doc.text(
        `Employees Included: ${uniqueEmployees} | Total Records: ${contributions.length}`,
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
      `Total Records: ${contributions.length} | Data Source: FundXpert Database`,
      60,
      currentY
    );

    currentY += metadataHeight - (isSingleEmployee ? 120 : 95);

    // ========== TABLE STRUCTURE ==========
    const tableWidth = 515;

    // Column widths based on export type
    const columnWidths = isSingleEmployee
      ? {
          id: 40,
          date: 70,
          employeeAmount: 80,
          employerAmount: 80,
          total: 85,
          status: 60,
          notes: 100,
        }
      : {
          id: 35,
          userId: 50,
          employeeName: 90,
          date: 65,
          employeeAmount: 75,
          employerAmount: 75,
          total: 75,
          status: 50,
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

    currentY += 12;
    doc
      .fillColor('#ffffff')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('ID', columnPositions.id + 2, currentY, {
        width: columnWidths.id - 4,
        align: 'center',
      });

    if (!isSingleEmployee) {
      doc
        .text('Emp ID', columnPositions.userId + 2, currentY, {
          width: columnWidths.userId - 4,
          align: 'center',
        })
        .text('Employee Name', columnPositions.employeeName + 2, currentY, {
          width: columnWidths.employeeName - 4,
          align: 'left',
        });
    }

    doc
      .text('Date', columnPositions.date + 2, currentY, {
        width: columnWidths.date - 4,
        align: 'left',
      })
      .text('Employee (P)', columnPositions.employeeAmount + 2, currentY, {
        width: columnWidths.employeeAmount - 4,
        align: 'center',
      })
      .text('Employer (P)', columnPositions.employerAmount + 2, currentY, {
        width: columnWidths.employerAmount - 4,
        align: 'center',
      })
      .text('Total (P)', columnPositions.total + 2, currentY, {
        width: columnWidths.total - 4,
        align: 'center',
      })
      .text('Status', columnPositions.status + 2, currentY, {
        width: columnWidths.status - 4,
        align: 'center',
      });

    if (isSingleEmployee) {
      doc.text('Notes', columnPositions.notes + 2, currentY, {
        width: columnWidths.notes - 4,
        align: 'center',
      });
    }

    currentY += 35;

    // ========== TABLE DATA WITH ENHANCED FORMATTING ==========
    let totalEmployee = 0;
    let totalEmployer = 0;
    const rowHeight = 32;

    const drawTableHeader = (y: number) => {
      doc
        .rect(40, y, tableWidth, 35)
        .fillAndStroke(colors.accent, colors.accent);

      const headerY = y + 12;
      doc
        .fillColor('#ffffff')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('ID', columnPositions.id + 2, headerY, {
          width: columnWidths.id - 4,
          align: 'center',
        });

      if (!isSingleEmployee) {
        doc
          .text('Emp ID', columnPositions.userId + 2, headerY, {
            width: columnWidths.userId - 4,
            align: 'center',
          })
          .text('Employee Name', columnPositions.employeeName + 2, headerY, {
            width: columnWidths.employeeName - 4,
            align: 'left',
          });
      }

      doc
        .text('Date', columnPositions.date + 2, headerY, {
          width: columnWidths.date - 4,
          align: 'left',
        })
        .text('Employee (P)', columnPositions.employeeAmount + 2, headerY, {
          width: columnWidths.employeeAmount - 4,
          align: 'center',
        })
        .text('Employer (P)', columnPositions.employerAmount + 2, headerY, {
          width: columnWidths.employerAmount - 4,
          align: 'center',
        })
        .text('Total (P)', columnPositions.total + 2, headerY, {
          width: columnWidths.total - 4,
          align: 'center',
        })
        .text('Status', columnPositions.status + 2, headerY, {
          width: columnWidths.status - 4,
          align: 'center',
        });

      if (isSingleEmployee) {
        doc.text('Notes', columnPositions.notes + 2, headerY, {
          width: columnWidths.notes - 4,
          align: 'center',
        });
      }

      return y + 35;
    };

    contributions.forEach((contribution, index) => {
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
      const contributionTotal =
        Number(contribution.employee_amount) +
        Number(contribution.employer_amount);

      doc
        .fillColor(colors.primary)
        .fontSize(8)
        .font('Helvetica')
        .text(String(contribution.id), columnPositions.id + 2, textY, {
          width: columnWidths.id - 4,
          align: 'center',
        });

      if (!isSingleEmployee) {
        doc
          .text(
            String(contribution.employee_id),
            columnPositions.userId + 2,
            textY,
            {
              width: columnWidths.userId - 4,
              align: 'center',
            }
          )
          .text(
            truncateText(contribution.employee_name || '-', 27),
            columnPositions.employeeName + 2,
            textY,
            { width: columnWidths.employeeName - 4, align: 'left' }
          );
      }

      doc
        .text(
          new Date(contribution.contribution_date).toLocaleDateString(),
          columnPositions.date + 2,
          textY,
          { width: columnWidths.date - 4, align: 'left' }
        )
        .text(
          Number(contribution.employee_amount).toLocaleString(),
          columnPositions.employeeAmount + 2,
          textY,
          { width: columnWidths.employeeAmount - 4, align: 'center' }
        )
        .text(
          Number(contribution.employer_amount).toLocaleString(),
          columnPositions.employerAmount + 2,
          textY,
          { width: columnWidths.employerAmount - 4, align: 'center' }
        )
        .text(
          contributionTotal.toLocaleString(),
          columnPositions.total + 2,
          textY,
          { width: columnWidths.total - 4, align: 'center' }
        )
        .font('Helvetica-Bold')
        .fillColor(
          contribution.is_adjusted ? colors.confidential : colors.success
        )
        .text(
          contribution.is_adjusted ? 'Adjusted' : 'Original',
          columnPositions.status + 2,
          textY,
          { width: columnWidths.status - 4, align: 'center' }
        )
        .fillColor(colors.primary)
        .font('Helvetica');

      if (isSingleEmployee) {
        doc.text(
          truncateText(contribution.notes || '', 50),
          columnPositions.notes + 2,
          textY,
          { width: columnWidths.notes - 4, align: 'left' }
        );
      }

      totalEmployee += Number(contribution.employee_amount);
      totalEmployer += Number(contribution.employer_amount);
      currentY += rowHeight;
    });

    // ========== ENHANCED SUMMARY SECTION ==========
    const summaryHeight = isSingleEmployee ? 160 : 180;
    if (currentY + summaryHeight > doc.page.height - 100) {
      addFooter();
      doc.addPage();
      currentY = 40;
    }

    currentY += 25;
    addHorizontalLine(currentY, colors.accent, 2);
    currentY += 25;

    const summaryBoxHeight = isSingleEmployee ? 130 : 150;
    const summaryBoxY = currentY;
    doc
      .rect(40, summaryBoxY, 515, summaryBoxHeight)
      .fillAndStroke(colors.background, colors.accent);

    let contentY = summaryBoxY + 20;
    const labelX = 60;
    const valueX = 320;
    const valueWidth = 215;
    const grandTotal = totalEmployee + totalEmployer;

    doc
      .fillColor(colors.primary)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('FINANCIAL SUMMARY', labelX, contentY);

    contentY += 25;

    if (!isSingleEmployee) {
      const uniqueEmployees = new Set(contributions.map(c => c.user_id)).size;
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
      .text('Total Employee Contributions:', labelX, contentY)
      .font('Helvetica-Bold')
      .text(
        `P${totalEmployee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        valueX,
        contentY,
        { width: valueWidth, align: 'right' }
      );

    contentY += 18;
    doc
      .font('Helvetica')
      .text('Total Employer Contributions:', labelX, contentY)
      .font('Helvetica-Bold')
      .text(
        `P${totalEmployer.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        valueX,
        contentY,
        { width: valueWidth, align: 'right' }
      );

    contentY += 15;
    doc
      .moveTo(labelX, contentY)
      .lineTo(535, contentY)
      .strokeColor(colors.accent)
      .lineWidth(1)
      .stroke();

    contentY += 15;
    doc
      .fillColor(colors.accent)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('GRAND TOTAL:', labelX, contentY)
      .text(
        `P${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        valueX,
        contentY,
        { width: valueWidth, align: 'right' }
      );

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

export async function findEmployeeByEmployeeIdController(
  req: Request,
  res: Response
) {
  try {
    const { employeeId } = req.params;
    const employee = await findEmployeeByEmployeeId(employeeId ?? '');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (err) {
    console.error('❌ Error looking up employee:', err);
    res.status(500).json({ error: 'Failed to lookup employee' });
  }
}

export async function searchEmployeesController(req: Request, res: Response) {
  try {
    const q = (req.query.q as string) || '';
    if (q.length < 2) {
      return res
        .status(400)
        .json({ error: 'Query must be at least 2 characters' });
    }

    const employees = await searchEmployees(q);
    res.json(employees);
  } catch (err) {
    console.error('❌ Error searching employees:', err);
    res.status(500).json({ error: 'Failed to search employees' });
  }
}
 
export async function getEmployeeContributionSummary(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params; // employee id
    const summary = await getContributionSummary(Number(id));

    if (!summary) {
      return res.status(404).json({ error: 'No contributions found' });
    }
 
    res.json(summary);
  } catch (err) {
    console.error('Error fetching contribution summary:', err);
    res.status(500).json({ error: 'Failed to fetch contribution summary' });
  }
}

export async function getAllContributionSummary(req: Request, res: Response) {
  try {
    const summary = await getContributionSummary();

    if (!summary) {
      return res.status(404).json({ error: 'No contributions found' });
    }

    res.json(summary);
  } catch (err) {
    console.error('Error fetching contribution summary:', err);
    res.status(500).json({ error: 'Failed to fetch contribution summary' });
  }
}
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '-';
  return text.length > maxLength
    ? text.substring(0, maxLength - 3) + '...'
    : text;
};

export function formatCurrency(value: number): string {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
