import type { CourseRole, TenantRole } from '@openlms/contracts';
import {
  ManualGradebookItemUnavailableError,
  ManualGradebookScoreExceedsMaxScoreError,
  ManualGradebookStudentUnavailableError,
} from '@openlms/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createDbHandle: vi.fn(),
  getGradebookManualItemForCourse: vi.fn(),
  listGradebookManualGradesForItem: vi.fn(),
  listGradebookManualItemsForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  recordGradebookManualGrade: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getGradebookManualItemForCourse: coreMocks.getGradebookManualItemForCourse,
    listGradebookManualGradesForItem: coreMocks.listGradebookManualGradesForItem,
    listGradebookManualItemsForCourse: coreMocks.listGradebookManualItemsForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    recordGradebookManualGrade: coreMocks.recordGradebookManualGrade,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const manualItemId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const now = new Date('2026-05-10T00:00:00.000Z');

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

const configureManualItem = (status: 'active' | 'archived'): void => {
  coreMocks.getGradebookManualItemForCourse.mockResolvedValue({
    id: manualItemId,
    tenantId,
    courseId,
    gradebookCategoryId: null,
    title: 'In-class participation',
    description: null,
    maxScore: 10,
    dueAt: null,
    position: 0,
    status,
    createdAt: new Date('2026-05-10T00:00:00.000Z'),
    updatedAt: new Date('2026-05-10T00:00:00.000Z'),
  });
};

