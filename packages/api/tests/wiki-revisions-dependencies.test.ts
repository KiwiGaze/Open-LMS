import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getWikiPageForCourse: vi.fn(),
  getWikiPageRevisionDiff: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  listWikiPageRevisionsForPage: vi.fn(),
  restoreWikiPageRevision: vi.fn(),
  updateWikiPage: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getWikiPageForCourse: coreMocks.getWikiPageForCourse,
    getWikiPageRevisionDiff: coreMocks.getWikiPageRevisionDiff,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    listWikiPageRevisionsForPage: coreMocks.listWikiPageRevisionsForPage,
    restoreWikiPageRevision: coreMocks.restoreWikiPageRevision,
    updateWikiPage: coreMocks.updateWikiPage,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const wikiPageId = '01J9QW7B6N5W2YH3D3A1V0KE90';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE91';
const revisionId = '01J9QW7B6N5W2YH3D3A1V0KE93';
const now = new Date('2026-05-12T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureCourseAccess = (tenantRole: TenantRole, courseRole: CourseRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue([{ tenantId, role: tenantRole }]);
  coreMocks.listUserCourseMemberships.mockResolvedValue(
    courseRole ? [{ tenantId, courseId, role: courseRole }] : [],
  );
};

const samplePage = () => ({
  id: wikiPageId,
  tenantId,
  courseId,
  slug: 'arguing-from-evidence',
  title: 'Arguing from evidence',
  content: 'Original outline.',
  status: 'published',
  learningObjectiveIds: [learningObjectiveId],
  createdById: actorUserId,
  createdAt: now,
  updatedAt: now,
});

const sampleRevision = () => ({
  id: revisionId,
  tenantId,
  wikiPageId,
  revision: 1,
  authorId: actorUserId,
  title: 'Arguing from evidence',
  content: 'Original outline.',
  summary: null,
  createdAt: now,
});

const sampleDiff = () => ({
  wikiPageId,
  baseRevision: 1,
  targetRevision: 2,
  title: {
    changed: true,
    base: 'Arguing from evidence',
    target: 'Arguing from evidence v2',
  },
  learningObjectiveIds: {
    added: [],
    removed: [learningObjectiveId],
  },
  content: [
    {
      kind: 'removed',
      oldLineNumber: 1,
      newLineNumber: null,
      text: 'Original outline.',
    },
    {
      kind: 'added',
      oldLineNumber: null,
      newLineNumber: 1,
      text: 'Updated outline.',
    },
  ],
});

describe('wiki page revisions API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getWikiPageForCourse.mockResolvedValue(samplePage());
    coreMocks.getWikiPageRevisionDiff.mockResolvedValue(sampleDiff());
    coreMocks.listWikiPageRevisionsForPage.mockResolvedValue([sampleRevision()]);
    coreMocks.restoreWikiPageRevision.mockResolvedValue({
      page: { ...samplePage(), title: 'Arguing from evidence', content: 'Original outline.' },
      revision: {
        ...sampleRevision(),
        id: revisionId,
        revision: 3,
        summary: 'Restored revision 1.',
      },
    });
    coreMocks.updateWikiPage.mockResolvedValue({
      page: { ...samplePage(), title: 'Arguing from evidence v2', content: 'Updated outline.' },
      revision: {
        ...sampleRevision(),
        id: revisionId,
        revision: 2,
        title: 'Arguing from evidence v2',
        content: 'Updated outline.',
      },
    });
    configureCourseAccess('student', 'student');
  });

  it('lists wiki page revisions for any course member', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listWikiPageRevisions(actorUserId, tenantId, courseId, wikiPageId),
    ).resolves.toMatchObject([{ id: revisionId, revision: 1 }]);

    expect(coreMocks.listWikiPageRevisionsForPage).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      wikiPageId,
    });
  });

  it('returns not found when the wiki page does not belong to the course on list', async () => {
    coreMocks.getWikiPageForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listWikiPageRevisions(actorUserId, tenantId, courseId, wikiPageId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Wiki page was not found in this course. Check the page id and retry the request.',
    });

    expect(coreMocks.listWikiPageRevisionsForPage).not.toHaveBeenCalled();
  });

  it('gets a wiki revision diff for any course member', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.getWikiPageRevisionDiff(actorUserId, tenantId, courseId, wikiPageId, 1, 2),
    ).resolves.toMatchObject({
      wikiPageId,
      baseRevision: 1,
      targetRevision: 2,
    });

    expect(coreMocks.getWikiPageRevisionDiff).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      wikiPageId,
      baseRevision: 1,
      targetRevision: 2,
    });
  });

  it('returns not found when a wiki revision diff references a missing page', async () => {
    coreMocks.getWikiPageForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.getWikiPageRevisionDiff(actorUserId, tenantId, courseId, wikiPageId, 1, 2),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Wiki page was not found in this course. Check the page id and retry the request.',
    });

    expect(coreMocks.getWikiPageRevisionDiff).not.toHaveBeenCalled();
  });

  it('returns not found when a wiki revision diff references a missing revision', async () => {
    coreMocks.getWikiPageRevisionDiff.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.getWikiPageRevisionDiff(actorUserId, tenantId, courseId, wikiPageId, 1, 2),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Wiki revision was not found for this page. Check the revision number and retry.',
    });
  });

  it('updates a wiki page for any course member and captures the actor as author', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateWikiPage(actorUserId, tenantId, courseId, wikiPageId, {
        title: 'Arguing from evidence v2',
        content: 'Updated outline.',
        status: 'published',
        learningObjectiveIds: [learningObjectiveId],
        summary: null,
      }),
    ).resolves.toMatchObject({
      id: wikiPageId,
      title: 'Arguing from evidence v2',
      content: 'Updated outline.',
    });

    expect(coreMocks.updateWikiPage).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      wikiPageId,
      authorId: actorUserId,
      title: 'Arguing from evidence v2',
      content: 'Updated outline.',
      status: 'published',
      learningObjectiveIds: [learningObjectiveId],
      summary: null,
    });
  });

  it('restores a wiki page revision for any course member and captures the actor as author', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.restoreWikiPageRevision(actorUserId, tenantId, courseId, wikiPageId, 1, {
        summary: 'Restored revision 1.',
      }),
    ).resolves.toMatchObject({
      id: wikiPageId,
      title: 'Arguing from evidence',
      content: 'Original outline.',
    });

    expect(coreMocks.restoreWikiPageRevision).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      wikiPageId,
      revision: 1,
      authorId: actorUserId,
      summary: 'Restored revision 1.',
    });
  });

  it('returns not found when restoring a missing wiki revision', async () => {
    coreMocks.restoreWikiPageRevision.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.restoreWikiPageRevision(actorUserId, tenantId, courseId, wikiPageId, 1, {
        summary: 'Restored revision 1.',
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Wiki revision was not found for this page. Check the revision number and retry.',
    });
  });

  it('rejects users outside the course updating wiki pages', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateWikiPage(actorUserId, tenantId, courseId, wikiPageId, {
        title: 'Arguing from evidence v2',
        content: 'Updated outline.',
        status: 'published',
        summary: null,
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateWikiPage).not.toHaveBeenCalled();
  });

  it('returns not found when the wiki page does not belong to the course on update', async () => {
    coreMocks.updateWikiPage.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateWikiPage(actorUserId, tenantId, courseId, wikiPageId, {
        title: 'Arguing from evidence v2',
        content: 'Updated outline.',
        status: 'published',
        summary: null,
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Wiki page was not found in this course. Check the page id and retry the request.',
    });
  });
});
