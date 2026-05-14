'use client';

import { cn } from '@/lib/cn';
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, type = 'text', ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'block w-full rounded-[var(--radius-md)] border bg-(--color-surface-elevated) px-3 py-2 text-sm',
        'text-(--color-text-default) placeholder:text-(--color-text-subtle)',
        'border-(--color-border-default) hover:border-(--color-border-strong)',
        'focus:border-(--color-border-focus) focus:outline-none focus:[box-shadow:var(--shadow-focus)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-[invalid=true]:border-(--color-danger-500) aria-[invalid=true]:focus:[box-shadow:0_0_0_2px_var(--color-surface-base),0_0_0_4px_var(--color-danger-500)]',
        'transition-colors duration-(--duration-base)',
        className,
      )}
      {...rest}
    />
  );
});
