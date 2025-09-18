import React from 'react';
import { NumberInput } from './number-input';
import { cn } from '@/lib/utils';

interface PercentInputProps extends React.ComponentProps<typeof NumberInput> {
  symbol?: string;
  symbolPosition?: 'left' | 'right';
}

export const PercentInput = React.forwardRef<
  HTMLInputElement,
  PercentInputProps
>(
  (
    {
      className,
      symbol = '%',
      symbolPosition: symbolPosition = 'left',
      ...props
    },
    ref
  ) => {
    return (
      <div className='relative'>
        {symbolPosition === 'left' && (
          <div className='pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3'>
            <span className='text-muted-foreground text-sm'>{symbol}</span>
          </div>
        )}
        <NumberInput
          ref={ref}
          className={cn(
            symbolPosition === 'left' && 'pl-8',
            symbolPosition === 'right' && 'pr-12',
            className
          )}
          {...props}
        />
        {symbolPosition === 'right' && (
          <div className='pointer-events-none absolute inset-y-0 right-8 flex items-center pr-3'>
            <span className='text-muted-foreground text-sm'>{symbol}</span>
          </div>
        )}
      </div>
    );
  }
);

PercentInput.displayName = 'PercentInput';
