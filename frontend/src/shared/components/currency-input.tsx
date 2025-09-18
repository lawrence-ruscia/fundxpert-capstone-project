import * as React from 'react';
import { NumberInput } from './number-input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends React.ComponentProps<typeof NumberInput> {
  currency?: string;
  currencyPosition?: 'left' | 'right';
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, currency = '₱', currencyPosition = 'left', ...props }, ref) => {
    return (
      <div className='relative'>
        {currencyPosition === 'left' && (
          <div className='pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3'>
            <span className='text-muted-foreground text-sm'>{currency}</span>
          </div>
        )}

        <NumberInput
          ref={ref}
          className={cn(
            currencyPosition === 'left' && 'pl-8',
            currencyPosition === 'right' && 'pr-12',
            className
          )}
          {...props}
        />

        {currencyPosition === 'right' && (
          <div className='pointer-events-none absolute inset-y-0 right-8 flex items-center pr-3'>
            <span className='text-muted-foreground text-sm'>{currency}</span>
          </div>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
