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
import { formatDateTime } from '@/lib/format.ts';
import type { CourseAnnouncement } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { use } from 'react';

type Params = { courseId: string };

export default function CourseAnnouncementsPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const announcements = useQuery({
    queryKey: tenantId
      ? queryKeys.courseAnnouncements(tenantId, courseId)
      : ['announcements', 'inactive'],
    queryFn: () =>
      apiFetch<CourseAnnouncement[]>(`/tenants/${tenantId}/courses/${courseId}/announcements`),
    enabled: Boolean(tenantId),
  });

  if (announcements.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`ann-${i}`} className="h-24 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    );
  }
  if (announcements.error) {
    return <ErrorState error={announcements.error} onRetry={() => announcements.refetch()} />;
  }
  if ((announcements.data?.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No announcements"
        description="When the instructor posts updates, they'll appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {announcements.data?.map((a) => (
        <Card key={a.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{a.title}</CardTitle>
              <Badge tone={a.status === 'published' ? 'success' : 'neutral'}>{a.status}</Badge>
            </div>
            <CardDescription>{a.postedAt ? formatDateTime(a.postedAt) : 'Draft'}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-(--color-text-default)">{a.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
