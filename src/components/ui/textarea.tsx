import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full rounded-xl border border-[hsl(var(--gray-300))] bg-white px-4 py-3 text-sm text-[hsl(var(--dark))] shadow-sm transition-colors placeholder:text-[hsl(var(--gray-600))] hover:border-[hsl(var(--gray-400))] focus-visible:border-[hsl(var(--dark))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gray-300))] disabled:cursor-not-allowed disabled:border-[hsl(var(--gray-200))] disabled:bg-[hsl(var(--gray-100))] disabled:text-[hsl(var(--gray-600))]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
