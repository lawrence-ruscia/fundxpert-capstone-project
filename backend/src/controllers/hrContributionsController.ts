import type { Request, Response } from 'express';
import {
  recordContribution,
  updateContribution,
  getContributionsByEmployee,
  getAllContributions,
  findEmployeeByEmployeeId,
  searchEmployees,
} from '../services/hrContributionsService.js';
import { isAuthenticatedRequest } from './employeeControllers.js';
import { Parser as Json2CsvParser } from 'json2csv';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { getEmployeeById } from '../services/hrService.js';
import path from 'path';

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

    const { userId, contributionDate, employeeAmount, employerAmount, notes } =
      req.body;

    const createdBy = req.user.id; // HR user from authMiddleware

    const contribution = await recordContribution({
      userId,
      contributionDate,
      employeeAmount,
      employerAmount,
      createdBy,
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
    const { employeeAmount, employerAmount, notes } = req.body;

    const updatedBy = req.user.id;

    const updated = await updateContribution(Number(id), {
      employeeAmount,
      employerAmount,
      updatedBy,
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
    const contributions = await getContributionsByEmployee(Number(userId));
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
    const contributions = await getAllContributions();
    res.json(contributions);
  } catch (err) {
    console.error('❌ getAllContributions error:', err);
    res.status(500).json({ error: 'Failed to fetch contributions' });
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
    const { employee_id, start, end } = req.query as {
      employee_id?: string;
      start?: string;
      end?: string;
    };

    const contributions = await getAllContributions(
      employee_id ? Number(employee_id) : undefined,
      start,
      end
    );

    // Format rows
    const formatted = contributions.map(c => ({
      ID: c.id,
      EmployeeID: c.user_id,
      Date: new Date(c.contribution_date).toISOString().split('T')[0],
      EmployeeAmount: Number(c.employee_amount).toFixed(2),
      EmployerAmount: Number(c.employer_amount).toFixed(2),
      Notes: c.notes ?? '',
    }));

    // Calculate totals
    const totals = {
      ID: '',
      EmployeeID: '',
      Date: 'TOTAL',
      EmployeeAmount: formatted
        .reduce((sum, row) => sum + parseFloat(row.EmployeeAmount), 0)
        .toFixed(2),
      EmployerAmount: formatted
        .reduce((sum, row) => sum + parseFloat(row.EmployerAmount), 0)
        .toFixed(2),
      Notes: '',
    };
    formatted.push(totals);

    const parser = new Json2CsvParser({ fields: Object.keys(formatted[0]) });
    const csv = parser.parse(formatted);

    res.header('Content-Type', 'text/csv');
    res.attachment('contributions_report.csv');
    res.send(csv);
  } catch (err) {
    console.error('❌ CSV export error:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
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
    const { employee_id, start, end } = req.query as {
      employee_id?: string;
      start?: string;
      end?: string;
    };

    const contributions = await getAllContributions(
      employee_id ? Number(employee_id) : undefined,
      start,
      end
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FundXpert';
    workbook.lastModifiedBy = 'FundXpert';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.subject = 'Provident Fund Contributions Report';

    //  Cover Sheet
    const cover = workbook.addWorksheet('Report Info');
    cover.addRow(['Provident Fund Contributions Report']);
    cover.addRow([`Generated at: ${new Date().toLocaleString()}`]);
    if (employee_id) cover.addRow([`Employee ID: ${employee_id}`]);
    if (start && end) cover.addRow([`Period: ${start} → ${end}`]);
    cover.addRow(['System: FundXpert']);

    // Style
    cover.getRow(1).font = { bold: true, size: 14 };
    cover.getRow(2).font = { italic: true, size: 10 };

    //  Contributions Sheet
    const sheet = workbook.addWorksheet('Contributions');
    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Employee ID', key: 'user_id', width: 12 },
      { header: 'Date', key: 'contribution_date', width: 15 },
      { header: 'Employee Amount', key: 'employee_amount', width: 18 },
      { header: 'Employer Amount', key: 'employer_amount', width: 18 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];

    // Freeze header row
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Add data
    contributions.forEach(c => {
      sheet.addRow({
        id: c.id,
        user_id: c.user_id,
        contribution_date: new Date(c.contribution_date)
          .toISOString()
          .split('T')[0],
        employee_amount: Number(c.employee_amount),
        employer_amount: Number(c.employer_amount),
        notes: c.notes ?? '',
      });
    });

    // Totals row
    const totalEmployee = contributions.reduce(
      (sum, c) => sum + Number(c.employee_amount),
      0
    );
    const totalEmployer = contributions.reduce(
      (sum, c) => sum + Number(c.employer_amount),
      0
    );
    const totalRow = sheet.addRow({
      id: '',
      user_id: '',
      contribution_date: 'TOTAL',
      employee_amount: totalEmployee,
      employer_amount: totalEmployer,
      notes: '',
    });
    totalRow.font = { bold: true };

    // Format currency columns
    sheet.getColumn('employee_amount').numFmt = '#,##0.00';
    sheet.getColumn('employer_amount').numFmt = '#,##0.00';

    // Protect sheet (read-only)
    const sheetPassword = 'readonly123';
    await sheet.protect(sheetPassword, {
      selectLockedCells: true,
      selectUnlockedCells: true,
    });

    // Stream to response
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=contributions_report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('❌ Excel export error:', err);
    res.status(500).json({ error: 'Failed to export Excel' });
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
    const { employee_id, start, end } = req.query as {
      employee_id?: string;
      start?: string;
      end?: string;
    };

    const contributions = await getAllContributions(
      employee_id ? Number(employee_id) : undefined,
      start,
      end
    );

    // Get employee details if specific employee is requested
    let employee: HREmployeeRecord | null = null;
    if (employee_id) {
      try {
        employee = await getEmployeeById(Number(employee_id));
      } catch (error) {
        console.warn('Could not fetch employee details:', error);
      }
    }

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      info: {
        Title: 'Provident Fund Contributions Report',
        Author: 'FundXpert',
        Subject: 'Employee Contributions Report',
        Creator: 'FundXpert',
      },
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=contributions_report_${new Date().toISOString().split('T')[0]}.pdf`
    );
    doc.pipe(res);

    // Colors and styling constants
    const colors = {
      primary: '#1f2937',
      secondary: '#6b7280',
      accent: '#001A88',
      border: '#e5e7eb',
      background: '#f9fafb',
    };

    // Helper function to add horizontal line
    const addHorizontalLine = (y: number, color = colors.border, width = 1) => {
      doc
        .strokeColor(color)
        .lineWidth(width)
        .moveTo(40, y)
        .lineTo(555, y)
        .stroke();
    };

    let currentY = 40;

    const __dirname = import.meta.dirname;
    // Company header
    try {
      const clientLogo = path.join(__dirname, 'client-logo.png');
      doc.image(clientLogo, 40, 40, { width: 140, height: 40 }); // Positioned top-right
    } catch (logoError) {
      console.warn('Logo not found, continuing without logo:', logoError);
    }

    doc
      .fillColor(colors.secondary)
      .fontSize(10)
      .font('Helvetica')
      .text('Human Resources Department', 40, currentY + 40);

    currentY += 60;
    addHorizontalLine(currentY, colors.accent, 2);
    currentY += 20;

    // Report title
    doc
      .fillColor(colors.primary)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Provident Fund Contributions Report', 40, currentY, {
        align: 'center',
      });

    currentY += 40;

    // Report metadata box - adjust height based on employee data
    const metadataHeight = employee ? 120 : 100;
    doc
      .rect(40, currentY, 515, metadataHeight)
      .fillAndStroke(colors.background, colors.border);

    currentY += 15;
    doc
      .fillColor(colors.primary)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Report Details', 60, currentY);

    currentY += 20;
    doc
      .fillColor(colors.secondary)
      .fontSize(10)
      .font('Helvetica')
      .text(
        `Generated: ${new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        60,
        currentY
      );

    // Add employee information if available
    if (employee) {
      currentY += 15;
      doc.text(
        `Employee: ${employee.name} (${employee.employee_id})`,
        60,
        currentY
      );
      currentY += 15;
      doc.text(
        `Department: ${employee.department} | Position: ${employee.position}`,
        60,
        currentY
      );
    } else if (employee_id) {
      currentY += 15;
      doc.text(`Employee ID: ${employee_id}`, 60, currentY);
    }

    if (start && end) {
      currentY += 15;
      doc.text(
        `Period: ${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`,
        60,
        currentY
      );
    } else {
      currentY += 15;
      doc.text('Period: All time', 60, currentY);
    }

    currentY += 15;
    doc.text(`Total Records: ${contributions.length}`, 60, currentY);

    currentY += metadataHeight - 60;

    // Table with fixed column widths to prevent squishing
    const tableWidth = 515;
    const columnWidths = {
      id: 40,
      employeeId: 70,
      date: 85,
      employeeAmount: 100,
      employerAmount: 100,
      notes: 120, // Increased notes column width
    };

    const columnPositions = {
      id: 40,
      employeeId: 40 + columnWidths.id,
      date: 40 + columnWidths.id + columnWidths.employeeId,
      employeeAmount:
        40 + columnWidths.id + columnWidths.employeeId + columnWidths.date,
      employerAmount:
        40 +
        columnWidths.id +
        columnWidths.employeeId +
        columnWidths.date +
        columnWidths.employeeAmount,
      notes:
        40 +
        columnWidths.id +
        columnWidths.employeeId +
        columnWidths.date +
        columnWidths.employeeAmount +
        columnWidths.employerAmount,
    };

    // Table header
    doc.rect(40, currentY, tableWidth, 30).fillAndStroke('#001A88', '#001A88');

    currentY += 10;
    doc
      .fillColor('#ffffff')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('ID', columnPositions.id + 5, currentY, {
        width: columnWidths.id - 10,
        align: 'center',
      })
      .text('Emp ID', columnPositions.employeeId + 5, currentY, {
        width: columnWidths.employeeId - 10,
        align: 'center',
      })
      .text('Date', columnPositions.date + 5, currentY, {
        width: columnWidths.date - 10,
        align: 'center',
      })
      .text('Employee Amt', columnPositions.employeeAmount + 5, currentY, {
        width: columnWidths.employeeAmount - 10,
        align: 'center',
      })
      .text('Employer Amt', columnPositions.employerAmount + 5, currentY, {
        width: columnWidths.employerAmount - 10,
        align: 'center',
      })
      .text('Notes', columnPositions.notes + 5, currentY, {
        width: columnWidths.notes - 10,
        align: 'center',
      });

    currentY += 30;

    // Table rows
    let totalEmployee = 0;
    let totalEmployer = 0;
    const rowHeight = 30; // Increased row height

    contributions.forEach((contribution, index) => {
      // Check for new page
      if (currentY + rowHeight > doc.page.height - 80) {
        doc.addPage();
        currentY = 40;

        // Repeat header
        doc
          .rect(40, currentY, tableWidth, 30)
          .fillAndStroke('#001A88', '#001A88');
        currentY += 8;
        doc
          .fillColor('#ffffff')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('ID', columnPositions.id + 5, currentY, {
            width: columnWidths.id - 10,
            align: 'center',
          })
          .text('Emp ID', columnPositions.employeeId + 5, currentY, {
            width: columnWidths.employeeId - 10,
            align: 'center',
          })
          .text('Date', columnPositions.date + 5, currentY, {
            width: columnWidths.date - 10,
            align: 'center',
          })
          .text('Employee Amt', columnPositions.employeeAmount + 5, currentY, {
            width: columnWidths.employeeAmount - 10,
            align: 'center',
          })
          .text('Employer Amt', columnPositions.employerAmount + 5, currentY, {
            width: columnWidths.employerAmount - 10,
            align: 'center',
          })
          .text('Notes', columnPositions.notes + 5, currentY, {
            width: columnWidths.notes - 10,
            align: 'center',
          });
        currentY += 30;
      }

      // Alternating row colors
      const rowColor = index % 2 === 0 ? '#ffffff' : colors.background;
      doc
        .rect(40, currentY, tableWidth, rowHeight)
        .fillAndStroke(rowColor, colors.border);

      const textY = currentY + 10;
      doc
        .fillColor(colors.primary)
        .fontSize(8)
        .font('Helvetica')
        .text(String(contribution.id), columnPositions.id + 2, textY, {
          width: columnWidths.id - 4,
          align: 'center',
        })
        .text(
          String(contribution.user_id),
          columnPositions.employeeId + 2,
          textY,
          { width: columnWidths.employeeId - 4, align: 'center' }
        )
        .text(
          new Date(contribution.contribution_date).toLocaleDateString(),
          columnPositions.date + 2,
          textY,
          { width: columnWidths.date - 4, align: 'center' }
        )
        .text(
          `P${Number(contribution.employee_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          columnPositions.employeeAmount + 2,
          textY,
          { width: columnWidths.employeeAmount - 4, align: 'center' }
        )
        .text(
          `P${Number(contribution.employer_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          columnPositions.employerAmount + 2,
          textY,
          { width: columnWidths.employerAmount - 4, align: 'center' }
        )
        .text(contribution.notes || '-', columnPositions.notes + 5, textY, {
          width: columnWidths.notes,
          align: 'left',
        });

      totalEmployee += Number(contribution.employee_amount);
      totalEmployer += Number(contribution.employer_amount);
      currentY += rowHeight;
    });

    // Summary section
    currentY += 20;
    addHorizontalLine(currentY, colors.accent, 2);
    currentY += 20;

    // Summary box
    doc
      .rect(40, currentY, 515, 100)
      .fillAndStroke(colors.background, colors.border);

    currentY += 15;
    doc
      .fillColor(colors.primary)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Summary', 70, currentY);

    currentY += 25;
    const grandTotal = totalEmployee + totalEmployer;

    doc
      .fontSize(11)
      .font('Helvetica')
      .text('Total Employee Contributions:', 80, currentY)
      .font('Helvetica-Bold')
      .text(
        `P${totalEmployee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        400,
        currentY,
        { align: 'center' }
      );

    currentY += 18;
    doc
      .font('Helvetica')
      .text('Total Employer Contributions:', 80, currentY)
      .font('Helvetica-Bold')
      .text(
        `P${totalEmployer.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        400,
        currentY,
        { align: 'center' }
      );

    currentY += 18;
    doc.moveTo(70, currentY).lineTo(535, currentY).stroke();
    currentY += 8;

    doc
      .fillColor(colors.accent)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Grand Total:', 80, currentY)
      .text(
        `P${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        400,
        currentY,
        { align: 'center' }
      );

    // Footer function
    const addFooter = (pageNum: number, totalPages: number) => {
      const footerY = doc.page.height - 50;

      addHorizontalLine(footerY - 10, colors.border);

      doc
        .fillColor(colors.secondary)
        .fontSize(8)
        .font('Helvetica')
        .text(
          'CONFIDENTIAL - This document contains sensitive financial information.',
          40,
          footerY,
          { align: 'center', width: 515 }
        )
        .text(
          `Generated by FundXpert | Page ${pageNum} of ${totalPages}`,
          40,
          footerY + 12,
          { align: 'center', width: 515 }
        );
    };

    // Add footers to all pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      addFooter(i - range.start + 1, range.count);
    }

    doc.end();
  } catch (err) {
    console.error('PDF export error:', err);
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
