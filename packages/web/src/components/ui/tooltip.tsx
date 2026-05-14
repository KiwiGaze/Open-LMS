'use client';

import { cn } from '@/lib/cn';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ComponentPropsWithoutRef } from 'react';
import { forwardRef } from 'react';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(function TooltipContent({ className, sideOffset = 6, ...rest }, ref) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'z-50 overflow-hidden rounded-[var(--radius-sm)] bg-(--color-surface-inverted) px-2 py-1 text-xs text-(--color-text-inverted) shadow-(--shadow-md)',
          'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
          className,
        )}
        {...rest}
      />
    </TooltipPrimitive.Portal>
  );
});
