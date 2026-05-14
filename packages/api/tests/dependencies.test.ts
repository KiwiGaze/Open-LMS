import { CourseId, CourseModuleId, Rubric, UserId } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  canAccessReleasedCoursePage,
  canAccessReleasedModuleItem,
  canViewAssignment,
  canViewAttendanceSession,
  canViewCompletionRequirement,
  canViewConversationThread,
  canViewCourseContentItem,
  canViewCourseGroup,
  canViewCoursePage,
  canViewCourseRoster,
  canViewCourseSection,
  canViewCourseSyllabus,
  canViewCredential,
  canViewDiscussionPost,
  canViewDiscussionTopic,
  canViewLearningObjective,
  canViewQuiz,
  canViewSubmissionAttachment,
  canViewSubmissionScopedResource,
  createApiDependencies,
  createReleaseVisibilityIndex,
  selectVisibleAssignmentRubric,
  visibleSubmissionCommentVisibilities,
} from '../src/dependencies.ts';

const actorId = UserId.parse('01J9QW7B6N5W2YH3D3A1V0KE2W');
const otherStudentId = UserId.parse('01J9QW7B6N5W2YH3D3A1V0KE2X');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';
const courseId = CourseId.parse('01J9QW7B6N5W2YH3D3A1V0KE2Z');
const moduleId = CourseModuleId.parse('01J9QW7B6N5W2YH3D3A1V0KE34');
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE35';
const resourceId = '01J9QW7B6N5W2YH3D3A1V0KE36';
const pageId = '01J9QW7B6N5W2YH3D3A1V0KE37';
const rubricId = '01J9QW7B6N5W2YH3D3A1V0KE30';
const now = new Date('2026-05-10T00:00:00.000Z');
const rubric = Rubric.parse({
  id: rubricId,
  tenantId,
  title: 'Evidence rubric',
  version: 1,
  sourceTemplateId: null,
  criteria: [
    {
      id: 'evidence',
      label: 'Evidence',
      description: 'Uses evidence and explains why it matters.',
      evidenceRequired: true,
      levels: [
        {
          id: 'developing',
          label: 'Developing',
          description: 'Evidence is present but weakly explained.',
          points: 2,
        },
      ],
    },
  ],
  createdAt: now,
  updatedAt: now,
});

