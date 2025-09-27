export const FONT = {
  REGULAR: 'Helvetica',
  BOLD: 'Helvetica-Bold',
};
export const COLOR = {
  PRIMARY: '#1f2937', // Dark Gray
  SECONDARY: '#6b7280', // Medium Gray
  ACCENT: '#3b82f6', // Blue
  BORDER: '#e5e7eb', // Light Gray
  BACKGROUND: '#f9fafb', // Off-White
  WHITE: '#ffffff',
};
export const LAYOUT = {
  MARGIN: 40,
  PAGE_WIDTH: 595.28, // A4 width in points
  CONTENT_WIDTH: 595.28 - 40 * 2,
  SPACING: {
    SECTION: 25,
    ITEM: 15,
    SUB_ITEM: 5,
  },
};

/**
 * Table Layout Configuration
 */
export const TABLE_COLUMNS = [
  { key: 'id', header: 'ID', width: 40, align: 'center' },
  { key: 'user_id', header: 'Emp ID', width: 65, align: 'center' },
  { key: 'contribution_date', header: 'Date', width: 80, align: 'center' },
  {
    key: 'employee_amount',
    header: 'Employee Amt',
    width: 110,
    align: 'right',
  },
  {
    key: 'employer_amount',
    header: 'Employer Amt',
    width: 110,
    align: 'right',
  },
  { key: 'notes', header: 'Notes', width: 110, align: 'left' },
];

// Calculate column start positions dynamically
let currentX = LAYOUT.MARGIN;
const COLUMN_POSITIONS = TABLE_COLUMNS.reduce((acc, col) => {
  acc[col.key] = { ...col, x: currentX };
  currentX += col.width;
  return acc;
}, {});

// ========================================================================
// 📄 PDF DRAWING HELPER FUNCTIONS
// Each function handles a specific part of the document
// ========================================================================

/** Draws the main document header */
export function drawHeader(doc, y) {
  doc
    .fillColor(COLOR.PRIMARY)
    .font(FONT.BOLD)
    .fontSize(24)
    .text('FUNDXPERT', LAYOUT.MARGIN, y);

  doc
    .fillColor(COLOR.SECONDARY)
    .font(FONT.REGULAR)
    .fontSize(10)
    .text('Human Resources Department', LAYOUT.MARGIN, y + 30);

  const newY = y + 60;
  doc
    .strokeColor(COLOR.ACCENT)
    .lineWidth(2)
    .moveTo(LAYOUT.MARGIN, newY)
    .lineTo(LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN, newY)
    .stroke();

  return newY + LAYOUT.SPACING.SECTION;
}

/** Draws the report metadata box */
export function drawMetadata(
  doc,
  y,
  { employee, employee_id, start, end, totalRecords }
) {
  const boxContentY = y + LAYOUT.SPACING.ITEM;
  let textY = boxContentY;

  // Dynamically calculate box height
  let boxHeight = 65; // Base height
  if (employee) boxHeight += 30;
  if (start && end) boxHeight += 15;
  if (employee_id && !employee) boxHeight += 15;

  doc
    .rect(LAYOUT.MARGIN, y, LAYOUT.CONTENT_WIDTH, boxHeight)
    .fillAndStroke(COLOR.BACKGROUND, COLOR.BORDER);

  doc
    .fillColor(COLOR.PRIMARY)
    .font(FONT.BOLD)
    .fontSize(11)
    .text('Report Details', LAYOUT.MARGIN + 20, textY);
  textY += LAYOUT.SPACING.ITEM + 5;

  doc.fillColor(COLOR.SECONDARY).font(FONT.REGULAR).fontSize(10);
  doc.text(
    `Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`,
    LAYOUT.MARGIN + 20,
    textY
  );

  if (employee) {
    textY += LAYOUT.SPACING.ITEM;
    doc.text(
      `Employee: ${employee.name} (${employee.employee_id})`,
      LAYOUT.MARGIN + 20,
      textY
    );
    textY += LAYOUT.SPACING.ITEM;
    doc.text(
      `Department: ${employee.department} | Position: ${employee.position}`,
      LAYOUT.MARGIN + 20,
      textY
    );
  } else if (employee_id) {
    textY += LAYOUT.SPACING.ITEM;
    doc.text(`Employee ID: ${employee_id}`, LAYOUT.MARGIN + 20, textY);
  }

  if (start && end) {
    textY += LAYOUT.SPACING.ITEM;
    doc.text(
      `Period: ${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`,
      LAYOUT.MARGIN + 20,
      textY
    );
  }

  doc.text(`Total Records: ${totalRecords}`, 350, boxContentY + 5);

  return y + boxHeight + LAYOUT.SPACING.SECTION;
}

/** Draws the header row for the contributions table */
export function drawTableHeader(doc, y) {
  doc.rect(LAYOUT.MARGIN, y, LAYOUT.CONTENT_WIDTH, 30).fill(COLOR.PRIMARY);

  doc.fillColor(COLOR.WHITE).font(FONT.BOLD).fontSize(9);

  TABLE_COLUMNS.forEach(col => {
    const pos = COLUMN_POSITIONS[col.key];
    doc.text(pos.header, pos.x + 5, y + 10, {
      width: pos.width - 10,
      align: 'center',
    });
  });

  return y + 30;
}

