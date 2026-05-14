import { cn } from '@/lib/cn';
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { forwardRef } from 'react';

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(function Table(
  { className, ...rest },
  ref,
) {
  return (
    <div className="w-full overflow-auto rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-elevated)">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm border-collapse', className)}
        {...rest}
      />
    </div>
  );
});

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableHeader({ className, ...rest }, ref) {
  return (
    <thead
      ref={ref}
      className={cn('bg-(--color-surface-sunken) text-(--color-text-muted)', className)}
      {...rest}
    />
  );
});

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableBody({ className, ...rest }, ref) {
  return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...rest} />;
});

export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableFooter({ className, ...rest }, ref) {
  return (
    <tfoot
      ref={ref}
      className={cn(
        'border-t border-(--color-border-subtle) bg-(--color-surface-sunken) font-medium',
        className,
      )}
      {...rest}
    />
  );
});

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  function TableRow({ className, ...rest }, ref) {
    return (
      <tr
        ref={ref}
        className={cn(
          'border-b border-(--color-border-subtle) transition-colors',
          'hover:bg-(--color-surface-sunken) data-[state=selected]:bg-(--color-surface-muted)',
          className,
        )}
        {...rest}
      />
    );
  },
);

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  function TableHead({ className, ...rest }, ref) {
    return (
      <th
        ref={ref}
        className={cn(
          'h-10 px-3 text-left align-middle text-xs font-medium uppercase tracking-wide',
          'first:pl-4 last:pr-4',
          className,
        )}
        {...rest}
      />
    );
  },
);

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  function TableCell({ className, ...rest }, ref) {
    return (
      <td
        ref={ref}
        className={cn('px-3 py-3 align-middle first:pl-4 last:pr-4', className)}
        {...rest}
      />
    );
  },
);

export const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  HTMLAttributes<HTMLTableCaptionElement>
>(function TableCaption({ className, ...rest }, ref) {
  return (
    <caption
      ref={ref}
      className={cn('mt-4 text-sm text-(--color-text-muted)', className)}
      {...rest}
    />
  );
});
