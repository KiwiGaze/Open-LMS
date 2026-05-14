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
import { useAssignmentsQuery } from '@/lib/api/queries/assignments.ts';
import { useDiscussionTopicsQuery } from '@/lib/api/queries/discussions.ts';
import { useMyModuleReleaseStatusQuery } from '@/lib/api/queries/module-release.ts';
import {
  useCourseModulesQuery,
  useCourseResourcesQuery,
  useCourseUnitsQuery,
} from '@/lib/api/queries/modules.ts';
import { useQuizzesQuery } from '@/lib/api/queries/quizzes.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDate, formatDateTime } from '@/lib/format.ts';
import type {
  Assignment,
  CourseModule,
  CourseResource,
  CourseUnit,
  DiscussionTopic,
  ModuleReleaseBlocker,
  Quiz,
} from '@openlms/contracts';
import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  Lock,
  MessagesSquare,
  Paperclip,
  TimerReset,
} from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string };

export default function ModulesPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);

  const modules = useCourseModulesQuery(tenantId, courseId);
  const units = useCourseUnitsQuery(tenantId, courseId);
  const resources = useCourseResourcesQuery(tenantId, courseId);
  const assignments = useAssignmentsQuery(tenantId, courseId);
  const quizzes = useQuizzesQuery(tenantId, courseId);
  const releaseStatus = useMyModuleReleaseStatusQuery(tenantId, courseId);
  const topics = useDiscussionTopicsQuery(tenantId, courseId);

  const isLoading =
    modules.isLoading ||
    units.isLoading ||
    resources.isLoading ||
    assignments.isLoading ||
    quizzes.isLoading ||
    topics.isLoading ||
    releaseStatus.isLoading;

  const loadError =
    modules.error ||
    units.error ||
    resources.error ||
    assignments.error ||
    quizzes.error ||
    topics.error ||
    releaseStatus.error;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`mod-${i}`} className="h-40 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    );
  }
  if (loadError) {
    return (
      <ErrorState
        error={loadError}
        onRetry={() => {
          modules.refetch();
          units.refetch();
          resources.refetch();
          assignments.refetch();
          quizzes.refetch();
          topics.refetch();
          releaseStatus.refetch();
        }}
      />
    );
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

  const unitsByModule = groupBy(units.data ?? [], (u) => u.moduleId);
  const assignmentsByUnit = groupBy(
    (assignments.data ?? []).filter((a) => a.unitId !== null),
    (a) => a.unitId as string,
  );
  const quizzesByUnit = groupBy(
    (quizzes.data ?? []).filter((q) => q.unitId !== null),
    (q) => q.unitId as string,
  );
  const topicsByUnit = groupBy(
    (topics.data ?? []).filter((t) => t.unitId !== null),
    (t) => t.unitId as string,
  );
  const resourcesByUnit = groupBy(
    (resources.data ?? []).filter((r) => r.unitId !== null),
    (r) => r.unitId as string,
  );
  const moduleLocks = new Map<string, ModuleReleaseBlocker[]>();
  for (const decision of releaseStatus.data ?? []) {
    if (decision.targetType !== 'module') continue;
    if (decision.state !== 'locked') continue;
    moduleLocks.set(decision.moduleId, decision.blockers);
  }

  return (
    <div className="flex flex-col gap-4">
      {(modules.data ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((mod, i) => (
          <ModuleCard
            key={mod.id}
            courseId={courseId}
            module={mod}
            index={i}
            units={(unitsByModule.get(mod.id) ?? [])
              .slice()
              .sort((a, b) => a.position - b.position)}
            assignmentsByUnit={assignmentsByUnit}
            quizzesByUnit={quizzesByUnit}
            topicsByUnit={topicsByUnit}
            resourcesByUnit={resourcesByUnit}
            lockBlockers={moduleLocks.get(mod.id) ?? null}
          />
        ))}
    </div>
  );
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

type ModuleCardProps = {
  courseId: string;
  module: CourseModule;
  index: number;
  units: CourseUnit[];
  assignmentsByUnit: Map<string, Assignment[]>;
  quizzesByUnit: Map<string, Quiz[]>;
  topicsByUnit: Map<string, DiscussionTopic[]>;
  resourcesByUnit: Map<string, CourseResource[]>;
  lockBlockers: ModuleReleaseBlocker[] | null;
};

function ModuleCard({
  courseId,
  module: mod,
  index,
  units,
  assignmentsByUnit,
  quizzesByUnit,
  topicsByUnit,
  resourcesByUnit,
  lockBlockers,
}: ModuleCardProps) {
  const isLocked = lockBlockers !== null;
  return (
    <Card className={isLocked ? 'opacity-90' : undefined}>
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-3">
          <span className="grid size-7 place-items-center rounded-full bg-(--color-surface-muted) text-xs font-medium text-(--color-text-default)">
            {index + 1}
          </span>
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {isLocked ? (
                <Lock className="size-4 text-(--color-text-muted)" aria-label="Locked" />
              ) : null}
              {mod.title}
            </CardTitle>
            {mod.summary ? <CardDescription>{mod.summary}</CardDescription> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLocked ? <Badge tone="warning">Locked</Badge> : null}
          <Badge tone={mod.visibility === 'published' ? 'success' : 'neutral'}>
            {mod.visibility}
          </Badge>
        </div>
      </CardHeader>
      {isLocked && lockBlockers.length > 0 ? (
        <CardContent className="pt-0">
          <div className="rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-muted) p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-(--color-text-muted)">
              To unlock
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {lockBlockers.map((blocker, blockerIndex) => (
                <li
                  key={`${blocker.ruleType}-${blockerIndex}`}
                  className="text-sm text-(--color-text-default)"
                >
                  <span className="font-medium">{blocker.summary}</span>
                  {blocker.requiredAction ? (
                    <span className="text-(--color-text-muted)"> — {blocker.requiredAction}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      ) : null}
      {!isLocked && units.length > 0 ? (
        <CardContent className="pt-0">
          <ul className="flex flex-col gap-3 border-t border-(--color-border-subtle) pt-3">
            {units.map((unit) => {
              const items = collectUnitItems({
                unit,
                assignments: assignmentsByUnit.get(unit.id) ?? [],
                quizzes: quizzesByUnit.get(unit.id) ?? [],
                topics: topicsByUnit.get(unit.id) ?? [],
                resources: resourcesByUnit.get(unit.id) ?? [],
              });
              return (
                <li key={unit.id} id={unit.id}>
                  <UnitSection courseId={courseId} unit={unit} items={items} />
                </li>
              );
            })}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  );
}

type UnitItem =
  | { kind: 'assignment'; data: Assignment }
  | { kind: 'quiz'; data: Quiz }
  | { kind: 'topic'; data: DiscussionTopic }
  | { kind: 'resource'; data: CourseResource };

function collectUnitItems(input: {
  unit: CourseUnit;
  assignments: Assignment[];
  quizzes: Quiz[];
  topics: DiscussionTopic[];
  resources: CourseResource[];
}): UnitItem[] {
  const items: UnitItem[] = [
    ...input.assignments.map<UnitItem>((data) => ({ kind: 'assignment', data })),
    ...input.quizzes.map<UnitItem>((data) => ({ kind: 'quiz', data })),
    ...input.topics.map<UnitItem>((data) => ({ kind: 'topic', data })),
    ...input.resources.map<UnitItem>((data) => ({ kind: 'resource', data })),
  ];
  return items.sort((a, b) => itemPosition(a) - itemPosition(b));
}

function itemPosition(item: UnitItem): number {
  switch (item.kind) {
    case 'assignment':
      return item.data.position ?? 0;
    case 'quiz':
      return item.data.position ?? 0;
    case 'topic':
      return item.data.position;
    case 'resource':
      return item.data.position;
  }
}

function UnitSection({
  courseId,
  unit,
  items,
}: {
  courseId: string;
  unit: CourseUnit;
  items: UnitItem[];
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-base) p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-(--color-text-default)">{unit.title}</p>
          {unit.summary ? (
            <p className="mt-0.5 text-xs text-(--color-text-muted)">{unit.summary}</p>
          ) : null}
        </div>
        <Badge tone={unit.visibility === 'published' ? 'success' : 'neutral'}>
          {unit.visibility}
        </Badge>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-(--color-text-muted)">No items placed in this unit yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <li key={itemKey(item)}>
              <UnitItemView courseId={courseId} item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function itemKey(item: UnitItem): string {
  return `${item.kind}-${item.data.id}`;
}

function UnitItemView({ courseId, item }: { courseId: string; item: UnitItem }) {
  switch (item.kind) {
    case 'assignment':
      return <AssignmentItem courseId={courseId} assignment={item.data} />;
    case 'quiz':
      return <QuizItem courseId={courseId} quiz={item.data} />;
    case 'topic':
      return <TopicItem courseId={courseId} topic={item.data} />;
    case 'resource':
      return <ResourceItem resource={item.data} />;
  }
}

function ItemShell({
  icon: Icon,
  badge,
  title,
  meta,
  body,
  openLabel,
  openHref,
}: {
  icon: typeof ClipboardList;
  badge: string;
  title: string;
  meta?: string;
  body: React.ReactNode;
  openLabel?: string;
  openHref?: string;
}) {
  return (
    <details className="group rounded-[var(--radius-sm)] border border-(--color-border-subtle) bg-(--color-surface-elevated) [&[open]>summary>span.chevron]:rotate-90">
      <summary className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm">
        <span className="rounded-[var(--radius-sm)] bg-(--color-brand-subtle) p-1 text-(--color-brand-700)">
          <Icon className="size-3.5" aria-hidden />
        </span>
        <span className="flex-1 truncate font-medium text-(--color-text-default)">{title}</span>
        <Badge tone="outline" className="shrink-0">
          {badge}
        </Badge>
        {meta ? <span className="shrink-0 text-xs text-(--color-text-muted)">{meta}</span> : null}
        <span className="chevron text-(--color-text-muted) transition-transform">
          <ChevronRight className="size-4" aria-hidden />
        </span>
      </summary>
      <div className="flex flex-col gap-2 border-t border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-default)">
        {body}
        {openHref ? (
          <Link
            href={openHref}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-(--color-text-link) hover:text-(--color-text-link-hover)"
          >
            {openLabel ?? 'Open'} <ChevronRight className="size-3" aria-hidden />
          </Link>
        ) : null}
      </div>
    </details>
  );
}

function AssignmentItem({ courseId, assignment }: { courseId: string; assignment: Assignment }) {
  return (
    <ItemShell
      icon={ClipboardList}
      badge="Assignment"
      title={assignment.title}
      meta={assignment.dueAt ? `Due ${formatDate(assignment.dueAt)}` : undefined}
      body={<p className="whitespace-pre-wrap text-sm">{truncate(assignment.instructions, 600)}</p>}
      openLabel="Open assignment"
      openHref={`/courses/${courseId}/assignments/${assignment.id}`}
    />
  );
}

function QuizItem({ courseId, quiz }: { courseId: string; quiz: Quiz }) {
  const meta: string[] = [];
  if (quiz.timeLimitMinutes) meta.push(`${quiz.timeLimitMinutes} min`);
  if (quiz.maxAttempts)
    meta.push(`${quiz.maxAttempts} attempt${quiz.maxAttempts === 1 ? '' : 's'}`);
  if (quiz.opensAt) meta.push(`Opens ${formatDateTime(quiz.opensAt)}`);
  return (
    <ItemShell
      icon={TimerReset}
      badge="Quiz"
      title={quiz.title}
      meta={meta.join(' · ') || undefined}
      body={
        quiz.description ? (
          <p className="whitespace-pre-wrap text-sm">{truncate(quiz.description, 600)}</p>
        ) : (
          <p className="text-sm text-(--color-text-muted)">No description provided.</p>
        )
      }
      openLabel="Open quiz"
      openHref={`/courses/${courseId}/quizzes/${quiz.id}`}
    />
  );
}

function TopicItem({ courseId, topic }: { courseId: string; topic: DiscussionTopic }) {
  return (
    <ItemShell
      icon={MessagesSquare}
      badge="Discussion"
      title={topic.title}
      meta={topic.gradingEnabled ? `Graded · ${topic.pointsPossible ?? 0} pts` : undefined}
      body={
        topic.prompt ? (
          <p className="whitespace-pre-wrap text-sm">{truncate(topic.prompt, 600)}</p>
        ) : (
          <p className="text-sm text-(--color-text-muted)">No prompt set.</p>
        )
      }
      openLabel="Open thread"
      openHref={`/courses/${courseId}/discussions/${topic.id}`}
    />
  );
}

function ResourceItem({ resource }: { resource: CourseResource }) {
  const icon =
    resource.resourceType === 'file'
      ? Paperclip
      : resource.resourceType === 'external_link'
        ? ExternalLink
        : FileText;
  return (
    <ItemShell
      icon={icon}
      badge={resource.resourceType.replace(/_/g, ' ')}
      title={resource.title}
      body={
        <>
          <p className="whitespace-pre-wrap text-sm">{truncate(resource.body, 1200)}</p>
          {resource.sourceUri ? (
            <a
              href={resource.sourceUri}
              target={resource.resourceType === 'external_link' ? '_blank' : undefined}
              rel={resource.resourceType === 'external_link' ? 'noreferrer noopener' : undefined}
              className="inline-flex items-center gap-1 text-xs font-medium text-(--color-text-link) hover:text-(--color-text-link-hover)"
            >
              {resource.resourceType === 'external_link' ? 'Open external link' : 'Open source'}{' '}
              <ChevronRight className="size-3" aria-hidden />
            </a>
          ) : null}
        </>
      }
    />
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
