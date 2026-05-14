import {
  type Course,
  type CourseMembership,
  CourseMembershipStatus,
  type CourseRole,
  Lti1p3NamesRolesMembershipContainer,
  type Lti1p3NamesRolesMembershipContainer as Lti1p3NamesRolesMembershipContainerContract,
  type Lti1p3NamesRolesRole,
  type User,
  lti1p3InstructorRole,
  lti1p3LearnerRole,
  lti1p3TeachingAssistantRole,
} from '@openlms/contracts';

export type Lti1p3NamesRolesRosterMember = {
  membership: CourseMembership;
  user: User;
};

const mapCourseRoleToLtiRole = (role: CourseRole): Lti1p3NamesRolesRole => {
  switch (role) {
    case 'student':
      return lti1p3LearnerRole;
    case 'teaching_assistant':
      return lti1p3TeachingAssistantRole;
    case 'instructor':
    case 'course_admin':
      return lti1p3InstructorRole;
  }
};

export const buildLti1p3NamesRolesMembershipContainer = (input: {
  serviceUrl: string;
  course: Course;
  members: Lti1p3NamesRolesRosterMember[];
  role?: Lti1p3NamesRolesRole;
}): Lti1p3NamesRolesMembershipContainerContract => {
  const projectedMembers = input.members
    .map((member) => {
      const ltiRole = mapCourseRoleToLtiRole(member.membership.role);

      return {
        status:
          CourseMembershipStatus.parse(member.membership.status) === 'active'
            ? 'Active'
            : 'Inactive',
        name: member.user.displayName,
        email: member.user.email,
        user_id: member.user.id,
        roles: [ltiRole],
      };
    })
    .filter((member) => input.role === undefined || member.roles.includes(input.role));

  return Lti1p3NamesRolesMembershipContainer.parse({
    id: input.serviceUrl,
    context: {
      id: input.course.id,
      label: input.course.code,
      title: input.course.title,
    },
    members: projectedMembers,
  });
};
