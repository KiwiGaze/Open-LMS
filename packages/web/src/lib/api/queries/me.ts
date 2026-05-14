'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { CourseMembership, TenantMembership, User } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';

export function useMeQuery() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => apiFetch<User>('/me'),
  });
}

export function useMyTenantMembershipsQuery() {
  return useQuery({
    queryKey: queryKeys.myTenantMemberships,
    queryFn: () => apiFetch<TenantMembership[]>('/me/tenant-memberships'),
  });
}

export function useMyCourseMembershipsQuery() {
  return useQuery({
    queryKey: queryKeys.myCourseMemberships,
    queryFn: () => apiFetch<CourseMembership[]>('/me/course-memberships'),
  });
}
