'use client';

import { cn } from '@/lib/cn';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import type { ComponentPropsWithoutRef } from 'react';
import { forwardRef } from 'react';

export const RadioGroup = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(function RadioGroup({ className, ...rest }, ref) {
  return <RadioGroupPrimitive.Root ref={ref} className={cn('grid gap-2', className)} {...rest} />;
});

export const RadioGroupItem = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(function RadioGroupItem({ className, ...rest }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square size-4 rounded-full border border-(--color-border-default) bg-(--color-surface-elevated)',
        'transition-colors duration-(--duration-fast)',
        'hover:border-(--color-border-strong)',
        'focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-focus)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:border-(--color-brand) data-[state=checked]:bg-(--color-brand)',
        className,
      )}
      {...rest}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="size-1.5 rounded-full bg-(--color-text-onbrand)" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
