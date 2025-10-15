// hooks/useContributionsExport.ts
import { useCallback } from 'react';
import * as employeeContributionService from '../services/employeeContributionsService.js';
import { toast } from 'sonner';
import { fetchEmployeeOverview } from '@/features/dashboard/employee/services/employeeService.js';
import type { Employee } from '@/features/dashboard/employee/types/employeeOverview.js';
interface DateRange {
  start?: string;
  end?: string;
}

interface UseContributionsExportParams {
  userId?: number;
  dateRange?: DateRange;
}

export function useEMPContributionsExport({
  userId,
  dateRange,
}: UseContributionsExportParams = {}) {
  const handleExport = useCallback(
    async (type: 'csv' | 'xlsx' | 'pdf') => {
      try {
        let blob;
        const exportParams = {
          start: dateRange?.start,
          end: dateRange?.end,
        };

        if (type === 'csv') {
          blob =
            await employeeContributionService.exportContributionsCSV(
              exportParams
            );
        } else if (type === 'xlsx') {
          blob =
            await employeeContributionService.exportContributionsExcel(
              exportParams
            );
        } else if (type === 'pdf') {
          blob =
            await employeeContributionService.exportContributionsPDF(
              exportParams
            );
        }

        if (!blob) {
          throw new Error('Failed to generate export file');
        }

        const res = await fetchEmployeeOverview();

        // Generate appropriate filename
        const filename = generateFilename(
          type,
          userId,
          res.employee,
          dateRange
        );

        // Download file
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Success toast with specific message
        const exportScope = `for ${res.employee?.name || 'employee'}`;

        toast.success(
          `Successfully exported ${type.toUpperCase()} ${exportScope}`
        );
      } catch (error) {
        console.error('Export failed:', error);
        toast.error(`Failed to export ${type.toUpperCase()} file`);
      }
    },
    [userId, dateRange]
  );

  return { handleExport };
}

/**
 * Generate appropriate filename based on export scope
 */
function generateFilename(
  type: 'csv' | 'xlsx' | 'pdf',
  userId?: number,
  employee?: Employee,
  dateRange?: DateRange
): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const dateRangeStr =
    dateRange?.start && dateRange?.end
      ? `_${dateRange.start}_to_${dateRange.end}`
      : '';

  // Single employee export
  const employeeName = employee.name.toLowerCase().replace(/\s+/g, '_');
  const employeeId = employee.employee_id || userId;
  return `contributions_${employeeName}_${employeeId}${dateRangeStr}_${timestamp}.${type}`;
}
