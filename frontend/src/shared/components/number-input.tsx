import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import * as React from 'react';

interface NumberInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  onValueChange?: (value: number | undefined) => void;
  step?: number;
  min?: number;
  max?: number;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      onValueChange,
      onChange,
      step = 1,
      min,
      max,
      disabled,
      value: controlledValue,
      defaultValue,
      ...props
    },
    ref
  ) => {
    // Determine if component is controlled
    const isControlled = controlledValue !== undefined;

    // Use controlled value or internal state
    const [internalValue, setInternalValue] = React.useState<string>(
      defaultValue?.toString() || ''
    );

    const displayValue = isControlled
      ? controlledValue?.toString() || ''
      : internalValue;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // Update internal state only if uncontrolled
      if (!isControlled) {
        setInternalValue(newValue);
      }

      // Always call onChange for form libraries
      if (onChange) {
        onChange(e);
      }

      // Call onValueChange with parsed number or undefined
      if (onValueChange) {
        const numValue =
          newValue === '' ? undefined : Number.parseFloat(newValue);
        // Only call if the parsed value is valid or explicitly empty
        if (newValue === '' || (numValue !== undefined && !isNaN(numValue))) {
          onValueChange(numValue);
        }
      }
    };

    const getCurrentNumericValue = (): number => {
      const parsed = Number.parseFloat(displayValue);
      return isNaN(parsed) ? 0 : parsed;
    };

    const adjustValue = (direction: 'up' | 'down') => {
      if (disabled) return;

      // Use integer arithmetic to avoid floating-point precision issues
      const currentValue = getCurrentNumericValue();

      // Determine the number of decimal places we need to work with
      const stepStr = step.toString();
      const currentStr = displayValue;

      const stepDecimals = stepStr.includes('.')
        ? stepStr.split('.')[1].length
        : 0;
      const currentDecimals = currentStr.includes('.')
        ? currentStr.split('.')[1].length
        : 0;
      const maxDecimals = Math.max(stepDecimals, currentDecimals, 3); // At least 3 for safety

      // Convert to integers for precise arithmetic
      const multiplier = Math.pow(10, maxDecimals);
      const currentInt = Math.round(currentValue * multiplier);
      const stepInt = Math.round(step * multiplier);

      const newValueInt =
        direction === 'up' ? currentInt + stepInt : currentInt - stepInt;
      const newValue = newValueInt / multiplier;

      // Round to remove any remaining precision issues
      const finalValue = Math.round(newValue * multiplier) / multiplier;

      // Check bounds
      if (min !== undefined && finalValue < min) return;
      if (max !== undefined && finalValue > max) return;

      const stringValue = finalValue.toString();

      // Update internal state only if uncontrolled
      if (!isControlled) {
        setInternalValue(stringValue);
      }

      // For controlled components, we need to create a synthetic event
      // to trigger onChange which will update the parent state
      if (onChange) {
        const syntheticEvent = {
          target: { value: stringValue },
          currentTarget: { value: stringValue },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }

      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        adjustValue('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        adjustValue('down');
      }
    };

    // Helper function to check if spinner buttons should be disabled
    const isUpDisabled = () => {
      if (disabled) return true;
      if (max === undefined) return false;
      const currentNum = getCurrentNumericValue();
      return currentNum >= max;
    };

    const isDownDisabled = () => {
      if (disabled) return true;
      if (min === undefined) return false;
      const currentNum = getCurrentNumericValue();
      return currentNum <= min;
    };

    return (
      <div className='relative'>
        <input
          ref={ref}
          type='number'
          data-slot='input'
          className={cn(
            'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            // Hide native spinner
            '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            // Add padding for custom spinner
            'pr-8',
            className
          )}
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          {...props}
        />

        {/* Custom Spinner Buttons */}
        <div className='absolute inset-y-0 right-0 flex flex-col'>
          <button
            type='button'
            onClick={() => adjustValue('up')}
            disabled={isUpDisabled()}
            className={cn(
              'border-input bg-background flex h-[18px] w-8 items-center justify-center rounded-tr-md border-l transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-none',
              'disabled:pointer-events-none disabled:opacity-50',
              'active:bg-accent/80'
            )}
            tabIndex={-1}
          >
            <ChevronUp className='h-3 w-3' />
          </button>
          <button
            type='button'
            onClick={() => adjustValue('down')}
            disabled={isDownDisabled()}
            className={cn(
              'border-input bg-background flex h-[18px] w-8 items-center justify-center rounded-br-md border-t border-l transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-none',
              'disabled:pointer-events-none disabled:opacity-50',
              'active:bg-accent/80'
            )}
            tabIndex={-1}
          >
            <ChevronDown className='h-3 w-3' />
          </button>
        </div>
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

export { NumberInput };
