import { describe, expect, it } from 'vitest';
import {
  getWikiPageRevisionDiff,
  restoreWikiPageRevision,
} from '../src/wiki/repository.ts';
import type { Database } from '../src/db/client.ts';
import { wikiPage, wikiPageRevision } from '../src/db/schema/wiki.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const wikiPageId = '01J9QW7B6N5W2YH3D3A1V0KE90';
const authorId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE91';
const restoredLearningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE92';
const now = new Date('2026-05-14T00:00:00.000Z');

type SelectQueue = Map<unknown, unknown[][]>;

const createSelectResult = (rows: unknown[]) => ({
  orderBy: async () => rows,
  limit: async () => rows,
  then: <TResult1 = unknown[], TResult2 = never>(
    onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) => Promise.resolve(rows).then(onfulfilled, onrejected),
});

const takeRows = (selectQueue: SelectQueue, table: unknown): unknown[] => {
  const queues = selectQueue.get(table) ?? [];
  const rows = queues.shift();
  return rows ?? [];
};

const samplePage = () => ({
  id: wikiPageId,
  tenantId,
  courseId,
  slug: 'evidence-faq',
  title: 'Evidence FAQ v3',
  content: 'Current content.',
  status: 'published',
  learningObjectiveIds: [learningObjectiveId],
  createdById: authorId,
  createdAt: now,
  updatedAt: now,
});

const sampleRevision = (revision: number, content: string, title = 'Evidence FAQ') => ({
  id: revision === 1 ? '01J9QW7B6N5W2YH3D3A1V0KE93' : '01J9QW7B6N5W2YH3D3A1V0KE94',
  tenantId,
  wikiPageId,
  revision,
  authorId,
  title,
  content,
  learningObjectiveIds: revision === 1 ? [learningObjectiveId] : [restoredLearningObjectiveId],
  summary: null,
  createdAt: now,
});

const createSelectOnlyDb = (selectQueue: SelectQueue): Database =>
  ({
    select: () => ({
      from: (table: unknown) => ({
        where: () => createSelectResult(takeRows(selectQueue, table)),
      }),
    }),
  }) as unknown as Database;

const createRestoreDb = (selectQueue: SelectQueue): { db: Database; inserted: unknown[] } => {
  const inserted: unknown[] = [];
  const tx = {
    select: () => ({
      from: (table: unknown) => ({
        where: () => createSelectResult(takeRows(selectQueue, table)),
      }),
    }),
    update: () => ({
      set: (patch: Record<string, unknown>) => ({
        where: () => ({
          returning: async () => [{ ...samplePage(), ...patch }],
        }),
      }),
    }),
    insert: () => ({
      values: (value: unknown) => ({
        returning: async () => {
          inserted.push(value);
          return [value];
        },
      }),
    }),
  };

  return {
    db: {
      transaction: async <T>(callback: (transaction: typeof tx) => Promise<T>) => callback(tx),
    } as unknown as Database,
    inserted,
  };
};

describe('wiki page revision workflows', () => {
  it('builds a diff between two wiki page revisions', async () => {
    const base = sampleRevision(1, 'Original claim\nOld support');
    const target = sampleRevision(2, 'Original claim\nNew support', 'Evidence FAQ v2');

    const diff = await getWikiPageRevisionDiff(
      createSelectOnlyDb(new Map([[wikiPageRevision, [[base, target]]]])),
      {
        tenantId,
        wikiPageId,
        baseRevision: 1,
        targetRevision: 2,
      },
    );

    expect(diff).toMatchObject({
      wikiPageId,
      baseRevision: 1,
      targetRevision: 2,
      title: {
        changed: true,
        base: 'Evidence FAQ',
        target: 'Evidence FAQ v2',
      },
      learningObjectiveIds: {
        added: [restoredLearningObjectiveId],
        removed: [learningObjectiveId],
      },
      content: [
        { kind: 'unchanged', oldLineNumber: 1, newLineNumber: 1, text: 'Original claim' },
        { kind: 'removed', oldLineNumber: 2, newLineNumber: null, text: 'Old support' },
        { kind: 'added', oldLineNumber: null, newLineNumber: 2, text: 'New support' },
      ],
    });
  });

  it('restores a wiki revision and records the restore as a new revision', async () => {
    const revision = sampleRevision(2, 'Restored content.', 'Restored title');
    const { db, inserted } = createRestoreDb(
      new Map<unknown, unknown[][]>([
        [wikiPage, [[samplePage()]]],
        [wikiPageRevision, [[revision], [{ value: 2 }]]],
      ]),
    );

    const result = await restoreWikiPageRevision(
      db,
      {
        tenantId,
        courseId,
        wikiPageId,
        revision: 2,
        authorId,
        summary: 'Restored revision 2 after review.',
      },
      now,
    );

    expect(result?.page).toMatchObject({
      id: wikiPageId,
      title: 'Restored title',
      content: 'Restored content.',
      status: 'published',
      learningObjectiveIds: [restoredLearningObjectiveId],
      updatedAt: now,
    });
    expect(result?.revision).toMatchObject({
      tenantId,
      wikiPageId,
      revision: 3,
      authorId,
      title: 'Restored title',
      content: 'Restored content.',
      learningObjectiveIds: [restoredLearningObjectiveId],
      summary: 'Restored revision 2 after review.',
      createdAt: now,
    });
    expect(inserted).toHaveLength(1);
  });
});
