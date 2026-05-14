'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { FormField } from '@/components/patterns/form-field.tsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx';
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
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useDiscussionGradesQuery,
  useUpsertDiscussionPostGrade,
} from '@/lib/api/queries/discussions.ts';
import { formatRelative, initialsOf } from '@/lib/format.ts';
import type { DiscussionPost, DiscussionPostGrade } from '@openlms/contracts';
import { Save } from 'lucide-react';
import { useMemo, useState } from 'react';

export type InstructorGradingPanelProps = {
  tenantId: string | null;
  courseId: string;
  topicId: string;
  pointsPossible: number;
  posts: DiscussionPost[];
};

type StudentRow = {
  authorId: string;
  primaryPost: DiscussionPost;
  postCount: number;
};

export function InstructorGradingPanel({
  tenantId,
  courseId,
  topicId,
  pointsPossible,
  posts,
}: InstructorGradingPanelProps) {
  const gradesQuery = useDiscussionGradesQuery(tenantId, courseId, topicId);

  const studentRows = useMemo<StudentRow[]>(() => {
    const byAuthor = new Map<string, DiscussionPost[]>();
    for (const post of posts) {
      if (post.status !== 'published') continue;
      const list = byAuthor.get(post.authorId) ?? [];
      list.push(post);
      byAuthor.set(post.authorId, list);
    }
    const rows: StudentRow[] = [];
    for (const [authorId, authorPosts] of byAuthor) {
      const sorted = [...authorPosts].sort((a, b) => {
        const aTime =
          typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt.getTime();
        const bTime =
          typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt.getTime();
        return aTime - bTime;
      });
      const primaryPost = sorted[0];
      if (!primaryPost) continue;
      rows.push({ authorId, primaryPost, postCount: sorted.length });
    }
    return rows.sort((a, b) => a.authorId.localeCompare(b.authorId));
  }, [posts]);

  const gradesByStudent = useMemo(() => {
    const map = new Map<string, DiscussionPostGrade>();
    for (const grade of gradesQuery.data ?? []) {
      const existing = map.get(grade.studentId);
      if (!existing) {
        map.set(grade.studentId, grade);
        continue;
      }
      const existingTime =
        typeof existing.updatedAt === 'string'
          ? new Date(existing.updatedAt).getTime()
          : existing.updatedAt.getTime();
      const candidateTime =
        typeof grade.updatedAt === 'string'
          ? new Date(grade.updatedAt).getTime()
          : grade.updatedAt.getTime();
      if (candidateTime > existingTime) map.set(grade.studentId, grade);
    }
    return map;
  }, [gradesQuery.data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade participation</CardTitle>
        <CardDescription>
          Visible only to instructors. Each row grades a student's earliest published post; later
          replies count toward visibility but not the score.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {gradesQuery.isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : gradesQuery.error ? (
          <ErrorState error={gradesQuery.error} onRetry={() => gradesQuery.refetch()} />
        ) : studentRows.length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">
            No student posts yet. Once students reply, you can grade them here.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {studentRows.map((row) => (
              <li key={row.authorId}>
                <StudentGradeRow
                  tenantId={tenantId}
                  courseId={courseId}
                  topicId={topicId}
                  row={row}
                  pointsPossible={pointsPossible}
                  existingGrade={gradesByStudent.get(row.authorId) ?? null}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

type StudentGradeRowProps = {
  tenantId: string | null;
  courseId: string;
  topicId: string;
  row: StudentRow;
  pointsPossible: number;
  existingGrade: DiscussionPostGrade | null;
};

function StudentGradeRow({
  tenantId,
  courseId,
  topicId,
  row,
  pointsPossible,
  existingGrade,
}: StudentGradeRowProps) {
  const { publish } = useToast();
  const upsert = useUpsertDiscussionPostGrade(tenantId, courseId, topicId);
  const [score, setScore] = useState<string>(existingGrade ? String(existingGrade.score) : '');
  const [comment, setComment] = useState<string>(existingGrade?.comment ?? '');
  const [scoreError, setScoreError] = useState<string | null>(null);

  const handleSave = async () => {
    setScoreError(null);
    const parsed = Number(score);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > pointsPossible) {
      setScoreError(`Score must be between 0 and ${pointsPossible}.`);
      return;
    }
    try {
      await upsert.mutateAsync({
        postId: row.primaryPost.id,
        score: parsed,
        maxScore: pointsPossible,
        status: 'published',
        comment: comment.trim() === '' ? null : comment.trim(),
      });
      publish({ tone: 'success', title: 'Grade saved' });
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not save the grade.';
      publish({ tone: 'danger', title: 'Save failed', description: message });
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-base) p-4">
      <div className="flex items-start gap-3">
        <Avatar size="sm">
          <AvatarFallback>{initialsOf(row.authorId.slice(-2))}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-(--color-text-default)">
              {row.authorId.slice(-12)}
            </span>
            {existingGrade ? (
              <Badge
                tone={
                  existingGrade.status === 'published'
                    ? 'success'
                    : existingGrade.status === 'revised'
                      ? 'warning'
                      : 'neutral'
                }
              >
                {existingGrade.status}
              </Badge>
            ) : (
              <Badge tone="outline">Ungraded</Badge>
            )}
            {row.postCount > 1 ? (
              <span className="text-xs text-(--color-text-muted)">
                +{row.postCount - 1} more {row.postCount === 2 ? 'reply' : 'replies'}
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-(--color-text-default)">
            {row.primaryPost.body}
          </p>
          <p className="mt-1 text-xs text-(--color-text-subtle)">
            Posted {formatRelative(row.primaryPost.createdAt)}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
        <FormField id={`score-${row.authorId}`} label="Score" error={scoreError ?? undefined}>
          <Input
            id={`score-${row.authorId}`}
            type="number"
            min={0}
            max={pointsPossible}
            step="any"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            invalid={Boolean(scoreError)}
            placeholder={`/ ${pointsPossible}`}
          />
        </FormField>
        <FormField id={`comment-${row.authorId}`} label="Comment">
          <Textarea
            id={`comment-${row.authorId}`}
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional feedback…"
          />
        </FormField>
        <div className="flex items-end">
          <Button onClick={handleSave} loading={upsert.isPending} disabled={score.trim() === ''}>
            <Save className="size-4" aria-hidden /> Save
          </Button>
        </div>
      </div>
    </div>
  );
}
