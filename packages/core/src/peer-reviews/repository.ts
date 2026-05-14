import {
  AssignmentPeerReviewId,
  AssignmentPeerReviewResponse,
  type AssignmentPeerReviewResponse as AssignmentPeerReviewResponseContract,
  AssignmentPeerReviewResponseId,
  type AssignmentPeerReviewResponseStatus,
  TenantId,
} from '@openlms/contracts';
import { and, asc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { assignmentPeerReview, assignmentPeerReviewResponse } from '../db/schema/submission.ts';

export type UpsertPeerReviewResponseInput = {
  tenantId: string;
  peerReviewId: string;
  criterionId: string;
  score: number | null;
  comment: string | null;
  status: AssignmentPeerReviewResponseStatus;
  submittedAt: Date | null;
};

export const upsertPeerReviewResponse = async (
  db: Database,
  input: UpsertPeerReviewResponseInput,
  now = new Date(),
): Promise<AssignmentPeerReviewResponseContract> => {
  const parsed = AssignmentPeerReviewResponse.parse({
    id: AssignmentPeerReviewResponseId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    peerReviewId: AssignmentPeerReviewId.parse(input.peerReviewId),
    criterionId: input.criterionId,
    score: input.score,
    comment: input.comment,
    status: input.status,
    submittedAt: input.submittedAt,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db
    .insert(assignmentPeerReviewResponse)
    .values(parsed)
    .onConflictDoUpdate({
      target: [
        assignmentPeerReviewResponse.tenantId,
        assignmentPeerReviewResponse.peerReviewId,
        assignmentPeerReviewResponse.criterionId,
      ],
      set: {
        score: input.score,
        comment: input.comment,
        status: input.status,
        submittedAt: input.submittedAt,
        updatedAt: now,
      },
    })
    .returning();
  if (!row) {
    throw new Error(
      'Peer review response could not be upserted because the database returned no row.',
    );
  }
  return AssignmentPeerReviewResponse.parse(row);
};

export type ListPeerReviewResponsesForReviewInput = {
  tenantId: string;
  peerReviewId: string;
};

export const listPeerReviewResponsesForReview = async (
  db: Database,
  input: ListPeerReviewResponsesForReviewInput,
): Promise<AssignmentPeerReviewResponseContract[]> => {
  const rows = await db
    .select()
    .from(assignmentPeerReviewResponse)
    .where(
      and(
        eq(assignmentPeerReviewResponse.tenantId, input.tenantId),
        eq(assignmentPeerReviewResponse.peerReviewId, input.peerReviewId),
      ),
    )
    .orderBy(asc(assignmentPeerReviewResponse.criterionId));
  return rows.map((row) => AssignmentPeerReviewResponse.parse(row));
};

export type ListPeerReviewResponsesForReviewerInput = {
  tenantId: string;
  assignmentId: string;
  reviewerId: string;
};

export const listPeerReviewResponsesForReviewer = async (
  db: Database,
  input: ListPeerReviewResponsesForReviewerInput,
): Promise<AssignmentPeerReviewResponseContract[]> => {
  const rows = await db
    .select({
      id: assignmentPeerReviewResponse.id,
      tenantId: assignmentPeerReviewResponse.tenantId,
      peerReviewId: assignmentPeerReviewResponse.peerReviewId,
      criterionId: assignmentPeerReviewResponse.criterionId,
      score: assignmentPeerReviewResponse.score,
      comment: assignmentPeerReviewResponse.comment,
      status: assignmentPeerReviewResponse.status,
      submittedAt: assignmentPeerReviewResponse.submittedAt,
      createdAt: assignmentPeerReviewResponse.createdAt,
      updatedAt: assignmentPeerReviewResponse.updatedAt,
    })
    .from(assignmentPeerReviewResponse)
    .innerJoin(
      assignmentPeerReview,
      and(
        eq(assignmentPeerReview.tenantId, assignmentPeerReviewResponse.tenantId),
        eq(assignmentPeerReview.id, assignmentPeerReviewResponse.peerReviewId),
      ),
    )
    .where(
      and(
        eq(assignmentPeerReviewResponse.tenantId, input.tenantId),
        eq(assignmentPeerReview.assignmentId, input.assignmentId),
        eq(assignmentPeerReview.reviewerId, input.reviewerId),
      ),
    )
    .orderBy(asc(assignmentPeerReviewResponse.criterionId));
  return rows.map((row) => AssignmentPeerReviewResponse.parse(row));
};
