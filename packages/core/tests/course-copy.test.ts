import { describe, expect, it } from 'vitest';
import { copyCourseTemplate } from '../src/courses/copy.ts';
import type { Database } from '../src/db/client.ts';
import {
  courseModule,
  coursePage,
  courseResource,
  courseUnit,
  learningObjective,
} from '../src/db/schema/course.ts';
import { glossaryEntry } from '../src/db/schema/glossary.ts';
import { wikiPage } from '../src/db/schema/wiki.ts';

const now = new Date('2026-05-14T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE9A';
const sourceCourseId = '01J9QW7B6N5W2YH3D3A1V0KE9B';
const targetCourseId = '01J9QW7B6N5W2YH3D3A1V0KE9C';
const sourceLearningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE9D';
const authorId = '01J9QW7B6N5W2YH3D3A1V0KE9E';

type InsertedRow = {
  table: unknown;
  value: Record<string, unknown>;
};

type SelectQueue = Map<unknown, unknown[][]>;

const createSelectResult = (rows: unknown[]) => ({
  orderBy: async () => rows,
  // biome-ignore lint/suspicious/noThenProperty: mocks Drizzle's thenable query builder for `await db.select()...` calls in repository tests.
  then: <TResult1 = unknown[], TResult2 = never>(
    onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) => Promise.resolve(rows).then(onfulfilled, onrejected),
});

const createCourseCopyDb = (selectQueue: SelectQueue): { db: Database; inserts: InsertedRow[] } => {
  const inserts: InsertedRow[] = [];
  const takeRows = (table: unknown): unknown[] => {
    const queues = selectQueue.get(table) ?? [];
    const rows = queues.shift();
    return rows ?? [];
  };
  const tx = {
    select: () => ({
      from: (table: unknown) => ({
        where: () => createSelectResult(takeRows(table)),
      }),
    }),
    insert: (table: unknown) => ({
      values: async (value: Record<string, unknown>) => {
        inserts.push({ table, value });
      },
    }),
  };

  return {
    db: {
      transaction: async <T>(callback: (transaction: typeof tx) => Promise<T>) => callback(tx),
    } as unknown as Database,
    inserts,
  };
};

describe('course copy', () => {
  it('copies wiki pages and glossary entries while preserving target content', async () => {
    const sourceLearningObjective = {
      id: sourceLearningObjectiveId,
      tenantId,
      courseId: sourceCourseId,
      code: 'LO-1',
      title: 'Explain evidence',
      description: null,
      status: 'active',
      position: 0,
      createdAt: now,
      updatedAt: now,
    };
    const sourceWikiPage = {
      id: '01J9QW7B6N5W2YH3D3A1V0KE9F',
      tenantId,
      courseId: sourceCourseId,
      slug: 'overview',
      title: 'Overview',
      content: 'Course overview content.',
      status: 'published',
      learningObjectiveIds: [sourceLearningObjectiveId],
      createdById: authorId,
      createdAt: now,
      updatedAt: now,
    };
    const targetWikiPage = {
      ...sourceWikiPage,
      id: '01J9QW7B6N5W2YH3D3A1V0KE9G',
      courseId: targetCourseId,
      learningObjectiveIds: [],
    };
    const sourceGlossaryEntry = {
      id: '01J9QW7B6N5W2YH3D3A1V0KE9H',
      tenantId,
      courseId: sourceCourseId,
      term: 'Thesis',
      definition: 'A defensible claim supported by evidence.',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    };
    const targetGlossaryEntry = {
      ...sourceGlossaryEntry,
      id: '01J9QW7B6N5W2YH3D3A1V0KE9J',
      courseId: targetCourseId,
    };
    const { db, inserts } = createCourseCopyDb(
      new Map<unknown, unknown[][]>([
        [learningObjective, [[sourceLearningObjective], []]],
        [courseModule, [[], []]],
        [courseUnit, [[]]],
        [coursePage, [[]]],
        [courseResource, [[]]],
        [wikiPage, [[sourceWikiPage], [targetWikiPage]]],
        [glossaryEntry, [[sourceGlossaryEntry], [targetGlossaryEntry]]],
      ]),
    );

    const result = await copyCourseTemplate(db, { tenantId, sourceCourseId, targetCourseId }, now);

    const copiedObjective = inserts.find((insert) => insert.table === learningObjective)?.value;
    const copiedWikiPage = inserts.find((insert) => insert.table === wikiPage)?.value;
    const copiedGlossaryEntry = inserts.find((insert) => insert.table === glossaryEntry)?.value;

    expect(result).toMatchObject({
      learningObjectivesCopied: 1,
      wikiPagesCopied: 1,
      glossaryEntriesCopied: 1,
    });
    expect(copiedWikiPage).toMatchObject({
      tenantId,
      courseId: targetCourseId,
      slug: 'overview-copy',
      title: sourceWikiPage.title,
      content: sourceWikiPage.content,
      status: sourceWikiPage.status,
      learningObjectiveIds: [copiedObjective?.id],
      createdById: authorId,
      createdAt: now,
      updatedAt: now,
    });
    expect(copiedWikiPage?.id).not.toBe(sourceWikiPage.id);
    expect(copiedGlossaryEntry).toMatchObject({
      tenantId,
      courseId: targetCourseId,
      term: 'Thesis (copy)',
      definition: sourceGlossaryEntry.definition,
      status: sourceGlossaryEntry.status,
      createdAt: now,
      updatedAt: now,
    });
    expect(copiedGlossaryEntry?.id).not.toBe(sourceGlossaryEntry.id);
  });
});
