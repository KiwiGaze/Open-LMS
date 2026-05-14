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
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useCreateCourse } from '@/lib/api/queries/courses.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const FormSchema = z
  .object({
    code: z.string().trim().min(1, 'Code is required.').max(32, 'Code is too long.'),
    title: z.string().trim().min(1, 'Title is required.').max(160, 'Title is too long.'),
    status: z.enum(['draft', 'active', 'archived']),
    startsAtLocal: z.string(),
    endsAtLocal: z.string(),
    catalogCategory: z.string(),
    academicTerm: z.string(),
    isBlueprint: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const starts = values.startsAtLocal ? new Date(values.startsAtLocal) : null;
    const ends = values.endsAtLocal ? new Date(values.endsAtLocal) : null;
    if (values.startsAtLocal && (!starts || Number.isNaN(starts.getTime()))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startsAtLocal'],
        message: 'Pick a valid date and time.',
      });
    }
    if (values.endsAtLocal && (!ends || Number.isNaN(ends.getTime()))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAtLocal'],
        message: 'Pick a valid date and time.',
      });
    }
    if (starts && ends && starts.getTime() > ends.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAtLocal'],
        message: 'End must be after start.',
      });
    }
  });

type FormValues = z.infer<typeof FormSchema>;

export default function NewCoursePage() {
  const router = useRouter();
  const { publish } = useToast();
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const mutation = useCreateCourse(tenantId);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      code: '',
      title: '',
      status: 'draft',
      startsAtLocal: '',
      endsAtLocal: '',
      catalogCategory: '',
      academicTerm: '',
      isBlueprint: false,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const course = await mutation.mutateAsync({
        code: values.code.trim(),
        title: values.title.trim(),
        status: values.status,
        startsAt: values.startsAtLocal ? new Date(values.startsAtLocal).toISOString() : null,
        endsAt: values.endsAtLocal ? new Date(values.endsAtLocal).toISOString() : null,
        catalogCategory: values.catalogCategory.trim() || null,
        academicTerm: values.academicTerm.trim() || null,
        isBlueprint: values.isBlueprint,
      });
      publish({ tone: 'success', title: 'Course created', description: course.title });
      router.push(`/courses/${course.id}`);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Something went wrong.';
      publish({ tone: 'danger', title: 'Could not create course', description: message });
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Course"
        title="New course"
        description="Create a new course shell. You can configure modules, assignments, and people after the course is created."
        actions={
          <Button asChild intent="ghost">
            <Link href="/courses">Back to courses</Link>
          </Button>
        }
      />
      <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
            <CardDescription>The minimum to create a course shell.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
              <FormField
                id="code"
                label="Course code"
                required
                description="Short identifier, unique within the institution."
                error={form.formState.errors.code?.message}
              >
                <Input
                  id="code"
                  placeholder="CS101"
                  maxLength={32}
                  invalid={Boolean(form.formState.errors.code)}
                  {...form.register('code')}
                />
              </FormField>
              <FormField
                id="title"
                label="Title"
                required
                error={form.formState.errors.title?.message}
              >
                <Input
                  id="title"
                  placeholder="Introduction to Computer Science"
                  maxLength={160}
                  invalid={Boolean(form.formState.errors.title)}
                  {...form.register('title')}
                />
              </FormField>
            </div>
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
                      <SelectItem value="active">Active</SelectItem>
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
            <CardTitle>Schedule</CardTitle>
            <CardDescription>
              Optional. You can edit these in course settings later.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="startsAtLocal"
                label="Starts at"
                error={form.formState.errors.startsAtLocal?.message}
              >
                <Input
                  id="startsAtLocal"
                  type="datetime-local"
                  invalid={Boolean(form.formState.errors.startsAtLocal)}
                  {...form.register('startsAtLocal')}
                />
              </FormField>
              <FormField
                id="endsAtLocal"
                label="Ends at"
                error={form.formState.errors.endsAtLocal?.message}
              >
                <Input
                  id="endsAtLocal"
                  type="datetime-local"
                  invalid={Boolean(form.formState.errors.endsAtLocal)}
                  {...form.register('endsAtLocal')}
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="catalogCategory"
                label="Catalog category"
                description="Optional grouping for the public catalog."
              >
                <Input
                  id="catalogCategory"
                  placeholder="Computer Science"
                  maxLength={120}
                  {...form.register('catalogCategory')}
                />
              </FormField>
              <FormField id="academicTerm" label="Academic term" description="e.g. Fall 2026">
                <Input
                  id="academicTerm"
                  placeholder="Fall 2026"
                  maxLength={64}
                  {...form.register('academicTerm')}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={form.control}
              name="isBlueprint"
              render={({ field }) => (
                <div className="flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-base) px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="isBlueprint"
                      className="text-sm font-medium text-(--color-text-default)"
                    >
                      Blueprint course
                    </label>
                    <p className="text-xs text-(--color-text-muted)">
                      Use this as a template for new course shells. Blueprints don't enrol learners
                      directly.
                    </p>
                  </div>
                  <Switch id="isBlueprint" checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button asChild intent="ghost">
            <Link href="/courses">Cancel</Link>
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Create course
          </Button>
        </div>
      </form>
    </div>
  );
}
