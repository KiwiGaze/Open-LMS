'use client';

import { cn } from '@/lib/cn';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';

const buttonStyles = cva(
  [
    'inline-flex items-center justify-center gap-2 select-none whitespace-nowrap',
    'rounded-[var(--radius-md)] font-medium leading-none transition-colors',
    'transition-[background-color,box-shadow,border-color,color] duration-(--duration-base) ease-(--ease-out-soft)',
    'focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-focus)]',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      intent: {
        primary: [
          'bg-(--color-brand) text-(--color-text-onbrand)',
          'hover:bg-(--color-brand-hover) active:bg-(--color-brand-active)',
        ],
        secondary: [
          'bg-(--color-surface-elevated) text-(--color-text-default) border border-(--color-border-default)',
          'hover:bg-(--color-surface-muted) hover:border-(--color-border-strong)',
        ],
        ghost: ['bg-transparent text-(--color-text-default)', 'hover:bg-(--color-surface-muted)'],
        subtle: [
          'bg-(--color-brand-subtle) text-(--color-brand-700)',
          'hover:bg-(--color-brand-subtle-hover)',
        ],
        danger: [
          'bg-(--color-danger-600) text-(--color-text-onbrand)',
          'hover:bg-(--color-danger-700)',
        ],
        link: 'bg-transparent text-(--color-text-link) hover:text-(--color-text-link-hover) underline-offset-4 hover:underline px-0',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, intent, size, block, asChild, loading, disabled, children, ...rest },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(buttonStyles({ intent, size, block }), className)}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </Comp>
  );
});

export { buttonStyles };
