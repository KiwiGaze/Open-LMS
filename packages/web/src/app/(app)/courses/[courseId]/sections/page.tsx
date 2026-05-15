'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { FormField } from '@/components/patterns/form-field.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useAssignSectionInstructorMutation,
  useAssignSectionMemberMutation,
  useCourseSectionsQuery,
  useCreateCourseSectionMutation,
  useDeleteCourseSectionMutation,
  useRemoveSectionInstructorMutation,
  useRemoveSectionMemberMutation,
  useSectionInstructorsQuery,
  useSectionMembersQuery,
} from '@/lib/api/queries/sections.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import type { CourseSection } from '@openlms/contracts';
import { Layers, Plus, Trash2, UserPlus } from 'lucide-react';
import { use, useState } from 'react';

type Params = { courseId: string };

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export default function CourseSectionsPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();
  const sections = useCourseSectionsQuery(tenantId, courseId);
  const createSection = useCreateCourseSectionMutation(tenantId, courseId);
  const deleteSection = useDeleteCourseSectionMutation(tenantId, courseId);

  const [newSectionOpen, setNewSectionOpen] = useState(false);
  const [name, setName] = useState('');
  const [activeSection, setActiveSection] = useState<CourseSection | null>(null);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await createSection.mutateAsync({
        name: trimmed,
        status: 'active',
        position: sections.data?.length ?? 0,
      });
      publish({ tone: 'success', title: 'Section created' });
      setName('');
      setNewSectionOpen(false);
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not create. Try again.';
      publish({ tone: 'danger', title: 'Create failed', description: message });
    }
  };

  const handleDelete = async (section: CourseSection) => {
    if (!window.confirm(`Delete section "${section.name}"?`)) return;
    try {
      await deleteSection.mutateAsync(section.id);
      publish({ tone: 'success', title: 'Section deleted' });
      if (activeSection?.id === section.id) setActiveSection(null);
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not delete. Try again.';
      publish({ tone: 'danger', title: 'Delete failed', description: message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Sections"
        title="Course sections"
        description="Subdivide your course roster for scheduling and grading."
        actions={
          <Button onClick={() => setNewSectionOpen(true)}>
            <Plus className="size-4" aria-hidden /> New section
          </Button>
        }
      />

      {sections.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : sections.error ? (
        <ErrorState error={sections.error} onRetry={() => sections.refetch()} />
      ) : (sections.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Layers}
          title="No sections"
          description="Create a section to assign students into smaller cohorts."
          action={
            <Button onClick={() => setNewSectionOpen(true)}>
              <Plus className="size-4" aria-hidden /> New section
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="flex flex-col gap-3">
            {sections.data?.map((section) => (
              <Card
                key={section.id}
                className={
                  activeSection?.id === section.id
                    ? 'border-(--color-brand) shadow-(--shadow-sm)'
                    : ''
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSection(section)}
                      className="text-left"
                    >
                      <CardTitle className="text-base hover:text-(--color-text-link)">
                        {section.name}
                      </CardTitle>
                    </button>
                    <div className="flex items-center gap-2">
                      <Badge tone={section.status === 'active' ? 'success' : 'neutral'}>
                        {section.status}
                      </Badge>
                      <Button
                        intent="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${section.name}`}
                        onClick={() => handleDelete(section)}
                        disabled={deleteSection.isPending}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {activeSection ? (
            <div className="flex flex-col gap-4">
              <SectionMembersPanel
                tenantId={tenantId}
                courseId={courseId}
                section={activeSection}
              />
              <SectionInstructorsPanel
                tenantId={tenantId}
                courseId={courseId}
                section={activeSection}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-sm text-(--color-text-muted)">
                Pick a section on the left to manage its members.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={newSectionOpen} onOpenChange={setNewSectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New section</DialogTitle>
            <DialogDescription>
              Sections divide the course roster — add students after creating.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <FormField label="Name" id="section-name" required>
              <Input
                id="section-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                placeholder="Section B"
                autoFocus
              />
            </FormField>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" intent="secondary" disabled={createSection.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={!name.trim() || createSection.isPending}
                loading={createSection.isPending}
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionMembersPanel({
  tenantId,
  courseId,
  section,
}: {
  tenantId: string | null;
  courseId: string;
  section: CourseSection;
}) {
  const { publish } = useToast();
  const members = useSectionMembersQuery(tenantId, courseId, section.id);
  const assign = useAssignSectionMemberMutation(tenantId, courseId, section.id);
  const remove = useRemoveSectionMemberMutation(tenantId, courseId, section.id);
  const [studentId, setStudentId] = useState('');
  const [studentIdError, setStudentIdError] = useState<string | null>(null);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStudentIdError(null);
    const trimmed = studentId.trim();
    if (!ULID_RE.test(trimmed)) {
      setStudentIdError('Student ID must be a 26-character ULID.');
      return;
    }
    try {
      await assign.mutateAsync(trimmed);
      publish({ tone: 'success', title: 'Student added' });
      setStudentId('');
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not add. Try again.';
      publish({ tone: 'danger', title: 'Add failed', description: message });
    }
  };

  const handleRemove = async (memberStudentId: string) => {
    if (!window.confirm(`Remove ${memberStudentId.slice(-12)}?`)) return;
    try {
      await remove.mutateAsync(memberStudentId);
      publish({ tone: 'success', title: 'Student removed' });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not remove. Try again.';
      publish({ tone: 'danger', title: 'Remove failed', description: message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members of “{section.name}”</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form onSubmit={handleAdd} className="flex items-end gap-2">
          <FormField label="Student ID" id="add-student" error={studentIdError} className="flex-1">
            <Input
              id="add-student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="01J9QW7B6N5W2YH3D3A1V0KE8M"
            />
          </FormField>
          <Button type="submit" disabled={assign.isPending} loading={assign.isPending}>
            <UserPlus className="size-4" aria-hidden /> Add
          </Button>
        </form>

        {members.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : members.error ? (
          <ErrorState error={members.error} onRetry={() => members.refetch()} />
        ) : (members.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-(--color-text-muted)">No students yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-(--color-border-subtle) overflow-hidden rounded-[var(--radius-md)] border border-(--color-border-subtle)">
            {members.data?.map((m) => (
              <li key={m.id} className="flex items-center gap-2 px-3 py-2">
                <span className="flex-1 font-mono text-xs text-(--color-text-default)">
                  {m.studentId.slice(-12)}
                </span>
                <Button
                  intent="ghost"
                  size="icon-sm"
                  aria-label="Remove student"
                  onClick={() => handleRemove(m.studentId)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function SectionInstructorsPanel({
  tenantId,
  courseId,
  section,
}: {
  tenantId: string | null;
  courseId: string;
  section: CourseSection;
}) {
  const { publish } = useToast();
  const instructors = useSectionInstructorsQuery(tenantId, courseId, section.id);
  const assign = useAssignSectionInstructorMutation(tenantId, courseId, section.id);
  const remove = useRemoveSectionInstructorMutation(tenantId, courseId, section.id);
  const [instructorId, setInstructorId] = useState('');
  const [instructorIdError, setInstructorIdError] = useState<string | null>(null);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInstructorIdError(null);
    const trimmed = instructorId.trim();
    if (!ULID_RE.test(trimmed)) {
      setInstructorIdError('Instructor ID must be a 26-character ULID.');
      return;
    }
    try {
      await assign.mutateAsync(trimmed);
      publish({ tone: 'success', title: 'Instructor assigned' });
      setInstructorId('');
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not assign. Try again.';
      publish({ tone: 'danger', title: 'Assign failed', description: message });
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm(`Remove ${id.slice(-12)} from this section?`)) return;
    try {
      await remove.mutateAsync(id);
      publish({ tone: 'success', title: 'Instructor removed' });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not remove. Try again.';
      publish({ tone: 'danger', title: 'Remove failed', description: message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instructors of "{section.name}"</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form onSubmit={handleAdd} className="flex items-end gap-2">
          <FormField
            label="Instructor ID"
            id={`add-instructor-${section.id}`}
            error={instructorIdError}
            className="flex-1"
          >
            <Input
              id={`add-instructor-${section.id}`}
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              placeholder="01J9QW7B6N5W2YH3D3A1V0KE8M"
            />
          </FormField>
          <Button type="submit" disabled={assign.isPending} loading={assign.isPending}>
            <UserPlus className="size-4" aria-hidden /> Assign
          </Button>
        </form>

        {instructors.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : instructors.error ? (
          <ErrorState error={instructors.error} onRetry={() => instructors.refetch()} />
        ) : (instructors.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-(--color-text-muted)">No instructors assigned yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-(--color-border-subtle) overflow-hidden rounded-[var(--radius-md)] border border-(--color-border-subtle)">
            {instructors.data?.map((i) => (
              <li key={i.id} className="flex items-center gap-2 px-3 py-2">
                <span className="flex-1 font-mono text-xs text-(--color-text-default)">
                  {i.instructorId.slice(-12)}
                </span>
                <Button
                  intent="ghost"
                  size="icon-sm"
                  aria-label="Remove instructor"
                  onClick={() => handleRemove(i.instructorId)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
