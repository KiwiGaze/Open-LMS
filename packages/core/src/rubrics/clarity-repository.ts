import {
  StoredRubricClarityReview,
  type StoredRubricClarityReview as StoredRubricClarityReviewContract,
} from '@openlms/contracts';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { rubricClarityReview } from '../db/schema/rubric-clarity.ts';

export const saveRubricClarityReview = async (
  db: Database,
  value: StoredRubricClarityReviewContract,
): Promise<StoredRubricClarityReviewContract> => {
  const parsed = StoredRubricClarityReview.parse(value);
  const [row] = await db
    .insert(rubricClarityReview)
    .values(parsed)
    .onConflictDoNothing({
      target: [
        rubricClarityReview.tenantId,
        rubricClarityReview.rubricId,
        rubricClarityReview.idempotencyKey,
      ],
    })
    .returning();

  if (row) {
    return StoredRubricClarityReview.parse(row);
  }

  const existing = await getRubricClarityReviewByIdempotencyKey(
    db,
    parsed.tenantId,
    parsed.rubricId,
    parsed.idempotencyKey,
  );

  if (!existing) {
    throw new Error(
      'Rubric clarity review could not be saved because the idempotency conflict could not be resolved.',
    );
  }

  return existing;
};

export const getRubricClarityReviewByIdempotencyKey = async (
  db: Database,
  tenantId: string,
  rubricId: string,
  idempotencyKey: string,
): Promise<StoredRubricClarityReviewContract | null> => {
  const [row] = await db
    .select()
    .from(rubricClarityReview)
    .where(
      and(
        eq(rubricClarityReview.tenantId, tenantId),
        eq(rubricClarityReview.rubricId, rubricId),
        eq(rubricClarityReview.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  return row ? StoredRubricClarityReview.parse(row) : null;
};
