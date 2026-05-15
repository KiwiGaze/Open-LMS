'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  NotificationCategory,
  NotificationChannel,
  NotificationFrequency,
  NotificationPreference,
  NotificationRecord,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useNotificationsQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.notifications(tenantId) : ['notifications', 'inactive'],
    queryFn: () => apiFetch<NotificationRecord[]>(`/tenants/${tenantId}/notifications`),
    enabled: Boolean(tenantId),
  });
}

export function useNotificationPreferencesQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId
      ? queryKeys.notificationPreferences(tenantId)
      : ['notification-preferences', 'inactive'],
    queryFn: () =>
      apiFetch<NotificationPreference[]>(`/tenants/${tenantId}/notifications/preferences`),
    enabled: Boolean(tenantId),
  });
}

export type UpsertNotificationPreferenceInput = {
  category: NotificationCategory;
  channel: NotificationChannel;
  frequency: NotificationFrequency;
};

export function useMarkNotificationReadMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot mark notification read.'));
      }
      return apiFetch<NotificationRecord>(
        `/tenants/${tenantId}/notifications/${encodeURIComponent(notificationId)}/read`,
        { method: 'POST' },
      );
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications(tenantId) });
      }
    },
  });
}

export function useUpsertNotificationPreferenceMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertNotificationPreferenceInput) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot save notification preference.'));
      }
      return apiFetch<NotificationPreference>(`/tenants/${tenantId}/notifications/preferences`, {
        method: 'PUT',
        body: input,
      });
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notificationPreferences(tenantId) });
      }
    },
  });
}
