import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createGlossaryEntry: vi.fn(),
  dbHandle: { db: {} },
  listGlossaryEntriesForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createGlossaryEntry: coreMocks.createGlossaryEntry,
    listGlossaryEntriesForCourse: coreMocks.listGlossaryEntriesForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const glossaryEntryId = '01J9QW7B6N5W2YH3D3A1V0KE8C';
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

const duplicateTermError = (): unknown => ({
  code: '23505',
  constraint_name: 'glossary_entry_tenant_course_term_uq',
});

const sampleEntry = () => ({
  id: glossaryEntryId,
  tenantId,
  courseId,
  term: 'thesis',
  definition: 'A central claim supported by evidence and reasoning.',
  status: 'published',
  createdAt: now,
  updatedAt: now,
});

describe('glossary API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listGlossaryEntriesForCourse.mockResolvedValue([sampleEntry()]);
    coreMocks.createGlossaryEntry.mockResolvedValue(sampleEntry());
    configureCourseAccess('student', 'student');
  });

  it('lists only published entries for students', async () => {
    const dependencies = createDependencies();

    await dependencies.listGlossaryEntries(actorUserId, tenantId, courseId);

    expect(coreMocks.listGlossaryEntriesForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      statuses: ['published'],
    });
  });

  it('lists all entries for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.listGlossaryEntries(actorUserId, tenantId, courseId);

    expect(coreMocks.listGlossaryEntriesForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      statuses: ['draft', 'published', 'archived'],
    });
  });

  it('creates entries for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createGlossaryEntry(actorUserId, tenantId, courseId, {
        term: 'thesis',
        definition: 'A central claim supported by evidence and reasoning.',
        status: 'published',
      }),
    ).resolves.toMatchObject({ id: glossaryEntryId, term: 'thesis', status: 'published' });

    expect(coreMocks.createGlossaryEntry).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      term: 'thesis',
      definition: 'A central claim supported by evidence and reasoning.',
      status: 'published',
    });
  });

  it('allows tenant staff without course membership to create entries', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createGlossaryEntry(actorUserId, tenantId, courseId, {
      term: 'warrant',
      definition: 'The link from evidence to claim.',
      status: 'draft',
    });

    expect(coreMocks.createGlossaryEntry).toHaveBeenCalledTimes(1);
  });

  it('rejects students creating entries', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createGlossaryEntry(actorUserId, tenantId, courseId, {
        term: 'thesis',
        definition: 'A central claim.',
        status: 'draft',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create glossary entries. Ask an instructor for access.',
    });

    expect(coreMocks.createGlossaryEntry).not.toHaveBeenCalled();
  });

  it('maps duplicate terms to a conflict', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createGlossaryEntry.mockRejectedValue(duplicateTermError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createGlossaryEntry(actorUserId, tenantId, courseId, {
        term: 'thesis',
        definition: 'A central claim.',
        status: 'published',
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'Glossary term already exists in this course. Choose a unique term and retry the request.',
    });
  });
});
