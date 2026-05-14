'use client';

import { cn } from '@/lib/cn';
import type { TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        'block w-full rounded-[var(--radius-md)] border bg-(--color-surface-elevated) px-3 py-2 text-sm leading-6',
        'text-(--color-text-default) placeholder:text-(--color-text-subtle)',
        'border-(--color-border-default) hover:border-(--color-border-strong)',
        'focus:border-(--color-border-focus) focus:outline-none focus:[box-shadow:var(--shadow-focus)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-[invalid=true]:border-(--color-danger-500)',
        'transition-colors duration-(--duration-base) resize-y',
        className,
      )}
      {...rest}
    />
  );
});