/** Draws a single data row in the contributions table */
export function drawTableRow(doc, y, contribution, index) {
  const rowColor = index % 2 === 0 ? COLOR.WHITE : COLOR.BACKGROUND;
  const rowHeight = 30;

  doc
    .rect(LAYOUT.MARGIN, y, LAYOUT.CONTENT_WIDTH, rowHeight)
    .fillAndStroke(rowColor, COLOR.BORDER);

  doc.fillColor(COLOR.PRIMARY).font(FONT.REGULAR).fontSize(8);
  const textY = y + 11; // Vertically center text in the row

  // Helper to format currency
  const formatCurrency = amount =>
    `P${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // Draw each cell's text
  doc.text(String(contribution.id), COLUMN_POSITIONS.id.x, textY, {
    width: COLUMN_POSITIONS.id.width,
    align: 'center',
  });
  doc.text(String(contribution.user_id), COLUMN_POSITIONS.user_id.x, textY, {
    width: COLUMN_POSITIONS.user_id.width,
    align: 'center',
  });
  doc.text(
    new Date(contribution.contribution_date).toLocaleDateString(),
    COLUMN_POSITIONS.contribution_date.x,
    textY,
    { width: COLUMN_POSITIONS.contribution_date.width, align: 'center' }
  );
  doc.text(
    formatCurrency(contribution.employee_amount),
    COLUMN_POSITIONS.employee_amount.x,
    textY,
    { width: COLUMN_POSITIONS.employee_amount.width - 10, align: 'right' }
  );
  doc.text(
    formatCurrency(contribution.employer_amount),
    COLUMN_POSITIONS.employer_amount.x,
    textY,
    { width: COLUMN_POSITIONS.employer_amount.width - 10, align: 'right' }
  );
  doc.text(contribution.notes || '-', COLUMN_POSITIONS.notes.x + 5, textY, {
    width: COLUMN_POSITIONS.notes.width - 10,
    align: 'left',
  });

  return y + rowHeight;
}

/** Draws the summary section with totals */
export function drawSummary(doc, y, { totalEmployee, totalEmployer }) {
  const grandTotal = totalEmployee + totalEmployer;
  const boxHeight = 100;

  doc
    .rect(LAYOUT.MARGIN, y, LAYOUT.CONTENT_WIDTH, boxHeight)
    .fillAndStroke(COLOR.BACKGROUND, COLOR.BORDER);

  let textY = y + LAYOUT.SPACING.ITEM;
  doc
    .fillColor(COLOR.PRIMARY)
    .font(FONT.BOLD)
    .fontSize(14)
    .text('Summary', LAYOUT.MARGIN + 20, textY);

  textY += LAYOUT.SPACING.SECTION;
  const labelX = LAYOUT.MARGIN + 20;
  const valueX = LAYOUT.MARGIN + LAYOUT.CONTENT_WIDTH - 220; // Position for values

  // Helper to draw a summary line
  const drawSummaryLine = (label, value, font, size, color) => {
    doc.fillColor(color).font(font).fontSize(size).text(label, labelX, textY);
    doc.text(value, valueX, textY, { width: 200, align: 'right' });
    textY += LAYOUT.SPACING.ITEM + 5;
  };

  drawSummaryLine(
    'Total Employee Contributions:',
    `P${totalEmployee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    FONT.REGULAR,
    11,
    COLOR.PRIMARY
  );
  drawSummaryLine(
    'Total Employer Contributions:',
    `P${totalEmployer.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    FONT.REGULAR,
    11,
    COLOR.PRIMARY
  );

  doc
    .strokeColor(COLOR.BORDER)
    .moveTo(labelX, textY)
    .lineTo(LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN - 20, textY)
    .stroke();
  textY += 10;

  drawSummaryLine(
    'Grand Total:',
    `P${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    FONT.BOLD,
    12,
    COLOR.ACCENT
  );

  return y + boxHeight;
}

/** Draws the footer on every page */
export function drawFooter(doc) {
  const footerY = doc.page.height - 50;
  doc
    .strokeColor(COLOR.BORDER)
    .lineWidth(1)
    .moveTo(LAYOUT.MARGIN, footerY)
    .lineTo(LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN, footerY)
    .stroke();

  const textOptions = { align: 'center', width: LAYOUT.CONTENT_WIDTH };
  doc.fillColor(COLOR.SECONDARY).font(FONT.REGULAR).fontSize(8);
  doc.text(
    'CONFIDENTIAL - This document contains sensitive financial information.',
    LAYOUT.MARGIN,
    footerY + 10,
    textOptions
  );
  doc.text(
    `Generated by FundXpert HR System | Page ${doc.page.number} of ${doc.page.count}`,
    LAYOUT.MARGIN,
    footerY + 22,
    textOptions
  );
}
