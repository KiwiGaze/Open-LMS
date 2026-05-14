'use client';

import { cn } from '@/lib/cn';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentPropsWithoutRef } from 'react';
import { forwardRef } from 'react';

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...rest }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-(--color-surface-muted) p-1 text-(--color-text-muted)',
        className,
      )}
      {...rest}
    />
  );
});

export const TabsTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...rest }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium',
        'transition-colors duration-(--duration-fast)',
        'focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-focus)]',
        'data-[state=active]:bg-(--color-surface-elevated) data-[state=active]:text-(--color-text-default) data-[state=active]:shadow-(--shadow-xs)',
        'hover:text-(--color-text-default)',
        className,
      )}
      {...rest}
    />
  );
});

export const TabsContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...rest }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-4 focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-focus)] rounded-[var(--radius-md)]',
        className,
      )}
      {...rest}
    />
  );
});
