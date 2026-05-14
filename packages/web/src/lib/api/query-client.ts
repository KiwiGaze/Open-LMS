'use client';

import { QueryClient } from '@tanstack/react-query';
import { ApiHttpError } from './errors.ts';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          // Don't retry on auth/permission errors or 4xx generally.
          if (error instanceof ApiHttpError) {
            if (error.status === 401 || error.status === 403 || error.status === 404) return false;
            if (error.status >= 400 && error.status < 500) return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
