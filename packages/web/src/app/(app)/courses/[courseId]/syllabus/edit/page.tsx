'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import {
  useCourseSyllabusQuery,
  useUpsertCourseSyllabusMutation,
} from '@/lib/api/queries/courses.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import type { CourseSyllabusVisibility } from '@openlms/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

type Params = { courseId: string };

const VISIBILITIES: CourseSyllabusVisibility[] = ['draft', 'published', 'archived'];

export default function EditSyllabusPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();
  const router = useRouter();

  const syllabus = useCourseSyllabusQuery(tenantId, courseId);
  const upsert = useUpsertCourseSyllabusMutation(tenantId, courseId);

  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<CourseSyllabusVisibility>('draft');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(false);
    setBody('');
    setVisibility('draft');
  }, [tenantId, courseId]);

  useEffect(() => {
    if (!hydrated && syllabus.data) {
      setBody(syllabus.data.body ?? '');
      setVisibility(syllabus.data.visibility);
      setHydrated(true);
    } else if (!hydrated && syllabus.isFetched && !syllabus.data) {
      setHydrated(true);
    }
  }, [hydrated, syllabus.data, syllabus.isFetched]);

  if (syllabus.isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }
  if (syllabus.error) {
    return <ErrorState error={syllabus.error} onRetry={() => syllabus.refetch()} />;
  }

  const trimmed = body.trim();
  const canSave = trimmed.length > 0 && !upsert.isPending;

  const onSave = () => {
    if (!canSave) return;
    upsert.mutate(
      { body: trimmed, visibility },
      {
        onSuccess: () => {
          publish({ tone: 'success', title: 'Syllabus saved' });
          router.push(`/courses/${courseId}`);
        },
        onError: (error) => {
          publish({
            tone: 'danger',
            title: 'Could not save syllabus',
            description: error instanceof Error ? error.message : undefined,
          });
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Syllabus"
        title="Edit syllabus"
        description="Markdown is supported. Publish makes the syllabus visible to learners."
        actions={
          <Button asChild intent="ghost">
            <Link href={`/courses/${courseId}`}>Back</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <label
            htmlFor="syllabus-body"
            className="flex flex-col gap-1 text-sm font-medium text-(--color-text-default)"
          >
            Body
            <Textarea
              id="syllabus-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={18}
              placeholder="Course policies, grading expectations, and weekly rhythm."
            />
          </label>
          <div className="flex max-w-xs flex-col gap-1 text-sm font-medium text-(--color-text-default)">
            <span id="syllabus-visibility-label">Visibility</span>
            <Select
              value={visibility}
              onValueChange={(value) => setVisibility(value as CourseSyllabusVisibility)}
            >
              <SelectTrigger aria-labelledby="syllabus-visibility-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITIES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button asChild intent="ghost">
              <Link href={`/courses/${courseId}`}>Cancel</Link>
            </Button>
            <Button onClick={onSave} disabled={!canSave}>
              {upsert.isPending ? 'Saving…' : 'Save syllabus'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
