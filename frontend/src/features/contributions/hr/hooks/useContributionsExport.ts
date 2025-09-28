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
}

export function useContributionsExport(
  userId: number,
  dateRange: DateRange,
  employee?: Employee
) {
  const handleExport = useCallback(
    async (type: 'csv' | 'xlsx' | 'pdf') => {
      try {
        let blob;

        if (type === 'csv')
          blob = await hrContributionsService.exportEmpContributionCSV(userId, {
            startDate: dateRange.start,
            endDate: dateRange.end,
          });
        if (type === 'xlsx')
          blob = await hrContributionsService.exportEmpContributionExcel(
            userId,
            {
              startDate: dateRange.start,
              endDate: dateRange.end,
            }
          );
        if (type === 'pdf') {
          blob = await hrContributionsService.exportEmpContributionPDF(userId, {
            startDate: dateRange.start,
            endDate: dateRange.end,
          });
        }

        const dateRangeStr =
          dateRange.start && dateRange.end
            ? `_${dateRange.start}_to_${dateRange.end}`
            : '';

        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `employee_${employee?.name.toLowerCase()}_contributions${dateRangeStr}_${new Date().toISOString().split('T')[0]}.${type}`;
        link.click();

        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Export failed:', error);
        toast.error(`Failed to export .${type} file`);
      }
    },
    [userId, dateRange, employee]
  );

  return { handleExport };
}
