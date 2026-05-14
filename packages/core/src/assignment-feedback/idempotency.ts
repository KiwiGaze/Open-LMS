import type {
  AiFeedbackDraft,
  FeedbackDraftResult,
  HumanReview,
  PublishedFeedback,
  Submission,
} from '@openlms/contracts';
import type { AiGenerationMetadata } from '../ai-logs/generation-result.ts';
import { publishFeedbackFromReview, recordAiFeedbackDraft } from './workflow.ts';

const idempotencyLocks = new Map<string, Promise<void>>();

export const runWithIdempotencyKeyLock = async <Result>(
  lockKey: string,
  run: () => Promise<Result>,
): Promise<Result> => {
  const previous = idempotencyLocks.get(lockKey) ?? Promise.resolve();
  let releaseCurrent: () => void = () => undefined;
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });
  const chained = previous.then(() => current);
  idempotencyLocks.set(lockKey, chained);

  await previous;

  try {
    return await run();
  } finally {
    releaseCurrent();
    if (idempotencyLocks.get(lockKey) === chained) {
      idempotencyLocks.delete(lockKey);
    }
  }
};

export type CompleteAiFeedbackDraftOnceInput = {
  submission: Submission;
  contextPackageId: string;
  generationMetadata: AiGenerationMetadata;
  idempotencyKey: string;
  output: FeedbackDraftResult;
  now: Date;
  findExisting: (idempotencyKey: string) => Promise<AiFeedbackDraft | null>;
  save: (feedbackDraft: AiFeedbackDraft) => Promise<AiFeedbackDraft>;
};

export type CompleteAiFeedbackDraftOnceResult = {
  feedbackDraft: AiFeedbackDraft;
  created: boolean;
};

export const completeAiFeedbackDraftOnce = async (
  input: CompleteAiFeedbackDraftOnceInput,
): Promise<CompleteAiFeedbackDraftOnceResult> => {
  const existing = await input.findExisting(input.idempotencyKey);

  if (existing) {
    return {
      feedbackDraft: existing,
      created: false,
    };
  }

  const feedbackDraft = await input.save(
    recordAiFeedbackDraft({
      submission: input.submission,
      contextPackageId: input.contextPackageId,
      generationMetadata: input.generationMetadata,
      idempotencyKey: input.idempotencyKey,
      output: input.output,
      now: input.now,
    }),
  );

  return {
    feedbackDraft,
    created: true,
  };
};

export type PublishReviewedFeedbackOnceInput = {
  feedbackDraft: AiFeedbackDraft;
  review: HumanReview;
  previousPublishedFeedback: PublishedFeedback[];
  now: Date;
  findExistingByReviewId: (humanReviewId: string) => Promise<PublishedFeedback | null>;
  save: (publishedFeedback: PublishedFeedback) => Promise<PublishedFeedback>;
};

export type PublishReviewedFeedbackOnceResult = {
  publishedFeedback: PublishedFeedback;
  created: boolean;
};

export const publishReviewedFeedbackOnce = async (
  input: PublishReviewedFeedbackOnceInput,
): Promise<PublishReviewedFeedbackOnceResult> => {
  const existing = await input.findExistingByReviewId(input.review.id);

  if (existing) {
    return {
      publishedFeedback: existing,
      created: false,
    };
  }

  const publishedFeedback = await input.save(
    publishFeedbackFromReview({
      feedbackDraft: input.feedbackDraft,
      review: input.review,
      previousPublishedFeedback: input.previousPublishedFeedback,
      now: input.now,
    }),
  );

  return {
    publishedFeedback,
    created: true,
  };
};