describe('API dependencies', () => {
  it('requires a database connection string for real dependencies', () => {
    expect(() => createApiDependencies({})).toThrow(
      'DATABASE_CONNECTION_STRING is required to start the API server.',
    );
  });

  it('hides draft and staff-only course content from ordinary course members', () => {
    expect(
      canViewCourseContentItem({ visibility: 'published', accessPolicy: 'course_member' }, false),
    ).toBe(true);
    expect(
      canViewCourseContentItem({ visibility: 'draft', accessPolicy: 'course_member' }, false),
    ).toBe(false);
    expect(
      canViewCourseContentItem({ visibility: 'published', accessPolicy: 'course_staff' }, false),
    ).toBe(false);
    expect(
      canViewCourseContentItem({ visibility: 'draft', accessPolicy: 'course_staff' }, true),
    ).toBe(true);
  });

  it('hides inactive learning objectives from ordinary course members', () => {
    expect(canViewLearningObjective({ status: 'active' }, false)).toBe(true);
    expect(canViewLearningObjective({ status: 'draft' }, false)).toBe(false);
    expect(canViewLearningObjective({ status: 'archived' }, false)).toBe(false);
    expect(canViewLearningObjective({ status: 'draft' }, true)).toBe(true);
  });

  it('hides unpublished course pages from ordinary course members', () => {
    expect(canViewCoursePage({ visibility: 'published' }, false)).toBe(true);
    expect(canViewCoursePage({ visibility: 'draft' }, false)).toBe(false);
    expect(canViewCoursePage({ visibility: 'archived' }, false)).toBe(false);
    expect(canViewCoursePage({ visibility: 'draft' }, true)).toBe(true);
  });

  it('hides unpublished course syllabi from ordinary course members', () => {
    expect(canViewCourseSyllabus({ visibility: 'published' }, false)).toBe(true);
    expect(canViewCourseSyllabus({ visibility: 'draft' }, false)).toBe(false);
    expect(canViewCourseSyllabus({ visibility: 'archived' }, false)).toBe(false);
    expect(canViewCourseSyllabus({ visibility: 'draft' }, true)).toBe(true);
  });

  it('hides archived course sections from ordinary course members', () => {
    expect(canViewCourseSection({ status: 'active' }, false)).toBe(true);
    expect(canViewCourseSection({ status: 'archived' }, false)).toBe(false);
    expect(canViewCourseSection({ status: 'archived' }, true)).toBe(true);
  });

  it('hides unpublished discussion content from ordinary course members', () => {
    expect(canViewDiscussionTopic({ visibility: 'published' }, false)).toBe(true);
    expect(canViewDiscussionTopic({ visibility: 'draft' }, false)).toBe(false);
    expect(canViewDiscussionTopic({ visibility: 'archived' }, false)).toBe(false);
    expect(canViewDiscussionTopic({ visibility: 'draft' }, true)).toBe(true);
    expect(canViewDiscussionPost({ status: 'published', authorId: actorId }, false)).toBe(true);
    expect(canViewDiscussionPost({ status: 'draft', authorId: actorId }, false, actorId)).toBe(
      true,
    );
    expect(
      canViewDiscussionPost({ status: 'draft', authorId: actorId }, false, otherStudentId),
    ).toBe(false);
    expect(canViewDiscussionPost({ status: 'hidden', authorId: actorId }, false)).toBe(false);
    expect(canViewDiscussionPost({ status: 'deleted', authorId: actorId }, false)).toBe(false);
    expect(canViewDiscussionPost({ status: 'hidden', authorId: actorId }, true)).toBe(true);
  });

  it('hides unpublished quizzes from ordinary course members', () => {
    expect(canViewQuiz({ status: 'published' }, false)).toBe(true);
    expect(canViewQuiz({ status: 'draft' }, false)).toBe(false);
    expect(canViewQuiz({ status: 'archived' }, false)).toBe(false);
    expect(canViewQuiz({ status: 'draft' }, true)).toBe(true);
  });

  it('hides unpublished assignment rubrics from ordinary course members', () => {
    expect(canViewAssignment({ status: 'published' }, false)).toBe(true);
    expect(canViewAssignment({ status: 'draft' }, false)).toBe(false);
    expect(canViewAssignment({ status: 'archived' }, false)).toBe(false);
    expect(canViewAssignment({ status: 'draft' }, true)).toBe(true);
  });

  it('uses release decisions to hide module-scoped items from learners', () => {
    const releaseVisibility = createReleaseVisibilityIndex([
      {
        moduleId,
        targetType: 'module',
        targetId: null,
        state: 'locked',
      },
      {
        moduleId,
        targetType: 'assignment',
        targetId: assignmentId,
        state: 'released',
      },
    ]);

    expect(
      canAccessReleasedModuleItem({ id: assignmentId, moduleId }, 'assignment', releaseVisibility),
    ).toBe(false);
    expect(
      canAccessReleasedModuleItem(
        { id: resourceId, moduleId: null },
        'course_resource',
        releaseVisibility,
      ),
    ).toBe(true);
    expect(canAccessReleasedModuleItem({ id: assignmentId, moduleId }, 'assignment', null)).toBe(
      true,
    );
  });

  it('uses release decisions to hide item-scoped targets from learners', () => {
    const releaseVisibility = createReleaseVisibilityIndex([
      {
        moduleId,
        targetType: 'module',
        targetId: null,
        state: 'released',
      },
      {
        moduleId,
        targetType: 'course_resource',
        targetId: resourceId,
        state: 'locked',
      },
      {
        moduleId,
        targetType: 'course_page',
        targetId: pageId,
        state: 'locked',
      },
    ]);

    expect(
      canAccessReleasedModuleItem(
        { id: resourceId, moduleId },
        'course_resource',
        releaseVisibility,
      ),
    ).toBe(false);
    expect(canAccessReleasedCoursePage({ id: pageId }, releaseVisibility)).toBe(false);
    expect(canAccessReleasedCoursePage({ id: pageId }, null)).toBe(true);
  });

  it('locks a page when any module context locks the same page target', () => {
    const otherModuleId = CourseModuleId.parse('01J9QW7B6N5W2YH3D3A1V0KE38');
    const releaseVisibility = createReleaseVisibilityIndex([
      {
        moduleId,
        targetType: 'course_page',
        targetId: pageId,
        state: 'released',
      },
      {
        moduleId: otherModuleId,
        targetType: 'course_page',
        targetId: pageId,
        state: 'locked',
      },
    ]);

    expect(canAccessReleasedCoursePage({ id: pageId }, releaseVisibility)).toBe(false);
  });

  it('selects assignment rubrics only when the assignment is visible in the requested course', () => {
    const publishedAssignment = {
      courseId,
      activeRubricId: rubric.id,
      status: 'published' as const,
    };
    const draftAssignment = {
      ...publishedAssignment,
      status: 'draft' as const,
    };

    expect(selectVisibleAssignmentRubric(publishedAssignment, rubric, courseId, false)).toEqual(
      rubric,
    );
    expect(selectVisibleAssignmentRubric(draftAssignment, rubric, courseId, false)).toBeNull();
    expect(selectVisibleAssignmentRubric(draftAssignment, rubric, courseId, true)).toEqual(rubric);
    expect(
      selectVisibleAssignmentRubric(
        { ...publishedAssignment, courseId: CourseId.parse('01J9QW7B6N5W2YH3D3A1V0KE31') },
        rubric,
        courseId,
        true,
      ),
    ).toBeNull();
    expect(
      selectVisibleAssignmentRubric(
        { ...publishedAssignment, activeRubricId: null },
        rubric,
        courseId,
        true,
      ),
    ).toBeNull();
    expect(selectVisibleAssignmentRubric(publishedAssignment, null, courseId, true)).toBeNull();
  });

  it('hides cancelled attendance sessions from ordinary course members', () => {
    expect(canViewAttendanceSession({ status: 'scheduled' }, false)).toBe(true);
    expect(canViewAttendanceSession({ status: 'completed' }, false)).toBe(true);
    expect(canViewAttendanceSession({ status: 'cancelled' }, false)).toBe(false);
    expect(canViewAttendanceSession({ status: 'cancelled' }, true)).toBe(true);
  });

  it('hides archived completion requirements from ordinary course members', () => {
    expect(canViewCompletionRequirement({ status: 'active' }, false)).toBe(true);
    expect(canViewCompletionRequirement({ status: 'archived' }, false)).toBe(false);
    expect(canViewCompletionRequirement({ status: 'archived' }, true)).toBe(true);
  });

  it('hides unpublished credentials from ordinary course members', () => {
    expect(canViewCredential({ status: 'published' }, false)).toBe(true);
    expect(canViewCredential({ status: 'draft' }, false)).toBe(false);
    expect(canViewCredential({ status: 'archived' }, false)).toBe(false);
    expect(canViewCredential({ status: 'draft' }, true)).toBe(true);
  });

  it('hides conversations from non-participants unless they are staff', () => {
    expect(
      canViewConversationThread({ participantIds: ['01J9QW7B6N5W2YH3D3A1V0KE2W'] }, actorId, false),
    ).toBe(true);
    expect(
      canViewConversationThread({ participantIds: ['01J9QW7B6N5W2YH3D3A1V0KE2X'] }, actorId, false),
    ).toBe(false);
    expect(
      canViewConversationThread({ participantIds: ['01J9QW7B6N5W2YH3D3A1V0KE2X'] }, actorId, true),
    ).toBe(true);
  });

  it('hides inactive groups and non-member groups from ordinary course members', () => {
    expect(canViewCourseGroup({ status: 'active' }, true, false)).toBe(true);
    expect(canViewCourseGroup({ status: 'active' }, false, false)).toBe(false);
    expect(canViewCourseGroup({ status: 'archived' }, true, false)).toBe(false);
    expect(canViewCourseGroup({ status: 'archived' }, false, true)).toBe(true);
  });

  it('allows only course or tenant staff to view course rosters', () => {
    expect(canViewCourseRoster({ hasTenantStaffAccess: false, hasCourseStaffAccess: false })).toBe(
      false,
    );
    expect(canViewCourseRoster({ hasTenantStaffAccess: true, hasCourseStaffAccess: false })).toBe(
      true,
    );
    expect(canViewCourseRoster({ hasTenantStaffAccess: false, hasCourseStaffAccess: true })).toBe(
      true,
    );
  });

  it('allows staff or the owning student to view submission attachments', () => {
    expect(
      canViewSubmissionAttachment({ studentId: actorId }, actorId, {
        hasTenantStaffAccess: false,
        hasCourseStaffAccess: false,
      }),
    ).toBe(true);
    expect(
      canViewSubmissionAttachment({ studentId: otherStudentId }, actorId, {
        hasTenantStaffAccess: false,
        hasCourseStaffAccess: false,
      }),
    ).toBe(false);
    expect(
      canViewSubmissionAttachment({ studentId: otherStudentId }, actorId, {
        hasTenantStaffAccess: true,
        hasCourseStaffAccess: false,
      }),
    ).toBe(true);
    expect(
      canViewSubmissionAttachment({ studentId: otherStudentId }, actorId, {
        hasTenantStaffAccess: false,
        hasCourseStaffAccess: true,
      }),
    ).toBe(true);
  });

  it('allows staff or the owning student to view submission-scoped resources', () => {
    expect(
      canViewSubmissionScopedResource({ studentId: actorId }, actorId, {
        hasTenantStaffAccess: false,
        hasCourseStaffAccess: false,
      }),
    ).toBe(true);
    expect(
      canViewSubmissionScopedResource({ studentId: otherStudentId }, actorId, {
        hasTenantStaffAccess: false,
        hasCourseStaffAccess: false,
      }),
    ).toBe(false);
    expect(
      canViewSubmissionScopedResource({ studentId: otherStudentId }, actorId, {
        hasTenantStaffAccess: true,
        hasCourseStaffAccess: false,
      }),
    ).toBe(true);
    expect(
      canViewSubmissionScopedResource({ studentId: otherStudentId }, actorId, {
        hasTenantStaffAccess: false,
        hasCourseStaffAccess: true,
      }),
    ).toBe(true);
  });

  it('limits submission comment visibility for students while staff can see internal notes', () => {
    expect(
      visibleSubmissionCommentVisibilities({
        hasTenantStaffAccess: false,
        hasCourseStaffAccess: false,
      }),
    ).toEqual(['student_visible']);
    expect(
      visibleSubmissionCommentVisibilities({
        hasTenantStaffAccess: true,
        hasCourseStaffAccess: false,
      }),
    ).toEqual(['student_visible', 'staff_only', 'peer_reviewer_visible']);
    expect(
      visibleSubmissionCommentVisibilities({
        hasTenantStaffAccess: false,
        hasCourseStaffAccess: true,
      }),
    ).toEqual(['student_visible', 'staff_only', 'peer_reviewer_visible']);
    expect(
      visibleSubmissionCommentVisibilities(
        {
          hasTenantStaffAccess: false,
          hasCourseStaffAccess: false,
        },
        { canViewStudentVisible: false, canViewPeerReviewerVisible: true },
      ),
    ).toEqual(['peer_reviewer_visible']);
  });
});
