'use client';

import { Skeleton } from '@/components/ui/skeleton.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState } from './empty-state.tsx';
import { ErrorState } from './error-state.tsx';

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
  className?: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[] | undefined;
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty?: {
    icon?: LucideIcon;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
  };
  onRowClick?: (row: T) => void;
  className?: string;
};

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading,
  error,
  onRetry,
  empty,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} className={className} />;
  }

  if (isLoading && (!data || data.length === 0)) {
    return (
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.id}
                style={col.width ? { width: col.width } : undefined}
                className={cn(col.className)}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, rowIdx) => (
            <TableRow key={`s-${String(rowIdx)}`}>
              {columns.map((col) => (
                <TableCell key={col.id}>
                  <Skeleton className="h-3 w-3/4" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (!data || data.length === 0) {
    if (!empty) return null;
    return <EmptyState {...empty} className={className} />;
  }

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col.id}
              style={col.width ? { width: col.width } : undefined}
              className={cn(
                col.align === 'right' && 'text-right',
                col.align === 'center' && 'text-center',
                col.className,
              )}
            >
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={onRowClick ? 'cursor-pointer' : undefined}
          >
            {columns.map((col) => (
              <TableCell
                key={col.id}
                className={cn(
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.className,
                )}
              >
                {col.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
