// hooks/useContributionsExport.ts
import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  exportUsersCSV,
  exportUsersExcel,
} from '../services/usersManagementService';

interface DateRange {
  start?: string;
  end?: string;
}

interface UseUsersExportParams {
  dateRange?: DateRange;
}

export function useUsersExport({ dateRange }: UseUsersExportParams = {}) {
  const handleExport = useCallback(
    async (type: 'csv' | 'xlsx' | 'pdf') => {
      try {
        let blob;
        const exportParams = {
          start: dateRange?.start,
          end: dateRange?.end,
        };

        // Call unified export functions with optional employeeId
        if (type === 'csv') {
          blob = await exportUsersCSV(exportParams);
        } else if (type === 'xlsx') {
          blob = await exportUsersExcel(exportParams);
        }

        if (!blob) {
          throw new Error('Failed to generate export file');
        }

        // Generate appropriate filename
        const filename = generateFilename(type, dateRange);

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
        const exportScope = 'for all users';
        toast.success(
          `Successfully exported ${type.toUpperCase()} ${exportScope}`
        );
      } catch (error) {
        console.error('Export failed:', error);
        toast.error(`Failed to export ${type.toUpperCase()} file`);
      }
    },
    [dateRange]
  );

  return { handleExport };
}

/**
 * Generate appropriate filename based on export scope
 */
function generateFilename(
  type: 'csv' | 'xlsx' | 'pdf',
  dateRange?: DateRange
): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const dateRangeStr =
    dateRange?.start && dateRange?.end
      ? `_${dateRange.start}_to_${dateRange.end}`
      : '';

  // All users export
  return `user_audit_${dateRangeStr}_${timestamp}.${type}`;
}
