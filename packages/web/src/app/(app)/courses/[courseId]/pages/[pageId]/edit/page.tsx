'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { useCoursePageQuery, useUpdateCoursePageMutation } from '@/lib/api/queries/pages.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { CoursePageForm } from '../../page-form.tsx';

type Params = { courseId: string; pageId: string };

export default function EditCoursePagePage({ params }: { params: Promise<Params> }) {
  const { courseId, pageId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const router = useRouter();
  const { publish } = useToast();
  const page = useCoursePageQuery(tenantId, courseId, pageId);
  const update = useUpdateCoursePageMutation(tenantId, courseId);

  if (page.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (page.error) {
    return <ErrorState error={page.error} onRetry={() => page.refetch()} />;
  }
  if (!page.data) return null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Pages"
        title={`Edit “${page.data.title}”`}
        description="Update the page content and visibility."
      />
      <CoursePageForm
        courseId={courseId}
        initial={{
          title: page.data.title,
          body: page.data.body,
          visibility: page.data.visibility,
          learningObjectiveIds: page.data.learningObjectiveIds,
        }}
        submitting={update.isPending}
        submitLabel="Save changes"
        onSubmit={async (input) => {
          await update.mutateAsync({ pageId, input });
          publish({ tone: 'success', title: 'Page saved' });
          router.push(`/courses/${courseId}/pages/${pageId}`);
        }}
      />
    </div>
  );
}
