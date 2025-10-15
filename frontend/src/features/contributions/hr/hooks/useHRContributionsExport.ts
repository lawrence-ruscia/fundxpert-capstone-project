// hooks/useContributionsExport.ts
import { useCallback } from 'react';
import { hrContributionsService } from '../services/hrContributionService';
import { toast } from 'sonner';

interface DateRange {
  start?: string;
  end?: string;
}

interface Employee {
  name: string;
  employee_id?: string | number;
}

interface UseContributionsExportParams {
  userId?: number; // Optional now - if not provided, exports all employees
  dateRange?: DateRange;
  employee?: Employee;
}

export function useHRContributionsExport({
  userId,
  dateRange,
  employee,
}: UseContributionsExportParams = {}) {
  const handleExport = useCallback(
    async (type: 'csv' | 'xlsx' | 'pdf') => {
      try {
        let blob;
        const exportParams = {
          userId: userId,
          start: dateRange?.start,
          end: dateRange?.end,
        };

        // Call unified export functions with optional employeeId
        if (type === 'csv') {
          blob =
            await hrContributionsService.exportContributionsCSV(exportParams);
        } else if (type === 'xlsx') {
          blob =
            await hrContributionsService.exportContributionsExcel(exportParams);
        } else if (type === 'pdf') {
          blob =
            await hrContributionsService.exportContributionsPDF(exportParams);
        }

        if (!blob) {
          throw new Error('Failed to generate export file');
        }

        // Generate appropriate filename
        const filename = generateFilename(type, userId, employee, dateRange);

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
        const exportScope = userId
          ? `for ${employee?.name || 'employee'}`
          : 'for all employees';
        toast.success(
          `Successfully exported ${type.toUpperCase()} ${exportScope}`
        );
      } catch (error) {
        console.error('Export failed:', error);
        toast.error(`Failed to export ${type.toUpperCase()} file`);
      }
    },
    [userId, dateRange, employee]
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

  if (userId && employee) {
    // Single employee export
    const employeeName = employee.name.toLowerCase().replace(/\s+/g, '_');
    const employeeId = employee.employee_id || userId;
    return `contributions_${employeeName}_${employeeId}${dateRangeStr}_${timestamp}.${type}`;
  } else {
    // All employees export
    return `contributions_all_employees${dateRangeStr}_${timestamp}.${type}`;
  }
}
