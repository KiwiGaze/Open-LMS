'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { WikiPage, WikiPageStatus } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type CreateWikiPageInput = {
  slug: string;
  title: string;
  content: string;
  status: WikiPageStatus;
  learningObjectiveIds: string[];
};

export type UpdateWikiPageInput = CreateWikiPageInput & {
  summary?: string | null;
};

export function useWikiPagesQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId ? queryKeys.wikiPages(tenantId, courseId) : ['wiki-pages', 'inactive'],
    queryFn: () => apiFetch<WikiPage[]>(`/tenants/${tenantId}/courses/${courseId}/wiki-pages`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useWikiPageQuery(
  tenantId: string | null,
  courseId: string | null,
  wikiPageId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && wikiPageId
        ? queryKeys.wikiPage(tenantId, courseId, wikiPageId)
        : ['wiki-page', 'inactive'],
    queryFn: () =>
      apiFetch<WikiPage>(
        `/tenants/${tenantId}/courses/${courseId}/wiki-pages/${encodeURIComponent(wikiPageId ?? '')}`,
      ),
    enabled: Boolean(tenantId && courseId && wikiPageId),
  });
}

export function useCreateWikiPageMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWikiPageInput) => {
      if (!tenantId || !courseId) {
        return Promise.reject(new Error('No active course — cannot create wiki page.'));
      }
      return apiFetch<WikiPage>(`/tenants/${tenantId}/courses/${courseId}/wiki-pages`, {
        method: 'POST',
        body: input,
      });
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.wikiPages(tenantId, courseId) });
      }
    },
  });
}

export function useUpdateWikiPageMutation(
  tenantId: string | null,
  courseId: string | null,
  wikiPageId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateWikiPageInput) => {
      if (!tenantId || !courseId || !wikiPageId) {
        return Promise.reject(new Error('No active wiki page — cannot save.'));
      }
      return apiFetch<WikiPage>(
        `/tenants/${tenantId}/courses/${courseId}/wiki-pages/${encodeURIComponent(wikiPageId)}`,
        {
          method: 'PUT',
          body: input,
        },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.wikiPages(tenantId, courseId) });
        if (wikiPageId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.wikiPage(tenantId, courseId, wikiPageId),
          });
        }
      }
    },
  });
}
