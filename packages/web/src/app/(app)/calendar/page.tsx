'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useCalendarItemsQuery } from '@/lib/api/queries/calendar.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime, formatRelative } from '@/lib/format.ts';
import type { CalendarItem } from '@openlms/contracts';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { CalendarClock, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type View = 'list' | 'week' | 'month';

const WEEK_OPTIONS = { weekStartsOn: 1 as const };

export default function CalendarPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const [view, setView] = useState<View>('list');
  const [anchor, setAnchor] = useState<Date>(() => startOfToday());

  const { from, to } = useMemo(() => computeRange(view, anchor), [view, anchor]);
  const items = useCalendarItemsQuery(tenantId, { from, to });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendar"
        description={describeRange(view, anchor)}
        actions={
          <Button intent="secondary" asChild>
            <a href={`/api/v1/tenants/${tenantId}/calendar.ics`} download>
              <ExternalLink className="size-4" aria-hidden /> Subscribe (.ics)
            </a>
          </Button>
        }
      />

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={view} onValueChange={(value) => setView(value as View)}>
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
        {view !== 'list' ? (
          <div className="flex items-center gap-2">
            <Button
              intent="secondary"
              size="sm"
              onClick={() => setAnchor((d) => shiftAnchor(view, d, -1))}
              aria-label="Previous period"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <Button intent="secondary" size="sm" onClick={() => setAnchor(startOfToday())}>
              Today
            </Button>
            <Button
              intent="secondary"
              size="sm"
              onClick={() => setAnchor((d) => shiftAnchor(view, d, 1))}
              aria-label="Next period"
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>

      {items.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`cal-${i}`} className="h-20 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : items.error ? (
        <ErrorState error={items.error} onRetry={() => items.refetch()} />
      ) : (items.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nothing on your calendar"
          description={
            view === 'list'
              ? 'When work is assigned, it will show up here.'
              : 'No items in this period. Try Next, Today, or the List view.'
          }
        />
      ) : view === 'list' ? (
        <ListView items={items.data ?? []} />
      ) : view === 'week' ? (
        <WeekView anchor={anchor} items={items.data ?? []} />
      ) : (
        <MonthView anchor={anchor} items={items.data ?? []} />
      )}
    </div>
  );
}

function computeRange(view: View, anchor: Date): { from: Date; to: Date } {
  if (view === 'list') {
    const from = new Date();
    const to = addDays(from, 60);
    return { from, to };
  }
  if (view === 'week') {
    return {
      from: startOfWeek(anchor, WEEK_OPTIONS),
      to: endOfWeek(anchor, WEEK_OPTIONS),
    };
  }
  return {
    from: startOfWeek(startOfMonth(anchor), WEEK_OPTIONS),
    to: endOfWeek(endOfMonth(anchor), WEEK_OPTIONS),
  };
}

function shiftAnchor(view: View, anchor: Date, direction: number): Date {
  if (view === 'week') return addWeeks(anchor, direction);
  if (view === 'month') return addMonths(anchor, direction);
  return anchor;
}

function describeRange(view: View, anchor: Date): string {
  if (view === 'list') return 'Everything due across all your courses for the next 60 days.';
  if (view === 'week') {
    const start = startOfWeek(anchor, WEEK_OPTIONS);
    const end = endOfWeek(anchor, WEEK_OPTIONS);
    return `Week of ${format(start, 'PP')} — ${format(end, 'PP')}.`;
  }
  return format(anchor, 'MMMM yyyy');
}

