'use client';

import { cn } from '@/lib/cn.ts';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import type { ComponentPropsWithoutRef } from 'react';
import { forwardRef } from 'react';

export const Switch = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...rest }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
        'transition-colors duration-(--duration-base)',
        'focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-focus)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-(--color-brand) data-[state=unchecked]:bg-(--color-neutral-300) dark:data-[state=unchecked]:bg-(--color-neutral-700)',
        className,
      )}
      {...rest}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block size-4 rounded-full bg-(--color-surface-elevated) shadow-(--shadow-sm)',
          'transition-transform duration-(--duration-base)',
          'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  );
});
