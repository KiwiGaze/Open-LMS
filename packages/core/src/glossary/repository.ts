import {
  CourseId,
  GlossaryEntry,
  type GlossaryEntry as GlossaryEntryContract,
  GlossaryEntryId,
  type GlossaryEntryStatus,
  TenantId,
} from '@openlms/contracts';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { glossaryEntry } from '../db/schema/glossary.ts';

export type ListGlossaryEntriesForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: GlossaryEntryStatus[];
};

export const listGlossaryEntriesForCourse = async (
  db: Database,
  input: ListGlossaryEntriesForCourseInput,
): Promise<GlossaryEntryContract[]> => {
  const rows = await db
    .select()
    .from(glossaryEntry)
    .where(
      and(
        eq(glossaryEntry.tenantId, input.tenantId),
        eq(glossaryEntry.courseId, input.courseId),
        inArray(glossaryEntry.status, input.statuses),
      ),
    )
    .orderBy(asc(glossaryEntry.term), asc(glossaryEntry.id));

  return rows.map((row) => GlossaryEntry.parse(row));
};

export type CreateGlossaryEntryInput = {
  tenantId: string;
  courseId: string;
  term: string;
  definition: string;
  status: GlossaryEntryStatus;
};

export const createGlossaryEntry = async (
  db: Database,
  input: CreateGlossaryEntryInput,
  now = new Date(),
): Promise<GlossaryEntryContract> => {
  const parsed = GlossaryEntry.parse({
    id: GlossaryEntryId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    term: input.term,
    definition: input.definition,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.insert(glossaryEntry).values(parsed).returning();

  if (!row) {
    throw new Error('Glossary entry could not be created because the database returned no row.');
  }

  return GlossaryEntry.parse(row);
};

export const getGlossaryEntryForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  glossaryEntryId: string,
): Promise<GlossaryEntryContract | null> => {
  const [row] = await db
    .select()
    .from(glossaryEntry)
    .where(
      and(
        eq(glossaryEntry.tenantId, tenantId),
        eq(glossaryEntry.courseId, courseId),
        eq(glossaryEntry.id, glossaryEntryId),
      ),
    )
    .limit(1);

  return row ? GlossaryEntry.parse(row) : null;
};

export type UpdateGlossaryEntryInput = {
  tenantId: string;
  courseId: string;
  glossaryEntryId: string;
  term: string;
  definition: string;
  status: GlossaryEntryStatus;
};

export const updateGlossaryEntry = async (
  db: Database,
  input: UpdateGlossaryEntryInput,
  now = new Date(),
): Promise<GlossaryEntryContract | null> => {
  const [row] = await db
    .update(glossaryEntry)
    .set({
      term: input.term,
      definition: input.definition,
      status: input.status,
      updatedAt: now,
    })
    .where(
      and(
        eq(glossaryEntry.tenantId, input.tenantId),
        eq(glossaryEntry.courseId, input.courseId),
        eq(glossaryEntry.id, input.glossaryEntryId),
      ),
    )
    .returning();

  return row ? GlossaryEntry.parse(row) : null;
};

export type DeleteGlossaryEntryInput = {
  tenantId: string;
  courseId: string;
  glossaryEntryId: string;
};

export const deleteGlossaryEntry = async (
  db: Database,
  input: DeleteGlossaryEntryInput,
): Promise<boolean> => {
  const result = await db
    .delete(glossaryEntry)
    .where(
      and(
        eq(glossaryEntry.tenantId, input.tenantId),
        eq(glossaryEntry.courseId, input.courseId),
        eq(glossaryEntry.id, input.glossaryEntryId),
      ),
    )
    .returning({ id: glossaryEntry.id });

  return result.length > 0;
};
