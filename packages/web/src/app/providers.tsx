'use client';

import { ToastProvider } from '@/components/ui/toast.tsx';
import { TooltipProvider } from '@/components/ui/tooltip.tsx';
import { setAuthToken } from '@/lib/api/client.ts';
import { createQueryClient } from '@/lib/api/query-client.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode, useEffect, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => createQueryClient());
  const token = useSessionStore((s) => s.token);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  return (
    <QueryClientProvider client={client}>
      <TooltipProvider delayDuration={120}>
        <ToastProvider>{children}</ToastProvider>
      </TooltipProvider>
      {process.env.NODE_ENV === 'development' ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
