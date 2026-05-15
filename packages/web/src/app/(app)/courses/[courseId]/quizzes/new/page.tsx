'use client';

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
import { Switch } from '@/components/ui/switch.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useCreateQuiz } from '@/lib/api/queries/quizzes.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
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

type Params = { courseId: string };

export default function NewQuizPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const router = useRouter();
  const { publish } = useToast();
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const mutation = useCreateQuiz(tenantId, courseId);

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

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const quiz = await mutation.mutateAsync({
        moduleId: null,
        unitId: null,
        position: null,
        title: values.title.trim(),
        description: values.description.trim() === '' ? null : values.description.trim(),
        status: values.status,
        opensAt: values.opensAtLocal ? new Date(values.opensAtLocal).toISOString() : null,
        closesAt: values.closesAtLocal ? new Date(values.closesAtLocal).toISOString() : null,
        timeLimitMinutes: values.timeLimitMinutes ? Number(values.timeLimitMinutes) : null,
        shuffleQuestions: values.shuffleQuestions,
        maxAttempts: Number(values.maxAttempts),
        accessPassword: values.accessPassword.trim() || null,
      });
      publish({ tone: 'success', title: 'Quiz created', description: quiz.title });
      router.push(`/courses/${courseId}/quizzes/${quiz.id}`);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Something went wrong.';
      publish({ tone: 'danger', title: 'Could not create quiz', description: message });
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Quiz"
        title="New quiz"
        description="Set up the quiz shell. Add questions and access overrides from the quiz detail page once created."
        actions={
          <Button asChild intent="ghost">
            <Link href={`/courses/${courseId}/quizzes`}>Back to quizzes</Link>
          </Button>
        }
      />
      <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
            <CardDescription>The minimum to create a quiz shell.</CardDescription>
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
                placeholder="Midterm: chapters 1–4"
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
                placeholder="Briefly describe what the quiz covers…"
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
            <CardDescription>
              Opens/closes are optional. Time limit applies to each attempt.
            </CardDescription>
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
              description="Optional. Required to start an attempt. Leave blank for no password."
            >
              <Input
                id="accessPassword"
                type="text"
                autoComplete="off"
                maxLength={256}
                placeholder="e.g. midterm-2026"
                {...form.register('accessPassword')}
              />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button asChild intent="ghost">
            <Link href={`/courses/${courseId}/quizzes`}>Cancel</Link>
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Create quiz
          </Button>
        </div>
      </form>
    </div>
  );
}
