import {
  type CourseMembership,
  CourseMembership as CourseMembershipSchema,
  type TenantMembership,
  TenantMembership as TenantMembershipSchema,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  assertCorePermission,
  canCourseRolePerform,
  canRolePerform,
} from '../src/permissions/evaluator.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const instructorId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const otherStudentId = '01J9QW7B6N5W2YH3D3A1V0KE33';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE30';

const membership = (userId: string, role: TenantMembership['role']): TenantMembership =>
  TenantMembershipSchema.parse({
    id: role === 'student' ? '01J9QW7B6N5W2YH3D3A1V0KE2X' : '01J9QW7B6N5W2YH3D3A1V0KE2Y',
    tenantId,
    userId,
    role,
    createdAt: now,
    updatedAt: now,
  });

const courseMembership = (userId: string, role: CourseMembership['role']): CourseMembership =>
  CourseMembershipSchema.parse({
    id: role === 'student' ? '01J9QW7B6N5W2YH3D3A1V0KE31' : '01J9QW7B6N5W2YH3D3A1V0KE32',
    tenantId,
    courseId,
    userId,
    role,
    createdAt: now,
    updatedAt: now,
  });

describe('Core permission evaluator', () => {
  it('prevents students from accessing teacher-only AI feedback drafts', () => {
    expect(canRolePerform('student', 'view_ai_feedback_draft')).toBe(false);

    expect(() =>
      assertCorePermission({
        tenantId,
        actorId: studentId,
        memberships: [membership(studentId, 'student')],
        permission: 'view_ai_feedback_draft',
      }),
    ).toThrow(/not allowed/);
  });

  it('allows instructors and teaching assistants to review AI drafts', () => {
    expect(canRolePerform('instructor', 'view_ai_feedback_draft')).toBe(true);
    expect(canRolePerform('teaching_assistant', 'review_ai_feedback_draft')).toBe(true);

    expect(() =>
      assertCorePermission({
        tenantId,
        actorId: instructorId,
        memberships: [membership(instructorId, 'instructor')],
        permission: 'review_ai_feedback_draft',
      }),
    ).not.toThrow();
  });

  it('keeps AI service accounts narrower than instructor permissions', () => {
    expect(canRolePerform('ai_service_account', 'build_ai_context')).toBe(true);
    expect(canRolePerform('ai_service_account', 'publish_feedback')).toBe(false);
    expect(canRolePerform('ai_service_account', 'manage_grades')).toBe(false);
  });

  it('checks course-scoped roles for course actions', () => {
    expect(canCourseRolePerform('student', 'request_submission_precheck')).toBe(true);
    expect(canCourseRolePerform('student', 'view_ai_feedback_draft')).toBe(false);

    expect(() =>
      assertCorePermission({
        tenantId,
        courseId,
        actorId: studentId,
        memberships: [],
        courseMemberships: [courseMembership(studentId, 'student')],
        permission: 'request_submission_precheck',
      }),
    ).not.toThrow();
  });

  it('allows students to view only their own published feedback', () => {
    expect(() =>
      assertCorePermission({
        tenantId,
        courseId,
        actorId: studentId,
        resourceOwnerId: studentId,
        memberships: [],
        courseMemberships: [courseMembership(studentId, 'student')],
        permission: 'view_published_feedback',
      }),
    ).not.toThrow();

    expect(() =>
      assertCorePermission({
        tenantId,
        courseId,
        actorId: studentId,
        resourceOwnerId: otherStudentId,
        memberships: [],
        courseMemberships: [courseMembership(studentId, 'student')],
        permission: 'view_published_feedback',
      }),
    ).toThrow(/own published feedback/);
  });

  it('allows elevated tenant roles to view another student feedback when the actor also has a student role', () => {
    expect(() =>
      assertCorePermission({
        tenantId,
        courseId,
        actorId: instructorId,
        resourceOwnerId: otherStudentId,
        memberships: [membership(instructorId, 'student'), membership(instructorId, 'instructor')],
        permission: 'view_published_feedback',
      }),
    ).not.toThrow();
  });

  it('allows elevated course roles to view another student feedback when the actor also has a student role', () => {
    expect(() =>
      assertCorePermission({
        tenantId,
        courseId,
        actorId: instructorId,
        resourceOwnerId: otherStudentId,
        memberships: [],
        courseMemberships: [
          courseMembership(instructorId, 'student'),
          courseMembership(instructorId, 'teaching_assistant'),
        ],
        permission: 'view_published_feedback',
      }),
    ).not.toThrow();
  });
});
