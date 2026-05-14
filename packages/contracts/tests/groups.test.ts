import { describe, expect, it } from 'vitest';
import { CourseGroup, CourseGroupMember, CourseGroupSet } from '../src/index.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const groupSetId = '01J9QW7B6N5W2YH3D3A1V0KE55';
const groupId = '01J9QW7B6N5W2YH3D3A1V0KE56';
const groupMemberId = '01J9QW7B6N5W2YH3D3A1V0KE57';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';

describe('course groups contracts', () => {
  it('validates course group sets', () => {
    expect(
      CourseGroupSet.parse({
        id: groupSetId,
        tenantId,
        courseId,
        name: 'Project teams',
        selfSignupEnabled: false,
        status: 'active',
        position: 0,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({ id: groupSetId, status: 'active' });
  });

  it('validates course groups and their members', () => {
    const group = CourseGroup.parse({
      id: groupId,
      tenantId,
      courseId,
      groupSetId,
      name: 'Team Alpha',
      description: 'Collaborative evidence project group.',
      status: 'active',
      position: 1,
      createdAt: now,
      updatedAt: now,
    });

    const member = CourseGroupMember.parse({
      id: groupMemberId,
      tenantId,
      groupId,
      userId: studentId,
      role: 'member',
      createdAt: now,
      updatedAt: now,
    });

    expect(group.groupSetId).toBe(groupSetId);
    expect(member.role).toBe('member');
  });
});
