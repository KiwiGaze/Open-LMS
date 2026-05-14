import { describe, expect, it } from 'vitest';
import { CourseMembership, TenantMembership } from '../src/index.ts';

const now = new Date('2026-05-10T00:00:00.000Z');

describe('membership contracts', () => {
  it('models tenant roles and course-scoped roles separately', () => {
    const tenantMembership = TenantMembership.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      userId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
      role: 'institution_admin',
      createdAt: now,
      updatedAt: now,
    });
    const courseMembership = CourseMembership.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      tenantId: tenantMembership.tenantId,
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
      userId: tenantMembership.userId,
      role: 'instructor',
      status: 'invited',
      invitedAt: now,
      acceptedAt: null,
      droppedAt: null,
      withdrawnAt: null,
      createdAt: now,
      updatedAt: now,
    });

    expect(tenantMembership.role).toBe('institution_admin');
    expect(courseMembership.role).toBe('instructor');
    expect(courseMembership.status).toBe('invited');
  });

  it('defaults existing course memberships to active lifecycle state', () => {
    const courseMembership = CourseMembership.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE30',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      userId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      role: 'student',
      createdAt: now,
      updatedAt: now,
    });

    expect(courseMembership.status).toBe('active');
    expect(courseMembership.invitedAt).toBeNull();
    expect(courseMembership.droppedAt).toBeNull();
  });

  it('models self-enrollment requests waiting for staff approval', () => {
    const courseMembership = CourseMembership.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE34',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE35',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE36',
      userId: '01J9QW7B6N5W2YH3D3A1V0KE37',
      role: 'student',
      status: 'pending_approval',
      createdAt: now,
      updatedAt: now,
    });

    expect(courseMembership.status).toBe('pending_approval');
    expect(courseMembership.acceptedAt).toBeNull();
  });
});
