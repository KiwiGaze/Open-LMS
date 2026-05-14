'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { User } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';

export function useMeQuery() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => apiFetch<User>('/me'),
  });
}
