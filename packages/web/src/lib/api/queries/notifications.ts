'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { NotificationRecord } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';

export function useNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: () => apiFetch<NotificationRecord[]>('/notifications'),
  });
}
