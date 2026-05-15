'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { WebhookSubscription, WebhookSubscriptionStatus } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type CreateWebhookSubscriptionInput = {
  name: string;
  endpointUrl: string;
  topics: string[];
  status: WebhookSubscriptionStatus;
  signingSecret: string;
};

export type UpdateWebhookSubscriptionInput = {
  name: string;
  endpointUrl: string;
  topics: string[];
  status: WebhookSubscriptionStatus;
  signingSecret?: string;
};

export function useWebhookSubscriptionsQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId
      ? queryKeys.webhookSubscriptions(tenantId)
      : ['webhook-subscriptions', 'inactive'],
    queryFn: () => apiFetch<WebhookSubscription[]>(`/tenants/${tenantId}/webhook-subscriptions`),
    enabled: Boolean(tenantId),
  });
}

export function useCreateWebhookSubscriptionMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWebhookSubscriptionInput) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot create webhook subscription.'));
      }
      return apiFetch<WebhookSubscription>(`/tenants/${tenantId}/webhook-subscriptions`, {
        method: 'POST',
        body: input,
      });
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.webhookSubscriptions(tenantId) });
      }
    },
  });
}

export function useUpdateWebhookSubscriptionMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateWebhookSubscriptionInput & { id: string }) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot update webhook subscription.'));
      }
      return apiFetch<WebhookSubscription>(
        `/tenants/${tenantId}/webhook-subscriptions/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          body: input,
        },
      );
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.webhookSubscriptions(tenantId) });
      }
    },
  });
}

export function useDeleteWebhookSubscriptionMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot delete webhook subscription.'));
      }
      return apiFetch<void>(
        `/tenants/${tenantId}/webhook-subscriptions/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          responseType: 'void',
        },
      );
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.webhookSubscriptions(tenantId) });
      }
    },
  });
}
