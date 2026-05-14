'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import type { CourseModule, CourseUnit } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string };

export default function ModulesPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);

  const modules = useQuery({
    queryKey: tenantId ? queryKeys.courseModules(tenantId, courseId) : ['modules', 'inactive'],
    queryFn: () => apiFetch<CourseModule[]>(`/tenants/${tenantId}/courses/${courseId}/modules`),
    enabled: Boolean(tenantId),
  });

  const units = useQuery({
    queryKey: ['courses', tenantId ?? '', courseId, 'units'],
    queryFn: () => apiFetch<CourseUnit[]>(`/tenants/${tenantId}/courses/${courseId}/units`),
    enabled: Boolean(tenantId),
  });

  const unitsByModule = (units.data ?? []).reduce<Record<string, CourseUnit[]>>((acc, unit) => {
    const list = acc[unit.moduleId] ?? [];
    list.push(unit);
    acc[unit.moduleId] = list;
    return acc;
  }, {});

  if (modules.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`mod-${i}`} className="h-32 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    );
  }
  if (modules.error) {
    return <ErrorState error={modules.error} onRetry={() => modules.refetch()} />;
  }
  if ((modules.data?.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No modules yet"
        description="Modules group readings, assignments, quizzes, and discussions into release-paced units."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {modules.data?.map((mod, i) => {
        const moduleUnits = unitsByModule[mod.id] ?? [];
        return (
          <Card key={mod.id}>
            <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
              <div className="flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-full bg-(--color-surface-muted) text-xs font-medium text-(--color-text-default)">
                  {i + 1}
                </span>
                <div>
                  <CardTitle className="text-base">{mod.title}</CardTitle>
                  {mod.summary ? <CardDescription>{mod.summary}</CardDescription> : null}
                </div>
              </div>
              <Badge tone={mod.visibility === 'published' ? 'success' : 'neutral'}>
                {mod.visibility}
              </Badge>
            </CardHeader>
            {moduleUnits.length > 0 ? (
              <CardContent className="pt-0">
                <ul className="divide-y divide-(--color-border-subtle) border-t border-(--color-border-subtle)">
                  {moduleUnits
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((unit) => (
                      <li
                        key={unit.id}
                        className="flex items-center justify-between gap-3 py-2.5 text-sm"
                      >
                        <div>
                          <p className="font-medium text-(--color-text-default)">{unit.title}</p>
                          {unit.summary ? (
                            <p className="text-xs text-(--color-text-muted)">{unit.summary}</p>
                          ) : null}
                        </div>
                        <Link
                          href={`/courses/${courseId}/modules#${unit.id}`}
                          className="inline-flex items-center gap-1 text-(--color-text-link) hover:text-(--color-text-link-hover)"
                        >
                          Open <ChevronRight className="size-3" aria-hidden />
                        </Link>
                      </li>
                    ))}
                </ul>
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
