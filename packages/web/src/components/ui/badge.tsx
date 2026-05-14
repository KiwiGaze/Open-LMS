import { cn } from '@/lib/cn';
import { type VariantProps, cva } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

const badgeStyles = cva(
  'inline-flex items-center gap-1 rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium leading-none whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral:
          'bg-(--color-surface-muted) text-(--color-text-default) border border-(--color-border-subtle)',
        brand: 'bg-(--color-brand-subtle) text-(--color-brand-700)',
        success: 'bg-(--color-success-50) text-(--color-success-700)',
        warning: 'bg-(--color-warning-50) text-(--color-warning-700)',
        danger: 'bg-(--color-danger-50) text-(--color-danger-700)',
        info: 'bg-(--color-info-50) text-(--color-info-700)',
        outline:
          'bg-transparent text-(--color-text-default) border border-(--color-border-default)',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeStyles> {}

export function Badge({ className, tone, ...rest }: BadgeProps) {
  return <span className={cn(badgeStyles({ tone }), className)} {...rest} />;
}
