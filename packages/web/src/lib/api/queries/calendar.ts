'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { CalendarItem } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';

export function useCalendarItemsQuery(tenantId: string | null, opts?: { from?: Date; to?: Date }) {
  return useQuery({
    queryKey: tenantId
      ? [...queryKeys.calendarItems(tenantId), opts?.from?.toISOString(), opts?.to?.toISOString()]
      : ['calendar', 'inactive'],
    queryFn: () =>
      apiFetch<CalendarItem[]>(`/tenants/${tenantId}/calendar-items`, {
        query: {
          from: opts?.from?.toISOString(),
          to: opts?.to?.toISOString(),
        },
      }),
    enabled: Boolean(tenantId),
  });
}
