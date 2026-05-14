'use client';

import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { Progress } from '@/components/ui/progress.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useSaveQuizAnswer, useSubmitQuizAttempt } from '@/lib/api/queries/quizzes.ts';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/format.ts';
import type {
  Quiz,
  QuizAttempt,
  QuizAttemptResponse,
  QuizAttemptResponseAnswer,
  QuizEffectiveSettings,
  QuizQuestion,
} from '@openlms/contracts';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Send,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { QuestionView } from './question-views.tsx';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const AUTOSAVE_DEBOUNCE_MS = 600;
const TIMER_WARNING_SECONDS = 5 * 60;

export type QuizRunnerProps = {
  tenantId: string;
  courseId: string;
  quizId: string;
  quiz: Quiz;
  attempt: QuizAttempt;
  questions: QuizQuestion[];
  initialResponses: QuizAttemptResponse[];
  settings: QuizEffectiveSettings | null;
};

export function QuizRunner({
  tenantId,
  courseId,
  quizId,
  quiz,
  attempt,
  questions,
  initialResponses,
  settings,
}: QuizRunnerProps) {
  const { publish } = useToast();
  const saveMutation = useSaveQuizAnswer(tenantId, courseId, quizId, attempt.id);
  const submitMutation = useSubmitQuizAttempt(tenantId, courseId, quizId);

  const [answers, setAnswers] = useState<Map<string, QuizAttemptResponseAnswer>>(() => {
    const map = new Map<string, QuizAttemptResponseAnswer>();
    for (const response of initialResponses) {
      map.set(response.questionId, response.answer);
    }
    return map;
  });
  const [statuses, setStatuses] = useState<Map<string, SaveStatus>>(() => new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [warned, setWarned] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{
    questionId: string;
    answer: QuizAttemptResponseAnswer;
  } | null>(null);
  const submittingRef = useRef(false);

  const currentQuestion = questions[currentIndex];
  const totalPoints = useMemo(() => questions.reduce((sum, q) => sum + q.points, 0), [questions]);

  const expiresAt = useMemo(() => {
    const minutes = settings?.timeLimitMinutes;
    if (!minutes) return null;
    const startedAt =
      typeof attempt.startedAt === 'string'
        ? new Date(attempt.startedAt as unknown as string)
        : attempt.startedAt;
    return new Date(startedAt.getTime() + minutes * 60 * 1000);
  }, [attempt.startedAt, settings?.timeLimitMinutes]);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(() => {
    if (!expiresAt) return null;
    return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  });

  const setStatus = (questionId: string, status: SaveStatus) => {
    setStatuses((prev) => {
      const next = new Map(prev);
      next.set(questionId, status);
      return next;
    });
  };

  const flushPendingSave = async (): Promise<void> => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const pending = pendingSaveRef.current;
    if (!pending) return;
    pendingSaveRef.current = null;
    try {
      await saveMutation.mutateAsync(pending);
      setStatus(pending.questionId, 'saved');
    } catch {
      setStatus(pending.questionId, 'error');
    }
  };

  const scheduleSave = (questionId: string, answer: QuizAttemptResponseAnswer | undefined) => {
    if (answer === undefined) return;
    pendingSaveRef.current = { questionId, answer };
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setStatus(questionId, 'saving');
    saveTimerRef.current = setTimeout(async () => {
      const pending = pendingSaveRef.current;
      if (!pending) return;
      pendingSaveRef.current = null;
      saveTimerRef.current = null;
      try {
        await saveMutation.mutateAsync(pending);
        setStatus(pending.questionId, 'saved');
      } catch (error) {
        const message =
          error instanceof ApiHttpError ? error.message : 'We could not save your answer.';
        setStatus(pending.questionId, 'error');
        publish({ tone: 'danger', title: 'Autosave failed', description: message });
      }
    }, AUTOSAVE_DEBOUNCE_MS);
  };

  const handleAnswerChange = (
    questionId: string,
    answer: QuizAttemptResponseAnswer | undefined,
  ) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      if (answer === undefined) {
        next.delete(questionId);
      } else {
        next.set(questionId, answer);
      }
      return next;
    });
    scheduleSave(questionId, answer);
  };

  const triggerSubmit = async (mode: 'manual' | 'auto') => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitDialogOpen(false);
    await flushPendingSave();
    try {
      await submitMutation.mutateAsync(attempt.id);
      publish({
        tone: mode === 'auto' ? 'warning' : 'success',
        title: mode === 'auto' ? 'Time is up' : 'Quiz submitted',
        description:
          mode === 'auto' ? 'Your answers have been submitted automatically.' : undefined,
      });
    } catch (error) {
      submittingRef.current = false;
      const message =
        error instanceof ApiHttpError
          ? error.message
          : 'We could not submit your attempt. Try again.';
      publish({ tone: 'danger', title: 'Submission failed', description: message });
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: triggerSubmit identity changes every render; ref guards against re-entry
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0 && !submittingRef.current) {
        void triggerSubmit('auto');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  useEffect(() => {
    if (secondsLeft !== null && secondsLeft <= TIMER_WARNING_SECONDS && !warned) {
      setWarned(true);
      publish({
        tone: 'warning',
        title: '5 minutes left',
        description: 'Wrap up — your attempt will submit automatically when time runs out.',
      });
    }
  }, [secondsLeft, warned, publish]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-(--color-text-muted)">
          This quiz has no questions yet.
        </CardContent>
      </Card>
    );
  }

  const answeredCount = answers.size;
  const progressPct =
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const currentStatus = statuses.get(currentQuestion.id) ?? 'idle';
  const currentAnswer = answers.get(currentQuestion.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <aside className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            {expiresAt ? <TimerWidget secondsLeft={secondsLeft} /> : null}
            <div>
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-(--color-text-muted)">
                <span>Progress</span>
                <span className="tabular-nums">
                  {answeredCount}/{questions.length}
                </span>
              </div>
              <Progress value={progressPct} className="mt-2" />
            </div>
            <p className="text-xs text-(--color-text-muted)">
              {totalPoints} pts total · {quiz.gradingMethod} of {quiz.maxAttempts} attempt
              {quiz.maxAttempts === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>
        <nav
          aria-label="Question navigator"
          className="rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-base)"
        >
          <ul className="flex flex-col">
            {questions.map((q, i) => {
              const status = statuses.get(q.id) ?? 'idle';
              const isAnswered = answers.has(q.id);
              const isCurrent = i === currentIndex;
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      'flex w-full items-center gap-3 border-b border-(--color-border-subtle) px-3 py-2 text-left text-sm last:border-b-0 hover:bg-(--color-surface-elevated)',
                      isCurrent && 'bg-(--color-brand-subtle) text-(--color-brand-700)',
                    )}
                    aria-current={isCurrent ? 'true' : undefined}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums',
                        isAnswered
                          ? 'border-(--color-success-300) bg-(--color-success-100) text-(--color-success-700)'
                          : 'border-(--color-border-default) text-(--color-text-muted)',
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{shortenPrompt(q.prompt)}</span>
                    <span aria-hidden>
                      {status === 'saving' ? <Loader2 className="size-3 animate-spin" /> : null}
                      {status === 'saved' ? (
                        <Check className="size-3 text-(--color-success-700)" />
                      ) : null}
                      {status === 'error' ? (
                        <AlertTriangle className="size-3 text-(--color-danger-700)" />
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                  Question {currentIndex + 1} of {questions.length} · {currentQuestion.points} pt
                  {currentQuestion.points === 1 ? '' : 's'}
                </p>
                <h2 className="mt-1 whitespace-pre-wrap text-base font-medium text-(--color-text-default)">
                  {currentQuestion.prompt}
                </h2>
              </div>
              <SaveIndicator status={currentStatus} />
            </div>
            <QuestionView
              question={currentQuestion}
              answer={currentAnswer}
              onChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
              disabled={submitMutation.isPending}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-2">
          <Button
            intent="secondary"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="size-4" aria-hidden /> Previous
          </Button>
          <div className="flex items-center gap-2">
            {currentIndex < questions.length - 1 ? (
              <Button onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}>
                Next <ChevronRight className="size-4" aria-hidden />
              </Button>
            ) : null}
            <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button intent="primary">
                  <Send className="size-4" aria-hidden /> Submit
                </Button>
              </DialogTrigger>
              <DialogContent width="sm">
                <DialogHeader>
                  <DialogTitle>Submit attempt?</DialogTitle>
                  <DialogDescription>
                    You've answered {answeredCount} of {questions.length} questions. Once you
                    submit, you can't change your answers for this attempt.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button intent="ghost">Keep working</Button>
                  </DialogClose>
                  <Button
                    onClick={() => triggerSubmit('manual')}
                    loading={submitMutation.isPending}
                  >
                    Submit attempt
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    </div>
  );
}

function TimerWidget({ secondsLeft }: { secondsLeft: number | null }) {
  if (secondsLeft === null) return null;
  const warning = secondsLeft <= TIMER_WARNING_SECONDS;
  return (
    <output
      className={cn(
        'flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2',
        warning
          ? 'border-(--color-warning-300) bg-(--color-warning-50) text-(--color-warning-700)'
          : 'border-(--color-border-subtle) text-(--color-text-default)',
      )}
      aria-live="polite"
    >
      <Clock className="size-4" aria-hidden />
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wider">Time left</span>
        <span className="text-lg font-semibold tabular-nums">{formatDuration(secondsLeft)}</span>
      </div>
    </output>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;
  if (status === 'saving') {
    return (
      <Badge tone="neutral" className="flex items-center gap-1">
        <Loader2 className="size-3 animate-spin" aria-hidden /> Saving…
      </Badge>
    );
  }
  if (status === 'saved') {
    return (
      <Badge tone="success" className="flex items-center gap-1">
        <Check className="size-3" aria-hidden /> Saved
      </Badge>
    );
  }
  return (
    <Badge tone="danger" className="flex items-center gap-1">
      <AlertTriangle className="size-3" aria-hidden /> Save failed
    </Badge>
  );
}

function shortenPrompt(prompt: string): string {
  const cleaned = prompt.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= 40) return cleaned;
  return `${cleaned.slice(0, 38)}…`;
}
