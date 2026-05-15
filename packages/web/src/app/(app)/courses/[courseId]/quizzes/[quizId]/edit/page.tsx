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
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useQuizQuery, useUpdateQuiz } from '@/lib/api/queries/quizzes.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Quiz } from '@openlms/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const FormSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required.').max(180, 'Title is too long.'),
    description: z.string(),
    status: z.enum(['draft', 'published', 'archived']),
    opensAtLocal: z.string(),
    closesAtLocal: z.string(),
    timeLimitMinutes: z.string(),
    maxAttempts: z.string(),
    shuffleQuestions: z.boolean(),
    accessPassword: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.opensAtLocal && Number.isNaN(new Date(values.opensAtLocal).getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['opensAtLocal'],
        message: 'Pick a valid date and time.',
      });
    }
    if (values.closesAtLocal && Number.isNaN(new Date(values.closesAtLocal).getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['closesAtLocal'],
        message: 'Pick a valid date and time.',
      });
    }
    if (values.opensAtLocal && values.closesAtLocal) {
      const opens = new Date(values.opensAtLocal).getTime();
      const closes = new Date(values.closesAtLocal).getTime();
      if (closes <= opens) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['closesAtLocal'],
          message: 'Closes must be after opens.',
        });
      }
    }
    if (values.timeLimitMinutes) {
      const n = Number(values.timeLimitMinutes);
      if (!Number.isInteger(n) || n <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timeLimitMinutes'],
          message: 'Time limit must be a positive integer.',
        });
      }
    }
    const attempts = Number(values.maxAttempts);
    if (!Number.isInteger(attempts) || attempts <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxAttempts'],
        message: 'Max attempts must be a positive integer.',
      });
    }
  });

type FormValues = z.infer<typeof FormSchema>;

type Params = { courseId: string; quizId: string };

function toLocalInput(value: Date | string | null): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultsFromQuiz(q: Quiz): FormValues {
  return {
    title: q.title,
    description: q.description ?? '',
    status: q.status,
    opensAtLocal: toLocalInput(q.opensAt),
    closesAtLocal: toLocalInput(q.closesAt),
    timeLimitMinutes: q.timeLimitMinutes != null ? String(q.timeLimitMinutes) : '',
    maxAttempts: String(q.maxAttempts),
    shuffleQuestions: q.shuffleQuestions,
    accessPassword: '',
  };
}

export default function EditQuizPage({ params }: { params: Promise<Params> }) {
  const { courseId, quizId } = use(params);
  const router = useRouter();
  const { publish } = useToast();
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const quiz = useQuizQuery(tenantId, courseId, quizId);
  const mutation = useUpdateQuiz(tenantId, courseId, quizId);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'draft',
      opensAtLocal: '',
      closesAtLocal: '',
      timeLimitMinutes: '',
      maxAttempts: '1',
      shuffleQuestions: false,
      accessPassword: '',
    },
  });

  useEffect(() => {
    if (quiz.data) {
      form.reset(defaultsFromQuiz(quiz.data));
    }
  }, [quiz.data, form]);

  if (quiz.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (quiz.error) {
    return <ErrorState error={quiz.error} onRetry={() => quiz.refetch()} />;
  }
  if (!quiz.data) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const trimmedPassword = values.accessPassword.trim();
      await mutation.mutateAsync({
        moduleId: quiz.data?.moduleId ?? null,
        unitId: quiz.data?.unitId ?? null,
        position: quiz.data?.position ?? null,
        title: values.title.trim(),
        description: values.description.trim() === '' ? null : values.description.trim(),
        status: values.status,
        opensAt: values.opensAtLocal ? new Date(values.opensAtLocal).toISOString() : null,
        closesAt: values.closesAtLocal ? new Date(values.closesAtLocal).toISOString() : null,
        timeLimitMinutes: values.timeLimitMinutes ? Number(values.timeLimitMinutes) : null,
        shuffleQuestions: values.shuffleQuestions,
        maxAttempts: Number(values.maxAttempts),
        // Omit accessPassword entirely when blank so the existing password is preserved.
        // Explicit null would clear it.
        ...(trimmedPassword === '' ? {} : { accessPassword: trimmedPassword }),
      });
      publish({ tone: 'success', title: 'Quiz updated' });
      router.push(`/courses/${courseId}/quizzes/${quizId}`);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Something went wrong.';
      publish({ tone: 'danger', title: 'Could not save', description: message });
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Quiz"
        title={`Edit · ${quiz.data.title}`}
        description="Changes apply immediately. Drafts stay hidden from learners."
        actions={
          <Button asChild intent="ghost">
            <Link href={`/courses/${courseId}/quizzes/${quizId}`}>Back to quiz</Link>
          </Button>
        }
      />
      <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
            <CardDescription>Title, description, and publish state.</CardDescription>
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
            <FormField
              id="description"
              label="Description"
              description="Optional. Plain text or Markdown."
            >
              <Textarea
                id="description"
                rows={5}
                maxLength={4000}
                {...form.register('description')}
              />
            </FormField>
            <FormField id="status" label="Status">
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status" className="w-full sm:w-48">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Availability and attempts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="opensAtLocal"
                label="Opens at"
                error={form.formState.errors.opensAtLocal?.message}
              >
                <Input
                  id="opensAtLocal"
                  type="datetime-local"
                  invalid={Boolean(form.formState.errors.opensAtLocal)}
                  {...form.register('opensAtLocal')}
                />
              </FormField>
              <FormField
                id="closesAtLocal"
                label="Closes at"
                error={form.formState.errors.closesAtLocal?.message}
              >
                <Input
                  id="closesAtLocal"
                  type="datetime-local"
                  invalid={Boolean(form.formState.errors.closesAtLocal)}
                  {...form.register('closesAtLocal')}
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="timeLimitMinutes"
                label="Time limit (minutes)"
                description="Leave blank for untimed."
                error={form.formState.errors.timeLimitMinutes?.message}
              >
                <Input
                  id="timeLimitMinutes"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  className="w-full sm:w-40"
                  invalid={Boolean(form.formState.errors.timeLimitMinutes)}
                  {...form.register('timeLimitMinutes')}
                />
              </FormField>
              <FormField
                id="maxAttempts"
                label="Max attempts"
                required
                error={form.formState.errors.maxAttempts?.message}
              >
                <Input
                  id="maxAttempts"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  className="w-full sm:w-40"
                  invalid={Boolean(form.formState.errors.maxAttempts)}
                  {...form.register('maxAttempts')}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Controller
              control={form.control}
              name="shuffleQuestions"
              render={({ field }) => (
                <div className="flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-base) px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="shuffleQuestions"
                      className="text-sm font-medium text-(--color-text-default)"
                    >
                      Shuffle questions
                    </label>
                    <p className="text-xs text-(--color-text-muted)">
                      Each attempt randomises question order to reduce cross-talk.
                    </p>
                  </div>
                  <Switch
                    id="shuffleQuestions"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
            <FormField
              id="accessPassword"
              label="Access password"
              description="Optional. Required to start an attempt. Leave blank to keep the current password (the API does not return existing passwords)."
            >
              <Input
                id="accessPassword"
                type="text"
                autoComplete="off"
                maxLength={256}
                placeholder="Leave blank to keep existing"
                {...form.register('accessPassword')}
              />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button asChild intent="ghost">
            <Link href={`/courses/${courseId}/quizzes/${quizId}`}>Cancel</Link>
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
