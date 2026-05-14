import { Card, CardContent } from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type KpiCardProps = {
  label: ReactNode;
  value?: ReactNode;
  icon?: LucideIcon;
  trend?: { delta: number; label?: string };
  hint?: ReactNode;
  loading?: boolean;
  className?: string;
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  loading,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn('p-0', className)}>
      <CardContent className="p-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-(--color-text-muted)">{label}</p>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-20" />
            ) : (
              <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-(--color-text-default)">
                {value ?? '—'}
              </p>
            )}
            {hint ? <p className="mt-1 text-xs text-(--color-text-subtle)">{hint}</p> : null}
          </div>
          {Icon ? (
            <span className="rounded-[var(--radius-md)] bg-(--color-brand-subtle) p-2 text-(--color-brand-700)">
              <Icon className="size-4" aria-hidden />
            </span>
          ) : null}
        </div>
        {trend ? (
          <p
            className={cn(
              'mt-3 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium',
              trend.delta >= 0 ? 'text-(--color-success-700)' : 'text-(--color-danger-700)',
            )}
          >
            {trend.delta >= 0 ? '▲' : '▼'} {Math.abs(trend.delta).toFixed(1)}%
            {trend.label ? (
              <span className="text-(--color-text-muted) font-normal">{trend.label}</span>
            ) : null}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
