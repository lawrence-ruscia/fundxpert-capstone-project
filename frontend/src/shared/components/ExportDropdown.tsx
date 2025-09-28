import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileBarChart,
  ChevronDown,
  Loader2,
} from 'lucide-react';

type ExportType = 'csv' | 'xlsx' | 'pdf';

interface ExportDropdownProps {
  onExport: (type: ExportType) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  label?: string;
}

export function ExportDropdown({
  onExport,
  disabled = false,
  className = '',
  variant = 'default',
  size = 'default',
  showLabel = true,
  label = 'Export',
}: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState<ExportType | null>(null);

  const handleExport = async (type: ExportType) => {
    try {
      setIsExporting(type);
      await onExport(type);
    } catch (error) {
      console.error(`Export ${type} failed:`, error);
    } finally {
      setIsExporting(null);
    }
  };

  const exportOptions = [
    {
      type: 'csv' as const,
      label: 'Export as CSV',
      description: 'Comma-separated values',
      icon: FileSpreadsheet,
    },
    {
      type: 'xlsx' as const,
      label: 'Export as Excel',
      description: 'Microsoft Excel format',
      icon: FileBarChart,
    },
    {
      type: 'pdf' as const,
      label: 'Export as PDF',
      description: 'Portable document format',
      icon: FileText,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isExporting !== null}
          className={`gap-2 ${className}`}
        >
          {isExporting ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Download className='h-4 w-4' />
          )}
          {showLabel && (
            <>
              {isExporting
                ? `Exporting ${isExporting.toUpperCase()}...`
                : label}
              <ChevronDown className='h-3 w-3 opacity-50' />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {exportOptions.map(option => {
          const Icon = option.icon;
          const isCurrentlyExporting = isExporting === option.type;

          return (
            <DropdownMenuItem
              key={option.type}
              onClick={() => handleExport(option.type)}
              disabled={isExporting !== null}
              className='cursor-pointer'
            >
              <div className='flex w-full items-center gap-3'>
                <div className='flex w-5 items-center justify-center'>
                  {isCurrentlyExporting ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Icon className='h-4 w-4' />
                  )}
                </div>
                <div className='flex-1'>
                  <div className='font-medium'>{option.label}</div>
                  <div className='text-muted-foreground text-xs'>
                    {option.description}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
