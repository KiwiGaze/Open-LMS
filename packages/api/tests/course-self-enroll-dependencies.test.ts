import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourseMembership: vi.fn(),
  createDbHandle: vi.fn(),
  countCourseMembershipsByStatus: vi.fn(),
  dbHandle: { db: {} },
  getCourseEnrollmentInfo: vi.fn(),
  listUserCourseMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseMembership: coreMocks.createCourseMembership,
    createDbHandle: coreMocks.createDbHandle,
    countCourseMembershipsByStatus: coreMocks.countCourseMembershipsByStatus,
    getCourseEnrollmentInfo: coreMocks.getCourseEnrollmentInfo,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const membershipId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const now = new Date('2026-05-12T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const newMembership = () => ({
  id: membershipId,
  tenantId,
  courseId,
  userId: actorUserId,
  role: 'student',
  createdAt: now,
  updatedAt: now,
});

describe('course self-enrollment API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getCourseEnrollmentInfo.mockResolvedValue({
      status: 'active',
      enrollmentCode: 'JOIN-WRIT-101',
      maxEnrollments: null,
      waitlistEnabled: false,
      enrollmentApprovalRequired: false,
      startsAt: null,
      endsAt: null,
    });
    coreMocks.countCourseMembershipsByStatus.mockResolvedValue(0);
    coreMocks.listUserCourseMemberships.mockResolvedValue([]);
    coreMocks.createCourseMembership.mockResolvedValue(newMembership());
  });

  it('enrolls the actor as a student when the code matches', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.selfEnrollInCourse(actorUserId, tenantId, courseId, {
        enrollmentCode: 'JOIN-WRIT-101',
      }),
    ).resolves.toMatchObject({
      id: membershipId,
      tenantId,
      courseId,
      userId: actorUserId,
      role: 'student',
    });

    expect(coreMocks.createCourseMembership).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      userId: actorUserId,
      role: 'student',
      status: 'active',
    });
  });

  it('returns the existing membership when the actor is already enrolled', async () => {
    coreMocks.listUserCourseMemberships.mockResolvedValue([
      {
        id: membershipId,
        tenantId,
        courseId,
        userId: actorUserId,
        role: 'student',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const dependencies = createDependencies();

    await expect(
      dependencies.selfEnrollInCourse(actorUserId, tenantId, courseId, {
        enrollmentCode: 'JOIN-WRIT-101',
      }),
    ).resolves.toMatchObject({
      id: membershipId,
      role: 'student',
    });

    expect(coreMocks.createCourseMembership).not.toHaveBeenCalled();
  });

  it('rejects a wrong enrollment code with bad_request', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.selfEnrollInCourse(actorUserId, tenantId, courseId, {
        enrollmentCode: 'WRONG-CODE',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Enrollment code is incorrect. Check the code and retry the request.',
    });

    expect(coreMocks.createCourseMembership).not.toHaveBeenCalled();
  });

  it('rejects with forbidden when the course is not active', async () => {
    coreMocks.getCourseEnrollmentInfo.mockResolvedValue({
      status: 'draft',
      enrollmentCode: 'JOIN-WRIT-101',
      maxEnrollments: null,
      waitlistEnabled: false,
      enrollmentApprovalRequired: false,
      startsAt: null,
      endsAt: null,
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.selfEnrollInCourse(actorUserId, tenantId, courseId, {
        enrollmentCode: 'JOIN-WRIT-101',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Self-enrollment is not available for this course.',
    });

    expect(coreMocks.createCourseMembership).not.toHaveBeenCalled();
  });

  it('rejects with forbidden when the course has no enrollment code set', async () => {
    coreMocks.getCourseEnrollmentInfo.mockResolvedValue({
      status: 'active',
      enrollmentCode: null,
      maxEnrollments: null,
      waitlistEnabled: false,
      enrollmentApprovalRequired: false,
      startsAt: null,
      endsAt: null,
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.selfEnrollInCourse(actorUserId, tenantId, courseId, {
        enrollmentCode: 'JOIN-WRIT-101',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Self-enrollment is not available for this course.',
    });

    expect(coreMocks.createCourseMembership).not.toHaveBeenCalled();
  });

  it('returns not found when the course does not exist in the tenant', async () => {
    coreMocks.getCourseEnrollmentInfo.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.selfEnrollInCourse(actorUserId, tenantId, courseId, {
        enrollmentCode: 'JOIN-WRIT-101',
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });

    expect(coreMocks.createCourseMembership).not.toHaveBeenCalled();
  });

  it('waitlists the actor when capacity is full and waitlist is enabled', async () => {
    coreMocks.getCourseEnrollmentInfo.mockResolvedValue({
      status: 'active',
      enrollmentCode: 'JOIN-WRIT-101',
      maxEnrollments: 1,
      waitlistEnabled: true,
      enrollmentApprovalRequired: false,
      startsAt: null,
      endsAt: null,
    });
    coreMocks.countCourseMembershipsByStatus.mockResolvedValue(1);
    coreMocks.createCourseMembership.mockResolvedValue({
      ...newMembership(),
      status: 'waitlisted',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.selfEnrollInCourse(actorUserId, tenantId, courseId, {
        enrollmentCode: 'JOIN-WRIT-101',
      }),
    ).resolves.toMatchObject({
      userId: actorUserId,
      role: 'student',
      status: 'waitlisted',
    });

    expect(coreMocks.createCourseMembership).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      userId: actorUserId,
      role: 'student',
      status: 'waitlisted',
    });
  });

  it('rejects self-enrollment when capacity is full and waitlist is disabled', async () => {
    coreMocks.getCourseEnrollmentInfo.mockResolvedValue({
      status: 'active',
      enrollmentCode: 'JOIN-WRIT-101',
      maxEnrollments: 1,
      waitlistEnabled: false,
      enrollmentApprovalRequired: false,
      startsAt: null,
      endsAt: null,
    });
    coreMocks.countCourseMembershipsByStatus.mockResolvedValue(1);
    const dependencies = createDependencies();

    await expect(
      dependencies.selfEnrollInCourse(actorUserId, tenantId, courseId, {
        enrollmentCode: 'JOIN-WRIT-101',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Course enrollment is full. Ask an instructor about waitlist options.',
    });

    expect(coreMocks.createCourseMembership).not.toHaveBeenCalled();
  });

  it('rejects self-enrollment before the course start date', async () => {
    coreMocks.getCourseEnrollmentInfo.mockResolvedValue({
      status: 'active',
      enrollmentCode: 'JOIN-WRIT-101',
      maxEnrollments: null,
      waitlistEnabled: false,
      enrollmentApprovalRequired: false,
      startsAt: new Date('2999-01-01T00:00:00.000Z'),
      endsAt: null,
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.selfEnrollInCourse(actorUserId, tenantId, courseId, {
        enrollmentCode: 'JOIN-WRIT-101',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Self-enrollment is not available for this course.',
    });

    expect(coreMocks.createCourseMembership).not.toHaveBeenCalled();
  });

  it('rejects self-enrollment after the course end date', async () => {
    coreMocks.getCourseEnrollmentInfo.mockResolvedValue({
      status: 'active',
      enrollmentCode: 'JOIN-WRIT-101',
      maxEnrollments: null,
      waitlistEnabled: false,
      enrollmentApprovalRequired: false,
      startsAt: null,
      endsAt: new Date('2000-01-01T00:00:00.000Z'),
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.selfEnrollInCourse(actorUserId, tenantId, courseId, {
        enrollmentCode: 'JOIN-WRIT-101',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Self-enrollment is not available for this course.',
    });

    expect(coreMocks.createCourseMembership).not.toHaveBeenCalled();
  });

  it('creates a pending approval membership when enrollment approval is required', async () => {
    coreMocks.getCourseEnrollmentInfo.mockResolvedValue({
      status: 'active',
      enrollmentCode: 'JOIN-WRIT-101',
      maxEnrollments: null,
      waitlistEnabled: false,
      enrollmentApprovalRequired: true,
      startsAt: null,
      endsAt: null,
    });
    coreMocks.createCourseMembership.mockResolvedValue({
      ...newMembership(),
      status: 'pending_approval',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.selfEnrollInCourse(actorUserId, tenantId, courseId, {
        enrollmentCode: 'JOIN-WRIT-101',
      }),
    ).resolves.toMatchObject({
      userId: actorUserId,
      role: 'student',
      status: 'pending_approval',
    });

    expect(coreMocks.createCourseMembership).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      userId: actorUserId,
      role: 'student',
      status: 'pending_approval',
    });
  });
});
