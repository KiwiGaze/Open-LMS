import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { courseModule, courseSection, courseUnit } from '../db/schema/course.ts';
import { gradebookCategory } from '../db/schema/feedback.ts';

type TxLike = Parameters<Parameters<Database['transaction']>[0]>[0];
type DbOrTx = Database | TxLike;

export type ReorderScope =
  | { kind: 'course_module'; tenantId: string; courseId: string }
  | { kind: 'course_section'; tenantId: string; courseId: string }
  | { kind: 'course_unit'; tenantId: string; courseId: string; moduleId: string }
  | { kind: 'gradebook_category'; tenantId: string; courseId: string };

export type ReorderResult = {
  reordered: number;
};

const STAGING_OFFSET = -1_000_000;

const updatePosition = async (
  db: DbOrTx,
  scope: ReorderScope,
  id: string,
  position: number,
  now: Date,
): Promise<boolean> => {
  switch (scope.kind) {
    case 'course_module': {
      const rows = await db
        .update(courseModule)
        .set({ position, updatedAt: now })
        .where(
          and(
            eq(courseModule.tenantId, scope.tenantId),
            eq(courseModule.courseId, scope.courseId),
            eq(courseModule.id, id),
          ),
        )
        .returning({ id: courseModule.id });
      return rows.length > 0;
    }
    case 'course_section': {
      const rows = await db
        .update(courseSection)
        .set({ position, updatedAt: now })
        .where(
          and(
            eq(courseSection.tenantId, scope.tenantId),
            eq(courseSection.courseId, scope.courseId),
            eq(courseSection.id, id),
          ),
        )
        .returning({ id: courseSection.id });
      return rows.length > 0;
    }
    case 'course_unit': {
      const rows = await db
        .update(courseUnit)
        .set({ position, updatedAt: now })
        .where(
          and(
            eq(courseUnit.tenantId, scope.tenantId),
            eq(courseUnit.courseId, scope.courseId),
            eq(courseUnit.moduleId, scope.moduleId),
            eq(courseUnit.id, id),
          ),
        )
        .returning({ id: courseUnit.id });
      return rows.length > 0;
    }
    case 'gradebook_category': {
      const rows = await db
        .update(gradebookCategory)
        .set({ position, updatedAt: now })
        .where(
          and(
            eq(gradebookCategory.tenantId, scope.tenantId),
            eq(gradebookCategory.courseId, scope.courseId),
            eq(gradebookCategory.id, id),
          ),
        )
        .returning({ id: gradebookCategory.id });
      return rows.length > 0;
    }
  }
};

const listIdsInScope = async (db: Database, scope: ReorderScope): Promise<string[]> => {
  switch (scope.kind) {
    case 'course_module': {
      const rows = await db
        .select({ id: courseModule.id })
        .from(courseModule)
        .where(
          and(eq(courseModule.tenantId, scope.tenantId), eq(courseModule.courseId, scope.courseId)),
        );
      return rows.map((row) => row.id);
    }
    case 'course_section': {
      const rows = await db
        .select({ id: courseSection.id })
        .from(courseSection)
        .where(
          and(
            eq(courseSection.tenantId, scope.tenantId),
            eq(courseSection.courseId, scope.courseId),
          ),
        );
      return rows.map((row) => row.id);
    }
    case 'course_unit': {
      const rows = await db
        .select({ id: courseUnit.id })
        .from(courseUnit)
        .where(
          and(
            eq(courseUnit.tenantId, scope.tenantId),
            eq(courseUnit.courseId, scope.courseId),
            eq(courseUnit.moduleId, scope.moduleId),
          ),
        );
      return rows.map((row) => row.id);
    }
    case 'gradebook_category': {
      const rows = await db
        .select({ id: gradebookCategory.id })
        .from(gradebookCategory)
        .where(
          and(
            eq(gradebookCategory.tenantId, scope.tenantId),
            eq(gradebookCategory.courseId, scope.courseId),
          ),
        );
      return rows.map((row) => row.id);
    }
  }
};

// Reorders the given ordered IDs to positions 0..N-1 within the scope.
// Uses a two-pass update (negative staging, then final positions) so that
// scopes with unique-position constraints don't hit transient collisions.
// Unknown IDs are rejected; missing items in the scope are not touched.
export const reorderInScope = async (
  db: Database,
  scope: ReorderScope,
  orderedIds: readonly string[],
  now = new Date(),
): Promise<ReorderResult> => {
  if (orderedIds.length === 0) {
    return { reordered: 0 };
  }

  const seen = new Set<string>();
  for (const id of orderedIds) {
    if (seen.has(id)) {
      throw new Error(`Duplicate id in orderedIds: ${id}`);
    }
    seen.add(id);
  }

  const existingIds = new Set(await listIdsInScope(db, scope));
  for (const id of orderedIds) {
    if (!existingIds.has(id)) {
      throw new Error(`Id not found in scope: ${id}`);
    }
  }

  return db.transaction(async (tx) => {
    for (const [i, id] of orderedIds.entries()) {
      await updatePosition(tx, scope, id, STAGING_OFFSET - i, now);
    }
    for (const [i, id] of orderedIds.entries()) {
      await updatePosition(tx, scope, id, i, now);
    }
    return { reordered: orderedIds.length };
  });
};
