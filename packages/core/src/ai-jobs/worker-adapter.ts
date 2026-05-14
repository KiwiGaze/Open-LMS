import type { AiJobOutput, AiJobRecord } from '@openlms/contracts';

export type PersistentAiJobExecutor = (job: AiJobRecord) => Promise<AiJobOutput>;

export type PersistentAiJobExecutors = Record<string, PersistentAiJobExecutor>;

export type PersistentAiJobPorts = {
  claimNext: () => Promise<AiJobRecord | null>;
  complete: (jobId: string, output: AiJobOutput) => Promise<AiJobRecord>;
  fail: (jobId: string, reason: string) => Promise<AiJobRecord>;
};

export type PersistentAiJobResult =
  | { status: 'idle'; job: null }
  | { status: 'succeeded'; job: AiJobRecord }
  | { status: 'retried'; job: AiJobRecord }
  | { status: 'failed'; job: AiJobRecord };

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'AI job failed with an unknown error.';

export const processNextPersistentAiJob = async (
  ports: PersistentAiJobPorts,
  executors: PersistentAiJobExecutors,
): Promise<PersistentAiJobResult> => {
  const claimedJob = await ports.claimNext();
  if (!claimedJob) {
    return { status: 'idle', job: null };
  }

  const executor = executors[claimedJob.actionIdentifier];
  if (!executor) {
    const failedJob = await ports.fail(
      claimedJob.id,
      `No executor is registered for AI action "${claimedJob.actionIdentifier}".`,
    );
    return { status: failedJob.status === 'queued' ? 'retried' : 'failed', job: failedJob };
  }

  try {
    return {
      status: 'succeeded',
      job: await ports.complete(claimedJob.id, await executor(claimedJob)),
    };
  } catch (error) {
    const failedJob = await ports.fail(claimedJob.id, getErrorMessage(error));
    return { status: failedJob.status === 'queued' ? 'retried' : 'failed', job: failedJob };
  }
};
