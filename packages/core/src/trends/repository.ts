import {
  StoredAssignmentTrendCard,
  type StoredAssignmentTrendCard as StoredAssignmentTrendCardContract,
} from '@openlms/contracts';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { assignmentTrendCard } from '../db/schema/trend.ts';

export const saveAssignmentTrendCard = async (
  db: Database,
  value: StoredAssignmentTrendCardContract,
): Promise<StoredAssignmentTrendCardContract> => {
  const parsed = StoredAssignmentTrendCard.parse(value);
  const [row] = await db
    .insert(assignmentTrendCard)
    .values(parsed)
    .onConflictDoNothing({
      target: [
        assignmentTrendCard.tenantId,
        assignmentTrendCard.assignmentId,
        assignmentTrendCard.idempotencyKey,
      ],
    })
    .returning();

  if (row) {
    return StoredAssignmentTrendCard.parse(row);
  }

  const existing = await getAssignmentTrendCardByIdempotencyKey(
    db,
    parsed.tenantId,
    parsed.assignmentId,
    parsed.idempotencyKey,
  );

  if (!existing) {
    throw new Error(
      'Assignment trend card could not be saved because the idempotency conflict could not be resolved.',
    );
  }

  return existing;
};

export const getAssignmentTrendCardByIdempotencyKey = async (
  db: Database,
  tenantId: string,
  assignmentId: string,
  idempotencyKey: string,
): Promise<StoredAssignmentTrendCardContract | null> => {
  const [row] = await db
    .select()
    .from(assignmentTrendCard)
    .where(
      and(
        eq(assignmentTrendCard.tenantId, tenantId),
        eq(assignmentTrendCard.assignmentId, assignmentId),
        eq(assignmentTrendCard.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  return row ? StoredAssignmentTrendCard.parse(row) : null;
};
