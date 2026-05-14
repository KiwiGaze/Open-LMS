'use client';

import { PageHeader } from '@/components/patterns/page-header.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { useCreateCoursePageMutation } from '@/lib/api/queries/pages.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { CoursePageForm } from '../page-form.tsx';

type Params = { courseId: string };

export default function NewCoursePagePage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const router = useRouter();
  const { publish } = useToast();
  const create = useCreateCoursePageMutation(tenantId, courseId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Pages"
        title="New page"
        description="Create a reference page for this course."
      />
      <CoursePageForm
        courseId={courseId}
        submitting={create.isPending}
        submitLabel="Create page"
        onSubmit={async (input) => {
          const page = await create.mutateAsync(input);
          publish({ tone: 'success', title: 'Page created', description: page.title });
          router.push(`/courses/${courseId}/pages/${page.id}`);
        }}
      />
    </div>
  );
}
