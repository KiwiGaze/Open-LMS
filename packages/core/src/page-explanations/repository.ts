import {
  StoredPageExplanation,
  type StoredPageExplanation as StoredPageExplanationContract,
} from '@openlms/contracts';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { pageExplanation } from '../db/schema/page-explanation.ts';

export const savePageExplanation = async (
  db: Database,
  value: StoredPageExplanationContract,
): Promise<StoredPageExplanationContract> => {
  const parsed = StoredPageExplanation.parse(value);
  const [row] = await db
    .insert(pageExplanation)
    .values(parsed)
    .onConflictDoNothing({
      target: [
        pageExplanation.tenantId,
        pageExplanation.coursePageId,
        pageExplanation.idempotencyKey,
      ],
    })
    .returning();

  if (row) {
    return StoredPageExplanation.parse(row);
  }

  const existing = await getPageExplanationByIdempotencyKey(
    db,
    parsed.tenantId,
    parsed.coursePageId,
    parsed.idempotencyKey,
  );

  if (!existing) {
    throw new Error(
      'Page explanation could not be saved because the idempotency conflict could not be resolved.',
    );
  }

  return existing;
};

export const getPageExplanationByIdempotencyKey = async (
  db: Database,
  tenantId: string,
  coursePageId: string,
  idempotencyKey: string,
): Promise<StoredPageExplanationContract | null> => {
  const [row] = await db
    .select()
    .from(pageExplanation)
    .where(
      and(
        eq(pageExplanation.tenantId, tenantId),
        eq(pageExplanation.coursePageId, coursePageId),
        eq(pageExplanation.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  return row ? StoredPageExplanation.parse(row) : null;
};
