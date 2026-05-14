import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createWikiPage: vi.fn(),
  dbHandle: { db: {} },
  listWikiPagesForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createWikiPage: coreMocks.createWikiPage,
    listWikiPagesForCourse: coreMocks.listWikiPagesForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const wikiPageId = '01J9QW7B6N5W2YH3D3A1V0KE90';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE91';
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

const duplicateSlugError = (): unknown => ({
  code: '23505',
  constraint_name: 'wiki_page_tenant_course_slug_uq',
});

const sampleWikiPage = () => ({
  id: wikiPageId,
  tenantId,
  courseId,
  slug: 'arguing-from-evidence',
  title: 'Arguing from evidence',
  content: 'A starting outline for class collaboration.',
  status: 'published',
  learningObjectiveIds: [learningObjectiveId],
  createdById: actorUserId,
  createdAt: now,
  updatedAt: now,
});

describe('wiki page API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listWikiPagesForCourse.mockResolvedValue([sampleWikiPage()]);
    coreMocks.createWikiPage.mockResolvedValue(sampleWikiPage());
    configureCourseAccess('student', 'student');
  });

  it('lists only published wiki pages for students', async () => {
    const dependencies = createDependencies();

    await dependencies.listWikiPages(actorUserId, tenantId, courseId);

    expect(coreMocks.listWikiPagesForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      statuses: ['published'],
    });
  });

  it('lists all wiki pages for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.listWikiPages(actorUserId, tenantId, courseId);

    expect(coreMocks.listWikiPagesForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      statuses: ['draft', 'published', 'archived'],
    });
  });

  it('allows any course member to create wiki pages, capturing the actor as creator', async () => {
    const dependencies = createDependencies();

    await dependencies.createWikiPage(actorUserId, tenantId, courseId, {
      slug: 'arguing-from-evidence',
      title: 'Arguing from evidence',
      content: 'A starting outline for class collaboration.',
      status: 'published',
      learningObjectiveIds: [learningObjectiveId],
    });

    expect(coreMocks.createWikiPage).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      slug: 'arguing-from-evidence',
      title: 'Arguing from evidence',
      content: 'A starting outline for class collaboration.',
      status: 'published',
      learningObjectiveIds: [learningObjectiveId],
      createdById: actorUserId,
    });
  });

  it('allows tenant staff without course membership to create wiki pages', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createWikiPage(actorUserId, tenantId, courseId, {
      slug: 'rubric-anchor',
      title: 'Rubric anchor draft',
      content: 'Draft anchor descriptions for the analytic rubric.',
      status: 'draft',
    });

    expect(coreMocks.createWikiPage).toHaveBeenCalledTimes(1);
  });

  it('rejects users outside the course creating wiki pages', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.createWikiPage(actorUserId, tenantId, courseId, {
        slug: 'arguing-from-evidence',
        title: 'Arguing from evidence',
        content: 'A starting outline.',
        status: 'draft',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
    });

    expect(coreMocks.createWikiPage).not.toHaveBeenCalled();
  });

  it('maps duplicate slugs to a conflict', async () => {
    coreMocks.createWikiPage.mockRejectedValue(duplicateSlugError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createWikiPage(actorUserId, tenantId, courseId, {
        slug: 'arguing-from-evidence',
        title: 'Arguing from evidence',
        content: 'Another attempt.',
        status: 'published',
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'Wiki page slug already exists in this course. Choose a unique slug and retry the request.',
    });
  });
});
