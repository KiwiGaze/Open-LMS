import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { generateOpenApiDocument } from '../src/openapi.ts';

const checkedInOpenApiPath = fileURLToPath(
  new URL('../../../openapi/openapi.json', import.meta.url),
);

describe('OpenAPI generation', () => {
  it('keeps the checked-in OpenAPI artifact aligned with generated output', () => {
    const document = generateOpenApiDocument();
    const checkedInDocument = readFileSync(checkedInOpenApiPath, 'utf8');

    expect(checkedInDocument).toBe(`${JSON.stringify(document, null, 2)}\n`);
  });

  it('generates a stable OpenAPI document for the public API surface', () => {
    const document = generateOpenApiDocument();

    expect(document.openapi).toBe('3.0.3');
    expect(document.info).toMatchObject({
      title: 'Open-LMS API',
      version: '0.0.0',
    });
    expect(document.servers).toEqual([{ url: '/' }]);
    expect(Object.keys(document.paths)).toEqual([
      '/health',
      '/api/v1/tenants',
      '/api/v1/onboarding/create-tenant',
      '/api/v1/tenants/{tenantId}/members',
      '/api/v1/tenants/{tenantId}/messageable-users',
      '/api/v1/tenants/{tenantId}/file-storage-quotas',
      '/api/v1/tenants/{tenantId}/webhook-subscriptions',
      '/api/v1/tenants/{tenantId}/webhook-subscriptions/{webhookSubscriptionId}',
      '/api/v1/tenants/{tenantId}/feature-flags',
      '/api/v1/tenants/{tenantId}/feature-flags/{key}',
      '/api/v1/tenants/{tenantId}/ai/usage-summary',
      '/api/v1/tenants/{tenantId}/provider-config',
      '/api/v1/tenants/{tenantId}/lti-1p3/jwks',
      '/api/v1/lti-1p3/authorize',
      '/api/v1/tenants/{tenantId}/lti-1p3/token',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/lti-1p3/namesroles',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/external-tools/{toolId}/lti-ags/lineitem/scores',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/external-tools/{toolId}/lti-ags/lineitem/results',
      '/api/v1/lti-1p3/deep-linking/return',
      '/api/v1/tenants/{tenantId}/ai/actions',
      '/api/v1/tenants/{tenantId}/xapi/statements',
      '/api/v1/tenants/{tenantId}/audit-logs',
      '/api/v1/tenants/{tenantId}/audit-logs/export.csv',
      '/api/v1/tenants/{tenantId}/legal-holds',
      '/api/v1/tenants/{tenantId}/legal-holds/{legalHoldId}/release',
      '/api/v1/tenants/{tenantId}/retention-policies',
      '/api/v1/tenants/{tenantId}/retention-policies/{targetType}',
      '/api/v1/tenants/{tenantId}/ai/usage-by-action',
      '/api/v1/tenants/{tenantId}/ai/usage-by-actor',
      '/api/v1/tenants/{tenantId}/memberships/{membershipId}',
      '/api/v1/me',
      '/api/v1/me/tenant-memberships',
      '/api/v1/me/course-memberships',
      '/api/v1/tenants/{tenantId}/courses',
      '/api/v1/tenants/{tenantId}/catalog/courses',
      '/api/v1/tenants/{tenantId}/favorites',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/favorite',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/next-position',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/reorder',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/copy',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/backup',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/common-cartridge',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/analytics/summary',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/restore',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/common-cartridge/import',
      '/api/v1/tenants/{tenantId}/courses/{courseId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/restore-deleted',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/catalog-settings',
      '/api/v1/tenants/{tenantId}/rubrics',
      '/api/v1/tenants/{tenantId}/rubrics/{rubricId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/sections',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{courseSectionId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/announcements',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/announcements/{announcementId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/messageable-users',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships/{courseMembershipId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/self-enroll',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships/bulk',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships/import-csv',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships/export.csv',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships/bulk-delete',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/effective-schedule',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/lti-outcomes',
      '/api/v1/tenants/{tenantId}/submissions/{submissionId}/plagiarism-reports',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/overrides',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/overrides/{overrideId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/rubric',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/questions',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/qti-items',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/qti-items/import',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/overrides',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/overrides/{overrideId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/effective-settings',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/grades',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/question-grades',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/question-grades/{questionId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/regrade',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/submit',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/responses',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/responses/{questionId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks/{questionBankId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks/{questionBankId}/questions',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions/{sessionId}/records',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions/{sessionId}/records/{studentId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/completion-requirements',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/completion-requirements/{requirementId}/progress',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/credentials',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/credentials/{credentialId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/credentials/{credentialId}/awards',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/conversations',
      '/api/v1/tenants/{tenantId}/inbox/threads',
      '/api/v1/tenants/{tenantId}/inbox/threads/{threadId}/messages',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/conversations/{threadId}/messages',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/group-sets',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/group-sets/{groupSetId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/groups',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/groups/{groupId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/groups/{groupId}/members',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/groups/{groupId}/join',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/groups/{groupId}/membership',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/drafts/{draftId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/drafts/{draftId}/submit',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/peer-reviews',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/attachments',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/attachments/{attachmentId}/download',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/comments',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/grade',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/grades/batch',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/grades/import-csv',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/categories',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/categories/{gradebookCategoryId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/grading-schemes',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/final-grades',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/final-grades/export',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/final-grades/sis-submissions',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/grade/history',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/grade/appeals',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/appeals',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/appeals/{gradeAppealId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-gradebook',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-gradebook/export',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/export',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/manual-items',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/manual-items/{manualItemId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/manual-items/{manualItemId}/grades',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/manual-items/{manualItemId}/grades/{studentId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/modules',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{courseModuleId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/units',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/units/{courseUnitId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/resources',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/resources/{courseResourceId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objectives',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objectives/{learningObjectiveId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objectives/{learningObjectiveId}/coverage',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objective-mastery',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/syllabus',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/pages',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/pages/{pageId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/launch',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/deep-linking/launch',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/launch-response',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/subscription',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/posts',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/posts/{postId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/grades',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/posts/{postId}/grade',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/glossary',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/glossary/{glossaryEntryId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/wiki-pages',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/wiki-pages/{wikiPageId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/wiki-pages/{wikiPageId}/revisions',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/wiki-pages/{wikiPageId}/revisions/{baseRevision}/diff/{targetRevision}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/wiki-pages/{wikiPageId}/revisions/{revision}/restore',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/surveys',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/surveys/{surveyId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/surveys/{surveyId}/questions',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/surveys/{surveyId}/responses',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/calendar-events',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/calendar-events/occurrences',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/calendar-events/{eventId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/meetings',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/meetings/{meetingId}',
      '/api/v1/tenants/{tenantId}/calendar-items',
      '/api/v1/tenants/{tenantId}/calendar.ics',
      '/api/v1/tenants/{tenantId}/notifications',
      '/api/v1/tenants/{tenantId}/notifications/preferences',
      '/api/v1/tenants/{tenantId}/notifications/{notificationId}/read',
      '/api/v1/tenants/{tenantId}/push-tokens',
      '/api/v1/tenants/{tenantId}/push-tokens/{tokenId}',
      '/api/v1/tenants/{tenantId}/files',
      '/api/v1/tenants/{tenantId}/files/{fileId}',
      '/api/v1/tenants/{tenantId}/files/{fileId}/download',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-rules',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-rules/{ruleId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-policy',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-overrides',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-overrides/{studentId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/release-status',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/release-status/{studentId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/resources/{resourceId}/views',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/scorm-packages',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/scorm-packages/{scormPackageId}/attempt',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/scorm-packages/{scormPackageId}/runtime/bridge.js',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/scorm-packages/{scormPackageId}/runtime/initialize',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/scorm-packages/{scormPackageId}/runtime/commit',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/scorm-packages/{scormPackageId}/runtime/finish',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/peer-reviews/{peerReviewId}/responses',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/peer-reviews/{peerReviewId}/responses/{criterionId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{sectionId}/members',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{sectionId}/members/{studentId}',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{sectionId}/instructors',
      '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{sectionId}/instructors/{instructorId}',
    ]);
    expect(document.paths['/api/v1/openapi.json']).toBeUndefined();
  });

  it('reuses contract schemas for exposed resources', () => {
    const document = generateOpenApiDocument();

    expect(document.components?.schemas).toHaveProperty('HealthResponse');
    expect(document.components?.schemas).toHaveProperty('Tenant');
    expect(document.components?.schemas).toHaveProperty('TenantFeatureFlag');
    expect(document.components?.schemas).toHaveProperty('Course');
    expect(document.components?.schemas).toHaveProperty('CommonCartridgeCourseExport');
    expect(document.components?.schemas).toHaveProperty('CommonCartridgeImportRequest');
    expect(document.components?.schemas).toHaveProperty('CommonCartridgeImportResult');
    expect(document.components?.schemas).toHaveProperty('CourseSection');
    expect(document.components?.schemas).toHaveProperty('CourseAnnouncement');
    expect(document.components?.schemas).toHaveProperty('CourseMembership');
    expect(document.components?.schemas).toHaveProperty('Assignment');
    expect(document.components?.schemas).toHaveProperty('AssignmentOverride');
    expect(document.components?.schemas).toHaveProperty('Rubric');
    expect(document.components?.schemas).toHaveProperty('Quiz');
    expect(document.components?.schemas).toHaveProperty('QuizQuestion');
    expect(document.components?.schemas).toHaveProperty('QuizAttempt');
    expect(document.components?.schemas).toHaveProperty('QuizAttemptResponse');
    expect(document.components?.schemas).toHaveProperty('QuestionBank');
    expect(document.components?.schemas).toHaveProperty('QuestionBankQuestion');
    expect(document.components?.schemas).toHaveProperty('AttendanceSession');
    expect(document.components?.schemas).toHaveProperty('AttendanceRecord');
    expect(document.components?.schemas).toHaveProperty('CompletionRequirement');
    expect(document.components?.schemas).toHaveProperty('CompletionProgress');
    expect(document.components?.schemas).toHaveProperty('CourseCredential');
    expect(document.components?.schemas).toHaveProperty('CredentialAward');
    expect(document.components?.schemas).toHaveProperty('ConversationThread');
    expect(document.components?.schemas).toHaveProperty('ConversationMessage');
    expect(document.components?.schemas).toHaveProperty('CourseGroupSet');
    expect(document.components?.schemas).toHaveProperty('CourseGroup');
    expect(document.components?.schemas).toHaveProperty('CourseGroupMember');
    expect(document.components?.schemas).toHaveProperty('Submission');
    expect(document.components?.schemas).toHaveProperty('Draft');
    expect(document.components?.schemas).toHaveProperty('AssignmentPeerReview');
    expect(document.components?.schemas).toHaveProperty('SubmissionAttachment');
    expect(document.components?.schemas).toHaveProperty('SubmissionComment');
    expect(document.components?.schemas).toHaveProperty('GradebookCategory');
    expect(document.components?.schemas).toHaveProperty('CourseGradingScheme');
    expect(document.components?.schemas).toHaveProperty('GradebookEntry');
    expect(document.components?.schemas).toHaveProperty('GradebookManualItem');
    expect(document.components?.schemas).toHaveProperty('GradebookManualGrade');
    expect(document.components?.schemas).toHaveProperty('CourseModule');
    expect(document.components?.schemas).toHaveProperty('CourseUnit');
    expect(document.components?.schemas).toHaveProperty('CourseResource');
    expect(document.components?.schemas).toHaveProperty('LearningObjective');
    expect(document.components?.schemas).toHaveProperty('LearningObjectiveMastery');
    expect(document.components?.schemas).toHaveProperty('CourseSyllabus');
    expect(document.components?.schemas).toHaveProperty('CoursePage');
    expect(document.components?.schemas).toHaveProperty('CourseExternalTool');
    expect(document.components?.schemas).toHaveProperty('Lti1p3JsonWebKeySet');
    expect(document.components?.schemas).toHaveProperty('Lti1p3LaunchAuthorizationResponse');
    expect(document.components?.schemas).toHaveProperty('Lti1p3OidcLoginInitiation');
    expect(document.components?.schemas).toHaveProperty('DiscussionTopic');
    expect(document.components?.schemas).toHaveProperty('DiscussionPost');
    expect(document.components?.schemas).toHaveProperty('CalendarItem');
    expect(document.components?.schemas).toHaveProperty('AuditLog');
    expect(document.components?.schemas).toHaveProperty('NotificationRecord');
    expect(document.components?.schemas).toHaveProperty('NotificationPreference');
    expect(document.components?.schemas).toHaveProperty('FileMetadata');
    expect(document.components?.schemas).not.toHaveProperty('FileResource');
  });

  it('emits date fields as JSON date-time strings', () => {
    const document = generateOpenApiDocument();
    const courseSchema = document.components?.schemas?.Course;
    const courseProperties =
      courseSchema && 'properties' in courseSchema ? courseSchema.properties : undefined;

    expect(courseProperties?.createdAt).toMatchObject({
      type: 'string',
      format: 'date-time',
    });
    expect(courseProperties?.startsAt).toMatchObject({
      type: 'string',
      format: 'date-time',
      nullable: true,
    });
  });

  it('documents course external tool launch URLs as HTTPS-only URIs', () => {
    const document = generateOpenApiDocument();
    const courseExternalToolSchema = document.components?.schemas?.CourseExternalTool;
    const courseExternalToolProperties =
      courseExternalToolSchema && 'properties' in courseExternalToolSchema
        ? courseExternalToolSchema.properties
        : undefined;

    expect(courseExternalToolProperties?.launchUrl).toMatchObject({
      type: 'string',
      format: 'uri',
      pattern: '^https:\\/\\/',
    });
  });

  it('documents LTI 1.3 OIDC authorization query fields', () => {
    const document = generateOpenApiDocument();
    const operation = document.paths['/api/v1/lti-1p3/authorize']?.get;

    expect(operation?.operationId).toBe('authorizeLti1p3OidcLaunch');
    expect(operation?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'scope', in: 'query', required: true }),
        expect.objectContaining({ name: 'response_type', in: 'query', required: true }),
        expect.objectContaining({ name: 'response_mode', in: 'query', required: true }),
        expect.objectContaining({ name: 'prompt', in: 'query', required: true }),
        expect.objectContaining({ name: 'client_id', in: 'query', required: true }),
        expect.objectContaining({ name: 'redirect_uri', in: 'query', required: true }),
        expect.objectContaining({ name: 'login_hint', in: 'query', required: true }),
        expect.objectContaining({ name: 'lti_message_hint', in: 'query', required: true }),
        expect.objectContaining({ name: 'nonce', in: 'query', required: true }),
        expect.objectContaining({ name: 'state', in: 'query', required: true }),
      ]),
    );
    expect(operation?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'redirect_uri',
          schema: expect.objectContaining({
            format: 'uri',
            pattern: '^https:\\/\\/',
          }),
        }),
      ]),
    );
    expect(operation?.responses?.['200']).toMatchObject({
      content: {
        'application/json': expect.objectContaining({
          schema: { $ref: '#/components/schemas/Lti1p3LaunchAuthorizationResponse' },
        }),
      },
    });
  });

  it('documents authenticated account self-deletion', () => {
    const document = generateOpenApiDocument();
    const operation = document.paths['/api/v1/me']?.delete;

    expect(operation?.operationId).toBe('deleteCurrentUser');
    expect(operation?.security).toEqual([{ bearerAuth: [] }]);
    expect(operation?.responses).toHaveProperty('204');
    expect(operation?.responses).toHaveProperty('401');
  });

  it('documents tenant legal hold management', () => {
    const document = generateOpenApiDocument();
    const collection = document.paths['/api/v1/tenants/{tenantId}/legal-holds'];
    const release =
      document.paths['/api/v1/tenants/{tenantId}/legal-holds/{legalHoldId}/release']?.post;

    expect(collection?.get?.operationId).toBe('listUserLegalHolds');
    expect(collection?.post?.operationId).toBe('createUserLegalHold');
    expect(release?.operationId).toBe('releaseUserLegalHold');
    expect(collection?.post?.responses).toHaveProperty('201');
    expect(release?.responses).toHaveProperty('200');
    expect(release?.responses).toHaveProperty('404');
  });

  it('documents tenant retention policy management', () => {
    const document = generateOpenApiDocument();
    const collection = document.paths['/api/v1/tenants/{tenantId}/retention-policies'];
    const item = document.paths['/api/v1/tenants/{tenantId}/retention-policies/{targetType}']?.put;

    expect(collection?.get?.operationId).toBe('listRetentionPolicies');
    expect(item?.operationId).toBe('upsertRetentionPolicy');
    expect(item?.responses).toHaveProperty('200');
    expect(item?.responses).toHaveProperty('403');
  });

  it('documents LTI 1.3 deep linking launch initiation', () => {
    const document = generateOpenApiDocument();
    const operation =
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/deep-linking/launch'
      ]?.post;

    expect(operation?.operationId).toBe('launchCourseExternalToolLti1p3DeepLinking');
    expect(operation?.responses?.['200']).toMatchObject({
      content: {
        'application/json': expect.objectContaining({
          schema: { $ref: '#/components/schemas/Lti1p3OidcLoginInitiation' },
        }),
      },
    });
    expect(operation?.responses).toHaveProperty('403');
  });

  it('documents LTI 1.3 deep linking return processing', () => {
    const document = generateOpenApiDocument();
    const operation = document.paths['/api/v1/lti-1p3/deep-linking/return']?.post;

    expect(operation?.operationId).toBe('processLti1p3DeepLinkingReturn');
    expect(operation?.requestBody).toMatchObject({
      content: {
        'application/x-www-form-urlencoded': expect.any(Object),
      },
    });
    expect(operation?.responses?.['200']).toMatchObject({
      content: {
        'application/json': expect.objectContaining({
          schema: { $ref: '#/components/schemas/Lti1p3DeepLinkingReturnResult' },
        }),
      },
    });
    expect(operation?.security).toBeUndefined();
  });

  it('documents learning objective mastery score invariants', () => {
    const document = generateOpenApiDocument();

    expect(document.components?.schemas?.LearningObjectiveMastery).toMatchObject({
      description:
        'Per-student mastery state for a course learning objective. score and maxScore must both be null or both be finite numbers, and score cannot exceed maxScore.',
    });
  });

  it('documents gradebook entry category metadata', () => {
    const document = generateOpenApiDocument();
    const gradebookEntrySchema = document.components?.schemas?.GradebookEntry;
    const gradebookEntryProperties =
      gradebookEntrySchema && 'properties' in gradebookEntrySchema
        ? gradebookEntrySchema.properties
        : undefined;

    expect(gradebookEntrySchema).toMatchObject({
      description:
        'Course gradebook entry. gradebookCategoryId and gradebookCategoryName are both populated for categorized assignments and both null for uncategorized assignments.',
    });
    expect(gradebookEntryProperties?.gradebookCategoryId).toMatchObject({
      type: 'string',
      nullable: true,
    });
    expect(gradebookEntryProperties?.gradebookCategoryName).toMatchObject({
      type: 'string',
      nullable: true,
    });
  });

  it('documents course resource sequencing positions', () => {
    const document = generateOpenApiDocument();
    const courseResourceSchema = document.components?.schemas?.CourseResource;
    const courseResourceProperties =
      courseResourceSchema && 'properties' in courseResourceSchema
        ? courseResourceSchema.properties
        : undefined;

    expect(courseResourceProperties?.position).toMatchObject({
      type: 'integer',
      minimum: 0,
    });
  });

  it('documents item-scoped module release rules', () => {
    const document = generateOpenApiDocument();
    const releaseRulesOperation =
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-rules'
      ]?.get;
    const releaseRuleSchema = document.components?.schemas?.ModuleReleaseRule;
    const releaseRuleVariant =
      releaseRuleSchema && 'oneOf' in releaseRuleSchema ? releaseRuleSchema.oneOf?.[0] : undefined;
    const releaseRuleProperties =
      releaseRuleVariant && 'properties' in releaseRuleVariant
        ? releaseRuleVariant.properties
        : undefined;

    expect(releaseRulesOperation?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'targetType', in: 'query' }),
        expect.objectContaining({ name: 'targetId', in: 'query' }),
      ]),
    );
    expect(releaseRuleProperties?.targetType).toMatchObject({
      type: 'string',
      enum: ['module', 'course_page', 'course_resource', 'assignment'],
    });
    expect(releaseRuleProperties?.targetId).toMatchObject({
      type: 'string',
      nullable: true,
    });
  });

  it('documents push notification preferences', () => {
    const document = generateOpenApiDocument();
    const operation = document.paths['/api/v1/tenants/{tenantId}/notifications/preferences']?.put;
    const requestSchema =
      operation?.requestBody &&
      'content' in operation.requestBody &&
      operation.requestBody.content['application/json']?.schema;
    const requestProperties =
      requestSchema && 'properties' in requestSchema ? requestSchema.properties : undefined;

    expect(requestProperties?.channel).toMatchObject({
      type: 'string',
      enum: ['in_app', 'email', 'push'],
      description: 'Delivery channel: in_app, email, or push.',
    });
  });

  it('documents assignment module placement filters and fields', () => {
    const document = generateOpenApiDocument();
    const assignmentOperation =
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/assignments']?.get;
    const assignmentSchema = document.components?.schemas?.Assignment;
    const assignmentProperties =
      assignmentSchema && 'properties' in assignmentSchema
        ? assignmentSchema.properties
        : undefined;

    expect(assignmentOperation?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'moduleId', in: 'query' }),
        expect.objectContaining({ name: 'unitId', in: 'query' }),
      ]),
    );
    expect(assignmentProperties?.moduleId).toMatchObject({
      type: 'string',
      nullable: true,
    });
    expect(assignmentProperties?.unitId).toMatchObject({
      type: 'string',
      nullable: true,
    });
    expect(assignmentProperties?.position).toMatchObject({
      type: 'integer',
      minimum: 0,
      nullable: true,
    });
    expect(assignmentProperties?.allowedFileExtensions).toMatchObject({
      type: 'array',
      default: [],
    });
    expect(assignmentProperties?.maxFileSizeBytes).toMatchObject({
      type: 'integer',
      nullable: true,
      default: null,
    });
  });

  it('documents submission attachment creation', () => {
    const document = generateOpenApiDocument();
    const attachmentsPath =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/attachments';
    const operation = document.paths[attachmentsPath]?.post;

    expect(operation?.operationId).toBe('createSubmissionAttachment');
    expect(operation?.responses).toHaveProperty('201');
  });

  it('documents quiz module placement filters and fields', () => {
    const document = generateOpenApiDocument();
    const quizOperation =
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes']?.get;
    const quizSchema = document.components?.schemas?.Quiz;
    const quizProperties =
      quizSchema && 'properties' in quizSchema ? quizSchema.properties : undefined;

    expect(quizOperation?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'moduleId', in: 'query' }),
        expect.objectContaining({ name: 'unitId', in: 'query' }),
      ]),
    );
    expect(quizProperties?.moduleId).toMatchObject({
      type: 'string',
      nullable: true,
    });
    expect(quizProperties?.unitId).toMatchObject({
      type: 'string',
      nullable: true,
    });
    expect(quizProperties?.position).toMatchObject({
      type: 'integer',
      minimum: 0,
      nullable: true,
    });
  });

  it('documents discussion topic module placement filters and fields', () => {
    const document = generateOpenApiDocument();
    const discussionOperation =
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics']?.get;
    const discussionSchema = document.components?.schemas?.DiscussionTopic;
    const discussionProperties =
      discussionSchema && 'properties' in discussionSchema
        ? discussionSchema.properties
        : undefined;

    expect(discussionOperation?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'moduleId', in: 'query' }),
        expect.objectContaining({ name: 'unitId', in: 'query' }),
      ]),
    );
    expect(discussionProperties?.moduleId).toMatchObject({
      type: 'string',
      nullable: true,
    });
    expect(discussionProperties?.unitId).toMatchObject({
      type: 'string',
      nullable: true,
    });
    expect(discussionProperties?.position).toMatchObject({
      type: 'integer',
      minimum: 0,
    });
  });

  it('documents quiz attempt response read and save operations', () => {
    const document = generateOpenApiDocument();
    const responsesPath =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/responses';
    const responsePath =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/responses/{questionId}';
    const responseSchema = document.components?.schemas?.QuizAttemptResponse;
    const responseProperties =
      responseSchema && 'properties' in responseSchema ? responseSchema.properties : undefined;

    expect(document.paths[responsesPath]?.get?.operationId).toBe('listQuizAttemptResponses');
    expect(document.paths[responsePath]?.put?.operationId).toBe('saveQuizAttemptResponse');
    expect(document.paths[responsePath]?.put?.requestBody).toMatchObject({
      content: {
        'application/json': expect.objectContaining({
          schema: expect.objectContaining({ type: 'object' }),
        }),
      },
    });
    expect(responseProperties?.answer).toBeDefined();
    expect(responseProperties?.questionId).toMatchObject({
      type: 'string',
    });
  });

  it('documents quiz attempt start and submit operations', () => {
    const document = generateOpenApiDocument();
    const attemptsPath = '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts';
    const submitPath =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/submit';

    expect(document.paths[attemptsPath]?.post?.operationId).toBe('startQuizAttempt');
    expect(document.paths[attemptsPath]?.post?.responses).toHaveProperty('201');
    expect(document.paths[submitPath]?.post?.operationId).toBe('submitQuizAttempt');
    expect(document.paths[submitPath]?.post?.responses?.['200']).toMatchObject({
      content: {
        'application/json': expect.objectContaining({
          schema: { $ref: '#/components/schemas/QuizAttempt' },
        }),
      },
    });
  });

  it('documents quiz overrides and effective settings operations', () => {
    const document = generateOpenApiDocument();
    const overridesPath =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/overrides';
    const overridePath =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/overrides/{overrideId}';
    const effectiveSettingsPath =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/effective-settings';

    expect(document.paths[overridesPath]?.get?.operationId).toBe('listQuizOverrides');
    expect(document.paths[overridesPath]?.post?.operationId).toBe('createQuizOverride');
    expect(document.paths[overridePath]?.patch?.operationId).toBe('updateQuizOverride');
    expect(document.paths[overridePath]?.delete?.operationId).toBe('deleteQuizOverride');
    expect(document.paths[effectiveSettingsPath]?.get?.operationId).toBe(
      'getQuizEffectiveSettings',
    );
    expect(document.components?.schemas?.QuizOverride).toBeDefined();
    expect(document.components?.schemas?.QuizEffectiveSettings).toBeDefined();
  });

  it('documents module-scoped completion requirement thresholds', () => {
    const document = generateOpenApiDocument();
    const requirementsOperation =
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/completion-requirements']?.get;
    const requirementSchema = document.components?.schemas?.CompletionRequirement;
    const requirementProperties =
      requirementSchema && 'properties' in requirementSchema
        ? requirementSchema.properties
        : undefined;

    expect(requirementsOperation?.parameters).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'moduleId', in: 'query' })]),
    );
    expect(requirementProperties?.moduleId).toMatchObject({
      type: 'string',
      nullable: true,
    });
    expect(requirementProperties?.minScorePercent).toMatchObject({
      type: 'number',
      nullable: true,
      minimum: 0,
      maximum: 100,
    });
  });

  it('documents assignment draft save and submit operations', () => {
    const document = generateOpenApiDocument();
    const draftPath =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/drafts/{draftId}';
    const submitPath =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/drafts/{draftId}/submit';

    expect(document.paths[draftPath]?.put?.operationId).toBe('saveAssignmentDraft');
    expect(document.paths[draftPath]?.put?.requestBody).toMatchObject({
      required: true,
      content: {
        'application/json': expect.objectContaining({
          schema: expect.objectContaining({ type: 'object' }),
        }),
      },
    });
    expect(document.paths[draftPath]?.put?.responses).toHaveProperty('400');
    expect(document.paths[submitPath]?.post?.operationId).toBe('submitAssignmentDraft');
    expect(document.paths[submitPath]?.post?.requestBody).toMatchObject({
      required: true,
    });
    expect(document.paths[submitPath]?.post?.responses).toHaveProperty('400');
    expect(document.paths[submitPath]?.post?.responses).toHaveProperty('201');
  });

  it('documents course membership creation', () => {
    const document = generateOpenApiDocument();
    const membershipsPath = '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships';
    const operation = document.paths[membershipsPath]?.post;

    expect(operation?.operationId).toBe('createCourseMembership');
    expect(operation?.requestBody).toMatchObject({
      required: true,
      content: {
        'application/json': expect.objectContaining({
          schema: expect.objectContaining({ type: 'object' }),
        }),
      },
    });
    expect(operation?.responses).toHaveProperty('201');
    expect(operation?.responses).toHaveProperty('400');
    expect(operation?.responses).toHaveProperty('403');
  });

  it('documents discussion post creation', () => {
    const document = generateOpenApiDocument();
    const postsPath =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/posts';
    const operation = document.paths[postsPath]?.post;

    expect(operation?.operationId).toBe('createDiscussionPost');
    expect(operation?.requestBody).toMatchObject({
      required: true,
      content: {
        'application/json': expect.objectContaining({
          schema: expect.objectContaining({ type: 'object' }),
        }),
      },
    });
    expect(JSON.stringify(operation?.requestBody)).toContain('"status"');
    expect(JSON.stringify(operation?.requestBody)).toContain('"draft"');
    expect(operation?.responses).toHaveProperty('201');
    expect(operation?.responses).toHaveProperty('400');
    expect(operation?.responses).toHaveProperty('404');
  });

  it('documents discussion post draft publishing', () => {
    const document = generateOpenApiDocument();
    const postPath =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/posts/{postId}';
    const operation = document.paths[postPath]?.put;

    expect(operation?.operationId).toBe('updateDiscussionPost');
    expect(JSON.stringify(operation?.requestBody)).toContain('"status"');
    expect(JSON.stringify(operation?.requestBody)).toContain('"published"');
  });

  it('documents discussion topic subscription management', () => {
    const document = generateOpenApiDocument();
    const path =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/subscription';

    expect(document.paths[path]?.put?.operationId).toBe('subscribeDiscussionTopic');
    expect(document.paths[path]?.put?.responses).toHaveProperty('200');
    expect(document.paths[path]?.delete?.operationId).toBe('unsubscribeDiscussionTopic');
    expect(document.paths[path]?.delete?.responses).toHaveProperty('204');
  });

  it('documents course announcement creation', () => {
    const document = generateOpenApiDocument();
    const path = '/api/v1/tenants/{tenantId}/courses/{courseId}/announcements';
    const operation = document.paths[path]?.post;

    expect(operation?.operationId).toBe('createCourseAnnouncement');
    expect(operation?.requestBody).toMatchObject({
      required: true,
      content: {
        'application/json': expect.objectContaining({ schema: expect.any(Object) }),
      },
    });
    expect(operation?.responses).toHaveProperty('201');
    expect(operation?.responses).toHaveProperty('400');
    expect(operation?.responses).toHaveProperty('403');
  });

  it('documents attendance record upserts', () => {
    const document = generateOpenApiDocument();
    const path =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions/{sessionId}/records/{studentId}';
    const operation = document.paths[path]?.put;

    expect(operation?.operationId).toBe('recordAttendanceRecord');
    expect(operation?.requestBody).toMatchObject({
      required: true,
      content: {
        'application/json': expect.objectContaining({
          schema: expect.objectContaining({ type: 'object' }),
        }),
      },
    });
    expect(operation?.responses).toHaveProperty('200');
    expect(operation?.responses).toHaveProperty('400');
    expect(operation?.responses).toHaveProperty('404');
  });

  it('documents attendance session creation', () => {
    const document = generateOpenApiDocument();
    const path = '/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions';
    const operation = document.paths[path]?.post;

    expect(operation?.operationId).toBe('createAttendanceSession');
    expect(operation?.requestBody).toMatchObject({
      required: true,
      content: {
        'application/json': expect.objectContaining({
          schema: expect.objectContaining({ type: 'object' }),
        }),
      },
    });
    expect(operation?.responses).toHaveProperty('201');
    expect(operation?.responses).toHaveProperty('400');
    expect(operation?.responses).toHaveProperty('403');
  });

  it('documents discussion topic creation', () => {
    const document = generateOpenApiDocument();
    const path = '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics';
    const operation = document.paths[path]?.post;
    const requestBody = operation?.requestBody;

    if (!requestBody || '$ref' in requestBody) {
      throw new Error('Discussion topic creation must document an inline request body.');
    }

    const schema = requestBody.content?.['application/json']?.schema;

    expect(operation?.operationId).toBe('createDiscussionTopic');
    expect(operation?.requestBody).toMatchObject({
      required: true,
      content: {
        'application/json': expect.objectContaining({ schema: expect.any(Object) }),
      },
    });
    expect(operation?.responses).toHaveProperty('201');
    expect(operation?.responses).toHaveProperty('400');
    expect(operation?.responses).toHaveProperty('403');
    expect(schema).toMatchObject({
      anyOf: expect.arrayContaining([
        expect.objectContaining({
          required: expect.arrayContaining(['moduleId', 'unitId']),
        }),
      ]),
    });
  });

  it('documents course page creation', () => {
    const document = generateOpenApiDocument();
    const path = '/api/v1/tenants/{tenantId}/courses/{courseId}/pages';
    const operation = document.paths[path]?.post;

    expect(operation?.operationId).toBe('createCoursePage');
    expect(operation?.requestBody).toMatchObject({
      required: true,
      content: {
        'application/json': expect.objectContaining({
          schema: expect.objectContaining({ type: 'object' }),
        }),
      },
    });
    expect(operation?.responses).toHaveProperty('201');
    expect(operation?.responses).toHaveProperty('400');
    expect(operation?.responses).toHaveProperty('403');
  });

  it('documents submission comment creation', () => {
    const document = generateOpenApiDocument();
    const path =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/comments';
    const operation = document.paths[path]?.post;

    expect(operation?.operationId).toBe('createSubmissionComment');
    expect(operation?.requestBody).toMatchObject({
      required: true,
      content: {
        'application/json': expect.objectContaining({
          schema: expect.objectContaining({ type: 'object' }),
        }),
      },
    });
    expect(operation?.responses).toHaveProperty('201');
    expect(operation?.responses).toHaveProperty('400');
    expect(operation?.responses).toHaveProperty('404');
  });

  it('documents course section creation', () => {
    const document = generateOpenApiDocument();
    const path = '/api/v1/tenants/{tenantId}/courses/{courseId}/sections';
    const operation = document.paths[path]?.post;

    expect(operation?.operationId).toBe('createCourseSection');
    expect(operation?.requestBody).toMatchObject({
      required: true,
      content: {
        'application/json': expect.objectContaining({
          schema: expect.objectContaining({ type: 'object' }),
        }),
      },
    });
    expect(operation?.responses).toHaveProperty('201');
    expect(operation?.responses).toHaveProperty('400');
    expect(operation?.responses).toHaveProperty('403');
  });

  it('documents course copy content counters', () => {
    const document = generateOpenApiDocument();
    const operation = document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/copy']?.post;

    expect(operation?.operationId).toBe('copyCourse');
    expect(document.components?.schemas?.CopyCourseResult).toMatchObject({
      properties: expect.objectContaining({
        wikiPagesCopied: expect.objectContaining({ type: 'integer' }),
        glossaryEntriesCopied: expect.objectContaining({ type: 'integer' }),
      }),
    });
  });

  it('documents section instructor assignment routes', () => {
    const document = generateOpenApiDocument();
    const collectionPath =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{sectionId}/instructors';
    const itemPath =
      '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{sectionId}/instructors/{instructorId}';

    expect(document.components?.schemas?.CourseSectionInstructor).toMatchObject({
      type: 'object',
    });
    expect(document.paths[collectionPath]?.get?.operationId).toBe('listSectionInstructors');
    expect(document.paths[collectionPath]?.post?.operationId).toBe('assignSectionInstructor');
    expect(document.paths[itemPath]?.delete?.operationId).toBe('removeSectionInstructor');
    expect(document.paths[collectionPath]?.post?.responses).toHaveProperty('201');
    expect(document.paths[collectionPath]?.post?.responses).toHaveProperty('400');
    expect(document.paths[itemPath]?.delete?.responses).toHaveProperty('204');
  });

  it('documents manual gradebook item score invariants', () => {
    const document = generateOpenApiDocument();
    const manualGradesOperation =
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/manual-items/{manualItemId}/grades'
      ]?.get;
    const manualGradeSaveOperation =
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/manual-items/{manualItemId}/grades/{studentId}'
      ]?.put;

    expect(document.components?.schemas?.GradebookManualGrade).toMatchObject({
      description:
        'Per-student grade for a manual gradebook item. score and maxScore must be finite numbers, and score cannot exceed maxScore.',
    });
    expect(manualGradesOperation?.responses).toHaveProperty('404');
    expect(manualGradeSaveOperation?.operationId).toBe('saveGradebookManualGrade');
    expect(manualGradeSaveOperation?.requestBody).toMatchObject({
      required: true,
      content: {
        'application/json': expect.objectContaining({
          schema: expect.objectContaining({ type: 'object' }),
        }),
      },
    });
    expect(manualGradeSaveOperation?.responses).toHaveProperty('400');
    expect(manualGradeSaveOperation?.responses).toHaveProperty('403');
    expect(manualGradeSaveOperation?.responses).toHaveProperty('404');
  });

  it('describes JSON responses and path parameters for every operation', () => {
    const document = generateOpenApiDocument();

    for (const pathItem of Object.values(document.paths)) {
      for (const operation of Object.values(pathItem ?? {})) {
        const successResponse =
          operation.responses?.[200] ?? operation.responses?.[201] ?? operation.responses?.[204];

        if (operation.responses?.[204]) {
          expect(operation.responses[204]).toMatchObject({ description: expect.any(String) });
          continue;
        }

        const contentTypes = Object.keys(successResponse?.content ?? {});
        expect(contentTypes.length).toBeGreaterThan(0);
        expect(successResponse?.content?.[contentTypes[0] ?? '']?.schema).toBeDefined();
      }
    }

    expect(document.paths['/api/v1/tenants/{tenantId}/courses']?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          in: 'path',
          name: 'tenantId',
          required: true,
        }),
      ]),
    );
  });

  it('documents bearer authentication for protected operations', () => {
    const document = generateOpenApiDocument();

    expect(document.components?.securitySchemes).toMatchObject({
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    });
    expect(
      document.paths['/api/v1/tenants/{tenantId}/lti-1p3/jwks']?.get?.security,
    ).toBeUndefined();
    expect(document.paths['/api/v1/lti-1p3/authorize']?.get?.security).toEqual([
      { bearerAuth: [] },
    ]);
    expect(document.paths['/api/v1/tenants']?.get?.security).toEqual([{ bearerAuth: [] }]);
    expect(document.paths['/api/v1/tenants/{tenantId}/courses']?.get?.security).toEqual([
      { bearerAuth: [] },
    ]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/sections']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/announcements']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/memberships']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/assignments']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/overrides'
      ]?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/rubric'
      ]?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/questions']
        ?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts']?.get
        ?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/responses'
      ]?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/responses/{questionId}'
      ]?.put?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks/{questionBankId}/questions'
      ]?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions']?.get
        ?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions/{sessionId}/records'
      ]?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/completion-requirements']?.get
        ?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/completion-requirements/{requirementId}/progress'
      ]?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/credentials']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/credentials/{credentialId}/awards'
      ]?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/conversations']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/conversations/{threadId}/messages'
      ]?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/group-sets']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/groups']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/groups/{groupId}/members']?.get
        ?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions'
      ]?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/peer-reviews'
      ]?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/attachments'
      ]?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/comments'
      ]?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/categories']?.get
        ?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/grading-schemes']?.get
        ?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/modules']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/units']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/resources']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objectives']?.get
        ?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objective-mastery']
        ?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/syllabus']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/pages']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/pages/{pageId}']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/launch'
      ]?.post?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/deep-linking/launch'
      ]?.post?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/launch-response'
      ]?.post?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics']?.get
        ?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/posts'
      ]?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(document.paths['/api/v1/tenants/{tenantId}/calendar-items']?.get?.security).toEqual([
      { bearerAuth: [] },
    ]);
    expect(document.paths['/api/v1/tenants/{tenantId}/notifications']?.get?.security).toEqual([
      { bearerAuth: [] },
    ]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/notifications/preferences']?.get?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      document.paths['/api/v1/tenants/{tenantId}/notifications/{notificationId}/read']?.post
        ?.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(document.paths['/api/v1/tenants/{tenantId}/files']?.get?.security).toEqual([
      { bearerAuth: [] },
    ]);
    expect(document.paths['/api/v1/tenants/{tenantId}/files/{fileId}']?.get?.security).toEqual([
      { bearerAuth: [] },
    ]);
    expect(document.paths['/api/v1/tenants']?.get?.responses).toHaveProperty('401');
    expect(document.paths['/api/v1/tenants/{tenantId}/courses']?.get?.responses).toHaveProperty(
      '401',
    );
    expect(document.paths['/api/v1/tenants/{tenantId}/courses']?.get?.responses).toHaveProperty(
      '403',
    );
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/sections']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/sections']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/announcements']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/announcements']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/memberships']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/memberships']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/assignments']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/assignments']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/overrides'
      ]?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/overrides'
      ]?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/overrides'
      ]?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/rubric'
      ]?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/rubric'
      ]?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/rubric'
      ]?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/questions']
        ?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/questions']
        ?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/questions']
        ?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts']?.get
        ?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts']?.get
        ?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts']?.get
        ?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/responses'
      ]?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/responses'
      ]?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/responses'
      ]?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/responses/{questionId}'
      ]?.put?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/responses/{questionId}'
      ]?.put?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/responses/{questionId}'
      ]?.put?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks']?.get
        ?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks']?.get
        ?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks/{questionBankId}/questions'
      ]?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks/{questionBankId}/questions'
      ]?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks/{questionBankId}/questions'
      ]?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions']?.get
        ?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions']?.get
        ?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions/{sessionId}/records'
      ]?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions/{sessionId}/records'
      ]?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions/{sessionId}/records'
      ]?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/completion-requirements']?.get
        ?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/completion-requirements']?.get
        ?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/completion-requirements/{requirementId}/progress'
      ]?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/completion-requirements/{requirementId}/progress'
      ]?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/completion-requirements/{requirementId}/progress'
      ]?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/credentials']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/credentials']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/credentials/{credentialId}/awards'
      ]?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/credentials/{credentialId}/awards'
      ]?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/credentials/{credentialId}/awards'
      ]?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/conversations']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/conversations']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/conversations/{threadId}/messages'
      ]?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/conversations/{threadId}/messages'
      ]?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/conversations/{threadId}/messages'
      ]?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/group-sets']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/group-sets']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/groups']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/groups']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/groups/{groupId}/members']?.get
        ?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/groups/{groupId}/members']?.get
        ?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/groups/{groupId}/members']?.get
        ?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions'
      ]?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions'
      ]?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions'
      ]?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/attachments'
      ]?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/attachments'
      ]?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/attachments'
      ]?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/peer-reviews'
      ]?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/peer-reviews'
      ]?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/peer-reviews'
      ]?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/comments'
      ]?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/comments'
      ]?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/comments'
      ]?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/categories']?.get
        ?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/categories']?.get
        ?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/grading-schemes']?.get
        ?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/grading-schemes']?.get
        ?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools']?.get
        ?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools']?.get
        ?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/launch'
      ]?.post?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/launch'
      ]?.post?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/deep-linking/launch'
      ]?.post?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/deep-linking/launch'
      ]?.post?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/launch-response'
      ]?.post?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/launch-response'
      ]?.post?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/modules']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/modules']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/units']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/units']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/resources']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/resources']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objectives']?.get
        ?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objectives']?.get
        ?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objective-mastery']
        ?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objective-mastery']
        ?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/syllabus']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/syllabus']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/syllabus']?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/pages']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/pages']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/pages/{pageId}']?.get
        ?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/pages/{pageId}']?.get
        ?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/pages/{pageId}']?.get
        ?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics']?.get
        ?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics']?.get
        ?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/posts'
      ]?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/posts'
      ]?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths[
        '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/posts'
      ]?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/calendar-items']?.get?.responses,
    ).toHaveProperty('400');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/calendar-items']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/calendar-items']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/notifications']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/notifications']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/notifications/preferences']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/notifications/preferences']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/notifications/{notificationId}/read']?.post
        ?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/notifications/{notificationId}/read']?.post
        ?.responses,
    ).toHaveProperty('403');
    expect(document.paths['/api/v1/tenants/{tenantId}/files']?.get?.responses).toHaveProperty(
      '401',
    );
    expect(document.paths['/api/v1/tenants/{tenantId}/files']?.get?.responses).toHaveProperty(
      '403',
    );
    expect(
      document.paths['/api/v1/tenants/{tenantId}/files/{fileId}']?.get?.responses,
    ).toHaveProperty('401');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/files/{fileId}']?.get?.responses,
    ).toHaveProperty('403');
    expect(
      document.paths['/api/v1/tenants/{tenantId}/files/{fileId}']?.get?.responses,
    ).toHaveProperty('404');
  });
});
