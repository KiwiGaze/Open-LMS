'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { FormField } from '@/components/patterns/form-field.tsx';
import { Badge } from '@/components/ui/badge.tsx';
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
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useCourseQuery,
  useDeleteCourseMutation,
  useUpdateCourseCatalogSettingsMutation,
} from '@/lib/api/queries/courses.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDate } from '@/lib/format.ts';
import type { CatalogVisibility } from '@openlms/contracts';
import { Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { CourseToolsCard } from './tools-card.tsx';

type Params = { courseId: string };

export default function CourseSettingsPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const router = useRouter();
  const { publish } = useToast();
  const course = useCourseQuery(tenantId, courseId);
  const update = useUpdateCourseCatalogSettingsMutation(tenantId, courseId);
  const deleteCourse = useDeleteCourseMutation(tenantId);

  const [catalogVisibility, setCatalogVisibility] = useState<CatalogVisibility>('private');
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('');
  const [academicTerm, setAcademicTerm] = useState('');
  const [maxEnrollments, setMaxEnrollments] = useState('');
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [enrollmentApprovalRequired, setEnrollmentApprovalRequired] = useState(false);

  useEffect(() => {
    if (!course.data) return;
    setCatalogCategory(course.data.catalogCategory ?? '');
    setAcademicTerm(course.data.academicTerm ?? '');
    setMaxEnrollments(course.data.maxEnrollments?.toString() ?? '');
    setWaitlistEnabled(course.data.waitlistEnabled);
    setEnrollmentApprovalRequired(course.data.enrollmentApprovalRequired);
  }, [course.data]);

  if (course.isLoading) return <Skeleton className="h-64 w-full" />;
  if (course.error) return <ErrorState error={course.error} onRetry={() => course.refetch()} />;
  if (!course.data) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const maxN = maxEnrollments.trim() === '' ? null : Number(maxEnrollments);
    if (maxN !== null && (!Number.isInteger(maxN) || maxN < 1)) {
      publish({
        tone: 'danger',
        title: 'Invalid max enrollments',
        description: 'Provide a positive whole number or leave blank for uncapped.',
      });
      return;
    }
    const trimmedCode = enrollmentCode.trim();
    if (trimmedCode && (trimmedCode.length < 4 || trimmedCode.length > 64)) {
      publish({
        tone: 'danger',
        title: 'Invalid enrollment code',
        description: 'Must be 4–64 characters or blank.',
      });
      return;
    }

    try {
      await update.mutateAsync({
        catalogVisibility,
        enrollmentCode: trimmedCode || null,
        catalogCategory: catalogCategory.trim() || null,
        academicTerm: academicTerm.trim() || null,
        maxEnrollments: maxN,
        waitlistEnabled,
        enrollmentApprovalRequired,
      });
      publish({ tone: 'success', title: 'Settings saved' });
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not save. Try again.';
      publish({ tone: 'danger', title: 'Save failed', description: message });
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Archive course "${course.data?.title}"? Students will lose access. You can restore it later.`,
      )
    ) {
      return;
    }
    try {
      await deleteCourse.mutateAsync(courseId);
      publish({ tone: 'success', title: 'Course archived' });
      router.push('/courses');
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not archive. Try again.';
      publish({ tone: 'danger', title: 'Archive failed', description: message });
    }
  };

  const c = course.data;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
          <CardDescription>
            Identity and lifecycle. Edit on this surface is limited — code, title, status, and dates
            are managed through the course creation flow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Code" value={c.code} />
            <Field label="Title" value={c.title} />
            <Field
              label="Status"
              value={
                <Badge
                  tone={
                    c.status === 'active'
                      ? 'success'
                      : c.status === 'archived'
                        ? 'outline'
                        : 'neutral'
                  }
                >
                  {c.status}
                </Badge>
              }
            />
            <Field label="Blueprint" value={c.isBlueprint ? 'Yes' : 'No'} />
            <Field label="Starts" value={formatDate(c.startsAt)} />
            <Field label="Ends" value={formatDate(c.endsAt)} />
          </dl>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Catalog & enrollment</CardTitle>
            <CardDescription>
              Controls who can find and join this course. Note: enrollment-code is write-only —
              re-enter to change it.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField label="Catalog visibility" id="visibility">
              <Select
                value={catalogVisibility}
                onValueChange={(v) => setCatalogVisibility(v as CatalogVisibility)}
              >
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private — invite only</SelectItem>
                  <SelectItem value="listed">Listed — appears in the catalog</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Enrollment code"
              id="enrollment-code"
              description="4–64 characters. Blank disables self-enrollment."
            >
              <Input
                id="enrollment-code"
                type="text"
                maxLength={64}
                value={enrollmentCode}
                onChange={(e) => setEnrollmentCode(e.target.value)}
                placeholder="JOIN-WRIT-101"
              />
            </FormField>

            <FormField label="Catalog category" id="category">
              <Input
                id="category"
                type="text"
                maxLength={120}
                value={catalogCategory}
                onChange={(e) => setCatalogCategory(e.target.value)}
                placeholder="Writing"
              />
            </FormField>

            <FormField label="Academic term" id="term">
              <Input
                id="term"
                type="text"
                maxLength={64}
                value={academicTerm}
                onChange={(e) => setAcademicTerm(e.target.value)}
                placeholder="2026 Fall"
              />
            </FormField>

            <FormField
              label="Max enrollments"
              id="max-enrollments"
              description="Blank for uncapped."
            >
              <Input
                id="max-enrollments"
                type="number"
                min="1"
                step="1"
                value={maxEnrollments}
                onChange={(e) => setMaxEnrollments(e.target.value)}
                placeholder="30"
              />
            </FormField>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="waitlist"
                  checked={waitlistEnabled}
                  onCheckedChange={setWaitlistEnabled}
                />
                <label htmlFor="waitlist" className="text-sm text-(--color-text-default)">
                  Waitlist when full
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="approval"
                  checked={enrollmentApprovalRequired}
                  onCheckedChange={setEnrollmentApprovalRequired}
                />
                <label htmlFor="approval" className="text-sm text-(--color-text-default)">
                  Require staff approval for self-enrollment
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button type="submit" disabled={update.isPending} loading={update.isPending}>
            <Save className="size-4" aria-hidden /> Save catalog settings
          </Button>
        </div>
      </form>

      <CourseToolsCard tenantId={tenantId} courseId={courseId} />

      <Card>
        <CardHeader>
          <CardTitle className="text-(--color-text-danger)">Danger zone</CardTitle>
          <CardDescription>
            Archive the course. Existing enrollments stay; the course can be restored from the
            tenant admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button intent="danger" onClick={handleDelete} disabled={deleteCourse.isPending}>
            <Trash2 className="size-4" aria-hidden /> Archive course
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-(--color-text-muted)">{label}</dt>
      <dd className="mt-1 text-(--color-text-default)">{value}</dd>
    </div>
  );
}
