'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { FormField } from '@/components/patterns/form-field.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
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
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useMyCourseMembershipsQuery } from '@/lib/api/queries/me.ts';
import {
  useCreateQuestionBankMutation,
  useDeleteQuestionBankMutation,
  useQuestionBanksQuery,
} from '@/lib/api/queries/question-banks.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import { Library, Plus, Trash2 } from 'lucide-react';
import { use, useState } from 'react';

const STAFF_ROLES = new Set(['instructor', 'teaching_assistant', 'course_admin']);

type Params = { courseId: string };

export default function QuestionBanksPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();
  const myCourseMemberships = useMyCourseMembershipsQuery();
  const isStaff =
    myCourseMemberships.data?.some(
      (m) => m.courseId === courseId && STAFF_ROLES.has(m.role),
    ) ?? false;

  const banks = useQuestionBanksQuery(tenantId, courseId);
  const createBank = useCreateQuestionBankMutation(tenantId, courseId);
  const deleteBank = useDeleteQuestionBankMutation(tenantId, courseId);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      await createBank.mutateAsync({
        title: trimmed,
        description: description.trim() === '' ? null : description.trim(),
        status: 'active',
      });
      publish({ tone: 'success', title: 'Bank created' });
      reset();
      setOpen(false);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not create bank.';
      publish({ tone: 'danger', title: 'Create failed', description: message });
    }
  };

  const handleDelete = (bankId: string, bankTitle: string) => {
    if (!window.confirm(`Delete question bank "${bankTitle}"? Bank questions are removed.`)) return;
    deleteBank.mutate(bankId, {
      onSuccess: () => publish({ tone: 'success', title: `Deleted ${bankTitle}` }),
      onError: (error) =>
        publish({
          tone: 'danger',
          title: 'Delete failed',
          description: error instanceof Error ? error.message : undefined,
        }),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Quizzes"
        title="Question banks"
        description="Reusable pools of questions you can pull into any quiz in this course."
        actions={
          isStaff ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" aria-hidden /> New bank
            </Button>
          ) : null
        }
      />

      {banks.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : banks.error ? (
        <ErrorState error={banks.error} onRetry={() => banks.refetch()} />
      ) : (banks.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Library}
          title="No question banks yet"
          description="Create a bank to build a reusable question pool."
          action={
            isStaff ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" aria-hidden /> New bank
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {banks.data?.map((bank) => (
            <li key={bank.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base">{bank.title}</CardTitle>
                      <CardDescription>Updated {formatDateTime(bank.updatedAt)}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={bank.status === 'active' ? 'success' : 'outline'}>
                        {bank.status}
                      </Badge>
                      {isStaff ? (
                        <Button
                          intent="ghost"
                          size="icon-sm"
                          aria-label={`Delete bank ${bank.title}`}
                          onClick={() => handleDelete(bank.id, bank.title)}
                          disabled={deleteBank.isPending}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                {bank.description ? (
                  <CardContent className="text-sm text-(--color-text-default)">
                    {bank.description}
                  </CardContent>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New question bank</DialogTitle>
            <DialogDescription>
              Banks hold questions that can be reused across multiple quizzes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField label="Title" id="qb-title" required>
              <Input
                id="qb-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={180}
                placeholder="Argumentation question bank"
                autoFocus
              />
            </FormField>
            <FormField label="Description" id="qb-description">
              <Textarea
                id="qb-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={4000}
                placeholder="Optional. Helps you remember what's in the bank."
              />
            </FormField>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" intent="secondary" disabled={createBank.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={!title.trim() || createBank.isPending}
                loading={createBank.isPending}
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
