import {
  TenantId,
  UserId,
  XapiStatement,
  type XapiStatement as XapiStatementContract,
  XapiStatementId,
} from '@openlms/contracts';
import { and, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { xapiStatement } from '../db/schema/xapi.ts';

export type SaveXapiStatementInput = {
  tenantId: string;
  statementId: string;
  receivedById: string;
  actor: Record<string, unknown>;
  verb: Record<string, unknown>;
  object: Record<string, unknown>;
  result: Record<string, unknown> | null;
  context: Record<string, unknown> | null;
  timestamp: Date | null;
};

export const saveXapiStatement = async (
  db: Database,
  input: SaveXapiStatementInput,
  now = new Date(),
): Promise<XapiStatementContract> => {
  const candidate = XapiStatement.parse({
    id: XapiStatementId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    statementId: input.statementId,
    receivedById: UserId.parse(input.receivedById),
    actor: input.actor,
    verb: input.verb,
    object: input.object,
    result: input.result,
    context: input.context,
    timestamp: input.timestamp,
    storedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  const [inserted] = await db
    .insert(xapiStatement)
    .values(candidate)
    .onConflictDoNothing({
      target: [xapiStatement.tenantId, xapiStatement.statementId],
    })
    .returning();

  if (inserted) {
    return XapiStatement.parse(inserted);
  }

  const [existing] = await db
    .select()
    .from(xapiStatement)
    .where(
      and(
        eq(xapiStatement.tenantId, input.tenantId),
        eq(xapiStatement.statementId, input.statementId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new Error('xAPI statement could not be saved because the database returned no row.');
  }

  return XapiStatement.parse(existing);
};
