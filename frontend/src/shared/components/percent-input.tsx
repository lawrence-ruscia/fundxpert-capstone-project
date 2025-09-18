import * as React from 'react';
import { NumberInput } from './number-input';
import { cn } from '@/lib/utils';

interface PercentInputProps extends React.ComponentProps<typeof NumberInput> {
  percentage?: string;
  percentagePosition?: 'left' | 'right';
}

const PercentInput = React.forwardRef<HTMLInputElement, PercentInputProps>(
  (
    { className, percentage = '%', percentagePosition = 'left', ...props },
    ref
  ) => {
    return (
      <div className='relative'>
        {percentagePosition === 'left' && (
          <div className='pointer-events-none absolute  inset-y-0 left-0 z-10 flex items-center pl-3'>
            <span className='text-muted-foreground text-sm'>{percentage}</span>
          </div>
        )}

        <NumberInput
          ref={ref}
          className={cn(
            percentagePosition === 'left' && 'pl-8',
            percentagePosition === 'right' && 'pr-12',
            className
          )}
          {...props}
        />

        {percentagePosition === 'right' && (
          <div className='pointer-events-none absolute inset-y-0 right-8 flex items-center pr-3'>
            <span className='text-muted-foreground text-sm'>{percentage}</span>
          </div>
        )}
      </div>
    );
  }
);

PercentInput.displayName = 'PercentInput';

export { PercentInput as PercentInput };
