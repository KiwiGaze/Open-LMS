import {
  CourseId,
  LearningObjectiveId,
  TenantId,
  UserId,
  WikiPage,
  type WikiPage as WikiPageContract,
  WikiPageId,
  WikiPageRevision,
  type WikiPageRevision as WikiPageRevisionContract,
  WikiPageRevisionDiff,
  type WikiPageRevisionDiff as WikiPageRevisionDiffContract,
  type WikiPageRevisionDiffLine,
  WikiPageRevisionId,
  type WikiPageStatus,
} from '@openlms/contracts';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { wikiPage, wikiPageRevision } from '../db/schema/wiki.ts';

export type ListWikiPagesForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: WikiPageStatus[];
};

export const listWikiPagesForCourse = async (
  db: Database,
  input: ListWikiPagesForCourseInput,
): Promise<WikiPageContract[]> => {
  const rows = await db
    .select()
    .from(wikiPage)
    .where(
      and(
        eq(wikiPage.tenantId, input.tenantId),
        eq(wikiPage.courseId, input.courseId),
        inArray(wikiPage.status, input.statuses),
      ),
    )
    .orderBy(asc(wikiPage.title), asc(wikiPage.id));

  return rows.map((row) => WikiPage.parse(row));
};

export type CreateWikiPageInput = {
  tenantId: string;
  courseId: string;
  slug: string;
  title: string;
  content: string;
  status: WikiPageStatus;
  learningObjectiveIds?: string[];
  createdById: string;
};

