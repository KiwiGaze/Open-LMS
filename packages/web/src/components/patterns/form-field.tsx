import { Label } from '@/components/ui/label.tsx';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export type FormFieldProps = {
  id?: string;
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FormField({
  id,
  label,
  description,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? (
            <span aria-hidden className="ml-0.5 text-(--color-text-danger)">
              *
            </span>
          ) : null}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p id={id ? `${id}-error` : undefined} className="text-xs text-(--color-text-danger)">
          {error}
        </p>
      ) : description ? (
        <p id={id ? `${id}-description` : undefined} className="text-xs text-(--color-text-muted)">
          {description}
        </p>
      ) : null}
    </div>
  );
}
