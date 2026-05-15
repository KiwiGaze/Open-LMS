'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { FormField } from '@/components/patterns/form-field.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useUpdateDiscussionTopic } from '@/lib/api/queries/discussions.ts';
import { useMyCourseMembershipsQuery } from '@/lib/api/queries/me.ts';
import { useRubricsQuery } from '@/lib/api/queries/rubrics.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import type { DiscussionTopic } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

const FormSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required.').max(180, 'Title is too long.'),
    prompt: z.string(),
    visibility: z.enum(['draft', 'published', 'archived']),
    position: z.string(),
    gradingEnabled: z.boolean(),
    pointsPossible: z.string(),
    rubricId: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.position) {
      const n = Number(values.position);
      if (!Number.isInteger(n) || n < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['position'],
          message: 'Position must be a non-negative integer.',
        });
      }
    }
    if (values.gradingEnabled) {
      const p = Number(values.pointsPossible);
      if (!values.pointsPossible || !Number.isFinite(p) || p < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pointsPossible'],
          message: 'Graded discussions need a non-negative point value.',
        });
      }
    }
    if (values.rubricId && !ULID_RE.test(values.rubricId.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rubricId'],
        message: 'Enter a valid rubric ULID (26 characters).',
      });
    }
  });

type FormValues = z.infer<typeof FormSchema>;

type Params = { courseId: string; topicId: string };

const STAFF_ROLES = new Set(['instructor', 'teaching_assistant', 'course_admin']);

