'use client';

import { cn } from '@/lib/cn';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { ComponentPropsWithoutRef } from 'react';
import { forwardRef } from 'react';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(function PopoverContent({ className, align = 'center', sideOffset = 6, ...rest }, ref) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72 rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-elevated) p-4 text-(--color-text-default) shadow-(--shadow-md)',
          'focus:outline-none',
          className,
        )}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  );
});
