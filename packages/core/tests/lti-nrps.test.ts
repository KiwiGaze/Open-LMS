import {
  CourseId,
  CourseMembershipId,
  TenantId,
  UserId,
  lti1p3LearnerRole,
  lti1p3NamesRolesContextMembershipReadonlyScope,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { buildLti1p3NamesRolesMembershipContainer } from '../src/lti/nrps.ts';

const tenantId = TenantId.parse('01J9QW7B6N5W2YH3D3A1V0KE2T');
const courseId = CourseId.parse('01J9QW7B6N5W2YH3D3A1V0KE2S');
const membershipId = CourseMembershipId.parse('01J9QW7B6N5W2YH3D3A1V0KE41');
const userId = UserId.parse('01J9QW7B6N5W2YH3D3A1V0KE42');
const now = new Date('2026-05-10T00:00:00.000Z');

describe('LTI 1.3 Names and Role Provisioning Services', () => {
  it('projects active course memberships into an NRPS context membership container', () => {
    const container = buildLti1p3NamesRolesMembershipContainer({
      serviceUrl:
        'https://lms.example.edu/api/v1/tenants/01J9QW7B6N5W2YH3D3A1V0KE2T/courses/01J9QW7B6N5W2YH3D3A1V0KE2S/lti-1p3/namesroles',
      course: {
        id: courseId,
        tenantId,
        code: 'WRIT-101',
        title: 'Evidence-Based Writing',
        status: 'active',
        startsAt: null,
        endsAt: null,
        catalogCategory: null,
        academicTerm: null,
        maxEnrollments: null,
        waitlistEnabled: false,
        enrollmentApprovalRequired: false,
        isBlueprint: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      members: [
        {
          membership: {
            id: membershipId,
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
          },
          user: {
            id: userId,
            email: 'ada@example.edu',
            displayName: 'Ada Lovelace',
            emailVerified: true,
            status: 'active',
            deletedAt: null,
            retainUntil: null,
            locale: null,
            timezone: null,
            createdAt: now,
            updatedAt: now,
          },
        },
      ],
    });

    expect(container).toEqual({
      id: 'https://lms.example.edu/api/v1/tenants/01J9QW7B6N5W2YH3D3A1V0KE2T/courses/01J9QW7B6N5W2YH3D3A1V0KE2S/lti-1p3/namesroles',
      context: {
        id: courseId,
        label: 'WRIT-101',
        title: 'Evidence-Based Writing',
      },
      members: [
        {
          status: 'Active',
          name: 'Ada Lovelace',
          email: 'ada@example.edu',
          user_id: '01J9QW7B6N5W2YH3D3A1V0KE42',
          roles: [lti1p3LearnerRole],
        },
      ],
    });
  });

  it('exposes the standard NRPS readonly scope constant', () => {
    expect(lti1p3NamesRolesContextMembershipReadonlyScope).toBe(
      'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
    );
  });
});