export default function EditDiscussionTopicPage({ params }: { params: Promise<Params> }) {
  const { courseId, topicId } = use(params);
  const router = useRouter();
  const { publish } = useToast();
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const mutation = useUpdateDiscussionTopic(tenantId, courseId, topicId);
  const myCourseMemberships = useMyCourseMembershipsQuery();
  const isStaff =
    myCourseMemberships.data?.some((m) => m.courseId === courseId && STAFF_ROLES.has(m.role)) ??
    false;

  const topic = useQuery({
    queryKey: tenantId
      ? queryKeys.discussionTopic(tenantId, courseId, topicId)
      : ['discussion-topic', 'inactive'],
    queryFn: () =>
      apiFetch<DiscussionTopic>(
        `/tenants/${tenantId}/courses/${courseId}/discussion-topics/${topicId}`,
      ),
    enabled: Boolean(tenantId) && isStaff,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: '',
      prompt: '',
      visibility: 'draft',
      position: '0',
      gradingEnabled: false,
      pointsPossible: '',
      rubricId: '',
    },
  });

  useEffect(() => {
    if (!topic.data) return;
    form.reset({
      title: topic.data.title,
      prompt: topic.data.prompt ?? '',
      visibility: topic.data.visibility,
      position: String(topic.data.position),
      gradingEnabled: topic.data.gradingEnabled,
      pointsPossible: topic.data.pointsPossible === null ? '' : String(topic.data.pointsPossible),
      rubricId: topic.data.rubricId ?? '',
    });
  }, [topic.data, form]);

  const gradingEnabled = form.watch('gradingEnabled');

  const onSubmit = form.handleSubmit(async (values) => {
    if (!topic.data) return;
    try {
      const updated = await mutation.mutateAsync({
        title: values.title.trim(),
        prompt: values.prompt.trim() === '' ? null : values.prompt.trim(),
        visibility: values.visibility,
        position: Number(values.position || '0'),
        gradingEnabled: values.gradingEnabled,
        pointsPossible: values.gradingEnabled ? Number(values.pointsPossible) : null,
        rubricId: values.rubricId.trim() || null,
        moduleId: topic.data.moduleId,
        unitId: topic.data.unitId,
      });
      publish({ tone: 'success', title: 'Topic updated', description: updated.title });
      router.push(`/courses/${courseId}/discussions/${topicId}`);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Something went wrong.';
      publish({ tone: 'danger', title: 'Could not update topic', description: message });
    }
  });

  if (myCourseMemberships.isLoading) {
    return <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />;
  }
  if (!isStaff) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-(--color-border-subtle) bg-(--color-surface-elevated) p-6 text-sm text-(--color-text-muted)">
        You need course staff access to edit this discussion topic.
      </div>
    );
  }
  if (topic.isLoading) {
    return <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />;
  }
  if (topic.error) {
    return <ErrorState error={topic.error} onRetry={() => topic.refetch()} />;
  }
  if (!topic.data) return null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Discussion"
        title="Edit discussion topic"
        description="Adjust title, prompt, visibility, position, or grading."
        actions={
          <Button asChild intent="ghost">
            <Link href={`/courses/${courseId}/discussions/${topicId}`}>Back to topic</Link>
          </Button>
        }
      />
      <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
            <CardDescription>Title, prompt, visibility, and position.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              id="title"
              label="Title"
              required
              error={form.formState.errors.title?.message}
            >
              <Input
                id="title"
                maxLength={180}
                invalid={Boolean(form.formState.errors.title)}
                {...form.register('title')}
              />
            </FormField>
            <FormField id="prompt" label="Prompt" description="Optional. Plain text or Markdown.">
              <Textarea id="prompt" rows={6} maxLength={4000} {...form.register('prompt')} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
              <FormField id="visibility" label="Visibility">
                <Controller
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="visibility">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField
                id="position"
                label="Position"
                description="Sort order in the discussion list."
                error={form.formState.errors.position?.message}
              >
                <Input
                  id="position"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className="w-full sm:w-32"
                  invalid={Boolean(form.formState.errors.position)}
                  {...form.register('position')}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grading</CardTitle>
            <CardDescription>
              When enabled, instructors can grade each student's earliest published reply.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Controller
              control={form.control}
              name="gradingEnabled"
              render={({ field }) => (
                <div className="flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-base) px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="gradingEnabled"
                      className="text-sm font-medium text-(--color-text-default)"
                    >
                      Graded discussion
                    </label>
                    <p className="text-xs text-(--color-text-muted)">
                      Adds the topic to the gradebook and exposes the instructor grading panel.
                    </p>
                  </div>
                  <Switch
                    id="gradingEnabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
            {gradingEnabled ? (
              <>
                <FormField
                  id="pointsPossible"
                  label="Points possible"
                  required
                  error={form.formState.errors.pointsPossible?.message}
                >
                  <Input
                    id="pointsPossible"
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    className="w-full sm:w-40"
                    invalid={Boolean(form.formState.errors.pointsPossible)}
                    {...form.register('pointsPossible')}
                  />
                </FormField>
                <FormField
                  id="rubricId"
                  label="Rubric"
                  description="Optional rubric for feedback alignment."
                  error={form.formState.errors.rubricId?.message}
                >
                  <Controller
                    control={form.control}
                    name="rubricId"
                    render={({ field }) => (
                      <DiscussionRubricPicker value={field.value} onChange={field.onChange} />
                    )}
                  />
                </FormField>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button asChild intent="ghost">
            <Link href={`/courses/${courseId}/discussions/${topicId}`}>Cancel</Link>
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}

function DiscussionRubricPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const rubrics = useRubricsQuery(tenantId);
  const noneSentinel = '__none__';
  const ready = !rubrics.isLoading && !rubrics.error;
  const selected = value.trim() === '' ? (ready ? noneSentinel : undefined) : value;

  return (
    <Select
      value={selected}
      onValueChange={(next) => onChange(next === noneSentinel ? '' : next)}
      disabled={rubrics.isLoading}
    >
      <SelectTrigger id="rubricId">
        <SelectValue
          placeholder={
            rubrics.isLoading
              ? 'Loading rubrics…'
              : rubrics.error
                ? 'Could not load rubrics'
                : 'No rubric'
          }
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={noneSentinel}>No rubric</SelectItem>
        {(rubrics.data ?? []).map((rubric) => (
          <SelectItem key={rubric.id} value={rubric.id}>
            {rubric.title} ({rubric.criteria.length} criteria)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