describe('manual gradebook item API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listGradebookManualItemsForCourse.mockResolvedValue([]);
    coreMocks.listGradebookManualGradesForItem.mockResolvedValue([]);
    coreMocks.recordGradebookManualGrade.mockResolvedValue({
      id: '01J9QW7B6N5W2YH3D3A1V0KE89',
      tenantId,
      gradebookManualItemId: manualItemId,
      studentId,
      score: 8,
      maxScore: 10,
      status: 'published',
      source: 'manual',
      gradedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    configureManualItem('active');
    configureCourseAccess('student', 'student');
  });

  it('lists only active manual gradebook items for students', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listGradebookManualItems(actorUserId, tenantId, courseId),
    ).resolves.toEqual([]);

    expect(coreMocks.listGradebookManualItemsForCourse).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        statuses: ['active'],
      },
    );
  });

  it('lists active and archived manual gradebook items for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.listGradebookManualItems(actorUserId, tenantId, courseId);

    expect(coreMocks.listGradebookManualItemsForCourse).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        statuses: ['active', 'archived'],
      },
    );
  });

  it('lists active and archived manual gradebook items for tenant staff without course membership', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.listGradebookManualItems(actorUserId, tenantId, courseId);

    expect(coreMocks.listGradebookManualItemsForCourse).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        statuses: ['active', 'archived'],
      },
    );
  });

  it('lists only signed-in student manual grades with student-visible statuses', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listGradebookManualGrades(actorUserId, tenantId, courseId, manualItemId),
    ).resolves.toEqual([]);

    expect(coreMocks.getGradebookManualItemForCourse).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      courseId,
      manualItemId,
    );
    expect(coreMocks.listGradebookManualGradesForItem).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      gradebookManualItemId: manualItemId,
      studentId: actorUserId,
      statuses: ['published', 'locked', 'appealed', 'revised', 'incomplete'],
    });
  });

  it('lists all manual grades for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.listGradebookManualGrades(actorUserId, tenantId, courseId, manualItemId);

    expect(coreMocks.listGradebookManualGradesForItem).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      gradebookManualItemId: manualItemId,
      studentId: undefined,
      statuses: ['draft', 'published', 'locked', 'appealed', 'revised', 'incomplete'],
    });
  });

  it('lists all manual grades for tenant staff without course membership', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.listGradebookManualGrades(actorUserId, tenantId, courseId, manualItemId);

    expect(coreMocks.listGradebookManualGradesForItem).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      gradebookManualItemId: manualItemId,
      studentId: undefined,
      statuses: ['draft', 'published', 'locked', 'appealed', 'revised', 'incomplete'],
    });
  });

  it('returns not found when the manual gradebook item is missing', async () => {
    coreMocks.getGradebookManualItemForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listGradebookManualGrades(actorUserId, tenantId, courseId, manualItemId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Manual gradebook item was not found in this course. Check the item id and retry the request.',
    });

    expect(coreMocks.listGradebookManualGradesForItem).not.toHaveBeenCalled();
  });

  it('hides archived manual gradebook item grades from students', async () => {
    configureManualItem('archived');
    const dependencies = createDependencies();

    await expect(
      dependencies.listGradebookManualGrades(actorUserId, tenantId, courseId, manualItemId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Manual gradebook item was not found in this course. Check the item id and retry the request.',
    });

    expect(coreMocks.listGradebookManualGradesForItem).not.toHaveBeenCalled();
  });

  it('rejects manual gradebook items for tenant members without course access', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listGradebookManualItems(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'You are not a member of this course. Switch courses or ask an instructor for access.',
    });

    expect(coreMocks.listGradebookManualItemsForCourse).not.toHaveBeenCalled();
  });

  it('records manual grades for active items when the actor is course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.saveGradebookManualGrade(
        actorUserId,
        tenantId,
        courseId,
        manualItemId,
        studentId,
        {
          score: 8,
          status: 'published',
        },
      ),
    ).resolves.toMatchObject({
      gradebookManualItemId: manualItemId,
      studentId,
      score: 8,
      maxScore: 10,
      status: 'published',
    });

    expect(coreMocks.recordGradebookManualGrade).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      gradebookManualItemId: manualItemId,
      studentId,
      score: 8,
      status: 'published',
    });
  });

  it('records incomplete manual grades for active items when the actor is course staff', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.recordGradebookManualGrade.mockImplementation(async (_db, input) => ({
      id: '01J9QW7B6N5W2YH3D3A1V0KE89',
      tenantId,
      gradebookManualItemId: manualItemId,
      studentId,
      score: input.score,
      maxScore: 10,
      status: input.status,
      source: 'manual',
      gradedAt: now,
      createdAt: now,
      updatedAt: now,
    }));
    const dependencies = createDependencies();

    await expect(
      dependencies.saveGradebookManualGrade(
        actorUserId,
        tenantId,
        courseId,
        manualItemId,
        studentId,
        {
          score: 0,
          status: 'incomplete',
        },
      ),
    ).resolves.toMatchObject({
      gradebookManualItemId: manualItemId,
      studentId,
      score: 0,
      maxScore: 10,
      status: 'incomplete',
    });

    expect(coreMocks.recordGradebookManualGrade).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      gradebookManualItemId: manualItemId,
      studentId,
      score: 0,
      status: 'incomplete',
    });
  });

  it('rejects manual grades for users who are not course students', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.recordGradebookManualGrade.mockRejectedValue(
      new ManualGradebookStudentUnavailableError(),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.saveGradebookManualGrade(
        actorUserId,
        tenantId,
        courseId,
        manualItemId,
        studentId,
        {
          score: 8,
          status: 'published',
        },
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Student was not found in this course. Check the student id and retry the request.',
    });

    expect(coreMocks.recordGradebookManualGrade).toHaveBeenCalled();
  });

  it('rejects students recording manual grades', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.saveGradebookManualGrade(
        actorUserId,
        tenantId,
        courseId,
        manualItemId,
        studentId,
        {
          score: 8,
          status: 'published',
        },
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'Only course staff can record manual gradebook grades. Ask an instructor for access.',
    });

    expect(coreMocks.recordGradebookManualGrade).not.toHaveBeenCalled();
  });

  it('rejects archived manual items when recording manual grades', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.recordGradebookManualGrade.mockRejectedValue(
      new ManualGradebookItemUnavailableError(),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.saveGradebookManualGrade(
        actorUserId,
        tenantId,
        courseId,
        manualItemId,
        studentId,
        {
          score: 8,
          status: 'published',
        },
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Manual gradebook item was not found in this course. Check the item id and retry the request.',
    });

    expect(coreMocks.recordGradebookManualGrade).toHaveBeenCalled();
  });

  it('rejects manual grade scores above the item maximum', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.recordGradebookManualGrade.mockRejectedValue(
      new ManualGradebookScoreExceedsMaxScoreError(),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.saveGradebookManualGrade(
        actorUserId,
        tenantId,
        courseId,
        manualItemId,
        studentId,
        {
          score: 11,
          status: 'published',
        },
      ),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'Score cannot exceed the manual gradebook item max score. Enter a score less than or equal to the item max score.',
    });

    expect(coreMocks.recordGradebookManualGrade).toHaveBeenCalled();
  });
});
