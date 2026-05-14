import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-(--color-border-default) bg-(--color-surface-elevated) px-6 py-12 text-center',
        className,
      )}
    >
      {Icon ? (
        <div className="rounded-full bg-(--color-brand-subtle) p-3 text-(--color-brand-700)">
          <Icon className="size-5" aria-hidden />
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="font-medium text-(--color-text-default)">{title}</p>
        {description ? (
          <p className="text-sm text-(--color-text-muted) max-w-md">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
