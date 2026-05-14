import type { AiJob, AiJobOutput, AiJobQueue } from './jobs.ts';

export type AiJobExecutor = (job: AiJob) => Promise<AiJobOutput>;

export type AiJobExecutors = Record<string, AiJobExecutor>;

export type ProcessAiJobResult =
  | { status: 'idle'; job: null }
  | { status: 'succeeded'; job: AiJob }
  | { status: 'retried'; job: AiJob }
  | { status: 'failed'; job: AiJob };

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'AI job failed with an unknown error.';

export const processNextAiJob = async (
  queue: AiJobQueue,
  executors: AiJobExecutors,
): Promise<ProcessAiJobResult> => {
  const claimedJob = queue.claimNext();
  if (!claimedJob) {
    return { status: 'idle', job: null };
  }

  const executor = executors[claimedJob.actionIdentifier];
  if (!executor) {
    const failedJob = queue.fail(
      claimedJob.id,
      `No executor is registered for AI action "${claimedJob.actionIdentifier}".`,
    );
    return { status: failedJob.status === 'queued' ? 'retried' : 'failed', job: failedJob };
  }

  try {
    const completedJob = queue.complete(claimedJob.id, await executor(claimedJob));
    return { status: 'succeeded', job: completedJob };
  } catch (error) {
    const failedJob = queue.fail(claimedJob.id, getErrorMessage(error));
    return { status: failedJob.status === 'queued' ? 'retried' : 'failed', job: failedJob };
  }
};
