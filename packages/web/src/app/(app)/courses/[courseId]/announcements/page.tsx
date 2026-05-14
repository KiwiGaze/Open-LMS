'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
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
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useCourseAnnouncementsQuery,
  useDeleteCourseAnnouncementMutation,
} from '@/lib/api/queries/announcements.ts';
import { useCourseMembershipsQuery } from '@/lib/api/queries/gradebook.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { CourseAnnouncement } from '@openlms/contracts';
import { Bell, Pencil, Pin, Plus, Trash2 } from 'lucide-react';
import { use, useState } from 'react';
import { AnnouncementDialog } from './announcement-dialog.tsx';

type Params = { courseId: string };

const STAFF_ROLES = new Set(['instructor', 'teaching_assistant', 'course_admin']);

export default function CourseAnnouncementsPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const user = useSessionStore((s) => s.user);
  const { publish } = useToast();

  const announcements = useCourseAnnouncementsQuery(tenantId, courseId);
  const memberships = useCourseMembershipsQuery(tenantId, courseId);
  const deleteAnnouncement = useDeleteCourseAnnouncementMutation(tenantId, courseId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CourseAnnouncement | null>(null);

  const myMembership = memberships.data?.find((m) => m.userId === user?.id);
  const isStaff = myMembership ? STAFF_ROLES.has(myMembership.role) : false;

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (announcement: CourseAnnouncement) => {
    setEditing(announcement);
    setDialogOpen(true);
  };

  const handleDelete = async (announcement: CourseAnnouncement) => {
    if (!window.confirm(`Delete "${announcement.title}"? This cannot be undone.`)) return;
    try {
      await deleteAnnouncement.mutateAsync(announcement.id);
      publish({ tone: 'success', title: 'Announcement deleted' });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not delete. Try again.';
      publish({ tone: 'danger', title: 'Delete failed', description: message });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {isStaff ? (
        <div className="flex items-center justify-end">
          <Button onClick={openNew}>
            <Plus className="size-4" aria-hidden /> New announcement
          </Button>
        </div>
      ) : null}

      {announcements.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`ann-${i}`} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : announcements.error ? (
        <ErrorState error={announcements.error} onRetry={() => announcements.refetch()} />
      ) : (announcements.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Bell}
          title="No announcements"
          description={
            isStaff
              ? 'Post updates to keep your students in the loop.'
              : "When the instructor posts updates, they'll appear here."
          }
          action={
            isStaff ? (
              <Button onClick={openNew}>
                <Plus className="size-4" aria-hidden /> New announcement
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.data?.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {a.pinned ? (
                      <Pin className="size-4 text-(--color-brand-700)" aria-label="Pinned" />
                    ) : null}
                    <CardTitle className="text-base">{a.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={a.status === 'published' ? 'success' : 'neutral'}>
                      {a.status}
                    </Badge>
                    {isStaff ? (
                      <>
                        <Button
                          intent="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${a.title}`}
                          onClick={() => openEdit(a)}
                        >
                          <Pencil className="size-4" aria-hidden />
                        </Button>
                        <Button
                          intent="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${a.title}`}
                          onClick={() => handleDelete(a)}
                          disabled={deleteAnnouncement.isPending}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
                <CardDescription>
                  {a.postedAt ? formatDateTime(a.postedAt) : 'Draft'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-(--color-text-default)">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AnnouncementDialog
        tenantId={tenantId}
        courseId={courseId}
        open={dialogOpen}
        onOpenChange={(next) => {
          setDialogOpen(next);
          if (!next) setEditing(null);
        }}
        existing={editing}
      />
    </div>
  );
}
