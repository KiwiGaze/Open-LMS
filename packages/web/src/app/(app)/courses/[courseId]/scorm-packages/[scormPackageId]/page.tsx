'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useFinishScormAttempt,
  useInitializeScormRuntime,
  useScormPackagesQuery,
} from '@/lib/api/queries/scorm.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime, formatPercent } from '@/lib/format.ts';
import type { ScormAttempt, ScormPackage } from '@openlms/contracts';
import { CheckCircle2, Flag } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useRef, useState } from 'react';

type Params = { courseId: string; scormPackageId: string };

export default function ScormPlayerPage({ params }: { params: Promise<Params> }) {
  const { courseId, scormPackageId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();

  const packages = useScormPackagesQuery(tenantId, courseId);
  const initialize = useInitializeScormRuntime(tenantId, courseId, scormPackageId);
  const finish = useFinishScormAttempt(tenantId, courseId, scormPackageId);

  const [attempt, setAttempt] = useState<ScormAttempt | null>(null);
  const initialisedRef = useRef(false);

  const pkg = packages.data?.find((p) => p.id === scormPackageId);

  // biome-ignore lint/correctness/useExhaustiveDependencies: one-shot init gated by ref; only re-run when tenant or package identity changes
  useEffect(() => {
    if (!tenantId || !pkg || initialisedRef.current) return;
    initialisedRef.current = true;
    initialize.mutate(undefined, {
      onSuccess: (state) => {
        setAttempt(state.attempt);
      },
      onError: (error) => {
        initialisedRef.current = false;
        const message =
          error instanceof ApiHttpError ? error.message : 'Could not start the SCORM runtime.';
        publish({ tone: 'danger', title: 'Launch failed', description: message });
      },
    });
  }, [tenantId, pkg]);

  const handleFinish = () => {
    finish.mutate(undefined, {
      onSuccess: (next) => {
        setAttempt(next);
        publish({
          tone: 'success',
          title: 'Attempt closed',
          description: 'Your progress has been recorded.',
        });
      },
      onError: (error) => {
        const message =
          error instanceof ApiHttpError ? error.message : 'Could not finalise the attempt.';
        publish({ tone: 'danger', title: 'Finish failed', description: message });
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="SCORM"
        title={pkg?.title ?? 'SCORM player'}
        description="In-app player for SCORM 1.2 and 2004 packages. Progress autosaves through the runtime bridge."
        actions={
          <Button asChild intent="ghost">
            <Link href={`/courses/${courseId}/scorm-packages`}>Back to packages</Link>
          </Button>
        }
      />

      {packages.isLoading ? (
        <Skeleton className="h-[60vh] w-full rounded-[var(--radius-lg)]" />
      ) : packages.error ? (
        <ErrorState error={packages.error} onRetry={() => packages.refetch()} />
      ) : !pkg ? (
        <ErrorState
          title="Package not found"
          error={new Error('It may have been removed or moved to another course.')}
        />
      ) : (
        <>
          <StatusBanner pkg={pkg} attempt={attempt} initialising={initialize.isPending} />

          {pkg.launchUrl ? (
            <Card className="overflow-hidden p-0">
              <CardContent className="p-0">
                <iframe
                  title={`${pkg.title} (SCORM player)`}
                  src={pkg.launchUrl}
                  className="h-[70vh] w-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  referrerPolicy="no-referrer"
                />
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={handleFinish} loading={finish.isPending} intent="secondary">
              <Flag className="size-4" aria-hidden /> Finish attempt
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function StatusBanner({
  pkg,
  attempt,
  initialising,
}: {
  pkg: ScormPackage;
  attempt: ScormAttempt | null;
  initialising: boolean;
}) {
  if (initialising) {
    return <Skeleton className="h-16 w-full rounded-[var(--radius-md)]" />;
  }
  if (!attempt) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-(--color-text-muted)">
          Waiting for the runtime to initialise…
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Badge
            tone={
              attempt.completionStatus === 'completed'
                ? 'success'
                : attempt.completionStatus === 'incomplete'
                  ? 'warning'
                  : 'neutral'
            }
          >
            {attempt.completionStatus.replace(/_/g, ' ')}
          </Badge>
          <Badge
            tone={
              attempt.successStatus === 'passed'
                ? 'success'
                : attempt.successStatus === 'failed'
                  ? 'danger'
                  : 'neutral'
            }
          >
            {attempt.successStatus}
          </Badge>
          {attempt.completionStatus === 'completed' ? (
            <span className="flex items-center gap-1 text-xs text-(--color-text-muted)">
              <CheckCircle2 className="size-3" aria-hidden /> Recorded
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-(--color-text-muted)">
          <span>
            Score:{' '}
            <span className="font-medium text-(--color-text-default)">
              {attempt.scoreScaled === null ? '—' : formatPercent(attempt.scoreScaled)}
            </span>
          </span>
          <span>
            Time:{' '}
            <span className="font-medium text-(--color-text-default)">
              {attempt.totalTimeSeconds === null
                ? '—'
                : `${Math.round(attempt.totalTimeSeconds / 60)}m`}
            </span>
          </span>
          {attempt.lastVisitedAt ? (
            <span>Last visited {formatDateTime(attempt.lastVisitedAt)}</span>
          ) : (
            <span>Version: SCORM {pkg.scormVersion}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
