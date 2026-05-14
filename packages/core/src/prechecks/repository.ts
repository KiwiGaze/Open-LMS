import {
  StoredSubmissionPrecheck,
  type StoredSubmissionPrecheck as StoredSubmissionPrecheckContract,
} from '@openlms/contracts';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { submissionPrecheck } from '../db/schema/precheck.ts';

export const saveSubmissionPrecheck = async (
  db: Database,
  value: StoredSubmissionPrecheckContract,
): Promise<StoredSubmissionPrecheckContract> => {
  const parsed = StoredSubmissionPrecheck.parse(value);
  const [row] = await db
    .insert(submissionPrecheck)
    .values(parsed)
    .onConflictDoNothing({
      target: [
        submissionPrecheck.tenantId,
        submissionPrecheck.submissionId,
        submissionPrecheck.idempotencyKey,
      ],
    })
    .returning();

  if (row) {
    return StoredSubmissionPrecheck.parse(row);
  }

  const existing = await getSubmissionPrecheckByIdempotencyKey(
    db,
    parsed.tenantId,
    parsed.submissionId,
    parsed.idempotencyKey,
  );

  if (!existing) {
    throw new Error(
      'Submission precheck could not be saved because the idempotency conflict could not be resolved.',
    );
  }

  return existing;
};

export const getSubmissionPrecheckByIdempotencyKey = async (
  db: Database,
  tenantId: string,
  submissionId: string,
  idempotencyKey: string,
): Promise<StoredSubmissionPrecheckContract | null> => {
  const [row] = await db
    .select()
    .from(submissionPrecheck)
    .where(
      and(
        eq(submissionPrecheck.tenantId, tenantId),
        eq(submissionPrecheck.submissionId, submissionId),
        eq(submissionPrecheck.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  return row ? StoredSubmissionPrecheck.parse(row) : null;
};
