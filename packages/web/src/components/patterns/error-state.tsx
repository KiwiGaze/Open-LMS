import { Button } from '@/components/ui/button.tsx';
import { type ApiErrorShape, asApiError } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

export type ErrorStateProps = {
  title?: ReactNode;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({ title, error, onRetry, className }: ErrorStateProps) {
  const parsed: ApiErrorShape | null = error ? asApiError(error) : null;
  const heading = title ?? 'Something went wrong';
  const message =
    parsed?.message ??
    (error instanceof Error
      ? error.message
      : 'Please try again. If this keeps happening, contact support.');
  const code = parsed?.code;
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-(--color-danger-200) bg-(--color-danger-50) px-6 py-10 text-center',
        className,
      )}
    >
      <div className="rounded-full bg-(--color-danger-200)/60 p-3 text-(--color-danger-700)">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <div className="flex flex-col gap-1 max-w-md">
        <p className="font-medium text-(--color-danger-700)">{heading}</p>
        <p className="text-sm text-(--color-danger-700)/85">{message}</p>
        {code ? (
          <p className="mt-1 text-2xs font-mono uppercase tracking-wider text-(--color-danger-700)/70">
            error: {code}
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button intent="secondary" size="sm" onClick={onRetry} className="mt-2">
          <RotateCcw className="size-3.5" aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
