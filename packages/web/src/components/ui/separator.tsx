'use client';

import { cn } from '@/lib/cn';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import type { ComponentPropsWithoutRef } from 'react';
import { forwardRef } from 'react';

export const Separator = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(function Separator({ className, orientation = 'horizontal', decorative = true, ...rest }, ref) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-(--color-border-subtle)',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...rest}
    />
  );
});
