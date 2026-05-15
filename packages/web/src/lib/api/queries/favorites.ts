'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { CourseFavorite } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useCourseFavoritesQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.courseFavorites(tenantId) : ['courseFavorites', 'inactive'],
    queryFn: () => apiFetch<CourseFavorite[]>(`/tenants/${tenantId}/favorites`),
    enabled: Boolean(tenantId),
  });
}

export function useFavoriteCourseMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot favorite course.'));
      }
      return apiFetch<CourseFavorite>(
        `/tenants/${tenantId}/courses/${encodeURIComponent(courseId)}/favorite`,
        { method: 'PUT' },
      );
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.courseFavorites(tenantId) });
      }
    },
  });
}

export function useUnfavoriteCourseMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot unfavorite course.'));
      }
      return apiFetch<void>(
        `/tenants/${tenantId}/courses/${encodeURIComponent(courseId)}/favorite`,
        { method: 'DELETE', responseType: 'void' },
      );
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.courseFavorites(tenantId) });
      }
    },
  });
}
