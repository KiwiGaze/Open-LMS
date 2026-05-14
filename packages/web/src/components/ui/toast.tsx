'use client';

import { cn } from '@/lib/cn';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { type VariantProps, cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { createContext, forwardRef, useCallback, useContext, useMemo, useState } from 'react';

const toastStyles = cva(
  cn(
    'pointer-events-auto relative flex w-full items-start justify-between gap-3 overflow-hidden',
    'rounded-[var(--radius-md)] border p-4 shadow-(--shadow-md)',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
  ),
  {
    variants: {
      tone: {
        neutral: 'bg-(--color-surface-elevated) border-(--color-border-default)',
        success: 'bg-(--color-success-50) border-(--color-success-200) text-(--color-success-700)',
        warning: 'bg-(--color-warning-50) border-(--color-warning-200) text-(--color-warning-700)',
        danger: 'bg-(--color-danger-50) border-(--color-danger-200) text-(--color-danger-700)',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

type ToastInput = {
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  tone?: VariantProps<typeof toastStyles>['tone'];
  durationMs?: number;
};

type ToastEntry = Required<Pick<ToastInput, 'id'>> & ToastInput;

type ToastContextValue = {
  publish: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastEntry[]>([]);

  const publish = useCallback((toast: ToastInput) => {
    const id = toast.id ?? `t_${Math.random().toString(36).slice(2)}`;
    setItems((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ publish, dismiss }), [publish, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {items.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            duration={t.durationMs ?? 4000}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
            className={cn(toastStyles({ tone: t.tone }))}
          >
            <div className="flex flex-col gap-1">
              {t.title ? (
                <ToastPrimitive.Title className="font-medium text-sm">
                  {t.title}
                </ToastPrimitive.Title>
              ) : null}
              {t.description ? (
                <ToastPrimitive.Description className="text-sm opacity-90">
                  {t.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close className="rounded-[var(--radius-sm)] p-1 hover:bg-(--color-surface-muted)">
              <X className="size-4" aria-hidden />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex w-96 max-w-[100vw] flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}

export const ToastAction = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(function ToastAction({ className, ...rest }, ref) {
  return (
    <ToastPrimitive.Action
      ref={ref}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-current bg-transparent px-3 text-sm font-medium',
        'hover:bg-(--color-surface-muted)',
        className,
      )}
      {...rest}
    />
  );
});
