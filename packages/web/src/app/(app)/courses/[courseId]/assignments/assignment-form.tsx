'use client';

import { FormField } from '@/components/patterns/form-field.tsx';
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
import {
  type AssignmentInput,
  useCreateAssignment,
  useUpdateAssignment,
} from '@/lib/api/queries/assignments.ts';
import { useRubricsQuery } from '@/lib/api/queries/rubrics.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Assignment } from '@openlms/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const EXT_RE = /^[a-z0-9][a-z0-9_-]*$/;

const FormSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required.').max(180, 'Title is too long.'),
    status: z.enum(['draft', 'published', 'archived']),
    instructions: z.string().trim().min(1, 'Instructions are required.'),
    dueAtLocal: z.string(),
    allowResubmission: z.boolean(),
    allowedFileExtensionsRaw: z.string(),
    maxFileSizeMb: z.string(),
    activeRubricId: z.string(),
    precheckEnabled: z.boolean(),
    feedbackDraftEnabled: z.boolean(),
    scoreSuggestionEnabled: z.boolean(),
    extraCredit: z.boolean(),
    anonymousGradingEnabled: z.boolean(),
    groupSubmissionEnabled: z.boolean(),
    groupSetId: z.string(),
    moduleId: z.string().nullable(),
    unitId: z.string().nullable(),
    position: z.number().int().nonnegative().nullable(),
  })
  .superRefine((values, ctx) => {
    if (values.dueAtLocal && Number.isNaN(new Date(values.dueAtLocal).getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dueAtLocal'],
        message: 'Pick a valid date and time.',
      });
    }
    if (values.maxFileSizeMb) {
      const mb = Number(values.maxFileSizeMb);
      if (!Number.isFinite(mb) || mb <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['maxFileSizeMb'],
          message: 'Enter a positive number of megabytes.',
        });
      }
    }
    if (values.activeRubricId && !ULID_RE.test(values.activeRubricId.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['activeRubricId'],
        message: 'Enter a valid rubric ULID (26 characters).',
      });
    }
    const extTokens = parseExtensions(values.allowedFileExtensionsRaw);
    for (const ext of extTokens) {
      if (!EXT_RE.test(ext)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['allowedFileExtensionsRaw'],
          message: `"${ext}" is not a valid extension. Use lowercase letters, digits, "-" or "_". No leading dot.`,
        });
        break;
      }
    }
    if (values.groupSubmissionEnabled) {
      const gid = values.groupSetId.trim();
      if (!gid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['groupSetId'],
          message: 'Group assignments need a group set ULID.',
        });
      } else if (!ULID_RE.test(gid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['groupSetId'],
          message: 'Enter a valid group set ULID (26 characters).',
        });
      }
    }
  });

export type AssignmentFormValues = z.infer<typeof FormSchema>;

function parseExtensions(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((x) => x.trim().toLowerCase().replace(/^\./, ''))
    .filter(Boolean);
}

