import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState } from 'react';

interface DataTableDateRangeFilterProps<TData> {
  column: any;
  title: string;
}

const formatDate = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export function DataTableDateRangeFilter<TData>({
  column,
  title,
}: DataTableDateRangeFilterProps<TData>) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const filterValue = column?.getFilterValue() as
    | { start?: string; end?: string }
    | undefined;

  const hasFilter = filterValue && (filterValue.start || filterValue.end);

  // Convert string dates to Date objects for the calendar
  const startDate = filterValue?.start
    ? new Date(filterValue.start)
    : undefined;
  const endDate = filterValue?.end ? new Date(filterValue.end) : undefined;

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined, type: 'start' | 'end') => {
    if (!date) return;

    const dateString = formatDate(date); // Format as YYYY-MM-DD

    column?.setFilterValue({
      ...filterValue,
      [type]: dateString,
    });

    // Close the popover after selection
    if (type === 'start') setStartOpen(false);
    if (type === 'end') setEndOpen(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='h-8 border-dashed'>
          <Calendar className='mr-2 h-4 w-4' />
          {title}
          {hasFilter && (
            <>
              <Separator orientation='vertical' className='mx-2 h-4' />
              <Badge
                variant='secondary'
                className='rounded-sm px-1 font-normal'
              >
                Filtered
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-4' align='start'>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <h4 className='leading-none font-medium'>{title}</h4>
            <p className='text-muted-foreground text-sm'>
              Set a date range to filter contributions
            </p>
          </div>

          <div className='flex gap-4'>
            {/* Start Date Picker */}
            <div className='flex flex-1 flex-col gap-2'>
              <label className='text-xs font-medium'>From</label>
              <Popover open={startOpen} onOpenChange={setStartOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='h-9 justify-between text-sm font-normal'
                  >
                    {startDate
                      ? startDate.toLocaleDateString()
                      : 'Select start'}
                    <ChevronDown className='h-4 w-4' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className='w-auto overflow-hidden p-0'
                  align='start'
                >
                  <CalendarComponent
                    mode='single'
                    selected={startDate}
                    captionLayout='dropdown'
                    onSelect={date => handleDateSelect(date, 'start')}
                    disabled={date => endDate && date > endDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date Picker */}
            <div className='flex flex-1 flex-col gap-2'>
              <label className='text-xs font-medium'>To</label>
              <Popover open={endOpen} onOpenChange={setEndOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='h-9 justify-between text-sm font-normal'
                  >
                    {endDate ? endDate.toLocaleDateString() : 'Select end'}
                    <ChevronDown className='h-4 w-4' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className='w-auto overflow-hidden p-0'
                  align='start'
                >
                  <CalendarComponent
                    mode='single'
                    selected={endDate}
                    captionLayout='dropdown'
                    onSelect={date => handleDateSelect(date, 'end')}
                    disabled={date => startDate && date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className='flex justify-start'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => column?.setFilterValue(undefined)}
              disabled={!hasFilter}
            >
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
