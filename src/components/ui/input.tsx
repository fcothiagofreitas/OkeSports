import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border border-[hsl(var(--gray-300))] bg-white px-4 py-2 text-sm text-[hsl(var(--dark))] shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[hsl(var(--dark))] placeholder:text-[hsl(var(--gray-600))] hover:border-[hsl(var(--gray-400))] focus-visible:border-[hsl(var(--dark))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gray-300))] disabled:cursor-not-allowed disabled:border-[hsl(var(--gray-200))] disabled:bg-[hsl(var(--gray-100))] disabled:text-[hsl(var(--gray-600))]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
