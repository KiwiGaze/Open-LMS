import type { TenantMembership } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { assertCorePermission } from '../src/permissions/evaluator.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const instructorId = '01J9QW7B6N5W2YH3D3A1V0KE2X';

const studentMembership = {
  id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  tenantId,
  userId: studentId,
  role: 'student',
  createdAt: new Date(),
  updatedAt: new Date(),
} as TenantMembership;

const instructorMembership = {
  id: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
  tenantId,
  userId: instructorId,
  role: 'instructor',
  createdAt: new Date(),
  updatedAt: new Date(),
} as TenantMembership;

describe('module release permissions', () => {
  it('instructor can manage module release rules', () => {
    expect(() =>
      assertCorePermission({
        tenantId,
        courseId,
        actorId: instructorId,
        memberships: [instructorMembership],
        permission: 'manage_module_release_rules',
      }),
    ).not.toThrow();
  });

  it('student cannot manage module release rules', () => {
    expect(() =>
      assertCorePermission({
        tenantId,
        courseId,
        actorId: studentId,
        memberships: [studentMembership],
        permission: 'manage_module_release_rules',
      }),
    ).toThrow();
  });

  it('student can view their own module release status', () => {
    expect(() =>
      assertCorePermission({
        tenantId,
        courseId,
        actorId: studentId,
        memberships: [studentMembership],
        permission: 'view_module_release_status',
      }),
    ).not.toThrow();
  });

  it('instructor can view module release status', () => {
    expect(() =>
      assertCorePermission({
        tenantId,
        courseId,
        actorId: instructorId,
        memberships: [instructorMembership],
        permission: 'view_module_release_status',
      }),
    ).not.toThrow();
  });

  it('teaching_assistant can manage module release rules', () => {
    const taMembership = {
      ...instructorMembership,
      id: '01J9QW7B6N5W2YH3D3A1V0KE30',
      userId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      role: 'teaching_assistant',
    } as TenantMembership;
    expect(() =>
      assertCorePermission({
        tenantId,
        courseId,
        actorId: taMembership.userId,
        memberships: [taMembership],
        permission: 'manage_module_release_rules',
      }),
    ).not.toThrow();
  });
});