function ListView({ items }: { items: CalendarItem[] }) {
  const grouped = useMemo(() => {
    const byDay = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const date = item.startsAt ? new Date(item.startsAt) : null;
      const key = date ? date.toISOString().slice(0, 10) : 'unscheduled';
      const list = byDay.get(key) ?? [];
      list.push(item);
      byDay.set(key, list);
    }
    return Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  return (
    <div className="flex flex-col gap-6">
      {grouped.map(([dayKey, list]) => (
        <section key={dayKey} className="flex flex-col gap-3">
          <h3 className="font-display text-sm font-semibold tracking-tight text-(--color-text-default)">
            {dayKey === 'unscheduled' ? 'No date' : formatDate(dayKey)}
          </h3>
          {list.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </section>
      ))}
    </div>
  );
}

function WeekView({ anchor, items }: { anchor: Date; items: CalendarItem[] }) {
  const days = useMemo(() => {
    const start = startOfWeek(anchor, WEEK_OPTIONS);
    const end = endOfWeek(anchor, WEEK_OPTIONS);
    return eachDayOfInterval({ start, end });
  }, [anchor]);
  const itemsByDay = useMemo(() => indexItemsByDay(items), [items]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((day) => {
        const dayItems = itemsByDay.get(day.toISOString().slice(0, 10)) ?? [];
        const isToday = isSameDay(day, startOfToday());
        return (
          <div
            key={day.toISOString()}
            className={cn(
              'flex min-h-32 flex-col gap-2 rounded-[var(--radius-md)] border bg-(--color-surface-base) p-3',
              isToday
                ? 'border-(--color-brand-400) bg-(--color-brand-subtle)'
                : 'border-(--color-border-subtle)',
            )}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                {format(day, 'EEE')}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  isToday ? 'text-(--color-brand-700)' : 'text-(--color-text-default)',
                )}
              >
                {format(day, 'd')}
              </span>
            </div>
            {dayItems.length === 0 ? (
              <p className="text-xs text-(--color-text-subtle)">—</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {dayItems.map((item) => (
                  <li key={item.id}>
                    <ItemPill item={item} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ anchor, items }: { anchor: Date; items: CalendarItem[] }) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(anchor), WEEK_OPTIONS);
    const end = endOfWeek(endOfMonth(anchor), WEEK_OPTIONS);
    return eachDayOfInterval({ start, end });
  }, [anchor]);
  const itemsByDay = useMemo(() => indexItemsByDay(items), [items]);
  const today = startOfToday();

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-base)">
      <div className="grid grid-cols-7 border-b border-(--color-border-subtle) bg-(--color-surface-elevated) text-center text-xs font-medium uppercase tracking-wider text-(--color-text-muted)">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
          <div key={label} className="px-2 py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayItems = itemsByDay.get(day.toISOString().slice(0, 10)) ?? [];
          const inMonth = isSameMonth(day, anchor);
          const isToday = isSameDay(day, today);
          const overflow = dayItems.length > 3;
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'flex min-h-28 flex-col gap-1 border-b border-r border-(--color-border-subtle) p-2 last:border-r-0',
                inMonth ? 'bg-(--color-surface-base)' : 'bg-(--color-surface-sunken)',
                isToday && 'bg-(--color-brand-subtle)',
              )}
            >
              <div
                className={cn(
                  'text-xs tabular-nums',
                  isToday
                    ? 'font-semibold text-(--color-brand-700)'
                    : inMonth
                      ? 'text-(--color-text-default)'
                      : 'text-(--color-text-subtle)',
                )}
              >
                {format(day, 'd')}
              </div>
              {dayItems.slice(0, 3).map((item) => (
                <ItemPill key={item.id} item={item} compact />
              ))}
              {overflow ? (
                <span className="text-2xs text-(--color-text-muted)">
                  +{dayItems.length - 3} more
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function indexItemsByDay(items: CalendarItem[]): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const date = item.startsAt ? new Date(item.startsAt) : null;
    if (!date) continue;
    const key = date.toISOString().slice(0, 10);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }
  return map;
}

function itemHref(item: CalendarItem): string {
  if (item.sourceType === 'assignment') {
    return `/courses/${item.courseId}/assignments/${item.sourceId}`;
  }
  return `/courses/${item.courseId}/calendar`;
}

function ItemPill({ item, compact = false }: { item: CalendarItem; compact?: boolean }) {
  return (
    <Link
      href={itemHref(item)}
      className={cn(
        'flex flex-col gap-0.5 rounded-[var(--radius-sm)] bg-(--color-surface-elevated) px-2 py-1 text-xs hover:bg-(--color-brand-subtle)',
        compact ? 'truncate' : '',
      )}
      title={item.title}
    >
      <span className="truncate font-medium text-(--color-text-default)">{item.title}</span>
      <span className="truncate text-2xs text-(--color-text-muted)">
        {format(new Date(item.startsAt), 'p')} · {item.courseCode}
      </span>
    </Link>
  );
}

function ItemCard({ item }: { item: CalendarItem }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-base">
            <Link href={itemHref(item)} className="hover:text-(--color-text-link)">
              {item.title}
            </Link>
          </CardTitle>
          <CardDescription>
            {`${formatDateTime(item.startsAt)} · ${formatRelative(item.startsAt)}`}
          </CardDescription>
        </div>
        <Badge tone="brand">{item.itemType.replace(/_/g, ' ')}</Badge>
      </CardHeader>
      <CardContent className="pt-0 text-xs text-(--color-text-subtle)">
        {item.courseCode ? <span>{item.courseCode}</span> : null}
      </CardContent>
    </Card>
  );
}
