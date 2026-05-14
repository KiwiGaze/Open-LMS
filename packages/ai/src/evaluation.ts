import type { HumanReview } from '@openlms/contracts';

export type FeedbackDraftEvaluationSummary = {
  totalReviews: number;
  accepted: number;
  edited: number;
  rejected: number;
  regenerationRequested: number;
  acceptanceRate: number;
  lightEditOrAcceptRate: number;
  rejectionRate: number;
};

const rate = (count: number, total: number): number => (total === 0 ? 0 : count / total);

export const summarizeFeedbackDraftEvaluations = (
  reviews: HumanReview[],
): FeedbackDraftEvaluationSummary => {
  const accepted = reviews.filter((review) => review.decision === 'accept').length;
  const edited = reviews.filter((review) => review.decision === 'edit').length;
  const rejected = reviews.filter((review) => review.decision === 'reject').length;
  const regenerationRequested = reviews.filter(
    (review) => review.decision === 'request_regeneration',
  ).length;
  const totalReviews = reviews.length;

  return {
    totalReviews,
    accepted,
    edited,
    rejected,
    regenerationRequested,
    acceptanceRate: rate(accepted, totalReviews),
    lightEditOrAcceptRate: rate(accepted + edited, totalReviews),
    rejectionRate: rate(rejected, totalReviews),
  };
};