export const createWikiPage = async (
  db: Database,
  input: CreateWikiPageInput,
  now = new Date(),
): Promise<WikiPageContract> => {
  const parsed = WikiPage.parse({
    id: WikiPageId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    slug: input.slug,
    title: input.title,
    content: input.content,
    status: input.status,
    learningObjectiveIds: (input.learningObjectiveIds ?? []).map((id) =>
      LearningObjectiveId.parse(id),
    ),
    createdById: UserId.parse(input.createdById),
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.insert(wikiPage).values(parsed).returning();

  if (!row) {
    throw new Error('Wiki page could not be created because the database returned no row.');
  }

  return WikiPage.parse(row);
};

export const getWikiPageForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  wikiPageId: string,
): Promise<WikiPageContract | null> => {
  const [row] = await db
    .select()
    .from(wikiPage)
    .where(
      and(
        eq(wikiPage.tenantId, tenantId),
        eq(wikiPage.courseId, courseId),
        eq(wikiPage.id, wikiPageId),
      ),
    )
    .limit(1);

  return row ? WikiPage.parse(row) : null;
};

export type ListWikiPageRevisionsForPageInput = {
  tenantId: string;
  wikiPageId: string;
};

export const listWikiPageRevisionsForPage = async (
  db: Database,
  input: ListWikiPageRevisionsForPageInput,
): Promise<WikiPageRevisionContract[]> => {
  const rows = await db
    .select()
    .from(wikiPageRevision)
    .where(
      and(
        eq(wikiPageRevision.tenantId, input.tenantId),
        eq(wikiPageRevision.wikiPageId, input.wikiPageId),
      ),
    )
    .orderBy(desc(wikiPageRevision.revision));

  return rows.map((row) => WikiPageRevision.parse(row));
};

export type GetWikiPageRevisionDiffInput = {
  tenantId: string;
  wikiPageId: string;
  baseRevision: number;
  targetRevision: number;
};

const diffLineContent = (
  baseContent: string,
  targetContent: string,
): WikiPageRevisionDiffLine[] => {
  const baseLines = baseContent.split(/\r?\n/);
  const targetLines = targetContent.split(/\r?\n/);
  const changes: WikiPageRevisionDiffLine[] = [];

  let prefixLength = 0;
  while (prefixLength < baseLines.length && prefixLength < targetLines.length) {
    const baseLine = baseLines[prefixLength];
    const targetLine = targetLines[prefixLength];
    if (baseLine === targetLine) {
      prefixLength += 1;
      continue;
    }
    break;
  }

  let baseSuffixStart = baseLines.length;
  let targetSuffixStart = targetLines.length;
  while (baseSuffixStart > prefixLength && targetSuffixStart > prefixLength) {
    const baseLine = baseLines[baseSuffixStart - 1];
    const targetLine = targetLines[targetSuffixStart - 1];
    if (baseLine === targetLine) {
      baseSuffixStart -= 1;
      targetSuffixStart -= 1;
      continue;
    }
    break;
  }

  for (let index = 0; index < prefixLength; index += 1) {
    const line = baseLines[index];
    if (line === undefined) {
      continue;
    }
    changes.push({
      kind: 'unchanged',
      oldLineNumber: index + 1,
      newLineNumber: index + 1,
      text: line,
    });
  }

  for (let index = prefixLength; index < baseSuffixStart; index += 1) {
    const baseLine = baseLines[index];
    if (baseLine === undefined) {
      continue;
    }
    changes.push({
      kind: 'removed',
      oldLineNumber: index + 1,
      newLineNumber: null,
      text: baseLine,
    });
  }

  for (let index = prefixLength; index < targetSuffixStart; index += 1) {
    const targetLine = targetLines[index];
    if (targetLine === undefined) {
      continue;
    }
    changes.push({
      kind: 'added',
      oldLineNumber: null,
      newLineNumber: index + 1,
      text: targetLine,
    });
  }

  for (
    let baseIndex = baseSuffixStart, targetIndex = targetSuffixStart;
    baseIndex < baseLines.length && targetIndex < targetLines.length;
    baseIndex += 1, targetIndex += 1
  ) {
    const line = baseLines[baseIndex];
    if (line === undefined) {
      continue;
    }
    changes.push({
      kind: 'unchanged',
      oldLineNumber: baseIndex + 1,
      newLineNumber: targetIndex + 1,
      text: line,
    });
  }

  return changes;
};

const diffLearningObjectiveIds = (
  baseIds: string[],
  targetIds: string[],
): { added: string[]; removed: string[] } => {
  const baseIdSet = new Set(baseIds);
  const targetIdSet = new Set(targetIds);

  return {
    added: targetIds.filter((id) => !baseIdSet.has(id)),
    removed: baseIds.filter((id) => !targetIdSet.has(id)),
  };
};

export const getWikiPageRevisionDiff = async (
  db: Database,
  input: GetWikiPageRevisionDiffInput,
): Promise<WikiPageRevisionDiffContract | null> => {
  const rows = await db
    .select()
    .from(wikiPageRevision)
    .where(
      and(
        eq(wikiPageRevision.tenantId, input.tenantId),
        eq(wikiPageRevision.wikiPageId, input.wikiPageId),
        inArray(wikiPageRevision.revision, [input.baseRevision, input.targetRevision]),
      ),
    )
    .orderBy(asc(wikiPageRevision.revision));

  const baseRevision = rows.find((row) => row.revision === input.baseRevision);
  const targetRevision = rows.find((row) => row.revision === input.targetRevision);

  if (!baseRevision || !targetRevision) {
    return null;
  }

  const learningObjectiveIds = diffLearningObjectiveIds(
    baseRevision.learningObjectiveIds,
    targetRevision.learningObjectiveIds,
  );

  return WikiPageRevisionDiff.parse({
    wikiPageId: WikiPageId.parse(input.wikiPageId),
    baseRevision: input.baseRevision,
    targetRevision: input.targetRevision,
    title: {
      changed: baseRevision.title !== targetRevision.title,
      base: baseRevision.title,
      target: targetRevision.title,
    },
    learningObjectiveIds,
    content: diffLineContent(baseRevision.content, targetRevision.content),
  });
};

export type UpdateWikiPageInput = {
  tenantId: string;
  courseId: string;
  wikiPageId: string;
  authorId: string;
  title: string;
  content: string;
  status: WikiPageStatus;
  learningObjectiveIds?: string[];
  summary: string | null;
};

export type UpdateWikiPageResult = {
  page: WikiPageContract;
  revision: WikiPageRevisionContract;
};

export const updateWikiPage = async (
  db: Database,
  input: UpdateWikiPageInput,
  now = new Date(),
): Promise<UpdateWikiPageResult | null> => {
  return db.transaction(async (tx) => {
    const [maxRow] = await tx
      .select({ value: sql<number>`coalesce(max(${wikiPageRevision.revision}), 0)` })
      .from(wikiPageRevision)
      .where(
        and(
          eq(wikiPageRevision.tenantId, input.tenantId),
          eq(wikiPageRevision.wikiPageId, input.wikiPageId),
        ),
      );

    const nextRevision = (maxRow?.value ?? 0) + 1;

    const [updatedRow] = await tx
      .update(wikiPage)
      .set({
        title: input.title,
        content: input.content,
        status: input.status,
        learningObjectiveIds: (input.learningObjectiveIds ?? []).map((id) =>
          LearningObjectiveId.parse(id),
        ),
        updatedAt: now,
      })
      .where(
        and(
          eq(wikiPage.tenantId, input.tenantId),
          eq(wikiPage.courseId, input.courseId),
          eq(wikiPage.id, input.wikiPageId),
        ),
      )
      .returning();

    if (!updatedRow) {
      return null;
    }

    const revisionRow = WikiPageRevision.parse({
      id: WikiPageRevisionId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      wikiPageId: WikiPageId.parse(input.wikiPageId),
      revision: nextRevision,
      authorId: UserId.parse(input.authorId),
      title: input.title,
      content: input.content,
      learningObjectiveIds: (input.learningObjectiveIds ?? []).map((id) =>
        LearningObjectiveId.parse(id),
      ),
      summary: input.summary,
      createdAt: now,
    });

    const [insertedRevision] = await tx.insert(wikiPageRevision).values(revisionRow).returning();

    if (!insertedRevision) {
      throw new Error('Wiki page revision insert returned no row.');
    }

    return {
      page: WikiPage.parse(updatedRow),
      revision: WikiPageRevision.parse(insertedRevision),
    };
  });
};

export type RestoreWikiPageRevisionInput = {
  tenantId: string;
  courseId: string;
  wikiPageId: string;
  revision: number;
  authorId: string;
  summary: string | null;
};

export const restoreWikiPageRevision = async (
  db: Database,
  input: RestoreWikiPageRevisionInput,
  now = new Date(),
): Promise<UpdateWikiPageResult | null> => {
  return db.transaction(async (tx) => {
    const [page] = await tx
      .select()
      .from(wikiPage)
      .where(
        and(
          eq(wikiPage.tenantId, input.tenantId),
          eq(wikiPage.courseId, input.courseId),
          eq(wikiPage.id, input.wikiPageId),
        ),
      )
      .limit(1);

    if (!page) {
      return null;
    }

    const [revision] = await tx
      .select()
      .from(wikiPageRevision)
      .where(
        and(
          eq(wikiPageRevision.tenantId, input.tenantId),
          eq(wikiPageRevision.wikiPageId, input.wikiPageId),
          eq(wikiPageRevision.revision, input.revision),
        ),
      )
      .limit(1);

    if (!revision) {
      return null;
    }

    const [maxRow] = await tx
      .select({ value: sql<number>`coalesce(max(${wikiPageRevision.revision}), 0)` })
      .from(wikiPageRevision)
      .where(
        and(
          eq(wikiPageRevision.tenantId, input.tenantId),
          eq(wikiPageRevision.wikiPageId, input.wikiPageId),
        ),
      );
    const nextRevision = (maxRow?.value ?? 0) + 1;

    const [updatedRow] = await tx
      .update(wikiPage)
      .set({
        title: revision.title,
        content: revision.content,
        learningObjectiveIds: revision.learningObjectiveIds.map((id) =>
          LearningObjectiveId.parse(id),
        ),
        updatedAt: now,
      })
      .where(
        and(
          eq(wikiPage.tenantId, input.tenantId),
          eq(wikiPage.courseId, input.courseId),
          eq(wikiPage.id, input.wikiPageId),
        ),
      )
      .returning();

    if (!updatedRow) {
      return null;
    }

    const revisionRow = WikiPageRevision.parse({
      id: WikiPageRevisionId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      wikiPageId: WikiPageId.parse(input.wikiPageId),
      revision: nextRevision,
      authorId: UserId.parse(input.authorId),
      title: revision.title,
      content: revision.content,
      learningObjectiveIds: revision.learningObjectiveIds.map((id) =>
        LearningObjectiveId.parse(id),
      ),
      summary: input.summary,
      createdAt: now,
    });

    const [insertedRevision] = await tx.insert(wikiPageRevision).values(revisionRow).returning();

    if (!insertedRevision) {
      throw new Error('Wiki page revision insert returned no row.');
    }

    return {
      page: WikiPage.parse(updatedRow),
      revision: WikiPageRevision.parse(insertedRevision),
    };
  });
};

export type DeleteWikiPageInput = {
  tenantId: string;
  courseId: string;
  wikiPageId: string;
};

export const deleteWikiPage = async (
  db: Database,
  input: DeleteWikiPageInput,
): Promise<boolean> => {
  const result = await db
    .delete(wikiPage)
    .where(
      and(
        eq(wikiPage.tenantId, input.tenantId),
        eq(wikiPage.courseId, input.courseId),
        eq(wikiPage.id, input.wikiPageId),
      ),
    )
    .returning({ id: wikiPage.id });

  return result.length > 0;
};
