import { CourseMembership, TenantMembership } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  countCourseMembershipsByStatus,
  createCourseMembership,
  getTenantMembershipById,
  listCourseMemberships,
  listUserCourseMemberships,
  userHasCourseRole,
} from '../src/memberships/repository.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const userId = '01J9QW7B6N5W2YH3D3A1V0KE2W';

const membership = CourseMembership.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  tenantId,
  courseId,
  userId,
  role: 'student',
  status: 'active',
  invitedAt: null,
  acceptedAt: now,
  droppedAt: null,
  withdrawnAt: null,
  createdAt: now,
  updatedAt: now,
});

const tenantMembership = TenantMembership.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  tenantId,
  userId,
  role: 'student',
  createdAt: now,
  updatedAt: now,
});

const createInsertOnlyDb = <T>(rows: T[]): Database =>
  ({
    insert: () => ({
      values: (value: T) => ({
        returning: async () => {
          rows.push(value);
          return [value];
        },
      }),
    }),
  }) as unknown as Database;

const createSelectOnlyDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createListOnlyDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: async () => rows,
      }),
    }),
  }) as unknown as Database;

describe('course membership repository', () => {
  it('creates course memberships with tenant, course, user, and role scope', async () => {
    const rows: unknown[] = [];
    const created = await createCourseMembership(createInsertOnlyDb(rows), {
      tenantId,
      courseId,
      userId,
      role: 'student',
      status: 'invited',
    });

    expect(created.tenantId).toBe(tenantId);
    expect(created.courseId).toBe(courseId);
    expect(created.userId).toBe(userId);
    expect(created.role).toBe('student');
    expect(created.status).toBe('invited');
    expect(created.invitedAt).toBeInstanceOf(Date);
    expect(rows).toHaveLength(1);
  });

  it('lists course memberships by user and course', async () => {
    await expect(
      listUserCourseMemberships(createListOnlyDb([membership]), userId),
    ).resolves.toEqual([membership]);
    await expect(
      listCourseMemberships(createListOnlyDb([membership]), {
        tenantId,
        courseId,
        status: 'active',
      }),
    ).resolves.toEqual([membership]);
  });

  it('counts course memberships by role and lifecycle status', async () => {
    await expect(
      countCourseMembershipsByStatus(createSelectOnlyDb([{ count: 2 }]), {
        tenantId,
        courseId,
        role: 'student',
        status: 'active',
      }),
    ).resolves.toBe(2);
  });

  it('checks a user role within a specific course', async () => {
    await expect(
      userHasCourseRole(createSelectOnlyDb([{ id: membership.id }]), {
        tenantId,
        courseId,
        userId,
        role: 'student',
      }),
    ).resolves.toBe(true);
    await expect(
      userHasCourseRole(createSelectOnlyDb([]), {
        tenantId,
        courseId,
        userId,
        role: 'instructor',
      }),
    ).resolves.toBe(false);
  });

  it('gets a tenant membership by tenant and membership id', async () => {
    await expect(
      getTenantMembershipById(createSelectOnlyDb([tenantMembership]), {
        tenantId,
        membershipId: tenantMembership.id,
      }),
    ).resolves.toEqual(tenantMembership);
    await expect(
      getTenantMembershipById(createSelectOnlyDb([]), {
        tenantId,
        membershipId: tenantMembership.id,
      }),
    ).resolves.toBeNull();
  });
});
