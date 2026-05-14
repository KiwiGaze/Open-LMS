'use client';

import { cn } from '@/lib/cn';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { forwardRef } from 'react';

export const Checkbox = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...rest }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer inline-flex size-4 shrink-0 items-center justify-center rounded-[var(--radius-xs)]',
        'border border-(--color-border-default) bg-(--color-surface-elevated)',
        'transition-colors duration-(--duration-fast)',
        'hover:border-(--color-border-strong)',
        'focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-focus)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-(--color-brand) data-[state=checked]:border-(--color-brand) data-[state=checked]:text-(--color-text-onbrand)',
        'data-[state=indeterminate]:bg-(--color-brand) data-[state=indeterminate]:border-(--color-brand) data-[state=indeterminate]:text-(--color-text-onbrand)',
        className,
      )}
      {...rest}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {rest.checked === 'indeterminate' ? (
          <Minus className="size-3" aria-hidden />
        ) : (
          <Check className="size-3" aria-hidden />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
