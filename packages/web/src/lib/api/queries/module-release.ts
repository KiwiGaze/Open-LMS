'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  ModuleReleaseCombinator,
  ModuleReleasePolicy,
  ModuleReleaseRule,
  ModuleReleaseRuleStatus,
  ModuleReleaseTargetType,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type RuleConfig =
  | { ruleType: 'prerequisite_modules'; config: { moduleIds: string[]; requireAll: boolean } }
  | {
      ruleType: 'objective_mastery';
      config: {
        objectiveId: string;
        minStatus: 'developing' | 'proficient' | 'mastered';
        minScorePercent: number | null;
      };
    }
  | { ruleType: 'date_after'; config: { releaseAt: string } }
  | { ruleType: 'manual_unlock'; config: { defaultLocked: boolean } };

export type ReleaseRuleInput = {
  targetType: ModuleReleaseTargetType;
  targetId: string | null;
  position: number;
  status: ModuleReleaseRuleStatus;
} & RuleConfig;

export function useModuleReleaseRulesQuery(
  tenantId: string | null,
  courseId: string | null,
  moduleId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && moduleId
        ? queryKeys.moduleReleaseRules(tenantId, courseId, moduleId)
        : ['release-rules', 'inactive'],
    queryFn: () =>
      apiFetch<ModuleReleaseRule[]>(
        `/tenants/${tenantId}/courses/${courseId}/modules/${moduleId}/release-rules`,
      ),
    enabled: Boolean(tenantId && courseId && moduleId),
  });
}

export function useModuleReleasePolicyQuery(
  tenantId: string | null,
  courseId: string | null,
  moduleId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && moduleId
        ? queryKeys.moduleReleasePolicy(tenantId, courseId, moduleId)
        : ['release-policy', 'inactive'],
    queryFn: () =>
      apiFetch<ModuleReleasePolicy>(
        `/tenants/${tenantId}/courses/${courseId}/modules/${moduleId}/release-policy`,
      ),
    enabled: Boolean(tenantId && courseId && moduleId),
  });
}

export function useCreateReleaseRuleMutation(
  tenantId: string | null,
  courseId: string | null,
  moduleId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReleaseRuleInput) =>
      apiFetch<ModuleReleaseRule>(
        `/tenants/${tenantId}/courses/${courseId}/modules/${moduleId}/release-rules`,
        { method: 'POST', body: input },
      ),
    onSuccess: () => {
      if (tenantId && courseId && moduleId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.moduleReleaseRules(tenantId, courseId, moduleId),
        });
      }
    },
  });
}

export function useDeleteReleaseRuleMutation(
  tenantId: string | null,
  courseId: string | null,
  moduleId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) =>
      apiFetch<void>(
        `/tenants/${tenantId}/courses/${courseId}/modules/${moduleId}/release-rules/${ruleId}`,
        { method: 'DELETE', responseType: 'void' },
      ),
    onSuccess: () => {
      if (tenantId && courseId && moduleId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.moduleReleaseRules(tenantId, courseId, moduleId),
        });
      }
    },
  });
}

export function useUpsertReleasePolicyMutation(
  tenantId: string | null,
  courseId: string | null,
  moduleId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (combinator: ModuleReleaseCombinator) =>
      apiFetch<ModuleReleasePolicy>(
        `/tenants/${tenantId}/courses/${courseId}/modules/${moduleId}/release-policy`,
        { method: 'PUT', body: { combinator } },
      ),
    onSuccess: () => {
      if (tenantId && courseId && moduleId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.moduleReleasePolicy(tenantId, courseId, moduleId),
        });
      }
    },
  });
}