function toDatetimeLocal(input: Date | string | null): string {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function toBytes(mbStr: string): number | null {
  if (!mbStr) return null;
  const mb = Number(mbStr);
  if (!Number.isFinite(mb) || mb <= 0) return null;
  return Math.round(mb * 1024 * 1024);
}

function bytesToMbString(bytes: number | null): string {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  return mb.toString().replace(/\.0+$/, '');
}

function defaultsFromAssignment(a: Assignment): AssignmentFormValues {
  return {
    title: a.title,
    status: a.status,
    instructions: a.instructions,
    dueAtLocal: toDatetimeLocal(a.dueAt),
    allowResubmission: a.allowResubmission,
    allowedFileExtensionsRaw: a.allowedFileExtensions.join(', '),
    maxFileSizeMb: bytesToMbString(a.maxFileSizeBytes),
    activeRubricId: a.activeRubricId ?? '',
    precheckEnabled: a.aiSettings.precheckEnabled,
    feedbackDraftEnabled: a.aiSettings.feedbackDraftEnabled,
    scoreSuggestionEnabled: a.aiSettings.scoreSuggestionEnabled,
    extraCredit: a.extraCredit,
    anonymousGradingEnabled: a.anonymousGradingEnabled,
    groupSubmissionEnabled: a.groupSubmissionEnabled,
    groupSetId: a.groupSetId ?? '',
    moduleId: a.moduleId,
    unitId: a.unitId,
    position: a.position,
  };
}

function emptyDefaults(): AssignmentFormValues {
  return {
    title: '',
    status: 'draft',
    instructions: '',
    dueAtLocal: '',
    allowResubmission: true,
    allowedFileExtensionsRaw: '',
    maxFileSizeMb: '',
    activeRubricId: '',
    precheckEnabled: false,
    feedbackDraftEnabled: false,
    scoreSuggestionEnabled: false,
    extraCredit: false,
    anonymousGradingEnabled: false,
    groupSubmissionEnabled: false,
    groupSetId: '',
    moduleId: null,
    unitId: null,
    position: null,
  };
}

function toApiInput(values: AssignmentFormValues): AssignmentInput {
  const trimmedRubric = values.activeRubricId.trim();
  return {
    moduleId: values.moduleId,
    unitId: values.unitId,
    position: values.position,
    title: values.title.trim(),
    instructions: values.instructions.trim(),
    status: values.status,
    dueAt: values.dueAtLocal ? new Date(values.dueAtLocal).toISOString() : null,
    allowResubmission: values.allowResubmission,
    activeRubricId: trimmedRubric || null,
    aiSettings: {
      precheckEnabled: values.precheckEnabled,
      feedbackDraftEnabled: values.feedbackDraftEnabled,
      scoreSuggestionEnabled: values.scoreSuggestionEnabled,
    },
    extraCredit: values.extraCredit,
    anonymousGradingEnabled: values.anonymousGradingEnabled,
    groupSubmissionEnabled: values.groupSubmissionEnabled,
    groupSetId: values.groupSubmissionEnabled ? values.groupSetId.trim() || null : null,
    allowedFileExtensions: parseExtensions(values.allowedFileExtensionsRaw),
    maxFileSizeBytes: toBytes(values.maxFileSizeMb),
  };
}

export type AssignmentFormProps =
  | { mode: 'create'; courseId: string }
  | { mode: 'edit'; courseId: string; assignment: Assignment };

export function AssignmentForm(props: AssignmentFormProps) {
  const router = useRouter();
  const { publish } = useToast();
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const createMutation = useCreateAssignment(tenantId, props.courseId);
  const updateMutation = useUpdateAssignment(tenantId, props.courseId);

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues:
      props.mode === 'edit' ? defaultsFromAssignment(props.assignment) : emptyDefaults(),
  });

  const groupSubmissionEnabled = form.watch('groupSubmissionEnabled');

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    const input = toApiInput(values);
    try {
      if (props.mode === 'create') {
        const created = await createMutation.mutateAsync(input);
        publish({ tone: 'success', title: 'Assignment created', description: created.title });
        router.push(`/courses/${props.courseId}/assignments/${created.id}`);
      } else {
        const updated = await updateMutation.mutateAsync({
          assignmentId: props.assignment.id,
          input,
        });
        publish({ tone: 'success', title: 'Assignment updated', description: updated.title });
        router.push(`/courses/${props.courseId}/assignments/${updated.id}`);
      }
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Something went wrong. Please try again.';
      publish({
        tone: 'danger',
        title: props.mode === 'create' ? 'Could not create assignment' : 'Could not save changes',
        description: message,
      });
    }
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
          <CardDescription>Title, status, and what learners are asked to do.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FormField id="title" label="Title" required error={form.formState.errors.title?.message}>
            <Input
              id="title"
              placeholder="Essay 1: Defending a thesis"
              maxLength={180}
              invalid={Boolean(form.formState.errors.title)}
              {...form.register('title')}
            />
          </FormField>
          <FormField
            id="status"
            label="Status"
            description="Drafts are hidden from learners until you publish."
          >
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
          <FormField
            id="instructions"
            label="Instructions"
            required
            description="Plain text or Markdown. Shown to learners on the assignment page."
            error={form.formState.errors.instructions?.message}
          >
            <Textarea
              id="instructions"
              rows={8}
              placeholder="Describe the task, expectations, and any references…"
              invalid={Boolean(form.formState.errors.instructions)}
              {...form.register('instructions')}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>
            When the assignment is due. Per-group overrides are managed separately.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FormField
            id="dueAtLocal"
            label="Due date and time"
            description="Leave blank for no due date. Time is in your browser's timezone."
            error={form.formState.errors.dueAtLocal?.message}
          >
            <Input
              id="dueAtLocal"
              type="datetime-local"
              className="w-full sm:w-72"
              invalid={Boolean(form.formState.errors.dueAtLocal)}
              {...form.register('dueAtLocal')}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission policy</CardTitle>
          <CardDescription>What learners can submit and whether they can revise.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SwitchRow
            id="allowResubmission"
            label="Allow resubmission"
            description="Let learners replace a previous submission until the assignment closes."
            control={form.control}
            name="allowResubmission"
          />
          <FormField
            id="allowedFileExtensionsRaw"
            label="Allowed file extensions"
            description="Comma-separated, lowercase, no leading dot (e.g. pdf, docx, png). Leave blank to allow any file type."
            error={form.formState.errors.allowedFileExtensionsRaw?.message}
          >
            <Input
              id="allowedFileExtensionsRaw"
              placeholder="pdf, docx"
              invalid={Boolean(form.formState.errors.allowedFileExtensionsRaw)}
              {...form.register('allowedFileExtensionsRaw')}
            />
          </FormField>
          <FormField
            id="maxFileSizeMb"
            label="Max file size (MB)"
            description="Leave blank for the system default."
            error={form.formState.errors.maxFileSizeMb?.message}
          >
            <Input
              id="maxFileSizeMb"
              type="number"
              min={0}
              step={0.1}
              inputMode="decimal"
              className="w-full sm:w-40"
              placeholder="20"
              invalid={Boolean(form.formState.errors.maxFileSizeMb)}
              {...form.register('maxFileSizeMb')}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rubric</CardTitle>
          <CardDescription>
            Attach a rubric so feedback aligns with the criteria learners see. Create rubrics in
            Admin → Rubrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FormField
            id="activeRubricId"
            label="Rubric"
            description="Leave blank for no rubric."
            error={form.formState.errors.activeRubricId?.message}
          >
            <Controller
              control={form.control}
              name="activeRubricId"
              render={({ field }) => <RubricPicker value={field.value} onChange={field.onChange} />}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI assist</CardTitle>
          <CardDescription>
            These toggles only enable AI features for this assignment. Tenant- and provider-level
            policy still apply.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SwitchRow
            id="precheckEnabled"
            label="Submission precheck"
            description="Lets learners run a structure/grammar check on their draft before submitting."
            control={form.control}
            name="precheckEnabled"
          />
          <SwitchRow
            id="feedbackDraftEnabled"
            label="Feedback draft"
            description="When grading, instructors can ask AI for a draft of qualitative feedback."
            control={form.control}
            name="feedbackDraftEnabled"
          />
          <SwitchRow
            id="scoreSuggestionEnabled"
            label="Score suggestion"
            description="When a rubric is attached, AI can suggest per-criterion scores. Instructors review before publishing."
            control={form.control}
            name="scoreSuggestionEnabled"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced</CardTitle>
          <CardDescription>Less common options. Defaults are usually fine.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SwitchRow
            id="extraCredit"
            label="Extra credit"
            description="Points contribute to the earned score but not to the maximum possible."
            control={form.control}
            name="extraCredit"
          />
          <SwitchRow
            id="anonymousGradingEnabled"
            label="Anonymous grading"
            description="Hide student identity from graders until feedback is published."
            control={form.control}
            name="anonymousGradingEnabled"
          />
          <SwitchRow
            id="groupSubmissionEnabled"
            label="Group submission"
            description="One submission per group. Requires a group set."
            control={form.control}
            name="groupSubmissionEnabled"
          />
          {groupSubmissionEnabled ? (
            <FormField
              id="groupSetId"
              label="Group set ULID"
              required
              description="26-character ULID of the group set used to resolve learners' groups."
              error={form.formState.errors.groupSetId?.message}
            >
              <Input
                id="groupSetId"
                placeholder="01J9QW7B6N5W2YH3D3A1V0KE55"
                autoComplete="off"
                spellCheck={false}
                invalid={Boolean(form.formState.errors.groupSetId)}
                {...form.register('groupSetId')}
              />
            </FormField>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button asChild intent="ghost">
          <Link
            href={
              props.mode === 'edit'
                ? `/courses/${props.courseId}/assignments/${props.assignment.id}`
                : `/courses/${props.courseId}/assignments`
            }
          >
            Cancel
          </Link>
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {props.mode === 'create' ? 'Create assignment' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

type SwitchRowProps = {
  id: string;
  label: string;
  description: string;
  control: ReturnType<typeof useForm<AssignmentFormValues>>['control'];
  name:
    | 'allowResubmission'
    | 'precheckEnabled'
    | 'feedbackDraftEnabled'
    | 'scoreSuggestionEnabled'
    | 'extraCredit'
    | 'anonymousGradingEnabled'
    | 'groupSubmissionEnabled';
};

function RubricPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const rubrics = useRubricsQuery(tenantId);
  const noneSentinel = '__none__';
  const selected = value.trim() === '' ? noneSentinel : value;

  return (
    <Select
      value={selected}
      onValueChange={(next) => onChange(next === noneSentinel ? '' : next)}
      disabled={rubrics.isLoading}
    >
      <SelectTrigger id="activeRubricId">
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

function SwitchRow({ id, label, description, control, name }: SwitchRowProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-base) px-4 py-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-sm font-medium text-(--color-text-default)">
              {label}
            </label>
            <p className="text-xs text-(--color-text-muted)">{description}</p>
          </div>
          <Switch id={id} checked={field.value} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  );
}
