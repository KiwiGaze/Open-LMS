import type {
  CourseMembership,
  CourseRole,
  TenantMembership,
  TenantRole,
} from '@openlms/contracts';

export type CorePermission =
  | 'manage_courses'
  | 'manage_assignments'
  | 'submit_work'
  | 'request_submission_precheck'
  | 'request_feedback_draft'
  | 'view_ai_feedback_draft'
  | 'review_ai_feedback_draft'
  | 'publish_feedback'
  | 'view_published_feedback'
  | 'manage_grades'
  | 'build_ai_context'
  | 'view_audit_log'
  | 'manage_ai_policy'
  | 'manage_module_release_rules'
  | 'view_module_release_status';

export type AssertCorePermissionInput = {
  tenantId: string;
  courseId?: string;
  actorId: string;
  resourceOwnerId?: string;
  memberships: TenantMembership[];
  courseMemberships?: CourseMembership[];
  permission: CorePermission;
};

const permissionsByRole = {
  student: new Set<CorePermission>([
    'submit_work',
    'request_submission_precheck',
    'view_published_feedback',
    'view_module_release_status',
  ]),
  instructor: new Set<CorePermission>([
    'manage_courses',
    'manage_assignments',
    'request_feedback_draft',
    'view_ai_feedback_draft',
    'review_ai_feedback_draft',
    'publish_feedback',
    'view_published_feedback',
    'manage_grades',
    'view_audit_log',
    'manage_module_release_rules',
    'view_module_release_status',
  ]),
  teaching_assistant: new Set<CorePermission>([
    'request_feedback_draft',
    'view_ai_feedback_draft',
    'review_ai_feedback_draft',
    'publish_feedback',
    'view_published_feedback',
    'view_audit_log',
    'manage_module_release_rules',
    'view_module_release_status',
  ]),
  course_admin: new Set<CorePermission>([
    'manage_courses',
    'manage_assignments',
    'request_feedback_draft',
    'view_ai_feedback_draft',
    'review_ai_feedback_draft',
    'publish_feedback',
    'view_published_feedback',
    'manage_grades',
    'view_audit_log',
    'manage_ai_policy',
    'manage_module_release_rules',
    'view_module_release_status',
  ]),
  institution_admin: new Set<CorePermission>([
    'manage_courses',
    'manage_assignments',
    'request_feedback_draft',
    'view_ai_feedback_draft',
    'review_ai_feedback_draft',
    'publish_feedback',
    'view_published_feedback',
    'manage_grades',
    'view_audit_log',
    'manage_ai_policy',
    'manage_module_release_rules',
    'view_module_release_status',
  ]),
  ai_service_account: new Set<CorePermission>(['build_ai_context']),
  integration_service_account: new Set<CorePermission>(['view_audit_log']),
} satisfies Record<TenantRole, Set<CorePermission>>;

export const canRolePerform = (role: TenantRole, permission: CorePermission): boolean =>
  permissionsByRole[role].has(permission);

const permissionsByCourseRole = {
  student: new Set<CorePermission>([
    'submit_work',
    'request_submission_precheck',
    'view_published_feedback',
  ]),
  instructor: permissionsByRole.instructor,
  teaching_assistant: permissionsByRole.teaching_assistant,
  course_admin: permissionsByRole.course_admin,
} satisfies Record<CourseRole, Set<CorePermission>>;

export const canCourseRolePerform = (role: CourseRole, permission: CorePermission): boolean =>
  permissionsByCourseRole[role].has(permission);

const canMembershipUsePermission = (
  role: TenantRole | CourseRole,
  permission: CorePermission,
  input: AssertCorePermissionInput,
): boolean => {
  if (role === 'student' && permission === 'view_published_feedback') {
    return input.resourceOwnerId === input.actorId;
  }

  return true;
};

const isStudentFeedbackOwnershipRestriction = (
  role: TenantRole | CourseRole,
  permission: CorePermission,
): boolean => role === 'student' && permission === 'view_published_feedback';

export const assertCorePermission = (input: AssertCorePermissionInput): void => {
  const actorMemberships = input.memberships.filter(
    (membership) => membership.tenantId === input.tenantId && membership.userId === input.actorId,
  );
  let studentFeedbackOwnershipDenied = false;

  for (const membership of actorMemberships) {
    if (!canRolePerform(membership.role, input.permission)) {
      continue;
    }

    if (canMembershipUsePermission(membership.role, input.permission, input)) {
      return;
    }

    if (isStudentFeedbackOwnershipRestriction(membership.role, input.permission)) {
      studentFeedbackOwnershipDenied = true;
    }
  }

  const actorCourseMemberships = (input.courseMemberships ?? []).filter(
    (membership) =>
      membership.tenantId === input.tenantId &&
      membership.userId === input.actorId &&
      membership.courseId === input.courseId,
  );

  for (const membership of actorCourseMemberships) {
    if (!canCourseRolePerform(membership.role, input.permission)) {
      continue;
    }

    if (canMembershipUsePermission(membership.role, input.permission, input)) {
      return;
    }

    if (isStudentFeedbackOwnershipRestriction(membership.role, input.permission)) {
      studentFeedbackOwnershipDenied = true;
    }
  }

  if (actorMemberships.length === 0 && actorCourseMemberships.length === 0) {
    throw new Error('Permission denied: actor is not a member of this tenant or course.');
  }

  if (studentFeedbackOwnershipDenied) {
    throw new Error('Permission denied: students can view only their own published feedback.');
  }

  throw new Error(
    `Permission denied: actor is not allowed to perform "${input.permission}". Ask an authorized instructor or administrator to continue.`,
  );
};
