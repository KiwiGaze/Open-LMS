import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteGlossaryEntry: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateGlossaryEntry: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteGlossaryEntry: coreMocks.deleteGlossaryEntry,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateGlossaryEntry: coreMocks.updateGlossaryEntry,
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

const sampleEntry = () => ({
  id: glossaryEntryId,
  tenantId,
  courseId,
  term: 'thesis',
  definition: 'Updated definition.',
  status: 'published',
  createdAt: now,
  updatedAt: now,
});

const duplicateTermError = (): unknown => ({
  code: '23505',
  constraint_name: 'glossary_entry_tenant_course_term_uq',
});

describe('glossary entry update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateGlossaryEntry.mockResolvedValue(sampleEntry());
    coreMocks.deleteGlossaryEntry.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a glossary entry for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateGlossaryEntry(actorUserId, tenantId, courseId, glossaryEntryId, {
        term: 'thesis',
        definition: 'Updated definition.',
        status: 'published',
      }),
    ).resolves.toMatchObject({ id: glossaryEntryId, definition: 'Updated definition.' });

    expect(coreMocks.updateGlossaryEntry).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      glossaryEntryId,
      term: 'thesis',
      definition: 'Updated definition.',
      status: 'published',
    });
  });

  it('returns not found when the glossary entry does not exist in the course', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateGlossaryEntry.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateGlossaryEntry(actorUserId, tenantId, courseId, glossaryEntryId, {
        term: 'thesis',
        definition: 'Updated definition.',
        status: 'published',
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Glossary entry was not found in this course. Check the entry id and retry the request.',
    });
  });

  it('rejects students from updating glossary entries', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateGlossaryEntry(actorUserId, tenantId, courseId, glossaryEntryId, {
        term: 'thesis',
        definition: 'Updated definition.',
        status: 'published',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateGlossaryEntry).not.toHaveBeenCalled();
  });

  it('maps duplicate terms during update to a conflict', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateGlossaryEntry.mockRejectedValue(duplicateTermError());
    const dependencies = createDependencies();

    await expect(
      dependencies.updateGlossaryEntry(actorUserId, tenantId, courseId, glossaryEntryId, {
        term: 'thesis',
        definition: 'Updated definition.',
        status: 'published',
      }),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('deletes a glossary entry for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteGlossaryEntry(actorUserId, tenantId, courseId, glossaryEntryId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteGlossaryEntry).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      glossaryEntryId,
    });
  });

  it('returns not found when deleting a missing glossary entry', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteGlossaryEntry.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteGlossaryEntry(actorUserId, tenantId, courseId, glossaryEntryId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Glossary entry was not found in this course. Check the entry id and retry the request.',
    });
  });

  it('rejects students from deleting glossary entries', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteGlossaryEntry(actorUserId, tenantId, courseId, glossaryEntryId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteGlossaryEntry).not.toHaveBeenCalled();
  });
});
