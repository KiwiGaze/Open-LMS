import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  listPeerReviewResponsesForReview,
  upsertPeerReviewResponse,
} from '../src/peer-reviews/repository.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE90';
const peerReviewId = '01J9QW7B6N5W2YH3D3A1V0KE91';
const responseId = '01J9QW7B6N5W2YH3D3A1V0KE92';
const now = new Date('2026-05-12T10:00:00Z');

const responseRow = {
  id: responseId,
  tenantId,
  peerReviewId,
  criterionId: 'evidence',
  score: 4,
  comment: 'Strong use of textual evidence.',
  status: 'submitted' as const,
  submittedAt: now,
  createdAt: now,
  updatedAt: now,
};

const createUpsertReturningDb = <T>(stored: T): Database =>
  ({
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => ({
          returning: async () => [stored],
        }),
      }),
    }),
  }) as unknown as Database;

const createSelectOrderByDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

describe('peer review response repository', () => {
  it('upserts a peer review response', async () => {
    const db = createUpsertReturningDb(responseRow);
    const result = await upsertPeerReviewResponse(db, {
      tenantId,
      peerReviewId,
      criterionId: 'evidence',
      score: 4,
      comment: 'Strong use of textual evidence.',
      status: 'submitted',
      submittedAt: now,
    });
    expect(result.status).toBe('submitted');
    expect(result.score).toBe(4);
  });

  it('rejects submitted status without submittedAt', async () => {
    const db = createUpsertReturningDb({ ...responseRow, submittedAt: null });
    await expect(
      upsertPeerReviewResponse(db, {
        tenantId,
        peerReviewId,
        criterionId: 'evidence',
        score: 4,
        comment: null,
        status: 'submitted',
        submittedAt: null,
      }),
    ).rejects.toThrow();
  });

  it('lists responses for a review', async () => {
    const db = createSelectOrderByDb([responseRow]);
    const result = await listPeerReviewResponsesForReview(db, { tenantId, peerReviewId });
    expect(result).toHaveLength(1);
  });
});
