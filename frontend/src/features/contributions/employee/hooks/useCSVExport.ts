import { useMemo } from 'react';
import type { EmployeeMetadata } from '../components/ContributionHistoryTable';
import type { ContributionTotals } from '../types/employeeContributions';
import { getPeriodLabel } from '@/utils/getPeriodLabel';

type TableDataType = {
  monthYear: string;
  employee: number;
  employer: number;
  vested: number;
  total: number;
  cumulative: number;
};

// CSV Export Hook
export const useCSVExport = (
  tableData: TableDataType[],
  totals: ContributionTotals,
  metadata: EmployeeMetadata,
  currentPeriod: string
) => {
  return useMemo(() => {
    return () => {
      try {
        const rows: string[][] = [];

        const periodLabel = getPeriodLabel(currentPeriod);

        // Employee info
        rows.push(['Employee Name', metadata.name]);
        rows.push(['Employee ID', metadata.employeeId]);
        rows.push(['Employment Status', metadata.employment_status]);
        rows.push([
          'Date Hired',
          new Date(metadata.date_hired).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        ]);
        rows.push(['Period', periodLabel]);
        rows.push([
          'Export Date',
          new Date().toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        ]);
        rows.push([]);

        // Headers
        rows.push([
          'Month/Year',
          'Employee Contribution',
          'Employer Contribution',
          'Vested',
          'Monthly Total',
          'Cumulative Balance',
        ]);

        // Data rows - numbers only, no currency symbols
        // NOTE: When sorted desc,  need to recalculate cumulative values
        let runningCumulative = 0;

        const createDateFromMonthYear = (monthYear: string) => {
          return new Date(`${monthYear} 1`);
        };

        // If data is sorted in descending order by date, we need special handling for cumulative
        const isDescending =
          tableData.length > 1 &&
          createDateFromMonthYear(tableData[0].monthYear) >
            createDateFromMonthYear(tableData[1].monthYear);

        if (isDescending) {
          // For descending sort, we need to reverse calculate cumulative from the end
          const reversedData = [...tableData].reverse();
          runningCumulative = 0;

          reversedData.forEach(row => {
            runningCumulative += row.total;
          });

          // export in the current sort order but with correct cumulative values
          let tempCumulative = runningCumulative;
          tableData.forEach(row => {
            rows.push([
              row.monthYear,
              row.employee.toString(),
              row.employer.toString(),
              row.vested.toString(),
              row.total.toString(),
              tempCumulative.toString(),
            ]);
            tempCumulative -= row.total;
          });
        } else {
          // For ascending sort or no sort
          tableData.forEach(row => {
            runningCumulative += row.total;
            rows.push([
              row.monthYear,
              row.employee.toString(),
              row.employer.toString(),
              row.vested.toString(),
              row.total.toString(),
              runningCumulative.toString(),
            ]);
          });
        }

        // Totals row
        rows.push([]);
        rows.push([
          'TOTALS',
          totals.employee.toString(),
          totals.employer.toString(),
          totals.vested.toString(),
          '',
          totals.grand_total.toString(),
        ]);

        // Convert to CSV
        const csvContent = rows
          .map(row =>
            row
              .map(cell =>
                // Only quote cells that contain commas
                cell.includes(',') ? `"${cell}"` : cell
              )
              .join(',')
          )
          .join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `${metadata.name.replace(/\s+/g, '_')}_Contributions_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('CSV export failed:', error);
        alert('Export failed. Please try again.');
      }
    };
  }, [tableData, totals, metadata, currentPeriod]);
};
