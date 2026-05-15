import {
  AiUsageSummary,
  Assignment,
  AssignmentEffectiveSchedule,
  AssignmentOverride,
  AssignmentPeerReview,
  AttendanceRecord,
  AttendanceSession,
  AuditLog,
  CalendarItem,
  CatalogCourse,
  CommonCartridgeCourseExport,
  CommonCartridgeImportResult,
  CompletionProgress,
  CompletionRequirement,
  ConversationMessage,
  ConversationThread,
  Course,
  CourseAnnouncement,
  CourseBackup,
  CourseCalendarEvent,
  CourseCatalogSettings,
  CourseCredential,
  CourseExternalTool,
  CourseExternalToolOutcome,
  CourseFavorite,
  CourseGradingScheme,
  CourseGroup,
  CourseGroupMember,
  CourseGroupSet,
  CourseMeeting,
  CourseMembership,
  CourseModule,
  CoursePage,
  CourseResource,
  CourseSection,
  CourseSectionInstructor,
  CourseSyllabus,
  CourseUnit,
  CredentialAward,
  DiscussionPost,
  DiscussionTopic,
  DiscussionTopicSubscription,
  Draft,
  FileResource,
  GlossaryEntry,
  Grade,
  type GradeStatus,
  GradebookCategory,
  GradebookEntry,
  GradebookManualGrade,
  GradebookManualItem,
  LearningObjective,
  LearningObjectiveCoverage,
  LearningObjectiveMastery,
  Lti1p3AgsResultContainer,
  Lti1p3DeepLinkingReturnResult,
  Lti1p3JsonWebKeySet,
  Lti1p3LaunchAuthorizationResponse,
  Lti1p3NamesRolesMembershipContainer,
  Lti1p3OidcLoginInitiation,
  Lti1p3ServiceAccessToken,
  type NotificationCategory,
  type NotificationChannel,
  type NotificationFrequency,
  NotificationPreference,
  NotificationRecord,
  ProviderConfigSummary,
  QtiQuizItemExport,
  QtiQuizItemImportResult,
  QuestionBank,
  QuestionBankQuestion,
  Quiz,
  QuizAttempt,
  QuizAttemptQuestionGrade,
  QuizAttemptResponse,
  QuizEffectiveSettings,
  QuizOverride,
  QuizQuestion,
  RetentionPolicy,
  Rubric,
  ScormRuntimeState,
  SisFinalGradeSubmission,
  Submission,
  SubmissionAttachment,
  SubmissionComment,
  SubmissionPlagiarismReport,
  Survey,
  SurveyQuestion,
  SurveyResponse,
  Tenant,
  TenantFeatureFlag,
  TenantMembership,
  User,
  UserLegalHold,
  UserPushToken,
  WebhookSubscription,
  WikiPage,
  WikiPageRevision,
  WikiPageRevisionDiff,
  XapiStatement,
} from '@openlms/contracts';
import { CoreSession } from '@openlms/core/auth/session';
import { describe, expect, it } from 'vitest';
import { createApiApp } from '../src/app.ts';
import { ApiError } from '../src/http-error.ts';
import { generateOpenApiDocument } from '../src/openapi.ts';

const dependencies = {
  authHandler: null,
  getSessionByToken: async () =>
    CoreSession.parse({
      userId: actorId,
      activeTenantId: tenantId,
      expiresAt: new Date('2999-05-10T00:00:00.000Z'),
    }),
  createInitialTenant: async () => {
    throw new Error('Not used in dependency tests');
  },
  listTenants: async (_actorUserId: string) => [],
  updateTenantFileStorageQuotas: async (
    _actorUserId: string,
    _tenantId: string,
    input: { storageByteLimit: number | null; defaultUserStorageByteLimit: number | null },
  ) =>
    Tenant.parse({
      id: tenantId,
      slug: 'demo-university',
      displayName: 'Demo University',
      storageByteLimit: input.storageByteLimit,
      defaultUserStorageByteLimit: input.defaultUserStorageByteLimit,
      createdAt: now,
      updatedAt: now,
    }),
  listMyTenantMemberships: async (_actorUserId: string) => [],
  listMyCourseMemberships: async (_actorUserId: string) => [],
  listTenantMembers: async (_actorUserId: string, _tenantId: string) => [],
  listTenantMessageableUsers: async (_actorUserId: string, _tenantId: string) => [],
  listTenantFeatureFlags: async (_actorUserId: string, _tenantId: string) => [],
  listWebhookSubscriptions: async (_actorUserId: string, _tenantId: string) => [],
  createWebhookSubscription: async (
    _actorUserId: string,
    _tenantId: string,
    input: {
      name: string;
      endpointUrl: string;
      topics: string[];
      status: 'enabled' | 'disabled';
      signingSecret: string;
    },
  ) =>
    WebhookSubscription.parse({
      id: webhookSubscriptionId,
      tenantId,
      name: input.name,
      endpointUrl: input.endpointUrl,
      topics: input.topics,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    }),
  updateWebhookSubscription: async (
    _actorUserId: string,
    _tenantId: string,
    requestedWebhookSubscriptionId: string,
    input: {
      name: string;
      endpointUrl: string;
      topics: string[];
      status: 'enabled' | 'disabled';
      signingSecret?: string;
    },
  ) =>
    WebhookSubscription.parse({
      id: requestedWebhookSubscriptionId,
      tenantId,
      name: input.name,
      endpointUrl: input.endpointUrl,
      topics: input.topics,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    }),
  deleteWebhookSubscription: async (
    _actorUserId: string,
    _tenantId: string,
    _webhookSubscriptionId: string,
  ) => {},
  listUserLegalHolds: async (_actorUserId: string, _tenantId: string) => [],
  createUserLegalHold: async (
    _actorUserId: string,
    _tenantId: string,
    input: { userId: string; reason: string },
  ) =>
    UserLegalHold.parse({
      id: legalHoldId,
      tenantId,
      userId: input.userId,
      createdById: actorId,
      reason: input.reason,
      releasedAt: null,
      createdAt: now,
      updatedAt: now,
    }),
  releaseUserLegalHold: async (
    _actorUserId: string,
    _tenantId: string,
    requestedLegalHoldId: string,
  ) =>
    UserLegalHold.parse({
      id: requestedLegalHoldId,
      tenantId,
      userId: actorId,
      createdById: actorId,
      reason: 'Grade appeal retention',
      releasedAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  listRetentionPolicies: async (_actorUserId: string, _tenantId: string) => [],
  upsertRetentionPolicy: async (
    _actorUserId: string,
    _tenantId: string,
    targetType: 'deleted_user',
    input: { retainDays: number },
  ) =>
    RetentionPolicy.parse({
      id: retentionPolicyId,
      tenantId,
      targetType,
      retainDays: input.retainDays,
      createdAt: now,
      updatedAt: now,
    }),
  upsertTenantFeatureFlag: async (
    _actorUserId: string,
    _tenantId: string,
    key: string,
    input: { enabled: boolean; description: string | null },
  ) =>
    TenantFeatureFlag.parse({
      id: tenantFeatureFlagId,
      tenantId,
      key,
      enabled: input.enabled,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    }),
  deleteTenantFeatureFlag: async (_actorUserId: string, _tenantId: string, _key: string) => {},
  getAiUsageSummary: async (_actorUserId: string, _tenantId: string, from: Date, to: Date) =>
    AiUsageSummary.parse({
      tenantId,
      from,
      to,
      totalCalls: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalDurationMs: 0,
      totalRetryCount: 0,
      fallbackCount: 0,
      estimatedCostCents: 0,
    }),
  listAiUsageByAction: async (
    _actorUserId: string,
    _tenantId: string,
    _from: Date,
    _to: Date,
  ) => [],
  listAiUsageByActor: async (_actorUserId: string, _tenantId: string, _from: Date, _to: Date) => [],
  listAuditLogs: async (_actorUserId: string, _tenantId: string) => [],
  exportAuditLogsCsv: async (_actorUserId: string, _tenantId: string) => '',
  ingestXapiStatement: async (_actorUserId: string, _tenantId: string, input: unknown) =>
    XapiStatement.parse({
      id: xapiStatementRecordId,
      tenantId,
      statementId:
        typeof input === 'object' && input !== null && 'id' in input
          ? String(input.id)
          : xapiStatementId,
      receivedById: actorId,
      actor: {
        objectType: 'Agent',
        account: { homePage: 'https://lms.example.edu', name: actorId },
      },
      verb: { id: 'https://adlnet.gov/expapi/verbs/completed', display: { en: 'completed' } },
      object: { id: 'https://lms.example.edu/activity/1', objectType: 'Activity' },
      result: { completion: true },
      context: { platform: 'Open-LMS' },
      timestamp: now,
      storedAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  listAiActions: async (_actorUserId: string, _tenantId: string) => [],
  listMyConsents: async (_actorUserId: string, _tenantId: string) => [],
  listMyCredentialAwards: async (_actorUserId: string, _tenantId: string) => [],
  recordMyConsent: async (_actorUserId: string, _tenantId: string) => {
    throw new ApiError('internal_error', 'Test stub for recordMyConsent should not be invoked.');
  },
  getProviderConfig: async (_actorUserId: string, _tenantId: string) =>
    ProviderConfigSummary.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KEH9',
      tenantId,
      providerType: 'openai',
      baseUrl: null,
      modelPreferences: { feedbackDraftModel: 'gpt-4.1' },
      capabilities: {
        supportsStructuredOutput: true,
        supportsTools: true,
        supportsVision: false,
        supportsPromptCaching: false,
        maxContextTokens: 128000,
        supportsDeterministic: true,
      },
      quota: {
        softWarnTokensPerPeriod: 100000,
        hardCapTokensPerPeriod: 500000,
        period: 'month',
      },
      validationStatus: 'pending',
      validationError: null,
      validatedAt: null,
      createdAt: now,
      updatedAt: now,
    }),
  upsertProviderConfig: async (_actorUserId: string, _tenantId: string) =>
    ProviderConfigSummary.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KEH9',
      tenantId,
      providerType: 'openai',
      baseUrl: null,
      modelPreferences: { feedbackDraftModel: 'gpt-4.1' },
      capabilities: {
        supportsStructuredOutput: true,
        supportsTools: true,
        supportsVision: false,
        supportsPromptCaching: false,
        maxContextTokens: 128000,
        supportsDeterministic: true,
      },
      quota: {
        softWarnTokensPerPeriod: 100000,
        hardCapTokensPerPeriod: 500000,
        period: 'month',
      },
      validationStatus: 'pending',
      validationError: null,
      validatedAt: null,
      createdAt: now,
      updatedAt: now,
    }),
  deleteProviderConfig: async (_actorUserId: string, _tenantId: string) => {
    return;
  },
  updateTenantMembership: async (
    _actorUserId: string,
    _tenantId: string,
    membershipId: string,
    input: {
      role:
        | 'student'
        | 'instructor'
        | 'teaching_assistant'
        | 'course_admin'
        | 'institution_admin'
        | 'ai_service_account'
        | 'integration_service_account';
    },
  ) =>
    TenantMembership.parse({
      id: membershipId,
      tenantId,
      userId: actorId,
      role: input.role,
      createdAt: now,
      updatedAt: now,
    }),
  getCurrentUser: async (_actorUserId: string) =>
    User.parse({
      id: actorId,
      email: 'user@example.com',
      displayName: 'Sample User',
      emailVerified: true,
      status: 'active',
      deletedAt: null,
      locale: null,
      timezone: null,
      createdAt: now,
      updatedAt: now,
    }),
  updateCurrentUser: async (_actorUserId: string, _input: unknown) =>
    User.parse({
      id: actorId,
      email: 'user@example.com',
      displayName: 'Sample User',
      emailVerified: true,
      status: 'active',
      deletedAt: null,
      locale: 'en-US',
      timezone: 'America/New_York',
      createdAt: now,
      updatedAt: now,
    }),
  deleteCurrentUser: async (_actorUserId: string) => {},
  listCourses: async (_actorUserId: string, _tenantId: string) => [],
  listDeletedCourses: async (_actorUserId: string, _tenantId: string) => [],
  listCatalogCourses: async (_tenantId: string) => [],
  listCourseFavorites: async (_actorUserId: string, _tenantId: string) => [],
  favoriteCourse: async (_actorUserId: string, _tenantId: string, _courseId: string) =>
    CourseFavorite.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
      tenantId,
      courseId,
      userId: actorId,
      createdAt: now,
    }),
  unfavoriteCourse: async (_actorUserId: string, _tenantId: string, _courseId: string) => {},
  getCourseNextPosition: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _scope: unknown,
  ) => ({ nextPosition: 5 }),
  reorderCourseContent: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) => ({ reordered: 3 }),
  copyCourse: async (
    _actorUserId: string,
    _tenantId: string,
    _sourceCourseId: string,
    _input: unknown,
  ) => ({
    learningObjectivesCopied: 2,
    modulesCopied: 3,
    unitsCopied: 4,
    pagesCopied: 1,
    resourcesCopied: 5,
    wikiPagesCopied: 6,
    glossaryEntriesCopied: 7,
  }),
  getCourseAnalyticsSummary: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
  ) => ({
    enrolledStudents: 0,
    publishedAssignments: 0,
    publishedQuizzes: 0,
    publishedCalendarEvents: 0,
    publishedDiscussionTopics: 0,
    totalSubmissions: 0,
  }),
  exportCourseBackup: async (_actorUserId: string, _tenantId: string, _courseId: string) =>
    CourseBackup.parse({
      formatVersion: '1',
      exportedAt: now,
      course: Course.parse({
        id: courseId,
        tenantId,
        code: 'WRIT-101',
        title: 'Evidence-Based Writing',
        status: 'draft',
        startsAt: null,
        endsAt: null,
        catalogVisibility: 'unlisted',
        enrollmentCode: null,
        createdAt: now,
        updatedAt: now,
      }),
      learningObjectives: [],
      modules: [],
      units: [],
      pages: [],
      resources: [],
    }),
  exportCourseCommonCartridge: async (_actorUserId: string, _tenantId: string, _courseId: string) =>
    CommonCartridgeCourseExport.parse({
      format: 'imscc_1_3',
      exportedAt: now,
      manifestXml: '<manifest identifier="openlms-course"></manifest>',
      files: [],
    }),
  importCourseCommonCartridge: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CommonCartridgeImportResult.parse({
      format: 'imscc_1_3',
      learningObjectivesRestored: 1,
      modulesRestored: 2,
      unitsRestored: 3,
      pagesRestored: 4,
      resourcesRestored: 5,
    }),
  restoreCourseBackup: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) => ({
    learningObjectivesRestored: 2,
    modulesRestored: 3,
    unitsRestored: 4,
    pagesRestored: 1,
    resourcesRestored: 5,
  }),
  createCourse: async (_actorUserId: string, _tenantId: string, _input: unknown) =>
    Course.parse({
      id: courseId,
      tenantId,
      code: 'WRIT-101',
      title: 'Evidence-Based Writing',
      status: 'draft',
      startsAt: null,
      endsAt: null,
      createdAt: now,
      updatedAt: now,
    }),
  updateCourse: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    Course.parse({
      id: courseId,
      tenantId,
      code: 'WRIT-101',
      title: 'Evidence-Based Writing',
      status: 'active',
      startsAt: null,
      endsAt: null,
      createdAt: now,
      updatedAt: now,
    }),
  deleteCourse: async (_actorUserId: string, _tenantId: string, _courseId: string) => {},
  restoreDeletedCourse: async (_actorUserId: string, _tenantId: string, _courseId: string) =>
    Course.parse({
      id: courseId,
      tenantId,
      code: 'WRIT-101',
      title: 'Evidence-Based Writing',
      status: 'draft',
      startsAt: null,
      endsAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    }),
  listCourseSections: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createCourseSection: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseSection.parse({
      id: courseSectionId,
      tenantId,
      courseId,
      name: 'Section B',
      status: 'active',
      position: 1,
      createdAt: now,
      updatedAt: now,
    }),
  updateCourseSection: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _courseSectionId: string,
    _input: unknown,
  ) =>
    CourseSection.parse({
      id: courseSectionId,
      tenantId,
      courseId,
      name: 'Section B (updated)',
      status: 'archived',
      position: 1,
      createdAt: now,
      updatedAt: now,
    }),
  deleteCourseSection: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _courseSectionId: string,
  ) => undefined,
  listCourseAnnouncements: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  listAnnouncementsForActor: async (_actorUserId: string, _tenantId: string) => [],
  createCourseAnnouncement: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseAnnouncement.parse({
      id: announcementId,
      tenantId,
      courseId,
      authorId: actorId,
      title: 'Essay workshop reminder',
      body: 'Bring one paragraph and one question for peer review.',
      status: 'published',
      pinned: true,
      postedAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  updateCourseAnnouncement: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _announcementId: string,
    _input: unknown,
  ) =>
    CourseAnnouncement.parse({
      id: announcementId,
      tenantId,
      courseId,
      authorId: actorId,
      title: 'Essay workshop reminder',
      body: 'Updated body.',
      status: 'published',
      pinned: true,
      postedAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  deleteCourseAnnouncement: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _announcementId: string,
  ) => undefined,
  listCourseMemberships: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  listMessageableUsers: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createCourseMembership: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseMembership.parse({
      id: courseMembershipId,
      tenantId,
      courseId,
      userId: actorId,
      role: 'student',
      createdAt: now,
      updatedAt: now,
    }),
  updateCourseMembership: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _courseMembershipId: string,
    _input: unknown,
  ) =>
    CourseMembership.parse({
      id: courseMembershipId,
      tenantId,
      courseId,
      userId: actorId,
      role: 'teaching_assistant',
      createdAt: now,
      updatedAt: now,
    }),
  deleteCourseMembership: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _courseMembershipId: string,
  ) => undefined,
  selfEnrollInCourse: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: { enrollmentCode: string },
  ) =>
    CourseMembership.parse({
      id: courseMembershipId,
      tenantId,
      courseId,
      userId: actorId,
      role: 'student',
      createdAt: now,
      updatedAt: now,
    }),
  updateCourseCatalogSettings: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseCatalogSettings.parse({
      tenantId,
      courseId,
      catalogVisibility: 'listed',
      enrollmentCode: 'JOIN-WRIT-101',
      updatedAt: now,
    }),
  listAssignments: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _moduleId?: string,
    _unitId?: string,
  ) => [],
  getAssignment: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
  ) => {
    throw new Error('not implemented in stub');
  },
  createAssignment: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    Assignment.parse({
      id: assignmentId,
      tenantId,
      courseId,
      moduleId: null,
      unitId: null,
      position: null,
      title: 'Essay 1: Defending a thesis',
      instructions: 'Argue your interpretation of the text using cited evidence.',
      status: 'draft',
      dueAt: null,
      allowResubmission: false,
      activeRubricId: null,
      aiSettings: {
        precheckEnabled: false,
        feedbackDraftEnabled: false,
        scoreSuggestionEnabled: false,
      },
      createdAt: now,
      updatedAt: now,
    }),
  updateAssignment: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    _input: unknown,
  ) =>
    Assignment.parse({
      id: assignmentId,
      tenantId,
      courseId,
      moduleId: null,
      unitId: null,
      position: null,
      title: 'Essay 1: Defending a thesis (updated)',
      instructions: 'Refreshed instructions.',
      status: 'published',
      dueAt: null,
      allowResubmission: true,
      activeRubricId: null,
      aiSettings: {
        precheckEnabled: false,
        feedbackDraftEnabled: false,
        scoreSuggestionEnabled: false,
      },
      createdAt: now,
      updatedAt: now,
    }),
  deleteAssignment: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
  ) => undefined,
  listAssignmentOverrides: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
  ) => [],
  createAssignmentOverride: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    input: {
      targetType: 'user' | 'group' | 'section';
      targetId: string;
      opensAt: Date | null;
      dueAt: Date | null;
      closesAt: Date | null;
      status: 'active' | 'archived';
    },
  ) =>
    AssignmentOverride.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE3E',
      tenantId,
      assignmentId,
      targetType: input.targetType,
      targetId: input.targetId,
      opensAt: input.opensAt,
      dueAt: input.dueAt,
      closesAt: input.closesAt,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    }),
  deleteAssignmentOverride: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    _overrideId: string,
  ) => {},
  updateAssignmentOverride: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    overrideId: string,
    input: {
      opensAt: Date | null;
      dueAt: Date | null;
      closesAt: Date | null;
      status: 'active' | 'archived';
    },
  ) =>
    AssignmentOverride.parse({
      id: overrideId,
      tenantId,
      assignmentId,
      targetType: 'user',
      targetId: actorId,
      opensAt: input.opensAt,
      dueAt: input.dueAt,
      closesAt: input.closesAt,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    }),
  getAssignmentEffectiveSchedule: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    assignmentId: string,
  ) =>
    AssignmentEffectiveSchedule.parse({
      assignmentId,
      opensAt: null,
      dueAt: null,
      closesAt: null,
    }),
  getAssignmentRubric: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
  ) =>
    Rubric.parse({
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
    }),
  listRubrics: async (_actorUserId: string, _tenantId: string) => [],
  getRubric: async (_actorUserId: string, _tenantId: string, _rubricId: string) =>
    Rubric.parse({
      id: rubricId,
      tenantId,
      title: 'Argument writing rubric',
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
    }),
  createRubric: async (_actorUserId: string, _tenantId: string, _input: unknown) =>
    Rubric.parse({
      id: rubricId,
      tenantId,
      title: 'Argument writing rubric',
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
    }),
  updateRubric: async (
    _actorUserId: string,
    _tenantId: string,
    _rubricId: string,
    _input: unknown,
  ) =>
    Rubric.parse({
      id: rubricId,
      tenantId,
      title: 'Argument writing rubric (updated)',
      version: 2,
      sourceTemplateId: null,
      criteria: [
        {
          id: 'evidence',
          label: 'Evidence',
          description: 'Refreshed evidence criterion.',
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
    }),
  deleteRubric: async (_actorUserId: string, _tenantId: string, _rubricId: string) => undefined,
  listQuizzes: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  getQuiz: async (_actorUserId: string, _tenantId: string, _courseId: string, _quizId: string) => {
    throw new Error('not implemented in stub');
  },
  createQuiz: async (_actorUserId: string, _tenantId: string, _courseId: string, _input: unknown) =>
    Quiz.parse({
      id: quizId,
      tenantId,
      courseId,
      moduleId: null,
      unitId: null,
      position: null,
      title: 'Argumentation quiz',
      description: null,
      status: 'draft',
      opensAt: null,
      closesAt: null,
      timeLimitMinutes: null,
      shuffleQuestions: false,
      maxAttempts: 1,
      createdAt: now,
      updatedAt: now,
    }),
  updateQuiz: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
    _input: unknown,
  ) =>
    Quiz.parse({
      id: quizId,
      tenantId,
      courseId,
      moduleId: null,
      unitId: null,
      position: null,
      title: 'Argumentation quiz (updated)',
      description: 'Refreshed description.',
      status: 'published',
      opensAt: null,
      closesAt: null,
      timeLimitMinutes: 30,
      shuffleQuestions: true,
      maxAttempts: 2,
      createdAt: now,
      updatedAt: now,
    }),
  deleteQuiz: async (_actorUserId: string, _tenantId: string, _courseId: string, _quizId: string) =>
    undefined,
  listQuizQuestions: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
  ) => [],
  createQuizQuestion: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
    _input: { position: number; questionType: string; prompt: string; points: number },
  ) =>
    QuizQuestion.parse({
      id: quizQuestionId,
      tenantId,
      quizId,
      position: 0,
      questionType: 'multiple_choice',
      prompt: 'Which element connects evidence to a claim?',
      points: 2,
      choices: [
        { id: 'a', text: 'Reasoning' },
        { id: 'b', text: 'Evidence' },
        { id: 'c', text: 'Claim' },
      ],
      createdAt: now,
      updatedAt: now,
    }),
  listQuizAttempts: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
  ) => [],
  listQuizAggregateGrades: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
  ) => [],
  listQuizOverrides: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
  ) => [],
  createQuizOverride: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
    _input: unknown,
  ) =>
    QuizOverride.parse({
      id: quizOverrideId,
      tenantId,
      quizId,
      targetType: 'user',
      targetId: actorId,
      opensAt: null,
      closesAt: null,
      timeLimitMinutes: 60,
      maxAttempts: 2,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }),
  updateQuizOverride: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
    _overrideId: string,
    _input: unknown,
  ) =>
    QuizOverride.parse({
      id: quizOverrideId,
      tenantId,
      quizId,
      targetType: 'user',
      targetId: actorId,
      opensAt: null,
      closesAt: null,
      timeLimitMinutes: 90,
      maxAttempts: 2,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }),
  deleteQuizOverride: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
    _overrideId: string,
  ) => undefined,
  getQuizEffectiveSettings: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
  ) =>
    QuizEffectiveSettings.parse({
      quizId,
      opensAt: null,
      closesAt: null,
      timeLimitMinutes: 60,
      maxAttempts: 2,
    }),
  listQuizAttemptQuestionGrades: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
    _attemptId: string,
  ) => [],
  recordQuizAttemptQuestionGrade: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
    _attemptId: string,
    _questionId: string,
    _input: unknown,
  ) =>
    QuizAttemptQuestionGrade.parse({
      id: quizAttemptQuestionGradeId,
      tenantId,
      quizId,
      attemptId: quizAttemptId,
      questionId: quizQuestionId,
      graderId: actorId,
      score: 4,
      feedback: 'Clear explanation.',
      createdAt: now,
      updatedAt: now,
    }),
  regradeQuizAttempt: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
    _attemptId: string,
  ) =>
    QuizAttempt.parse({
      id: quizAttemptId,
      tenantId,
      quizId,
      studentId: actorId,
      attemptNumber: 1,
      status: 'graded',
      startedAt: now,
      submittedAt: now,
      score: 4,
      createdAt: now,
      updatedAt: now,
    }),
  startQuizAttempt: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
    _input?: { accessPassword?: string | null; clientIp?: string | null },
  ) =>
    QuizAttempt.parse({
      id: quizAttemptId,
      tenantId,
      quizId,
      studentId: actorId,
      attemptNumber: 1,
      status: 'in_progress',
      startedAt: now,
      submittedAt: null,
      score: null,
      createdAt: now,
      updatedAt: now,
    }),
  submitQuizAttempt: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
    _attemptId: string,
  ) =>
    QuizAttempt.parse({
      id: quizAttemptId,
      tenantId,
      quizId,
      studentId: actorId,
      attemptNumber: 1,
      status: 'submitted',
      startedAt: now,
      submittedAt: now,
      score: null,
      createdAt: now,
      updatedAt: now,
    }),
  listQuizAttemptResponses: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
    _attemptId: string,
  ) => [],
  saveQuizAttemptResponse: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _quizId: string,
    _attemptId: string,
    _questionId: string,
    _answer: unknown,
  ) =>
    QuizAttemptResponse.parse({
      id: quizAttemptResponseId,
      tenantId,
      quizId,
      attemptId: quizAttemptId,
      questionId: quizQuestionId,
      answer: { kind: 'choice', selectedChoiceIds: ['b'] },
      createdAt: now,
      updatedAt: now,
    }),
  listQuestionBanks: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createQuestionBank: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    QuestionBank.parse({
      id: questionBankId,
      tenantId,
      courseId,
      title: 'Argumentation question bank',
      description: null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }),
  updateQuestionBank: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _questionBankId: string,
    _input: unknown,
  ) =>
    QuestionBank.parse({
      id: questionBankId,
      tenantId,
      courseId,
      title: 'Argumentation question bank (updated)',
      description: 'Refreshed description.',
      status: 'archived',
      createdAt: now,
      updatedAt: now,
    }),
  deleteQuestionBank: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _questionBankId: string,
  ) => undefined,
  listQuestionBankQuestions: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _questionBankId: string,
  ) => [],
  createQuestionBankQuestion: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _questionBankId: string,
    _input: unknown,
  ) =>
    QuestionBankQuestion.parse({
      id: questionBankQuestionId,
      tenantId,
      questionBankId,
      position: 0,
      questionType: 'multiple_choice',
      prompt: 'Which element connects evidence to a claim?',
      points: 2,
      choices: [
        { id: 'a', text: 'Reasoning' },
        { id: 'b', text: 'Evidence' },
      ],
      createdAt: now,
      updatedAt: now,
    }),
  listAttendanceSessions: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createAttendanceSession: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    AttendanceSession.parse({
      id: attendanceSessionId,
      tenantId,
      courseId,
      title: 'Week 2 seminar',
      startsAt: new Date('2026-05-11T00:00:00.000Z'),
      endsAt: new Date('2026-05-11T01:00:00.000Z'),
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    }),
  listAttendanceRecords: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _sessionId: string,
  ) => [],
  recordAttendanceRecord: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _sessionId: string,
    _studentId: string,
    _input: unknown,
  ) =>
    AttendanceRecord.parse({
      id: attendanceRecordId,
      tenantId,
      sessionId: attendanceSessionId,
      studentId: actorId,
      status: 'late',
      note: 'Arrived after the opening activity.',
      recordedAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  listCompletionRequirements: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _moduleId: string | undefined,
  ) => [],
  createCompletionRequirement: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CompletionRequirement.parse({
      id: completionRequirementId,
      tenantId,
      courseId,
      moduleId: null,
      title: 'Submit Essay 1',
      description: null,
      requirementType: 'submit_assignment',
      targetType: 'assignment',
      targetId: assignmentId,
      minScorePercent: null,
      status: 'active',
      required: true,
      position: 0,
      createdAt: now,
      updatedAt: now,
    }),
  listCompletionProgress: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _requirementId: string,
  ) => [],
  listCredentials: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createCourseCredential: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseCredential.parse({
      id: credentialId,
      tenantId,
      courseId,
      credentialType: 'badge',
      title: 'Evidence-based writing badge',
      description: 'Awarded for sustained evidence-based argumentation.',
      criteriaSummary: 'Earn 85% or higher on at least three essay rubrics.',
      status: 'draft',
      imageUrl: null,
      createdAt: now,
      updatedAt: now,
    }),
  updateCourseCredential: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _credentialId: string,
    _input: unknown,
  ) =>
    CourseCredential.parse({
      id: credentialId,
      tenantId,
      courseId,
      credentialType: 'badge',
      title: 'Evidence-based writing badge (updated)',
      description: 'Refreshed description.',
      criteriaSummary: 'Earn 90% or higher on at least three essay rubrics.',
      status: 'published',
      imageUrl: null,
      createdAt: now,
      updatedAt: now,
    }),
  deleteCourseCredential: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _credentialId: string,
  ) => undefined,
  listCredentialAwards: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _credentialId: string,
  ) => [],
  createCredentialAward: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _credentialId: string,
    _input: unknown,
  ) =>
    CredentialAward.parse({
      id: credentialAwardId,
      tenantId,
      credentialId,
      studentId: actorId,
      status: 'issued',
      issuedAt: now,
      revokedAt: null,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
    }),
  listConversationThreads: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createConversationThread: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    ConversationThread.parse({
      id: conversationThreadId,
      tenantId,
      courseId,
      subject: 'Sample thread',
      status: 'open',
      participantIds: [actorId],
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  listConversationMessages: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _threadId: string,
  ) => [],
  createConversationMessage: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _threadId: string,
    _input: unknown,
  ) =>
    ConversationMessage.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE4Z',
      tenantId,
      threadId: conversationThreadId,
      senderId: actorId,
      body: 'Sample message',
      sentAt: now,
      createdAt: now,
    }),
  listCourseGroupSets: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createCourseGroupSet: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseGroupSet.parse({
      id: courseGroupSetId,
      tenantId,
      courseId,
      name: 'Project teams',
      selfSignupEnabled: false,
      status: 'active',
      position: 0,
      createdAt: now,
      updatedAt: now,
    }),
  updateCourseGroupSet: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _groupSetId: string,
    _input: unknown,
  ) =>
    CourseGroupSet.parse({
      id: courseGroupSetId,
      tenantId,
      courseId,
      name: 'Project teams (renamed)',
      selfSignupEnabled: true,
      status: 'active',
      position: 0,
      createdAt: now,
      updatedAt: now,
    }),
  deleteCourseGroupSet: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _groupSetId: string,
  ) => {},
  listCourseGroups: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createCourseGroup: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseGroup.parse({
      id: courseGroupId,
      tenantId,
      courseId,
      groupSetId: courseGroupSetId,
      name: 'Team Alpha',
      description: null,
      status: 'active',
      position: 0,
      createdAt: now,
      updatedAt: now,
    }),
  updateCourseGroup: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _groupId: string,
    _input: unknown,
  ) =>
    CourseGroup.parse({
      id: courseGroupId,
      tenantId,
      courseId,
      groupSetId: courseGroupSetId,
      name: 'Team Alpha (renamed)',
      description: null,
      status: 'active',
      position: 0,
      createdAt: now,
      updatedAt: now,
    }),
  deleteCourseGroup: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _groupId: string,
  ) => {},
  listCourseGroupMembers: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _groupId: string,
  ) => [],
  createCourseGroupMember: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _groupId: string,
    _input: unknown,
  ) =>
    CourseGroupMember.parse({
      id: courseGroupMemberId,
      tenantId,
      groupId: courseGroupId,
      userId: actorId,
      role: 'member',
      createdAt: now,
      updatedAt: now,
    }),
  joinCourseGroup: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _groupId: string,
  ) =>
    CourseGroupMember.parse({
      id: courseGroupMemberId,
      tenantId,
      groupId: courseGroupId,
      userId: actorId,
      role: 'member',
      createdAt: now,
      updatedAt: now,
    }),
  leaveCourseGroup: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _groupId: string,
  ) => {},
  listAssignmentSubmissions: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
  ) => [],
  upsertSubmissionGrade: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    submissionId: string,
    input: {
      score: number;
      maxScore: number;
      status: GradeStatus;
    },
  ) =>
    Grade.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE39',
      tenantId,
      submissionId,
      score: input.score,
      maxScore: input.maxScore,
      status: input.status,
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    }),
  saveAssignmentDraft: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    _draftId: string,
    _blocks: unknown,
  ) =>
    Draft.parse({
      id: draftId,
      tenantId,
      assignmentId,
      studentId: actorId,
      blocks: [{ blockId: 'intro', text: 'Evidence supports the claim.' }],
      createdAt: now,
      updatedAt: now,
    }),
  submitAssignmentDraft: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    _draftId: string,
    _blocks: unknown,
  ) =>
    Submission.parse({
      id: submissionId,
      tenantId,
      assignmentId,
      studentId: actorId,
      sourceDraftId: draftId,
      version: 1,
      status: 'submitted',
      contentSnapshot: [{ blockId: 'intro', text: 'Evidence supports the claim.' }],
      submittedAt: now,
      createdAt: now,
    }),
  listAssignmentPeerReviews: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
  ) => [],
  listSubmissionAttachments: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    _submissionId: string,
  ) => [],
  createSubmissionAttachment: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    _submissionId: string,
    _input: unknown,
  ) =>
    SubmissionAttachment.parse({
      id: submissionAttachmentId,
      tenantId,
      submissionId,
      fileResourceId: fileId,
      displayName: 'evidence-appendix.pdf',
      position: 0,
      createdAt: now,
    }),
  downloadSubmissionAttachment: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    _submissionId: string,
    _attachmentId: string,
  ) => ({
    file: FileResource.parse({
      id: fileId,
      tenantId,
      courseId: null,
      ownerId: actorId,
      storageProvider: 'local_fs',
      storageKey: 'test/key',
      filename: 'evidence-appendix.pdf',
      mediaType: 'application/pdf',
      byteSize: 4,
      checksumSha256: 'a'.repeat(64),
      visibility: 'private',
      altText: null,
      transcriptText: null,
      license: null,
      copyrightHolder: null,
      createdAt: now,
    }),
    bytes: new Uint8Array([1, 2, 3, 4]),
  }),
  listSubmissionComments: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    _submissionId: string,
  ) => [],
  createSubmissionComment: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    _submissionId: string,
    _input: unknown,
  ) =>
    SubmissionComment.parse({
      id: submissionCommentId,
      tenantId,
      submissionId,
      authorId: actorId,
      body: 'Please expand the evidence explanation.',
      visibility: 'student_visible',
      createdAt: now,
      updatedAt: now,
    }),
  listGradebookEntries: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  exportGradebookCsv: async (_actorUserId: string, _tenantId: string, _courseId: string) => '',
  listCourseFinalGrades: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  exportCourseFinalGradesCsv: async (_actorUserId: string, _tenantId: string, _courseId: string) =>
    '',
  submitCourseFinalGradesToSis: async () =>
    SisFinalGradeSubmission.parse({
      tenantId,
      courseId,
      integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE5X',
      storageFileId: '01J9QW7B6N5W2YH3D3A1V0KE5Y',
      rowCount: 1,
      status: 'queued',
      submittedAt: now,
    }),
  listSubmissionGradeHistory: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    _submissionId: string,
  ) => [],
  createGradeAppeal: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    _submissionId: string,
    _input: unknown,
  ) => {
    throw new ApiError('not_found', 'No grade appeal configured for this test.');
  },
  listGradeAppeals: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  updateGradeAppeal: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _gradeAppealId: string,
    _input: unknown,
  ) => {
    throw new ApiError('not_found', 'No grade appeal configured for this test.');
  },
  listGradebookManualItems: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
  ) => [],
  createGradebookManualItem: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    GradebookManualItem.parse({
      id: gradebookManualItemId,
      tenantId,
      courseId,
      gradebookCategoryId: null,
      title: 'Participation',
      description: null,
      maxScore: 100,
      dueAt: null,
      position: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }),
  updateGradebookManualItem: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _manualItemId: string,
    _input: unknown,
  ) =>
    GradebookManualItem.parse({
      id: gradebookManualItemId,
      tenantId,
      courseId,
      gradebookCategoryId: null,
      title: 'Participation (updated)',
      description: 'Refreshed description.',
      maxScore: 150,
      dueAt: null,
      position: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }),
  deleteGradebookManualItem: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _manualItemId: string,
  ) => undefined,
  listGradebookManualGrades: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _manualItemId: string,
  ) => [],
  saveGradebookManualGrade: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _manualItemId: string,
    _studentId: string,
    _input: unknown,
  ) =>
    GradebookManualGrade.parse({
      id: gradebookManualGradeId,
      tenantId,
      gradebookManualItemId,
      studentId: actorId,
      score: 9,
      maxScore: 10,
      status: 'published',
      source: 'manual',
      gradedAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  listGradebookCategories: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createGradebookCategory: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    GradebookCategory.parse({
      id: gradebookCategoryId,
      tenantId,
      courseId,
      name: 'Homework',
      position: 0,
      weightPercent: 40,
      dropLowest: 1,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }),
  updateGradebookCategory: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _gradebookCategoryId: string,
    _input: unknown,
  ) =>
    GradebookCategory.parse({
      id: gradebookCategoryId,
      tenantId,
      courseId,
      name: 'Homework (updated)',
      position: 0,
      weightPercent: 50,
      dropLowest: 1,
      status: 'archived',
      createdAt: now,
      updatedAt: now,
    }),
  deleteGradebookCategory: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _gradebookCategoryId: string,
  ) => undefined,
  listCourseGradingSchemes: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
  ) => [],
  createCourseGradingScheme: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseGradingScheme.parse({
      id: courseGradingSchemeId,
      tenantId,
      courseId,
      name: 'Standard 4-tier',
      status: 'active',
      entries: [
        { label: 'A', minPercent: 90 },
        { label: 'F', minPercent: 0 },
      ],
      createdAt: now,
      updatedAt: now,
    }),
  listCourseExternalTools: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  getLti1p3JsonWebKeySet: async (_tenantId: string) =>
    Lti1p3JsonWebKeySet.parse({
      keys: [
        {
          kty: 'RSA',
          kid: 'platform-key-1',
          use: 'sig',
          alg: 'RS256',
          n: 'sXch3n91Z0-SKpR6aSpsNQ',
          e: 'AQAB',
        },
      ],
    }),
  launchCourseExternalToolLti1p3: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _toolId: string,
  ) =>
    Lti1p3OidcLoginInitiation.parse({
      method: 'redirect',
      url: 'https://tools.example.edu/oidc/login?iss=https%3A%2F%2Flms.example.edu',
    }),
  launchCourseExternalToolLti1p3DeepLinking: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _toolId: string,
  ) =>
    Lti1p3OidcLoginInitiation.parse({
      method: 'redirect',
      url: 'https://tools.example.edu/oidc/login?iss=https%3A%2F%2Flms.example.edu',
    }),
  createCourseExternalToolLti1p3LaunchAuthorizationResponse: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _toolId: string,
    _input: unknown,
  ) =>
    Lti1p3LaunchAuthorizationResponse.parse({
      method: 'form_post',
      url: 'https://tools.example.edu/lti/launch',
      fields: {
        id_token: 'header.payload.signature',
        state: 'state-123',
      },
    }),
  authorizeLti1p3OidcLaunch: async (_sessionToken: string, _input: unknown) =>
    Lti1p3LaunchAuthorizationResponse.parse({
      method: 'form_post',
      url: 'https://tools.example.edu/lti/launch',
      fields: {
        id_token: 'header.payload.signature',
        state: 'state-123',
      },
    }),
  processLti1p3DeepLinkingReturn: async (_jwt: string) =>
    Lti1p3DeepLinkingReturnResult.parse({
      createdExternalTools: [],
      ignoredContentItemCount: 0,
    }),
  createLti1p3ServiceAccessToken: async (_tenantId: string, _input: unknown) =>
    Lti1p3ServiceAccessToken.parse({
      access_token: 'header.payload.signature',
      token_type: 'bearer',
      expires_in: 3600,
      scope: 'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
    }),
  getLti1p3NamesRolesMemberships: async (
    _accessToken: string,
    _tenantId: string,
    _courseId: string,
    _role?: unknown,
  ) =>
    Lti1p3NamesRolesMembershipContainer.parse({
      id: 'https://lms.example.edu/api/v1/tenants/01J9QW7B6N5W2YH3D3A1V0KE2T/courses/01J9QW7B6N5W2YH3D3A1V0KE2Y/lti-1p3/namesroles',
      context: {
        id: courseId,
        label: 'WRIT-101',
        title: 'Evidence-Based Writing',
      },
      members: [],
    }),
  publishLti1p3AgsScore: async (
    _accessToken: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    _toolId: string,
    _score: unknown,
  ) => undefined,
  listLti1p3AgsResults: async (
    _accessToken: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    _toolId: string,
    _userId?: string,
  ) =>
    Lti1p3AgsResultContainer.parse([
      {
        id: `https://lms.example.edu/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/external-tools/${courseExternalToolId}/lti-ags/lineitem/results/${actorId}`,
        scoreOf: `https://lms.example.edu/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/external-tools/${courseExternalToolId}/lti-ags/lineitem`,
        userId: actorId,
        resultScore: 9,
        resultMaximum: 10,
      },
    ]),
  updateCourseExternalTool: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _toolId: string,
    _input: unknown,
  ) =>
    CourseExternalTool.parse({
      id: courseExternalToolId,
      tenantId,
      courseId,
      integrationConnectionId: integrationConnectionId,
      name: 'External tool (renamed)',
      description: null,
      launchUrl: 'https://launch.example.test/lti',
      placement: 'course_navigation',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }),
  deleteCourseExternalTool: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _toolId: string,
  ) => undefined,
  recordCourseExternalToolOutcome: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
    _input: unknown,
  ) =>
    CourseExternalToolOutcome.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE3Z',
      tenantId,
      courseId,
      assignmentId,
      studentId: actorId,
      externalToolId: courseExternalToolId,
      score: 85,
      maxScore: 100,
      status: 'published',
      reportedAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  listCourseExternalToolOutcomes: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _assignmentId: string,
  ) => [],
  recordSubmissionPlagiarismReport: async (
    _actorUserId: string,
    _tenantId: string,
    _submissionId: string,
    _input: unknown,
  ) =>
    SubmissionPlagiarismReport.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE3W',
      tenantId,
      courseId,
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE3V',
      integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE3U',
      similarityPercent: 12.5,
      reportUrl: 'https://provider.example/report/abc',
      status: 'complete',
      checkedAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  listSubmissionPlagiarismReports: async (
    _actorUserId: string,
    _tenantId: string,
    _submissionId: string,
  ) => [],
  listCoursePlagiarismReports: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
  ) => [],
  listMyPushTokens: async (_actorUserId: string, _tenantId: string) => [],
  registerMyPushToken: async (_actorUserId: string, _tenantId: string, _input: unknown) =>
    UserPushToken.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE3T',
      tenantId,
      userId: actorId,
      platform: 'ios',
      token: 'sample-token',
      locale: 'en-US',
      appVersion: '1.0.0',
      lastUsedAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  revokeMyPushToken: async (_actorUserId: string, _tenantId: string, _tokenId: string) => undefined,
  createCourseExternalTool: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseExternalTool.parse({
      id: courseExternalToolId,
      tenantId,
      courseId,
      integrationConnectionId: integrationConnectionId,
      name: 'Mathway',
      description: 'Step-by-step math problem solver.',
      launchUrl: 'https://launch.example.test/mathway',
      placement: 'course_navigation',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }),
  listCourseModules: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createCourseModule: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseModule.parse({
      id: moduleId,
      tenantId,
      courseId,
      title: 'Foundations of evidence-based writing',
      summary: 'Introduces the core argument structure used throughout the course.',
      visibility: 'published',
      accessPolicy: 'course_member',
      version: 1,
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    }),
  updateCourseModule: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _moduleId: string,
    _input: unknown,
  ) =>
    CourseModule.parse({
      id: moduleId,
      tenantId,
      courseId,
      title: 'Foundations of evidence-based writing (updated)',
      summary: 'Refreshed summary.',
      visibility: 'published',
      accessPolicy: 'course_member',
      version: 2,
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    }),
  deleteCourseModule: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _moduleId: string,
  ) => undefined,
  listCourseUnits: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _moduleId: string | undefined,
  ) => [],
  createCourseUnit: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseUnit.parse({
      id: unitId,
      tenantId,
      courseId,
      moduleId,
      title: 'Defining a claim',
      summary: 'How to phrase a defensible thesis statement.',
      visibility: 'published',
      accessPolicy: 'course_member',
      version: 1,
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    }),
  updateCourseUnit: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _unitId: string,
    _input: unknown,
  ) =>
    CourseUnit.parse({
      id: unitId,
      tenantId,
      courseId,
      moduleId,
      title: 'Defining a claim (updated)',
      summary: 'Refreshed summary.',
      visibility: 'published',
      accessPolicy: 'course_member',
      version: 2,
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    }),
  deleteCourseUnit: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _unitId: string,
  ) => undefined,
  listCourseResources: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _moduleId: string | undefined,
    _unitId: string | undefined,
  ) => [],
  createCourseResource: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseResource.parse({
      id: resourceId,
      tenantId,
      courseId,
      moduleId,
      unitId,
      resourceType: 'reading_material',
      title: 'Argument structure primer',
      body: 'Claim → reasoning → evidence.',
      sourceUri: null,
      visibility: 'published',
      accessPolicy: 'course_member',
      version: 1,
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    }),
  updateCourseResource: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _resourceId: string,
    _input: unknown,
  ) =>
    CourseResource.parse({
      id: resourceId,
      tenantId,
      courseId,
      moduleId,
      unitId,
      resourceType: 'reading_material',
      title: 'Argument structure primer (updated)',
      body: 'Refreshed body.',
      sourceUri: null,
      visibility: 'published',
      accessPolicy: 'course_member',
      version: 2,
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    }),
  deleteCourseResource: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _resourceId: string,
  ) => undefined,
  listLearningObjectives: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  getLearningObjectiveCoverage: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    learningObjectiveId: string,
  ) =>
    LearningObjectiveCoverage.parse({
      learningObjectiveId,
      moduleIds: [],
      unitIds: [],
      pageIds: [],
    }),
  createLearningObjective: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    LearningObjective.parse({
      id: learningObjectiveId,
      tenantId,
      courseId,
      code: 'LO-1',
      title: 'Construct evidence-based arguments',
      description: 'Students can defend claims with cited evidence.',
      status: 'active',
      position: 0,
      createdAt: now,
      updatedAt: now,
    }),
  updateLearningObjective: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _learningObjectiveId: string,
    _input: unknown,
  ) =>
    LearningObjective.parse({
      id: learningObjectiveId,
      tenantId,
      courseId,
      code: 'LO-1-updated',
      title: 'Construct evidence-based arguments (updated)',
      description: 'Refreshed description.',
      status: 'active',
      position: 0,
      createdAt: now,
      updatedAt: now,
    }),
  deleteLearningObjective: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _learningObjectiveId: string,
  ) => undefined,
  listLearningObjectiveMastery: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
  ) => [],
  listCoursePages: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createCoursePage: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CoursePage.parse({
      id: pageId,
      tenantId,
      courseId,
      title: 'Evidence page',
      body: 'Evidence needs reasoning that connects it to a claim.',
      visibility: 'published',
      version: 1,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    }),
  updateCoursePage: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _pageId: string,
    _input: unknown,
  ) =>
    CoursePage.parse({
      id: pageId,
      tenantId,
      courseId,
      title: 'Evidence page (updated)',
      body: 'Updated content.',
      visibility: 'published',
      version: 2,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    }),
  deleteCoursePage: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _pageId: string,
  ) => undefined,
  getCourseSyllabus: async (_actorUserId: string, _tenantId: string, _courseId: string) =>
    CourseSyllabus.parse({
      id: syllabusId,
      tenantId,
      courseId,
      body: 'Course policies, grading expectations, and weekly rhythm.',
      visibility: 'published',
      version: 1,
      createdAt: now,
      updatedAt: now,
    }),
  upsertCourseSyllabus: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseSyllabus.parse({
      id: syllabusId,
      tenantId,
      courseId,
      body: 'Course policies, grading expectations, and weekly rhythm.',
      visibility: 'published',
      version: 1,
      createdAt: now,
      updatedAt: now,
    }),
  listDiscussionTopics: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _moduleId: string | undefined,
    _unitId: string | undefined,
  ) => [],
  createDiscussionTopic: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    DiscussionTopic.parse({
      id: discussionTopicId,
      tenantId,
      courseId,
      moduleId: null,
      unitId: null,
      title: 'Course Q&A',
      prompt: null,
      visibility: 'published',
      position: 0,
      createdAt: now,
      updatedAt: now,
    }),
  updateDiscussionTopic: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _topicId: string,
    _input: unknown,
  ) =>
    DiscussionTopic.parse({
      id: discussionTopicId,
      tenantId,
      courseId,
      moduleId: null,
      unitId: null,
      title: 'Course Q&A (updated)',
      prompt: 'Refreshed prompt.',
      visibility: 'published',
      position: 0,
      createdAt: now,
      updatedAt: now,
    }),
  deleteDiscussionTopic: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _topicId: string,
  ) => undefined,
  listDiscussionPosts: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _topicId: string,
  ) => [],
  createDiscussionPost: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _topicId: string,
    _input: unknown,
  ) =>
    DiscussionPost.parse({
      id: discussionPostId,
      tenantId,
      topicId: discussionTopicId,
      authorId: actorId,
      parentPostId: null,
      body: 'I can clarify the evidence in the second sentence.',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    }),
  subscribeToDiscussionTopic: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _topicId: string,
  ) =>
    DiscussionTopicSubscription.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE3C',
      tenantId,
      topicId: discussionTopicId,
      userId: actorId,
      createdAt: now,
    }),
  unsubscribeFromDiscussionTopic: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _topicId: string,
  ) => undefined,
  updateDiscussionPost: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _topicId: string,
    _postId: string,
    _input: unknown,
  ) =>
    DiscussionPost.parse({
      id: discussionPostId,
      tenantId,
      topicId: discussionTopicId,
      authorId: actorId,
      parentPostId: null,
      body: 'I can clarify the evidence in the second sentence (edited).',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    }),
  deleteDiscussionPost: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _topicId: string,
    _postId: string,
  ) => undefined,
  listSurveys: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createSurvey: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    Survey.parse({
      id: surveyId,
      tenantId,
      courseId,
      title: 'End-of-term reflection',
      description: null,
      status: 'draft',
      opensAt: null,
      closesAt: null,
      allowsAnonymousResponses: true,
      createdAt: now,
      updatedAt: now,
    }),
  updateSurvey: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _surveyId: string,
    _input: unknown,
  ) =>
    Survey.parse({
      id: surveyId,
      tenantId,
      courseId,
      title: 'End-of-term reflection (updated)',
      description: 'Refreshed description.',
      status: 'published',
      opensAt: null,
      closesAt: null,
      allowsAnonymousResponses: false,
      createdAt: now,
      updatedAt: now,
    }),
  deleteSurvey: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _surveyId: string,
  ) => undefined,
  listSurveyQuestions: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _surveyId: string,
  ) => [],
  createSurveyQuestion: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _surveyId: string,
    _input: { position: number; questionType: string; prompt: string; required: boolean },
  ) =>
    SurveyQuestion.parse({
      id: surveyQuestionId,
      tenantId,
      surveyId,
      position: 0,
      questionType: 'single_choice',
      prompt: 'How did the pacing feel?',
      required: true,
      choices: [
        { id: 'a', text: 'Too slow' },
        { id: 'b', text: 'Just right' },
        { id: 'c', text: 'Too fast' },
      ],
      createdAt: now,
      updatedAt: now,
    }),
  listGlossaryEntries: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createGlossaryEntry: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    GlossaryEntry.parse({
      id: glossaryEntryId,
      tenantId,
      courseId,
      term: 'thesis',
      definition: 'A central claim supported by evidence and reasoning.',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    }),
  updateGlossaryEntry: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _glossaryEntryId: string,
    _input: unknown,
  ) =>
    GlossaryEntry.parse({
      id: glossaryEntryId,
      tenantId,
      courseId,
      term: 'thesis',
      definition: 'Updated definition.',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    }),
  deleteGlossaryEntry: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _glossaryEntryId: string,
  ) => undefined,
  listWikiPages: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createWikiPage: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    WikiPage.parse({
      id: wikiPageId,
      tenantId,
      courseId,
      slug: 'arguing-from-evidence',
      title: 'Arguing from evidence',
      content: 'A starting outline for class collaboration.',
      status: 'published',
      createdById: actorId,
      createdAt: now,
      updatedAt: now,
    }),
  updateWikiPage: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _wikiPageId: string,
    _input: unknown,
  ) =>
    WikiPage.parse({
      id: wikiPageId,
      tenantId,
      courseId,
      slug: 'arguing-from-evidence',
      title: 'Arguing from evidence v2',
      content: 'Updated outline.',
      status: 'published',
      createdById: actorId,
      createdAt: now,
      updatedAt: now,
    }),
  deleteWikiPage: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _wikiPageId: string,
  ) => undefined,
  listWikiPageRevisions: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _wikiPageId: string,
  ) => [],
  getWikiPageRevisionDiff: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _wikiPageId: string,
    baseRevision: number,
    targetRevision: number,
  ) =>
    WikiPageRevisionDiff.parse({
      wikiPageId,
      baseRevision,
      targetRevision,
      title: {
        changed: false,
        base: 'Arguing from evidence',
        target: 'Arguing from evidence',
      },
      learningObjectiveIds: {
        added: [],
        removed: [],
      },
      content: [
        {
          kind: 'unchanged',
          oldLineNumber: 1,
          newLineNumber: 1,
          text: 'A starting outline for class collaboration.',
        },
      ],
    }),
  restoreWikiPageRevision: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _wikiPageId: string,
    _revision: number,
    _input: unknown,
  ) =>
    WikiPage.parse({
      id: wikiPageId,
      tenantId,
      courseId,
      slug: 'arguing-from-evidence',
      title: 'Arguing from evidence',
      content: 'A starting outline for class collaboration.',
      status: 'published',
      createdById: actorId,
      createdAt: now,
      updatedAt: now,
    }),
  listSurveyResponses: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _surveyId: string,
  ) => [],
  submitSurveyResponse: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _surveyId: string,
    _input: unknown,
  ) =>
    SurveyResponse.parse({
      id: surveyResponseId,
      tenantId,
      surveyId,
      surveyQuestionId,
      respondentId: null,
      answer: { kind: 'single_choice', choiceId: 'b' },
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  getCoursePage: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _pageId: string,
  ) =>
    CoursePage.parse({
      id: pageId,
      tenantId,
      courseId,
      title: 'Evidence page',
      body: 'Evidence needs reasoning that connects it to a claim.',
      visibility: 'published',
      version: 1,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    }),
  listCalendarItems: async (_actorUserId: string, _tenantId: string, _from: Date, _to: Date) => [],
  exportCalendarIcs: async (_actorUserId: string, _tenantId: string, _from: Date, _to: Date) =>
    'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n',
  listCourseMeetings: async (_actorUserId: string, _tenantId: string, _courseId: string) => [],
  createCourseMeeting: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseMeeting.parse({
      id: courseMeetingId,
      tenantId,
      courseId,
      title: 'Live workshop',
      description: null,
      provider: 'zoom',
      externalUrl: 'https://example.zoom.us/j/123456789',
      startsAt: new Date('2026-09-10T15:00:00.000Z'),
      endsAt: new Date('2026-09-10T16:30:00.000Z'),
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    }),
  updateCourseMeeting: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _meetingId: string,
    _input: unknown,
  ) =>
    CourseMeeting.parse({
      id: courseMeetingId,
      tenantId,
      courseId,
      title: 'Live workshop (rescheduled)',
      description: null,
      provider: 'zoom',
      externalUrl: 'https://example.zoom.us/j/123456789',
      startsAt: new Date('2026-09-10T15:00:00.000Z'),
      endsAt: new Date('2026-09-10T16:30:00.000Z'),
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    }),
  deleteCourseMeeting: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _meetingId: string,
  ) => undefined,
  listCourseCalendarEvents: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
  ) => [],
  listCourseCalendarEventOccurrences: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) => [],
  createCourseCalendarEvent: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _input: unknown,
  ) =>
    CourseCalendarEvent.parse({
      id: courseCalendarEventId,
      tenantId,
      courseId,
      title: 'Weekly workshop',
      description: 'Live writing studio.',
      location: 'Room 204',
      startsAt: new Date('2026-09-10T15:00:00.000Z'),
      endsAt: new Date('2026-09-10T16:30:00.000Z'),
      visibility: 'published',
      recurrenceRule: 'FREQ=WEEKLY;COUNT=10',
      createdAt: now,
      updatedAt: now,
    }),
  updateCourseCalendarEvent: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _eventId: string,
    _input: unknown,
  ) =>
    CourseCalendarEvent.parse({
      id: courseCalendarEventId,
      tenantId,
      courseId,
      title: 'Weekly workshop (refreshed)',
      description: null,
      location: 'Room 204',
      startsAt: new Date('2026-09-10T15:00:00.000Z'),
      endsAt: new Date('2026-09-10T16:30:00.000Z'),
      visibility: 'published',
      recurrenceRule: null,
      createdAt: now,
      updatedAt: now,
    }),
  deleteCourseCalendarEvent: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _eventId: string,
  ) => undefined,
  listNotifications: async (_actorUserId: string, _tenantId: string) => [],
  listNotificationPreferences: async (_actorUserId: string, _tenantId: string) => [],
  upsertNotificationPreference: async (
    _actorUserId: string,
    _tenantId: string,
    input: {
      category: NotificationCategory;
      channel: NotificationChannel;
      frequency: NotificationFrequency;
    },
  ) =>
    NotificationPreference.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE9A',
      tenantId,
      userId: actorId,
      category: input.category,
      channel: input.channel,
      frequency: input.frequency,
      createdAt: now,
      updatedAt: now,
    }),
  listFiles: async (_actorUserId: string, _tenantId: string) => [],
  getFile: async (_actorUserId: string, _tenantId: string, _fileId: string) =>
    FileResource.parse({
      id: fileId,
      tenantId,
      ownerId: actorId,
      storageProvider: 's3_compatible',
      storageKey: 'tenant/owner/evidence.pdf',
      filename: 'evidence.pdf',
      mediaType: 'application/pdf',
      byteSize: 42000,
      checksumSha256: 'a'.repeat(64),
      visibility: 'private',
      createdAt: now,
    }),
  uploadFile: async (_actorUserId: string, _tenantId: string, input: unknown) =>
    FileResource.parse({
      id: fileId,
      tenantId,
      courseId: null,
      ownerId: actorId,
      storageProvider: 'local_fs',
      storageKey: 'tenant/owner/evidence.pdf',
      filename:
        input && typeof input === 'object' && 'filename' in input
          ? String(input.filename)
          : 'evidence.pdf',
      mediaType: 'application/pdf',
      byteSize: 3,
      checksumSha256: 'a'.repeat(64),
      visibility: 'private',
      altText: null,
      transcriptText: null,
      license: null,
      copyrightHolder: null,
      createdAt: now,
    }),
  downloadFile: async (_actorUserId: string, _tenantId: string, _fileId: string) => ({
    file: FileResource.parse({
      id: fileId,
      tenantId,
      ownerId: actorId,
      storageProvider: 'local_fs',
      storageKey: 'tenant/owner/evidence.pdf',
      filename: 'evidence.pdf',
      mediaType: 'application/pdf',
      byteSize: 3,
      checksumSha256: 'a'.repeat(64),
      visibility: 'private',
      createdAt: now,
    }),
    bytes: new Uint8Array([1, 2, 3]),
  }),
  deleteFile: async (_actorUserId: string, _tenantId: string, _fileId: string) => {},
  markNotificationRead: async (_actorUserId: string, _tenantId: string, _notificationId: string) =>
    NotificationRecord.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE31',
      tenantId,
      recipientId: actorId,
      category: 'system',
      title: 'System notice',
      body: 'A notification was marked read.',
      resourceType: 'system',
      resourceId: 'system',
      deliveryState: 'sent',
      readAt: now,
      createdAt: now,
    }),
  batchUpsertSubmissionGrades: async () => ({
    results: [],
    savedCount: 0,
    failedCount: 0,
  }),
  importSubmissionGradesCsv: async () => ({
    results: [],
    savedCount: 0,
    failedCount: 0,
  }),
  bulkEnrollInCourse: async () => ({
    results: [],
    enrolledCount: 0,
    failedCount: 0,
  }),
  bulkDeleteCourseMemberships: async () => ({
    results: [],
    deletedCount: 0,
    failedCount: 0,
  }),
  importCourseRosterCsv: async () => ({
    results: [],
    importedCount: 0,
    failedCount: 0,
  }),
  exportCourseRosterCsv: async () => '',
  listDiscussionGradebookEntries: async () => [],
  exportDiscussionGradebookCsv: async () => '',
  listInboxThreads: async () => [],
  createInboxThread: async (
    _actorUserId: string,
    _tenantId: string,
    _input: {
      subject: string;
      body: string;
      participantIds: string[];
      courseId: string | null;
    },
  ) =>
    ConversationThread.parse({
      id: conversationThreadId,
      tenantId,
      courseId: null,
      subject: 'Welcome',
      status: 'open',
      participantIds: [actorId],
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  listInboxThreadMessages: async (_actorUserId: string, _tenantId: string, _threadId: string) => [],
  createInboxThreadMessage: async (
    _actorUserId: string,
    _tenantId: string,
    _threadId: string,
    _input: { body: string },
  ) =>
    ConversationMessage.parse({
      id: conversationMessageId,
      tenantId,
      threadId: conversationThreadId,
      senderId: actorId,
      body: 'Reply.',
      sentAt: now,
      createdAt: now,
    }),
  recordResourceView: async () => {
    throw new Error('recordResourceView stub not configured for this test.');
  },
  listResourceViews: async () => [],
  listScormPackages: async () => [],
  createScormPackage: async () => {
    throw new Error('createScormPackage stub not configured for this test.');
  },
  upsertScormAttempt: async () => {
    throw new Error('upsertScormAttempt stub not configured for this test.');
  },
  initializeScormRuntime: async () => {
    throw new Error('initializeScormRuntime stub not configured for this test.');
  },
  commitScormRuntime: async () => {
    throw new Error('commitScormRuntime stub not configured for this test.');
  },
  finishScormRuntime: async () => {
    throw new Error('finishScormRuntime stub not configured for this test.');
  },
  exportQuizQtiItems: async () => {
    throw new Error('exportQuizQtiItems stub not configured for this test.');
  },
  importQuizQtiItems: async () => {
    throw new Error('importQuizQtiItems stub not configured for this test.');
  },
  listPeerReviewResponses: async () => [],
  upsertPeerReviewResponse: async () => {
    throw new Error('upsertPeerReviewResponse stub not configured for this test.');
  },
  listSectionMembers: async () => [],
  listSectionInstructors: async () => [],
  assignSectionMember: async () => {
    throw new Error('assignSectionMember stub not configured for this test.');
  },
  assignSectionInstructor: async () => {
    throw new Error('assignSectionInstructor stub not configured for this test.');
  },
  removeSectionMember: async () => undefined,
  removeSectionInstructor: async () => undefined,
  listDiscussionPostGrades: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _topicId: string,
    _studentId: string | undefined,
  ) => [],
  upsertDiscussionPostGrade: async () => {
    throw new Error('upsertDiscussionPostGrade stub not configured for this test.');
  },
  listModuleReleaseRules: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _moduleId: string,
    _targetType: 'module' | 'course_page' | 'course_resource' | 'assignment' | undefined,
    _targetId: string | undefined,
  ) => [],
  createModuleReleaseRule: async () => {
    throw new Error('createModuleReleaseRule stub not configured for this test.');
  },
  updateModuleReleaseRule: async () => {
    throw new Error('updateModuleReleaseRule stub not configured for this test.');
  },
  deleteModuleReleaseRule: async () => undefined,
  upsertModuleReleasePolicy: async () => {
    throw new Error('upsertModuleReleasePolicy stub not configured for this test.');
  },
  getModuleReleasePolicy: async () => {
    throw new Error('getModuleReleasePolicy stub not configured for this test.');
  },
  listModuleReleaseOverrides: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _moduleId: string,
  ) => [],
  upsertModuleReleaseOverride: async () => {
    throw new Error('upsertModuleReleaseOverride stub not configured for this test.');
  },
  removeModuleReleaseOverride: async () => undefined,
  getMyModuleReleaseStatus: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
  ) => [],
  getStudentModuleReleaseStatus: async (
    _actorUserId: string,
    _tenantId: string,
    _courseId: string,
    _studentId: string,
  ) => [],
  close: async () => undefined,
};

const now = new Date('2026-05-10T00:00:00.000Z');
const actorId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';
const targetCourseId = '01J9QW7B6N5W2YH3D3A1V0KE3F';
const courseSectionId = '01J9QW7B6N5W2YH3D3A1V0KE3B';
const courseSectionInstructorId = '01J9QW7B6N5W2YH3D3A1V0KE3D';
const instructorId = '01J9QW7B6N5W2YH3D3A1V0KE3E';
const announcementId = '01J9QW7B6N5W2YH3D3A1V0KE5J';
const courseMembershipId = '01J9QW7B6N5W2YH3D3A1V0KE30';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE36';
const rubricId = '01J9QW7B6N5W2YH3D3A1V0KE3C';
const quizId = '01J9QW7B6N5W2YH3D3A1V0KE43';
const quizQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE44';
const quizAttemptId = '01J9QW7B6N5W2YH3D3A1V0KE5E';
const quizAttemptResponseId = '01J9QW7B6N5W2YH3D3A1V0KE5F';
const quizAttemptQuestionGradeId = '01J9QW7B6N5W2YH3D3A1V0KE5G';
const quizOverrideId = '01J9QW7B6N5W2YH3D3A1V0KE5H';
const questionBankId = '01J9QW7B6N5W2YH3D3A1V0KE77';
const questionBankQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE78';
const attendanceSessionId = '01J9QW7B6N5W2YH3D3A1V0KE4C';
const attendanceRecordId = '01J9QW7B6N5W2YH3D3A1V0KE4D';
const completionRequirementId = '01J9QW7B6N5W2YH3D3A1V0KE4J';
const completionProgressId = '01J9QW7B6N5W2YH3D3A1V0KE4K';
const credentialId = '01J9QW7B6N5W2YH3D3A1V0KE4R';
const credentialAwardId = '01J9QW7B6N5W2YH3D3A1V0KE4S';
const conversationThreadId = '01J9QW7B6N5W2YH3D3A1V0KE4Y';
const conversationMessageId = '01J9QW7B6N5W2YH3D3A1V0KE50';
const courseGroupSetId = '01J9QW7B6N5W2YH3D3A1V0KE55';
const courseGroupId = '01J9QW7B6N5W2YH3D3A1V0KE56';
const courseGroupMemberId = '01J9QW7B6N5W2YH3D3A1V0KE57';
const draftId = '01J9QW7B6N5W2YH3D3A1V0KE37';
const submissionId = '01J9QW7B6N5W2YH3D3A1V0KE38';
const submissionAttachmentId = '01J9QW7B6N5W2YH3D3A1V0KE5P';
const submissionCommentId = '01J9QW7B6N5W2YH3D3A1V0KE5Y';
const fileId = '01J9QW7B6N5W2YH3D3A1V0KE2Z';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const unitId = '01J9QW7B6N5W2YH3D3A1V0KE32';
const resourceId = '01J9QW7B6N5W2YH3D3A1V0KE33';
const scormPackageId = '01J9QW7B6N5W2YH3D3A1V0KE42';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE34';
const learningObjectiveMasteryId = '01J9QW7B6N5W2YH3D3A1V0KE83';
const gradebookManualItemId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const gradebookManualGradeId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const gradebookCategoryId = '01J9QW7B6N5W2YH3D3A1V0KE8F';
const courseGradingSchemeId = '01J9QW7B6N5W2YH3D3A1V0KE8Q';
const courseExternalToolId = '01J9QW7B6N5W2YH3D3A1V0KE8H';
const integrationConnectionId = '01J9QW7B6N5W2YH3D3A1V0KE8G';
const xapiStatementRecordId = '01J9QW7B6N5W2YH3D3A1V0KE8J';
const xapiStatementId = '550e8400-e29b-41d4-a716-446655440000';
const auditLogId = '01J9QW7B6N5W2YH3D3A1V0KE8K';
const tenantFeatureFlagId = '01J9QW7B6N5W2YH3D3A1V0KE8M';
const webhookSubscriptionId = '01J9QW7B6N5W2YH3D3A1V0KE8R';
const legalHoldId = '01J9QW7B6N5W2YH3D3A1V0KE8N';
const retentionPolicyId = '01J9QW7B6N5W2YH3D3A1V0KE8P';
const pageId = '01J9QW7B6N5W2YH3D3A1V0KE35';
const syllabusId = '01J9QW7B6N5W2YH3D3A1V0KE82';
const discussionTopicId = '01J9QW7B6N5W2YH3D3A1V0KE39';
const discussionPostId = '01J9QW7B6N5W2YH3D3A1V0KE3A';
const surveyId = '01J9QW7B6N5W2YH3D3A1V0KE3C';
const surveyQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE3D';
const surveyResponseId = '01J9QW7B6N5W2YH3D3A1V0KE3E';
const glossaryEntryId = '01J9QW7B6N5W2YH3D3A1V0KE3F';
const wikiPageId = '01J9QW7B6N5W2YH3D3A1V0KE3G';
const courseCalendarEventId = '01J9QW7B6N5W2YH3D3A1V0KE3H';
const courseMeetingId = '01J9QW7B6N5W2YH3D3A1V0KE3J';
const wikiPageRevisionId = '01J9QW7B6N5W2YH3D3A1V0KE3K';
const authorization = { authorization: 'Bearer session-token' };

describe('API app', () => {
  it('responds to health checks', async () => {
    const app = createApiApp({ dependencies });

    const response = await app.request('/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ok',
      service: 'open-lms-api',
    });
  });

  it('deletes the authenticated user account', async () => {
    let deletedActorUserId: string | null = null;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        deleteCurrentUser: async (requestedActorId) => {
          deletedActorUserId = requestedActorId;
        },
      },
    });

    const response = await app.request('/api/v1/me', {
      method: 'DELETE',
      headers: authorization,
    });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(deletedActorUserId).toBe(actorId);
  });

  it('requires authentication before deleting the current user account', async () => {
    let wasDeleteCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        deleteCurrentUser: async () => {
          wasDeleteCalled = true;
        },
      },
    });

    const response = await app.request('/api/v1/me', { method: 'DELETE' });

    expect(response.status).toBe(401);
    expect(wasDeleteCalled).toBe(false);
  });

  it('ingests xAPI statements through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        ingestXapiStatement: async (requestedActorId, requestedTenantId, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(input.id).toBe(xapiStatementId);
          return XapiStatement.parse({
            id: xapiStatementRecordId,
            tenantId,
            statementId: input.id,
            receivedById: actorId,
            actor: input.actor,
            verb: input.verb,
            object: input.object,
            result: input.result ?? null,
            context: input.context ?? null,
            timestamp: input.timestamp ? new Date(input.timestamp) : null,
            storedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/xapi/statements`, {
      method: 'POST',
      headers: { ...authorization, 'content-type': 'application/json' },
      body: JSON.stringify({
        id: xapiStatementId,
        actor: {
          objectType: 'Agent',
          account: { homePage: 'https://lms.example.edu', name: actorId },
        },
        verb: {
          id: 'https://adlnet.gov/expapi/verbs/completed',
          display: { en: 'completed' },
        },
        object: {
          id: 'https://lms.example.edu/activity/1',
          objectType: 'Activity',
        },
        result: { completion: true },
        context: { platform: 'Open-LMS' },
        timestamp: '2026-05-14T00:00:00.000Z',
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      id: xapiStatementRecordId,
      tenantId,
      statementId: xapiStatementId,
      receivedById: actorId,
      verb: { id: 'https://adlnet.gov/expapi/verbs/completed' },
    });
  });

  it('lists tenant audit logs through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAuditLogs: async (requestedActorId, requestedTenantId, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(input).toMatchObject({
            category: 'grade',
            action: 'change_grade',
            resourceType: 'grade',
            resourceId,
            limit: 25,
          });
          expect(input.from?.toISOString()).toBe('2026-05-01T00:00:00.000Z');
          expect(input.to?.toISOString()).toBe('2026-05-14T00:00:00.000Z');

          return [
            AuditLog.parse({
              id: auditLogId,
              tenantId,
              actorId,
              category: 'grade',
              action: 'change_grade',
              resourceType: 'grade',
              resourceId,
              metadata: { changedFields: ['score'] },
              createdAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/audit-logs?category=grade&action=change_grade&resourceType=grade&resourceId=${resourceId}&from=2026-05-01T00%3A00%3A00.000Z&to=2026-05-14T00%3A00%3A00.000Z&limit=25`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      expect.objectContaining({
        id: auditLogId,
        tenantId,
        actorId,
        category: 'grade',
        action: 'change_grade',
        resourceType: 'grade',
        resourceId,
      }),
    ]);
  });

  it('exports tenant audit logs as CSV through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        exportAuditLogsCsv: async (requestedActorId, requestedTenantId, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(input).toMatchObject({ category: 'grade', limit: 50 });
          return 'id,tenant_id\nlog-1,tenant-1';
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/audit-logs/export.csv?category=grade`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(await response.text()).toBe('id,tenant_id\nlog-1,tenant-1');
  });

  it('serves the generated OpenAPI document', async () => {
    const app = createApiApp({ dependencies });

    const response = await app.request('/api/v1/openapi.json');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(generateOpenApiDocument());
  });

  it('rate limits repeated API requests by authenticated caller', async () => {
    const app = createApiApp({
      dependencies,
      rateLimit: {
        capacity: 1,
        refillTokensPerSecond: 1 / 60,
        now: () => now,
      },
    });

    const first = await app.request('/api/v1/tenants', { headers: authorization });
    const second = await app.request('/api/v1/tenants', { headers: authorization });

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.headers.get('retry-after')).toBe('60');
    expect(await second.json()).toEqual({
      error: {
        code: 'rate_limited',
        message: 'Too many requests. Retry after the rate-limit window resets.',
      },
    });
  });

  it('does not rate limit health checks or the OpenAPI document', async () => {
    const app = createApiApp({
      dependencies,
      rateLimit: {
        capacity: 1,
        refillTokensPerSecond: 1 / 60,
        now: () => now,
      },
    });

    expect((await app.request('/health')).status).toBe(200);
    expect((await app.request('/health')).status).toBe(200);
    expect((await app.request('/api/v1/openapi.json')).status).toBe(200);
    expect((await app.request('/api/v1/openapi.json')).status).toBe(200);
    expect((await app.request('/api/v1/tenants', { headers: authorization })).status).toBe(200);
  });

  it('initializes SCORM runtime state through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        initializeScormRuntime: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedPackageId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedPackageId).toBe(scormPackageId);
          return ScormRuntimeState.parse({
            attempt: {
              id: '01J9QW7B6N5W2YH3D3A1V0KE77',
              tenantId,
              scormPackageId,
              studentId: actorId,
              completionStatus: 'incomplete',
              successStatus: 'unknown',
              scoreScaled: null,
              totalTimeSeconds: null,
              suspendData: null,
              lastVisitedAt: now,
              createdAt: now,
              updatedAt: now,
            },
            values: {
              'cmi.core.lesson_status': 'incomplete',
              'cmi.core.total_time': '0000:00:00.00',
              'cmi.suspend_data': '',
              'cmi.core.entry': '',
            },
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/scorm-packages/${scormPackageId}/runtime/initialize`,
      {
        method: 'POST',
        headers: authorization,
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      values: {
        'cmi.core.lesson_status': 'incomplete',
      },
    });
  });

  it('commits SCORM runtime state through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        commitScormRuntime: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedPackageId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedPackageId).toBe(scormPackageId);
          expect(input.values['cmi.core.lesson_status']).toBe('passed');
          return ScormRuntimeState.parse({
            attempt: {
              id: '01J9QW7B6N5W2YH3D3A1V0KE77',
              tenantId,
              scormPackageId,
              studentId: actorId,
              completionStatus: 'completed',
              successStatus: 'passed',
              scoreScaled: 0.87,
              totalTimeSeconds: 750,
              suspendData: 'bookmark=section-2',
              lastVisitedAt: now,
              createdAt: now,
              updatedAt: now,
            },
            values: {
              'cmi.core.lesson_status': 'passed',
              'cmi.core.score.raw': '87',
              'cmi.core.total_time': '0000:12:30.00',
              'cmi.suspend_data': 'bookmark=section-2',
              'cmi.core.entry': 'resume',
            },
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/scorm-packages/${scormPackageId}/runtime/commit`,
      {
        method: 'POST',
        headers: { ...authorization, 'content-type': 'application/json' },
        body: JSON.stringify({
          values: {
            'cmi.core.lesson_status': 'passed',
            'cmi.core.score.raw': '87',
            'cmi.core.session_time': '0000:12:30.00',
            'cmi.suspend_data': 'bookmark=section-2',
          },
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      values: {
        'cmi.core.lesson_status': 'passed',
        'cmi.core.total_time': '0000:12:30.00',
      },
    });
  });

  it('serves a SCORM 1.2 JavaScript bridge through the API prefix', async () => {
    const app = createApiApp({ dependencies });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/scorm-packages/${scormPackageId}/runtime/bridge.js`,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/javascript');
    const script = await response.text();
    expect(script).toContain('window.API');
    expect(script).toContain('window.API_1484_11');
    expect(script).toContain('LMSInitialize');
    expect(script).toContain('Terminate');
    expect(script).toContain(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/scorm-packages/${scormPackageId}/runtime/initialize`,
    );
    expect(script).toContain(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/scorm-packages/${scormPackageId}/runtime/commit`,
    );
    expect(script).toContain(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/scorm-packages/${scormPackageId}/runtime/finish`,
    );
  });

  it('exports quiz QTI items through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        exportQuizQtiItems: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuizId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuizId).toBe(quizId);
          return QtiQuizItemExport.parse({
            format: 'qti_2_1',
            exportedAt: now,
            itemCount: 1,
            items: [
              {
                identifier: quizQuestionId,
                title: 'Which element connects evidence to a claim?',
                xml: '<assessmentItem identifier="item-1"></assessmentItem>',
              },
            ],
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/qti-items`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      format: 'qti_2_1',
      itemCount: 1,
      items: [{ identifier: quizQuestionId }],
    });
  });

  it('imports quiz QTI items through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        importQuizQtiItems: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuizId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuizId).toBe(quizId);
          expect(input.items[0]?.xml).toContain('assessmentItem');
          return QtiQuizItemImportResult.parse({
            format: 'qti_2_1',
            importedCount: 1,
            questions: [
              {
                id: quizQuestionId,
                tenantId,
                quizId,
                position: 5,
                questionType: 'multiple_choice',
                prompt: 'Which element connects evidence to a claim?',
                points: 2,
                choices: [{ id: 'choice-a', text: 'Reasoning' }],
                createdAt: now,
                updatedAt: now,
              },
            ],
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/qti-items/import`,
      {
        method: 'POST',
        headers: { ...authorization, 'content-type': 'application/json' },
        body: JSON.stringify({
          format: 'qti_2_1',
          items: [{ xml: '<assessmentItem identifier="item-1"></assessmentItem>' }],
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      format: 'qti_2_1',
      importedCount: 1,
      questions: [{ id: quizQuestionId, position: 5 }],
    });
  });

  it('serves tenant LTI 1.3 JWKS without authentication', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        getLti1p3JsonWebKeySet: async (requestedTenantId) => {
          expect(requestedTenantId).toBe(tenantId);
          return Lti1p3JsonWebKeySet.parse({
            keys: [
              {
                kty: 'RSA',
                kid: 'platform-key-1',
                use: 'sig',
                alg: 'RS256',
                n: 'sXch3n91Z0-SKpR6aSpsNQ',
                e: 'AQAB',
              },
            ],
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/lti-1p3/jwks`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      keys: [
        {
          kty: 'RSA',
          kid: 'platform-key-1',
          use: 'sig',
          alg: 'RS256',
          n: 'sXch3n91Z0-SKpR6aSpsNQ',
          e: 'AQAB',
        },
      ],
    });
  });

  it('exchanges LTI 1.3 service tokens through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createLti1p3ServiceAccessToken: async (requestedTenantId, input) => {
          expect(requestedTenantId).toBe(tenantId);
          expect(input).toEqual({
            grant_type: 'client_credentials',
            client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            client_assertion: 'tool.client.assertion',
            scope: 'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
          });
          return Lti1p3ServiceAccessToken.parse({
            access_token: 'service.header.payload.signature',
            token_type: 'bearer',
            expires_in: 3600,
            scope: 'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/lti-1p3/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: 'tool.client.assertion',
        scope: 'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
      }).toString(),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      access_token: 'service.header.payload.signature',
      token_type: 'bearer',
      expires_in: 3600,
      scope: 'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
    });
  });

  it('returns LTI 1.3 NRPS context memberships through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        getLti1p3NamesRolesMemberships: async (
          accessToken,
          requestedTenantId,
          requestedCourseId,
          role,
        ) => {
          expect(accessToken).toBe('service.header.payload.signature');
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(role).toBe('http://purl.imsglobal.org/vocab/lis/v2/membership#Learner');
          return Lti1p3NamesRolesMembershipContainer.parse({
            id: `https://lms.example.edu/api/v1/tenants/${tenantId}/courses/${courseId}/lti-1p3/namesroles`,
            context: {
              id: courseId,
              label: 'WRIT-101',
              title: 'Evidence-Based Writing',
            },
            members: [],
          });
        },
      },
    });
    const query = new URLSearchParams({
      role: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/lti-1p3/namesroles?${query.toString()}`,
      {
        headers: { authorization: 'Bearer service.header.payload.signature' },
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain(
      'application/vnd.ims.lti-nrps.v2.membershipcontainer+json',
    );
    expect(await response.json()).toEqual({
      id: `https://lms.example.edu/api/v1/tenants/${tenantId}/courses/${courseId}/lti-1p3/namesroles`,
      context: {
        id: courseId,
        label: 'WRIT-101',
        title: 'Evidence-Based Writing',
      },
      members: [],
    });
  });

  it('publishes LTI 1.3 AGS scores through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        publishLti1p3AgsScore: async (
          accessToken,
          requestedTenantId,
          requestedCourseId,
          requestedAssignmentId,
          requestedToolId,
          score,
        ) => {
          expect(accessToken).toBe('service.header.payload.signature');
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedAssignmentId).toBe(assignmentId);
          expect(requestedToolId).toBe(courseExternalToolId);
          expect(score).toEqual({
            timestamp: now,
            scoreGiven: 9,
            scoreMaximum: 10,
            activityProgress: 'Completed',
            gradingProgress: 'FullyGraded',
            userId: actorId,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/external-tools/${courseExternalToolId}/lti-ags/lineitem/scores`,
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer service.header.payload.signature',
          'content-type': 'application/vnd.ims.lis.v1.score+json',
        },
        body: JSON.stringify({
          timestamp: '2026-05-10T00:00:00.000Z',
          scoreGiven: 9,
          scoreMaximum: 10,
          activityProgress: 'Completed',
          gradingProgress: 'FullyGraded',
          userId: actorId,
        }),
      },
    );

    expect(response.status).toBe(204);
  });

  it('returns LTI 1.3 AGS results through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listLti1p3AgsResults: async (
          accessToken,
          requestedTenantId,
          requestedCourseId,
          requestedAssignmentId,
          requestedToolId,
          userId,
        ) => {
          expect(accessToken).toBe('service.header.payload.signature');
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedAssignmentId).toBe(assignmentId);
          expect(requestedToolId).toBe(courseExternalToolId);
          expect(userId).toBe(actorId);
          return Lti1p3AgsResultContainer.parse([
            {
              id: `https://lms.example.edu/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/external-tools/${courseExternalToolId}/lti-ags/lineitem/results/${actorId}`,
              scoreOf: `https://lms.example.edu/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/external-tools/${courseExternalToolId}/lti-ags/lineitem`,
              userId: actorId,
              resultScore: 9,
              resultMaximum: 10,
            },
          ]);
        },
      },
    });
    const query = new URLSearchParams({ user_id: actorId });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/external-tools/${courseExternalToolId}/lti-ags/lineitem/results?${query.toString()}`,
      {
        headers: { authorization: 'Bearer service.header.payload.signature' },
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain(
      'application/vnd.ims.lis.v2.resultcontainer+json',
    );
    expect(await response.json()).toEqual([
      {
        id: `https://lms.example.edu/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/external-tools/${courseExternalToolId}/lti-ags/lineitem/results/${actorId}`,
        scoreOf: `https://lms.example.edu/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/external-tools/${courseExternalToolId}/lti-ags/lineitem`,
        userId: actorId,
        resultScore: 9,
        resultMaximum: 10,
      },
    ]);
  });

  it('lists tenants through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listTenants: async (requestedActorId) => {
          expect(requestedActorId).toBe(actorId);
          return [
            Tenant.parse({
              id: tenantId,
              slug: 'demo-university',
              displayName: 'Demo University',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request('/api/v1/tenants', { headers: authorization });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: tenantId,
        slug: 'demo-university',
        displayName: 'Demo University',
        storageByteLimit: null,
        defaultUserStorageByteLimit: null,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('updates tenant file storage quotas through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        updateTenantFileStorageQuotas: async (requestedActorId, requestedTenantId, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(input).toEqual({
            storageByteLimit: 1024,
            defaultUserStorageByteLimit: null,
          });
          return Tenant.parse({
            id: tenantId,
            slug: 'demo-university',
            displayName: 'Demo University',
            storageByteLimit: input.storageByteLimit,
            defaultUserStorageByteLimit: input.defaultUserStorageByteLimit,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/file-storage-quotas`, {
      method: 'PUT',
      headers: { ...authorization, 'content-type': 'application/json' },
      body: JSON.stringify({
        storageByteLimit: 1024,
        defaultUserStorageByteLimit: null,
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: tenantId,
      slug: 'demo-university',
      displayName: 'Demo University',
      storageByteLimit: 1024,
      defaultUserStorageByteLimit: null,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists tenant feature flags through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listTenantFeatureFlags: async (requestedActorId, requestedTenantId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          return [
            TenantFeatureFlag.parse({
              id: tenantFeatureFlagId,
              tenantId,
              key: 'gradebook.final_grades',
              enabled: true,
              description: 'Enable final grade exports for pilot tenants.',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/feature-flags`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: tenantFeatureFlagId,
        tenantId,
        key: 'gradebook.final_grades',
        enabled: true,
        description: 'Enable final grade exports for pilot tenants.',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('upserts tenant feature flags through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        upsertTenantFeatureFlag: async (requestedActorId, requestedTenantId, key, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(key).toBe('gradebook.final_grades');
          expect(input).toEqual({
            enabled: true,
            description: 'Enable final grade exports for pilot tenants.',
          });
          return TenantFeatureFlag.parse({
            id: tenantFeatureFlagId,
            tenantId,
            key,
            enabled: input.enabled,
            description: input.description,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/feature-flags/gradebook.final_grades`,
      {
        method: 'PUT',
        headers: { ...authorization, 'content-type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          description: 'Enable final grade exports for pilot tenants.',
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: tenantFeatureFlagId,
      tenantId,
      key: 'gradebook.final_grades',
      enabled: true,
      description: 'Enable final grade exports for pilot tenants.',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('deletes tenant feature flags through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        deleteTenantFeatureFlag: async (requestedActorId, requestedTenantId, key) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(key).toBe('gradebook.final_grades');
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/feature-flags/gradebook.final_grades`,
      {
        method: 'DELETE',
        headers: authorization,
      },
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });

  it('lists webhook subscriptions through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listWebhookSubscriptions: async (requestedActorId, requestedTenantId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          return [
            WebhookSubscription.parse({
              id: webhookSubscriptionId,
              tenantId,
              name: 'Student systems webhook',
              endpointUrl: 'https://hooks.example.edu/open-lms',
              topics: ['grade.lifecycle', 'assignment.feedback'],
              status: 'enabled',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/webhook-subscriptions`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: webhookSubscriptionId,
        tenantId,
        name: 'Student systems webhook',
        endpointUrl: 'https://hooks.example.edu/open-lms',
        topics: ['grade.lifecycle', 'assignment.feedback'],
        status: 'enabled',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates webhook subscriptions through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createWebhookSubscription: async (requestedActorId, requestedTenantId, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(input).toEqual({
            name: 'Student systems webhook',
            endpointUrl: 'https://hooks.example.edu/open-lms',
            topics: ['grade.lifecycle', 'assignment.feedback'],
            status: 'enabled',
            signingSecret: 'plain-webhook-secret',
          });
          return WebhookSubscription.parse({
            id: webhookSubscriptionId,
            tenantId,
            name: input.name,
            endpointUrl: input.endpointUrl,
            topics: input.topics,
            status: input.status,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/webhook-subscriptions`, {
      method: 'POST',
      headers: { ...authorization, 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Student systems webhook',
        endpointUrl: 'https://hooks.example.edu/open-lms',
        topics: ['grade.lifecycle', 'assignment.feedback'],
        status: 'enabled',
        signingSecret: 'plain-webhook-secret',
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: webhookSubscriptionId,
      tenantId,
      name: 'Student systems webhook',
      endpointUrl: 'https://hooks.example.edu/open-lms',
      topics: ['grade.lifecycle', 'assignment.feedback'],
      status: 'enabled',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('updates webhook subscriptions through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        updateWebhookSubscription: async (
          requestedActorId,
          requestedTenantId,
          requestedWebhookSubscriptionId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedWebhookSubscriptionId).toBe(webhookSubscriptionId);
          expect(input).toEqual({
            name: 'Renamed webhook',
            endpointUrl: 'https://hooks.example.edu/open-lms',
            topics: ['grade.lifecycle'],
            status: 'disabled',
          });
          return WebhookSubscription.parse({
            id: requestedWebhookSubscriptionId,
            tenantId,
            name: input.name,
            endpointUrl: input.endpointUrl,
            topics: input.topics,
            status: input.status,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/webhook-subscriptions/${webhookSubscriptionId}`,
      {
        method: 'PUT',
        headers: { ...authorization, 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Renamed webhook',
          endpointUrl: 'https://hooks.example.edu/open-lms',
          topics: ['grade.lifecycle'],
          status: 'disabled',
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: webhookSubscriptionId,
      tenantId,
      name: 'Renamed webhook',
      endpointUrl: 'https://hooks.example.edu/open-lms',
      topics: ['grade.lifecycle'],
      status: 'disabled',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('deletes webhook subscriptions through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        deleteWebhookSubscription: async (
          requestedActorId,
          requestedTenantId,
          requestedWebhookSubscriptionId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedWebhookSubscriptionId).toBe(webhookSubscriptionId);
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/webhook-subscriptions/${webhookSubscriptionId}`,
      {
        method: 'DELETE',
        headers: authorization,
      },
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });

  it('lists tenant courses through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourses: async (requestedActorId, requestedTenantId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          return [
            Course.parse({
              id: courseId,
              tenantId,
              code: 'ENG101',
              title: 'Writing Studio',
              status: 'active',
              startsAt: null,
              endsAt: null,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: courseId,
        tenantId,
        code: 'ENG101',
        title: 'Writing Studio',
        status: 'active',
        startsAt: null,
        endsAt: null,
        catalogCategory: null,
        academicTerm: null,
        isBlueprint: false,
        maxEnrollments: null,
        waitlistEnabled: false,
        enrollmentApprovalRequired: false,
        deletedAt: null,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('copies courses through the API prefix with full content counters', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        copyCourse: async (requestedActorId, requestedTenantId, requestedSourceCourseId, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedSourceCourseId).toBe(courseId);
          expect(input).toEqual({ targetCourseId });
          return {
            learningObjectivesCopied: 2,
            modulesCopied: 3,
            unitsCopied: 4,
            pagesCopied: 1,
            resourcesCopied: 5,
            wikiPagesCopied: 6,
            glossaryEntriesCopied: 7,
          };
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/copy`, {
      method: 'POST',
      headers: {
        ...authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ targetCourseId }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      learningObjectivesCopied: 2,
      modulesCopied: 3,
      unitsCopied: 4,
      pagesCopied: 1,
      resourcesCopied: 5,
      wikiPagesCopied: 6,
      glossaryEntriesCopied: 7,
    });
  });

  it('lists catalog courses publicly without authentication', async () => {
    const startsAt = new Date('2026-08-25T00:00:00.000Z');
    const endsAt = new Date('2026-12-15T00:00:00.000Z');
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCatalogCourses: async (requestedTenantId, options) => {
          expect(requestedTenantId).toBe(tenantId);
          expect(options).toEqual({
            isBlueprint: true,
            catalogCategory: 'Writing',
            academicTerm: '2026 Fall',
          });
          return [
            CatalogCourse.parse({
              id: courseId,
              tenantId,
              code: 'WRIT-101',
              title: 'Evidence-Based Writing',
              catalogCategory: 'Writing',
              academicTerm: '2026 Fall',
              startsAt,
              endsAt,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/catalog/courses?blueprint=true&catalogCategory=Writing&academicTerm=2026%20Fall`,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([
      {
        id: courseId,
        tenantId,
        code: 'WRIT-101',
        title: 'Evidence-Based Writing',
        catalogCategory: 'Writing',
        academicTerm: '2026 Fall',
        startsAt: '2026-08-25T00:00:00.000Z',
        endsAt: '2026-12-15T00:00:00.000Z',
      },
    ]);
    expect(JSON.stringify(body)).not.toContain('status');
    expect(JSON.stringify(body)).not.toContain('catalogVisibility');
  });

  it('exports course Common Cartridge packages through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        exportCourseCommonCartridge: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return CommonCartridgeCourseExport.parse({
            format: 'imscc_1_3',
            exportedAt: now,
            manifestXml: '<manifest identifier="openlms-course"></manifest>',
            files: [
              { path: 'pages/overview.html', contentType: 'text/html', content: '<p>Hi</p>' },
            ],
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/common-cartridge`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      format: 'imscc_1_3',
      manifestXml: '<manifest identifier="openlms-course"></manifest>',
      files: [{ path: 'pages/overview.html', contentType: 'text/html' }],
    });
  });

  it('imports course Common Cartridge packages through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        importCourseCommonCartridge: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input.manifestXml).toContain('manifest');
          return CommonCartridgeImportResult.parse({
            format: 'imscc_1_3',
            learningObjectivesRestored: 1,
            modulesRestored: 2,
            unitsRestored: 3,
            pagesRestored: 4,
            resourcesRestored: 5,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/common-cartridge/import`,
      {
        method: 'POST',
        headers: { ...authorization, 'content-type': 'application/json' },
        body: JSON.stringify({
          format: 'imscc_1_3',
          manifestXml: '<manifest identifier="openlms-course"></manifest>',
          files: [],
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      format: 'imscc_1_3',
      learningObjectivesRestored: 1,
      modulesRestored: 2,
      unitsRestored: 3,
      pagesRestored: 4,
      resourcesRestored: 5,
    });
  });

  it('creates courses through the API prefix', async () => {
    const startsAt = new Date('2026-08-25T00:00:00.000Z');
    const endsAt = new Date('2026-12-15T00:00:00.000Z');
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourse: async (requestedActorId, requestedTenantId, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(input).toEqual({
            code: 'WRIT-101',
            title: 'Evidence-Based Writing',
            status: 'draft',
            startsAt,
            endsAt,
            isBlueprint: true,
          });
          return Course.parse({
            id: courseId,
            tenantId,
            code: input.code,
            title: input.title,
            status: input.status,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            isBlueprint: input.isBlueprint,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses`, {
      method: 'POST',
      headers: {
        ...authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        code: 'WRIT-101',
        title: 'Evidence-Based Writing',
        status: 'draft',
        startsAt: '2026-08-25T00:00:00.000Z',
        endsAt: '2026-12-15T00:00:00.000Z',
        isBlueprint: true,
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: courseId,
      tenantId,
      code: 'WRIT-101',
      title: 'Evidence-Based Writing',
      status: 'draft',
      startsAt: '2026-08-25T00:00:00.000Z',
      endsAt: '2026-12-15T00:00:00.000Z',
      catalogCategory: null,
      academicTerm: null,
      isBlueprint: true,
      maxEnrollments: null,
      waitlistEnabled: false,
      enrollmentApprovalRequired: false,
      deletedAt: null,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('soft-deletes courses through the API prefix', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        deleteCourse: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          dependencyCalled = true;
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}`, {
      method: 'DELETE',
      headers: authorization,
    });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(dependencyCalled).toBe(true);
  });

  it('restores deleted courses through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        restoreDeletedCourse: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return Course.parse({
            id: courseId,
            tenantId,
            code: 'WRIT-101',
            title: 'Evidence-Based Writing',
            status: 'draft',
            startsAt: null,
            endsAt: null,
            deletedAt: null,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/restore-deleted`,
      {
        method: 'POST',
        headers: authorization,
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: courseId,
      tenantId,
      code: 'WRIT-101',
      title: 'Evidence-Based Writing',
      status: 'draft',
      startsAt: null,
      endsAt: null,
      catalogCategory: null,
      academicTerm: null,
      isBlueprint: false,
      maxEnrollments: null,
      waitlistEnabled: false,
      enrollmentApprovalRequired: false,
      deletedAt: null,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('creates rubrics through the API prefix', async () => {
    const sampleCriteria = [
      {
        id: 'evidence',
        label: 'Evidence',
        description: 'Uses evidence and explains why it matters.',
        evidenceRequired: true,
        learningObjectiveIds: [],
        levels: [
          {
            id: 'developing',
            label: 'Developing',
            description: 'Evidence is present but weakly explained.',
            points: 2,
          },
        ],
      },
    ];
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createRubric: async (requestedActorId, requestedTenantId, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(input).toEqual({
            title: 'Argument writing rubric',
            sourceTemplateId: null,
            criteria: sampleCriteria,
          });
          return Rubric.parse({
            id: rubricId,
            tenantId,
            title: input.title,
            version: 1,
            sourceTemplateId: input.sourceTemplateId,
            criteria: input.criteria,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/rubrics`, {
      method: 'POST',
      headers: {
        ...authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Argument writing rubric',
        sourceTemplateId: null,
        criteria: sampleCriteria,
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: rubricId,
      tenantId,
      title: 'Argument writing rubric',
      version: 1,
      sourceTemplateId: null,
      criteria: sampleCriteria,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course memberships for course staff through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseMemberships: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            CourseMembership.parse({
              id: courseMembershipId,
              tenantId,
              courseId,
              userId: actorId,
              role: 'student',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/memberships`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: courseMembershipId,
        tenantId,
        courseId,
        userId: actorId,
        role: 'student',
        status: 'active',
        invitedAt: null,
        acceptedAt: null,
        droppedAt: null,
        withdrawnAt: null,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates course memberships through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseMembership: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({ userId: actorId, role: 'student', status: 'active' });
          return CourseMembership.parse({
            id: courseMembershipId,
            tenantId,
            courseId,
            userId: actorId,
            role: 'student',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/memberships`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ userId: actorId, role: 'student' }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: courseMembershipId,
      tenantId,
      courseId,
      userId: actorId,
      role: 'student',
      status: 'active',
      invitedAt: null,
      acceptedAt: null,
      droppedAt: null,
      withdrawnAt: null,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('self-enrolls the authenticated actor through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        selfEnrollInCourse: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({ enrollmentCode: 'JOIN-WRIT-101' });
          return CourseMembership.parse({
            id: courseMembershipId,
            tenantId,
            courseId,
            userId: actorId,
            role: 'student',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/self-enroll`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ enrollmentCode: 'JOIN-WRIT-101' }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: courseMembershipId,
      tenantId,
      courseId,
      userId: actorId,
      role: 'student',
      status: 'active',
      invitedAt: null,
      acceptedAt: null,
      droppedAt: null,
      withdrawnAt: null,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('updates course catalog settings through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        updateCourseCatalogSettings: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            catalogVisibility: 'listed',
            enrollmentCode: 'JOIN-WRIT-101',
            catalogCategory: 'Writing',
            academicTerm: '2026 Fall',
            maxEnrollments: null,
            waitlistEnabled: false,
            enrollmentApprovalRequired: true,
          });
          return CourseCatalogSettings.parse({
            tenantId,
            courseId,
            catalogVisibility: input.catalogVisibility,
            enrollmentCode: input.enrollmentCode,
            catalogCategory: input.catalogCategory,
            academicTerm: input.academicTerm,
            enrollmentApprovalRequired: input.enrollmentApprovalRequired,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/catalog-settings`,
      {
        method: 'PUT',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          catalogVisibility: 'listed',
          enrollmentCode: 'JOIN-WRIT-101',
          catalogCategory: 'Writing',
          academicTerm: '2026 Fall',
          enrollmentApprovalRequired: true,
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      tenantId,
      courseId,
      catalogVisibility: 'listed',
      enrollmentCode: 'JOIN-WRIT-101',
      catalogCategory: 'Writing',
      academicTerm: '2026 Fall',
      maxEnrollments: null,
      waitlistEnabled: false,
      enrollmentApprovalRequired: true,
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course sections through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseSections: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            CourseSection.parse({
              id: courseSectionId,
              tenantId,
              courseId,
              name: 'Section A',
              status: 'active',
              position: 0,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/sections`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: courseSectionId,
        tenantId,
        courseId,
        name: 'Section A',
        status: 'active',
        position: 0,
        meetingDays: [],
        meetingStartTime: null,
        meetingEndTime: null,
        location: null,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates course sections through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseSection: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            name: 'Section B',
            status: 'active',
            position: 1,
            meetingDays: [],
            meetingStartTime: null,
            meetingEndTime: null,
            location: null,
          });
          return CourseSection.parse({
            id: courseSectionId,
            tenantId,
            courseId,
            name: 'Section B',
            status: 'active',
            position: 1,
            meetingDays: input.meetingDays,
            meetingStartTime: input.meetingStartTime,
            meetingEndTime: input.meetingEndTime,
            location: input.location,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/sections`, {
      method: 'POST',
      headers: {
        ...authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Section B',
        status: 'active',
        position: 1,
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: courseSectionId,
      tenantId,
      courseId,
      name: 'Section B',
      status: 'active',
      position: 1,
      meetingDays: [],
      meetingStartTime: null,
      meetingEndTime: null,
      location: null,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('rejects partial course section meeting details before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseSection: async () => {
          dependencyCalled = true;
          return dependencies.createCourseSection(actorId, tenantId, courseId, {
            name: 'Section B',
            status: 'active',
            position: 1,
            meetingDays: [],
            meetingStartTime: null,
            meetingEndTime: null,
            location: null,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/sections`, {
      method: 'POST',
      headers: {
        ...authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Section B',
        status: 'active',
        position: 1,
        meetingStartTime: '09:30',
      }),
    });

    expect(response.status).toBe(400);
    expect(dependencyCalled).toBe(false);
  });

  it('lists section instructors through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listSectionInstructors: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedSectionId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedSectionId).toBe(courseSectionId);
          return [
            CourseSectionInstructor.parse({
              id: courseSectionInstructorId,
              tenantId,
              courseId,
              sectionId: courseSectionId,
              instructorId,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/sections/${courseSectionId}/instructors`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: courseSectionInstructorId,
        tenantId,
        courseId,
        sectionId: courseSectionId,
        instructorId,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('assigns section instructors through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        assignSectionInstructor: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedSectionId,
          requestedInstructorId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedSectionId).toBe(courseSectionId);
          expect(requestedInstructorId).toBe(instructorId);
          return CourseSectionInstructor.parse({
            id: courseSectionInstructorId,
            tenantId,
            courseId,
            sectionId: courseSectionId,
            instructorId,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/sections/${courseSectionId}/instructors`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ instructorId }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: courseSectionInstructorId,
      tenantId,
      courseId,
      sectionId: courseSectionId,
      instructorId,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('removes section instructors through the API prefix', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        removeSectionInstructor: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedSectionId,
          requestedInstructorId,
        ) => {
          dependencyCalled = true;
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedSectionId).toBe(courseSectionId);
          expect(requestedInstructorId).toBe(instructorId);
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/sections/${courseSectionId}/instructors/${instructorId}`,
      {
        method: 'DELETE',
        headers: authorization,
      },
    );

    expect(response.status).toBe(204);
    expect(dependencyCalled).toBe(true);
  });

  it('lists course announcements through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseAnnouncements: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            CourseAnnouncement.parse({
              id: announcementId,
              tenantId,
              courseId,
              authorId: actorId,
              title: 'Bring annotated drafts',
              body: 'Please bring annotated drafts to the next seminar.',
              status: 'published',
              pinned: true,
              postedAt: now,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/announcements`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: announcementId,
        tenantId,
        courseId,
        authorId: actorId,
        title: 'Bring annotated drafts',
        body: 'Please bring annotated drafts to the next seminar.',
        status: 'published',
        pinned: true,
        postedAt: '2026-05-10T00:00:00.000Z',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates course announcements through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseAnnouncement: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            title: 'Essay workshop reminder',
            body: 'Bring one paragraph and one question for peer review.',
            status: 'published',
            pinned: true,
          });
          return CourseAnnouncement.parse({
            id: announcementId,
            tenantId,
            courseId,
            authorId: actorId,
            title: 'Essay workshop reminder',
            body: 'Bring one paragraph and one question for peer review.',
            status: 'published',
            pinned: true,
            postedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/announcements`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Essay workshop reminder',
          body: 'Bring one paragraph and one question for peer review.',
          status: 'published',
          pinned: true,
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: announcementId,
      tenantId,
      courseId,
      authorId: actorId,
      title: 'Essay workshop reminder',
      body: 'Bring one paragraph and one question for peer review.',
      status: 'published',
      pinned: true,
      postedAt: '2026-05-10T00:00:00.000Z',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('updates course announcements through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        updateCourseAnnouncement: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedAnnouncementId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedAnnouncementId).toBe(announcementId);
          expect(input).toEqual({
            title: 'Essay workshop reminder (updated)',
            body: 'New time: Friday at 3pm.',
            status: 'published',
            pinned: true,
          });
          return CourseAnnouncement.parse({
            id: announcementId,
            tenantId,
            courseId,
            authorId: actorId,
            title: input.title,
            body: input.body,
            status: input.status,
            pinned: input.pinned,
            postedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/announcements/${announcementId}`,
      {
        method: 'PUT',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Essay workshop reminder (updated)',
          body: 'New time: Friday at 3pm.',
          status: 'published',
          pinned: true,
        }),
      },
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { title: string; body: string };
    expect(body.title).toBe('Essay workshop reminder (updated)');
    expect(body.body).toBe('New time: Friday at 3pm.');
  });

  it('deletes course announcements through the API prefix', async () => {
    let deletedAnnouncementId: string | null = null;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        deleteCourseAnnouncement: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedAnnouncementId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          deletedAnnouncementId = requestedAnnouncementId;
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/announcements/${announcementId}`,
      {
        method: 'DELETE',
        headers: authorization,
      },
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(deletedAnnouncementId).toBe(announcementId);
  });

  it('lists tenant calendar items through the API prefix', async () => {
    const from = new Date('2026-05-11T00:00:00.000Z');
    const to = new Date('2026-05-18T00:00:00.000Z');
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCalendarItems: async (
          requestedActorId,
          requestedTenantId,
          requestedFrom,
          requestedTo,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedFrom).toEqual(from);
          expect(requestedTo).toEqual(to);
          return [
            CalendarItem.parse({
              id: `assignment_due:${assignmentId}`,
              tenantId,
              courseId,
              courseCode: 'ENG101',
              courseTitle: 'Writing Studio',
              itemType: 'assignment_due',
              title: 'Evidence essay',
              startsAt: new Date('2026-05-12T03:00:00.000Z'),
              endsAt: null,
              sourceType: 'assignment',
              sourceId: assignmentId,
            }),
            CalendarItem.parse({
              id: 'course_event:01J9QW7B6N5W2YH3D3A1V0KE82',
              tenantId,
              courseId,
              courseCode: 'ENG101',
              courseTitle: 'Writing Studio',
              itemType: 'course_event',
              title: 'Essay workshop',
              startsAt: new Date('2026-05-13T03:00:00.000Z'),
              endsAt: new Date('2026-05-13T04:00:00.000Z'),
              sourceType: 'course_calendar_event',
              sourceId: '01J9QW7B6N5W2YH3D3A1V0KE82',
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/calendar-items?from=${from.toISOString()}&to=${to.toISOString()}`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: `assignment_due:${assignmentId}`,
        tenantId,
        courseId,
        courseCode: 'ENG101',
        courseTitle: 'Writing Studio',
        itemType: 'assignment_due',
        title: 'Evidence essay',
        startsAt: '2026-05-12T03:00:00.000Z',
        endsAt: null,
        sourceType: 'assignment',
        sourceId: assignmentId,
      },
      {
        id: 'course_event:01J9QW7B6N5W2YH3D3A1V0KE82',
        tenantId,
        courseId,
        courseCode: 'ENG101',
        courseTitle: 'Writing Studio',
        itemType: 'course_event',
        title: 'Essay workshop',
        startsAt: '2026-05-13T03:00:00.000Z',
        endsAt: '2026-05-13T04:00:00.000Z',
        sourceType: 'course_calendar_event',
        sourceId: '01J9QW7B6N5W2YH3D3A1V0KE82',
      },
    ]);
  });

  it('lists course calendar events through the API prefix', async () => {
    const startsAt = new Date('2026-09-10T15:00:00.000Z');
    const endsAt = new Date('2026-09-10T16:30:00.000Z');
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseCalendarEvents: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            CourseCalendarEvent.parse({
              id: courseCalendarEventId,
              tenantId,
              courseId,
              title: 'Weekly workshop',
              description: 'Live writing studio for evidence and reasoning.',
              location: 'Room 204',
              startsAt,
              endsAt,
              visibility: 'published',
              recurrenceRule: 'FREQ=WEEKLY;COUNT=10',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/calendar-events`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: courseCalendarEventId,
        tenantId,
        courseId,
        title: 'Weekly workshop',
        description: 'Live writing studio for evidence and reasoning.',
        location: 'Room 204',
        startsAt: '2026-09-10T15:00:00.000Z',
        endsAt: '2026-09-10T16:30:00.000Z',
        visibility: 'published',
        recurrenceRule: 'FREQ=WEEKLY;COUNT=10',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates course calendar events through the API prefix', async () => {
    const startsAt = new Date('2026-09-10T15:00:00.000Z');
    const endsAt = new Date('2026-09-10T16:30:00.000Z');
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseCalendarEvent: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            title: 'Weekly workshop',
            description: 'Live writing studio for evidence and reasoning.',
            location: 'Room 204',
            startsAt,
            endsAt,
            visibility: 'published',
            recurrenceRule: 'FREQ=WEEKLY;COUNT=10',
          });
          return CourseCalendarEvent.parse({
            id: courseCalendarEventId,
            tenantId,
            courseId,
            title: input.title,
            description: input.description,
            location: input.location,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            visibility: input.visibility,
            recurrenceRule: input.recurrenceRule,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/calendar-events`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Weekly workshop',
          description: 'Live writing studio for evidence and reasoning.',
          location: 'Room 204',
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          visibility: 'published',
          recurrenceRule: 'FREQ=WEEKLY;COUNT=10',
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: courseCalendarEventId,
      tenantId,
      courseId,
      title: 'Weekly workshop',
      description: 'Live writing studio for evidence and reasoning.',
      location: 'Room 204',
      startsAt: '2026-09-10T15:00:00.000Z',
      endsAt: '2026-09-10T16:30:00.000Z',
      visibility: 'published',
      recurrenceRule: 'FREQ=WEEKLY;COUNT=10',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('updates course calendar events through the API prefix', async () => {
    const startsAt = new Date('2026-09-10T15:00:00.000Z');
    const endsAt = new Date('2026-09-10T16:30:00.000Z');
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        updateCourseCalendarEvent: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedEventId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedEventId).toBe(courseCalendarEventId);
          expect(input).toEqual({
            title: 'Weekly workshop (refreshed)',
            description: null,
            location: 'Room 204',
            startsAt,
            endsAt,
            visibility: 'published',
            recurrenceRule: null,
          });
          return CourseCalendarEvent.parse({
            id: courseCalendarEventId,
            tenantId,
            courseId,
            title: input.title,
            description: input.description,
            location: input.location,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            visibility: input.visibility,
            recurrenceRule: input.recurrenceRule,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/calendar-events/${courseCalendarEventId}`,
      {
        method: 'PUT',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Weekly workshop (refreshed)',
          description: null,
          location: 'Room 204',
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          visibility: 'published',
          recurrenceRule: null,
        }),
      },
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { title: string };
    expect(body.title).toBe('Weekly workshop (refreshed)');
  });

  it('deletes course calendar events through the API prefix', async () => {
    let deletedEventId: string | null = null;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        deleteCourseCalendarEvent: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedEventId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          deletedEventId = requestedEventId;
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/calendar-events/${courseCalendarEventId}`,
      {
        method: 'DELETE',
        headers: authorization,
      },
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(deletedEventId).toBe(courseCalendarEventId);
  });

  it('lists course meetings through the API prefix', async () => {
    const startsAt = new Date('2026-09-10T15:00:00.000Z');
    const endsAt = new Date('2026-09-10T16:30:00.000Z');
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseMeetings: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            CourseMeeting.parse({
              id: courseMeetingId,
              tenantId,
              courseId,
              title: 'Live workshop',
              description: 'Synchronous workshop on rubrics and feedback.',
              provider: 'zoom',
              externalUrl: 'https://example.zoom.us/j/123456789',
              startsAt,
              endsAt,
              recordingUrl: 'https://media.example.edu/recordings/workshop.mp4',
              playbackUrl: 'https://media.example.edu/playback/workshop',
              status: 'scheduled',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/meetings`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: courseMeetingId,
        tenantId,
        courseId,
        title: 'Live workshop',
        description: 'Synchronous workshop on rubrics and feedback.',
        provider: 'zoom',
        externalUrl: 'https://example.zoom.us/j/123456789',
        startsAt: '2026-09-10T15:00:00.000Z',
        endsAt: '2026-09-10T16:30:00.000Z',
        recordingUrl: 'https://media.example.edu/recordings/workshop.mp4',
        playbackUrl: 'https://media.example.edu/playback/workshop',
        status: 'scheduled',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates course meetings through the API prefix', async () => {
    const startsAt = new Date('2026-09-10T15:00:00.000Z');
    const endsAt = new Date('2026-09-10T16:30:00.000Z');
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseMeeting: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            title: 'Live workshop',
            description: 'Synchronous workshop on rubrics and feedback.',
            provider: 'zoom',
            externalUrl: 'https://example.zoom.us/j/123456789',
            startsAt,
            endsAt,
            recordingUrl: null,
            playbackUrl: null,
            status: 'scheduled',
          });
          return CourseMeeting.parse({
            id: courseMeetingId,
            tenantId,
            courseId,
            title: input.title,
            description: input.description,
            provider: input.provider,
            externalUrl: input.externalUrl,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            recordingUrl: input.recordingUrl,
            playbackUrl: input.playbackUrl,
            status: input.status,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/meetings`, {
      method: 'POST',
      headers: {
        ...authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Live workshop',
        description: 'Synchronous workshop on rubrics and feedback.',
        provider: 'zoom',
        externalUrl: 'https://example.zoom.us/j/123456789',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        status: 'scheduled',
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: courseMeetingId,
      tenantId,
      courseId,
      title: 'Live workshop',
      description: 'Synchronous workshop on rubrics and feedback.',
      provider: 'zoom',
      externalUrl: 'https://example.zoom.us/j/123456789',
      startsAt: '2026-09-10T15:00:00.000Z',
      endsAt: '2026-09-10T16:30:00.000Z',
      recordingUrl: null,
      playbackUrl: null,
      status: 'scheduled',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('updates course meetings through the API prefix', async () => {
    const startsAt = new Date('2026-09-10T15:00:00.000Z');
    const endsAt = new Date('2026-09-10T17:00:00.000Z');
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        updateCourseMeeting: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedMeetingId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedMeetingId).toBe(courseMeetingId);
          expect(input).toEqual({
            title: 'Live workshop (rescheduled)',
            description: null,
            provider: 'zoom',
            externalUrl: 'https://example.zoom.us/j/123456789',
            startsAt,
            endsAt,
            recordingUrl: null,
            playbackUrl: null,
            status: 'scheduled',
          });
          return CourseMeeting.parse({
            id: courseMeetingId,
            tenantId,
            courseId,
            title: input.title,
            description: input.description,
            provider: input.provider,
            externalUrl: input.externalUrl,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            recordingUrl: input.recordingUrl,
            playbackUrl: input.playbackUrl,
            status: input.status,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/meetings/${courseMeetingId}`,
      {
        method: 'PUT',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Live workshop (rescheduled)',
          description: null,
          provider: 'zoom',
          externalUrl: 'https://example.zoom.us/j/123456789',
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          status: 'scheduled',
        }),
      },
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { title: string };
    expect(body.title).toBe('Live workshop (rescheduled)');
  });

  it('deletes course meetings through the API prefix', async () => {
    let deletedMeetingId: string | null = null;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        deleteCourseMeeting: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedMeetingId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          deletedMeetingId = requestedMeetingId;
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/meetings/${courseMeetingId}`,
      {
        method: 'DELETE',
        headers: authorization,
      },
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(deletedMeetingId).toBe(courseMeetingId);
  });

  it('lists course assignments through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAssignments: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedModuleId,
          requestedUnitId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedModuleId).toBe(moduleId);
          expect(requestedUnitId).toBe(unitId);
          return [
            Assignment.parse({
              id: '01J9QW7B6N5W2YH3D3A1V0KE30',
              tenantId,
              courseId,
              moduleId,
              unitId,
              position: 0,
              title: 'Evidence essay',
              instructions: 'Write an essay using textual evidence.',
              status: 'published',
              dueAt: new Date('2026-05-12T03:00:00.000Z'),
              allowResubmission: true,
              activeRubricId: null,
              aiSettings: {
                precheckEnabled: true,
                feedbackDraftEnabled: true,
                scoreSuggestionEnabled: false,
              },
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments?moduleId=${moduleId}&unitId=${unitId}`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE30',
        tenantId,
        courseId,
        moduleId,
        unitId,
        position: 0,
        title: 'Evidence essay',
        instructions: 'Write an essay using textual evidence.',
        status: 'published',
        dueAt: '2026-05-12T03:00:00.000Z',
        allowResubmission: true,
        activeRubricId: null,
        aiSettings: {
          precheckEnabled: true,
          feedbackDraftEnabled: true,
          scoreSuggestionEnabled: false,
        },
        latePenaltyPercentPerDay: null,
        lateMaxPenaltyPercent: null,
        extraCredit: false,
        anonymousGradingEnabled: false,
        groupSubmissionEnabled: false,
        groupSetId: null,
        allowedFileExtensions: [],
        maxFileSizeBytes: null,
        gradingLocked: false,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates assignments through the API prefix', async () => {
    const dueAt = new Date('2026-09-15T17:00:00.000Z');
    const aiSettings = {
      precheckEnabled: true,
      feedbackDraftEnabled: true,
      scoreSuggestionEnabled: false,
    };
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createAssignment: async (requestedActorId, requestedTenantId, requestedCourseId, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            moduleId,
            unitId,
            position: 0,
            title: 'Essay 1: Defending a thesis',
            instructions: 'Argue your interpretation of the text using cited evidence.',
            status: 'published',
            dueAt,
            allowResubmission: true,
            activeRubricId: rubricId,
            aiSettings,
          });
          return Assignment.parse({
            id: assignmentId,
            tenantId,
            courseId,
            moduleId: input.moduleId,
            unitId: input.unitId,
            position: input.position,
            title: input.title,
            instructions: input.instructions,
            status: input.status,
            dueAt: input.dueAt,
            allowResubmission: input.allowResubmission,
            activeRubricId: input.activeRubricId,
            aiSettings: input.aiSettings,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          moduleId,
          unitId,
          position: 0,
          title: 'Essay 1: Defending a thesis',
          instructions: 'Argue your interpretation of the text using cited evidence.',
          status: 'published',
          dueAt: '2026-09-15T17:00:00.000Z',
          allowResubmission: true,
          activeRubricId: rubricId,
          aiSettings,
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: assignmentId,
      tenantId,
      courseId,
      moduleId,
      unitId,
      position: 0,
      title: 'Essay 1: Defending a thesis',
      instructions: 'Argue your interpretation of the text using cited evidence.',
      status: 'published',
      dueAt: '2026-09-15T17:00:00.000Z',
      allowResubmission: true,
      activeRubricId: rubricId,
      aiSettings,
      latePenaltyPercentPerDay: null,
      lateMaxPenaltyPercent: null,
      extraCredit: false,
      anonymousGradingEnabled: false,
      groupSubmissionEnabled: false,
      groupSetId: null,
      allowedFileExtensions: [],
      maxFileSizeBytes: null,
      gradingLocked: false,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists assignment overrides through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAssignmentOverrides: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedAssignmentId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedAssignmentId).toBe(assignmentId);
          return [
            AssignmentOverride.parse({
              id: '01J9QW7B6N5W2YH3D3A1V0KE7G',
              tenantId,
              assignmentId,
              targetType: 'user',
              targetId: actorId,
              opensAt: now,
              dueAt: new Date('2026-05-12T00:00:00.000Z'),
              closesAt: null,
              status: 'active',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/overrides`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE7G',
        tenantId,
        assignmentId,
        targetType: 'user',
        targetId: actorId,
        opensAt: '2026-05-10T00:00:00.000Z',
        dueAt: '2026-05-12T00:00:00.000Z',
        closesAt: null,
        status: 'active',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('rejects unauthenticated assignment override requests before listing overrides', async () => {
    let listWasCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAssignmentOverrides: async () => {
          listWasCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/overrides`,
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: {
        code: 'unauthorized',
        message: 'Authentication is required. Sign in and retry the request.',
      },
    });
    expect(listWasCalled).toBe(false);
  });

  it('reads an assignment rubric through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        getAssignmentRubric: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedAssignmentId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedAssignmentId).toBe(assignmentId);
          return Rubric.parse({
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
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/rubric`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: rubricId,
      tenantId,
      title: 'Evidence rubric',
      criteria: [
        {
          id: 'evidence',
          label: 'Evidence',
          evidenceRequired: true,
        },
      ],
    });
  });

  it('returns not found when an assignment rubric is unavailable', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        getAssignmentRubric: async () => {
          throw new ApiError(
            'not_found',
            'Assignment rubric was not found. Check the assignment id and retry the request.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/rubric`,
      { headers: authorization },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: 'not_found',
        message: 'Assignment rubric was not found. Check the assignment id and retry the request.',
      },
    });
  });

  it('lists course quizzes through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuizzes: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedModuleId,
          requestedUnitId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedModuleId).toBe(moduleId);
          expect(requestedUnitId).toBe(unitId);
          return [
            Quiz.parse({
              id: quizId,
              tenantId,
              courseId,
              moduleId,
              unitId,
              position: 0,
              title: 'Evidence check',
              description: 'Check whether evidence is connected to the claim.',
              status: 'published',
              opensAt: now,
              closesAt: null,
              timeLimitMinutes: 30,
              shuffleQuestions: false,
              maxAttempts: 2,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes?moduleId=${moduleId}&unitId=${unitId}`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: quizId,
        tenantId,
        courseId,
        moduleId,
        unitId,
        position: 0,
        title: 'Evidence check',
        description: 'Check whether evidence is connected to the claim.',
        status: 'published',
        opensAt: '2026-05-10T00:00:00.000Z',
        closesAt: null,
        timeLimitMinutes: 30,
        shuffleQuestions: false,
        maxAttempts: 2,
        gradingMethod: 'best',
        proctoringRequired: false,
        accessPasswordRequired: false,
        allowedIpRanges: [],
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates quizzes through the API prefix', async () => {
    const opensAt = new Date('2026-09-10T00:00:00.000Z');
    const closesAt = new Date('2026-09-15T23:59:00.000Z');
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createQuiz: async (requestedActorId, requestedTenantId, requestedCourseId, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            moduleId,
            unitId,
            position: 0,
            title: 'Argumentation quiz',
            description: 'Multiple-choice on evidence and reasoning.',
            status: 'published',
            opensAt,
            closesAt,
            timeLimitMinutes: 30,
            shuffleQuestions: true,
            maxAttempts: 2,
          });
          return Quiz.parse({
            id: quizId,
            tenantId,
            courseId,
            moduleId: input.moduleId,
            unitId: input.unitId,
            position: input.position,
            title: input.title,
            description: input.description,
            status: input.status,
            opensAt: input.opensAt,
            closesAt: input.closesAt,
            timeLimitMinutes: input.timeLimitMinutes,
            shuffleQuestions: input.shuffleQuestions,
            maxAttempts: input.maxAttempts,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes`, {
      method: 'POST',
      headers: {
        ...authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        moduleId,
        unitId,
        position: 0,
        title: 'Argumentation quiz',
        description: 'Multiple-choice on evidence and reasoning.',
        status: 'published',
        opensAt: '2026-09-10T00:00:00.000Z',
        closesAt: '2026-09-15T23:59:00.000Z',
        timeLimitMinutes: 30,
        shuffleQuestions: true,
        maxAttempts: 2,
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: quizId,
      tenantId,
      courseId,
      moduleId,
      unitId,
      position: 0,
      title: 'Argumentation quiz',
      description: 'Multiple-choice on evidence and reasoning.',
      status: 'published',
      opensAt: '2026-09-10T00:00:00.000Z',
      closesAt: '2026-09-15T23:59:00.000Z',
      timeLimitMinutes: 30,
      shuffleQuestions: true,
      maxAttempts: 2,
      gradingMethod: 'best',
      proctoringRequired: false,
      accessPasswordRequired: false,
      allowedIpRanges: [],
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists quiz questions through the API prefix without answer keys', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuizQuestions: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuizId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuizId).toBe(quizId);
          return [
            QuizQuestion.parse({
              id: quizQuestionId,
              tenantId,
              quizId,
              position: 0,
              questionType: 'multiple_choice',
              prompt: 'Which sentence best connects the evidence to the claim?',
              points: 2,
              choices: [
                { id: 'a', text: 'It repeats the quote.' },
                { id: 'b', text: 'It explains why the quote matters.' },
              ],
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/questions`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([
      {
        id: quizQuestionId,
        tenantId,
        quizId,
        position: 0,
        questionType: 'multiple_choice',
        prompt: 'Which sentence best connects the evidence to the claim?',
        points: 2,
        choices: [
          { id: 'a', text: 'It repeats the quote.' },
          { id: 'b', text: 'It explains why the quote matters.' },
        ],
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
    expect(JSON.stringify(body)).not.toContain('correct');
    expect(JSON.stringify(body)).not.toContain('answer');
  });

  it('creates quiz questions through the API prefix', async () => {
    const choices = [
      { id: 'a', text: 'Reasoning' },
      { id: 'b', text: 'Evidence' },
      { id: 'c', text: 'Claim' },
    ];
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createQuizQuestion: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuizId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuizId).toBe(quizId);
          expect(input).toEqual({
            position: 0,
            questionType: 'multiple_choice',
            prompt: 'Which element connects evidence to a claim?',
            points: 2,
            choices,
          });
          return QuizQuestion.parse({
            id: quizQuestionId,
            tenantId,
            quizId,
            position: input.position,
            questionType: input.questionType,
            prompt: input.prompt,
            points: input.points,
            choices: input.choices,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/questions`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          position: 0,
          questionType: 'multiple_choice',
          prompt: 'Which element connects evidence to a claim?',
          points: 2,
          choices,
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: quizQuestionId,
      tenantId,
      quizId,
      position: 0,
      questionType: 'multiple_choice',
      prompt: 'Which element connects evidence to a claim?',
      points: 2,
      choices,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists quiz overrides through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuizOverrides: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuizId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuizId).toBe(quizId);
          return [
            QuizOverride.parse({
              id: quizOverrideId,
              tenantId,
              quizId,
              targetType: 'user',
              targetId: actorId,
              opensAt: null,
              closesAt: null,
              timeLimitMinutes: 60,
              maxAttempts: 2,
              status: 'active',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/overrides`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: quizOverrideId,
        tenantId,
        quizId,
        targetType: 'user',
        targetId: actorId,
        opensAt: null,
        closesAt: null,
        timeLimitMinutes: 60,
        maxAttempts: 2,
        status: 'active',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates quiz overrides through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createQuizOverride: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuizId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuizId).toBe(quizId);
          expect(input).toEqual({
            targetType: 'user',
            targetId: actorId,
            opensAt: null,
            closesAt: new Date('2026-05-17T23:59:00.000Z'),
            timeLimitMinutes: 60,
            maxAttempts: 2,
            status: 'active',
          });
          return QuizOverride.parse({
            id: quizOverrideId,
            tenantId,
            quizId,
            targetType: input.targetType,
            targetId: input.targetId,
            opensAt: input.opensAt,
            closesAt: input.closesAt,
            timeLimitMinutes: input.timeLimitMinutes,
            maxAttempts: input.maxAttempts,
            status: input.status,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/overrides`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          targetType: 'user',
          targetId: actorId,
          opensAt: null,
          closesAt: '2026-05-17T23:59:00.000Z',
          timeLimitMinutes: 60,
          maxAttempts: 2,
          status: 'active',
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      id: quizOverrideId,
      tenantId,
      quizId,
      targetType: 'user',
      targetId: actorId,
      opensAt: null,
      closesAt: '2026-05-17T23:59:00.000Z',
      timeLimitMinutes: 60,
      maxAttempts: 2,
      status: 'active',
    });
  });

  it('reads quiz effective settings through the API prefix', async () => {
    const app = createApiApp({ dependencies });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/effective-settings`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      quizId,
      opensAt: null,
      closesAt: null,
      timeLimitMinutes: 60,
      maxAttempts: 2,
    });
  });

  it('lists quiz attempts through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuizAttempts: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuizId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuizId).toBe(quizId);
          return [
            QuizAttempt.parse({
              id: quizAttemptId,
              tenantId,
              quizId,
              studentId: actorId,
              attemptNumber: 1,
              status: 'submitted',
              startedAt: now,
              submittedAt: new Date('2026-05-10T00:30:00.000Z'),
              score: 8,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: quizAttemptId,
        tenantId,
        quizId,
        studentId: actorId,
        attemptNumber: 1,
        status: 'submitted',
        startedAt: '2026-05-10T00:00:00.000Z',
        submittedAt: '2026-05-10T00:30:00.000Z',
        score: 8,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('lists quiz attempt question grades through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuizAttemptQuestionGrades: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuizId,
          requestedAttemptId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuizId).toBe(quizId);
          expect(requestedAttemptId).toBe(quizAttemptId);
          return [
            QuizAttemptQuestionGrade.parse({
              id: quizAttemptQuestionGradeId,
              tenantId,
              quizId,
              attemptId: quizAttemptId,
              questionId: quizQuestionId,
              graderId: actorId,
              score: 4,
              feedback: 'Clear explanation.',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts/${quizAttemptId}/question-grades`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: quizAttemptQuestionGradeId,
        tenantId,
        quizId,
        attemptId: quizAttemptId,
        questionId: quizQuestionId,
        graderId: actorId,
        score: 4,
        feedback: 'Clear explanation.',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('records quiz attempt question grades through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        recordQuizAttemptQuestionGrade: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuizId,
          requestedAttemptId,
          requestedQuestionId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuizId).toBe(quizId);
          expect(requestedAttemptId).toBe(quizAttemptId);
          expect(requestedQuestionId).toBe(quizQuestionId);
          expect(input).toEqual({ score: 4, feedback: 'Clear explanation.' });
          return QuizAttemptQuestionGrade.parse({
            id: quizAttemptQuestionGradeId,
            tenantId,
            quizId,
            attemptId: quizAttemptId,
            questionId: quizQuestionId,
            graderId: actorId,
            score: input.score,
            feedback: input.feedback,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts/${quizAttemptId}/question-grades/${quizQuestionId}`,
      {
        method: 'put',
        headers: { ...authorization, 'content-type': 'application/json' },
        body: JSON.stringify({ score: 4, feedback: 'Clear explanation.' }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: quizAttemptQuestionGradeId,
      attemptId: quizAttemptId,
      questionId: quizQuestionId,
      score: 4,
    });
  });

  it('regrades quiz attempts through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        regradeQuizAttempt: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuizId,
          requestedAttemptId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuizId).toBe(quizId);
          expect(requestedAttemptId).toBe(quizAttemptId);
          return QuizAttempt.parse({
            id: quizAttemptId,
            tenantId,
            quizId,
            studentId: actorId,
            attemptNumber: 1,
            status: 'graded',
            startedAt: now,
            submittedAt: now,
            score: 4,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts/${quizAttemptId}/regrade`,
      { method: 'post', headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: quizAttemptId,
      status: 'graded',
      score: 4,
    });
  });

  it('starts quiz attempts through the API prefix', async () => {
    let capturedStartInput: unknown;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        startQuizAttempt: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuizId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuizId).toBe(quizId);
          capturedStartInput = input;
          return QuizAttempt.parse({
            id: quizAttemptId,
            tenantId,
            quizId,
            studentId: actorId,
            attemptNumber: 1,
            status: 'in_progress',
            startedAt: now,
            submittedAt: null,
            score: null,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts`,
      {
        method: 'post',
        headers: {
          ...authorization,
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.44, 10.0.0.4',
        },
        body: JSON.stringify({ accessPassword: 'exam-room' }),
      },
    );

    expect(response.status).toBe(201);
    expect(capturedStartInput).toEqual({
      accessPassword: 'exam-room',
      clientIp: '203.0.113.44',
    });
    expect(await response.json()).toMatchObject({
      id: quizAttemptId,
      quizId,
      studentId: actorId,
      attemptNumber: 1,
      status: 'in_progress',
      submittedAt: null,
      score: null,
    });
  });

  it('rejects malformed quiz attempt start bodies before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        startQuizAttempt: async () => {
          dependencyCalled = true;
          return dependencies.startQuizAttempt(actorId, tenantId, courseId, quizId);
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts`,
      {
        method: 'post',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: '{',
      },
    );

    expect(response.status).toBe(400);
    expect(dependencyCalled).toBe(false);
  });

  it('submits quiz attempts through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        submitQuizAttempt: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuizId,
          requestedAttemptId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuizId).toBe(quizId);
          expect(requestedAttemptId).toBe(quizAttemptId);
          return QuizAttempt.parse({
            id: quizAttemptId,
            tenantId,
            quizId,
            studentId: actorId,
            attemptNumber: 1,
            status: 'submitted',
            startedAt: now,
            submittedAt: now,
            score: null,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts/${quizAttemptId}/submit`,
      { method: 'post', headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: quizAttemptId,
      quizId,
      studentId: actorId,
      attemptNumber: 1,
      status: 'submitted',
      submittedAt: '2026-05-10T00:00:00.000Z',
      score: null,
    });
  });

  it('lists quiz attempt responses through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuizAttemptResponses: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuizId,
          requestedAttemptId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuizId).toBe(quizId);
          expect(requestedAttemptId).toBe(quizAttemptId);
          return [
            QuizAttemptResponse.parse({
              id: quizAttemptResponseId,
              tenantId,
              quizId,
              attemptId: quizAttemptId,
              questionId: quizQuestionId,
              answer: { kind: 'choice', selectedChoiceIds: ['b'] },
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts/${quizAttemptId}/responses`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: quizAttemptResponseId,
        tenantId,
        quizId,
        attemptId: quizAttemptId,
        questionId: quizQuestionId,
        answer: { kind: 'choice', selectedChoiceIds: ['b'] },
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('saves quiz attempt responses through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        saveQuizAttemptResponse: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuizId,
          requestedAttemptId,
          requestedQuestionId,
          requestedAnswer,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuizId).toBe(quizId);
          expect(requestedAttemptId).toBe(quizAttemptId);
          expect(requestedQuestionId).toBe(quizQuestionId);
          expect(requestedAnswer).toEqual({ kind: 'choice', selectedChoiceIds: ['b'] });
          return QuizAttemptResponse.parse({
            id: quizAttemptResponseId,
            tenantId,
            quizId,
            attemptId: quizAttemptId,
            questionId: quizQuestionId,
            answer: { kind: 'choice', selectedChoiceIds: ['b'] },
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts/${quizAttemptId}/responses/${quizQuestionId}`,
      {
        method: 'put',
        headers: { ...authorization, 'content-type': 'application/json' },
        body: JSON.stringify({ answer: { kind: 'choice', selectedChoiceIds: ['b'] } }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: quizAttemptResponseId,
      attemptId: quizAttemptId,
      questionId: quizQuestionId,
      answer: { kind: 'choice', selectedChoiceIds: ['b'] },
    });
  });

  it('lists course question banks through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuestionBanks: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            QuestionBank.parse({
              id: questionBankId,
              tenantId,
              courseId,
              title: 'Evidence reasoning bank',
              description: 'Reusable evidence and explanation prompts.',
              status: 'active',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/question-banks`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: questionBankId,
        tenantId,
        courseId,
        title: 'Evidence reasoning bank',
        description: 'Reusable evidence and explanation prompts.',
        status: 'active',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates question banks through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createQuestionBank: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            title: 'Argumentation question bank',
            description: 'Multiple-choice and short-response items aligned to LO-1.',
            status: 'active',
          });
          return QuestionBank.parse({
            id: questionBankId,
            tenantId,
            courseId,
            title: input.title,
            description: input.description,
            status: input.status,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/question-banks`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Argumentation question bank',
          description: 'Multiple-choice and short-response items aligned to LO-1.',
          status: 'active',
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: questionBankId,
      tenantId,
      courseId,
      title: 'Argumentation question bank',
      description: 'Multiple-choice and short-response items aligned to LO-1.',
      status: 'active',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists question bank questions through the API prefix without answer keys', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuestionBankQuestions: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuestionBankId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuestionBankId).toBe(questionBankId);
          return [
            QuestionBankQuestion.parse({
              id: questionBankQuestionId,
              tenantId,
              questionBankId,
              position: 0,
              questionType: 'essay',
              prompt: 'Explain why this quote supports the claim.',
              points: 3,
              choices: [],
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/question-banks/${questionBankId}/questions`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([
      {
        id: questionBankQuestionId,
        tenantId,
        questionBankId,
        position: 0,
        questionType: 'essay',
        prompt: 'Explain why this quote supports the claim.',
        points: 3,
        choices: [],
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
    expect(JSON.stringify(body)).not.toContain('correct');
    expect(JSON.stringify(body)).not.toContain('answer');
  });

  it('creates question bank questions through the API prefix', async () => {
    const choices = [
      { id: 'a', text: 'Reasoning' },
      { id: 'b', text: 'Evidence' },
      { id: 'c', text: 'Claim' },
    ];
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createQuestionBankQuestion: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedQuestionBankId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedQuestionBankId).toBe(questionBankId);
          expect(input).toEqual({
            position: 0,
            questionType: 'multiple_choice',
            prompt: 'Which element connects evidence to a claim?',
            points: 2,
            choices,
          });
          return QuestionBankQuestion.parse({
            id: questionBankQuestionId,
            tenantId,
            questionBankId,
            position: input.position,
            questionType: input.questionType,
            prompt: input.prompt,
            points: input.points,
            choices: input.choices,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/question-banks/${questionBankId}/questions`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          position: 0,
          questionType: 'multiple_choice',
          prompt: 'Which element connects evidence to a claim?',
          points: 2,
          choices,
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: questionBankQuestionId,
      tenantId,
      questionBankId,
      position: 0,
      questionType: 'multiple_choice',
      prompt: 'Which element connects evidence to a claim?',
      points: 2,
      choices,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course attendance sessions through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAttendanceSessions: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            AttendanceSession.parse({
              id: attendanceSessionId,
              tenantId,
              courseId,
              title: 'Week 1 seminar',
              startsAt: now,
              endsAt: new Date('2026-05-10T01:00:00.000Z'),
              status: 'scheduled',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/attendance-sessions`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: attendanceSessionId,
        tenantId,
        courseId,
        title: 'Week 1 seminar',
        startsAt: '2026-05-10T00:00:00.000Z',
        endsAt: '2026-05-10T01:00:00.000Z',
        status: 'scheduled',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates attendance sessions through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createAttendanceSession: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            title: 'Week 2 seminar',
            startsAt: new Date('2026-05-11T00:00:00.000Z'),
            endsAt: new Date('2026-05-11T01:00:00.000Z'),
            status: 'scheduled',
          });
          return AttendanceSession.parse({
            id: attendanceSessionId,
            tenantId,
            courseId,
            title: 'Week 2 seminar',
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            status: input.status,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/attendance-sessions`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Week 2 seminar',
          startsAt: '2026-05-11T00:00:00.000Z',
          endsAt: '2026-05-11T01:00:00.000Z',
          status: 'scheduled',
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: attendanceSessionId,
      tenantId,
      courseId,
      title: 'Week 2 seminar',
      startsAt: '2026-05-11T00:00:00.000Z',
      endsAt: '2026-05-11T01:00:00.000Z',
      status: 'scheduled',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('creates attendance sessions from offset date-time strings', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createAttendanceSession: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            title: 'Week 2 seminar',
            startsAt: new Date('2026-05-11T00:00:00.000Z'),
            endsAt: new Date('2026-05-11T01:00:00.000Z'),
            status: 'scheduled',
          });
          return AttendanceSession.parse({
            id: attendanceSessionId,
            tenantId,
            courseId,
            title: input.title,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            status: input.status,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/attendance-sessions`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Week 2 seminar',
          startsAt: '2026-05-11T08:00:00+08:00',
          endsAt: '2026-05-11T09:00:00+08:00',
          status: 'scheduled',
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      startsAt: '2026-05-11T00:00:00.000Z',
      endsAt: '2026-05-11T01:00:00.000Z',
    });
  });

  it('rejects attendance sessions when the end is not after the start', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createAttendanceSession: async () => {
          dependencyCalled = true;
          return dependencies.createAttendanceSession(actorId, tenantId, courseId, {
            title: 'Week 2 seminar',
            startsAt: now,
            endsAt: now,
            status: 'scheduled',
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/attendance-sessions`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Week 2 seminar',
          startsAt: '2026-05-11T01:00:00.000Z',
          endsAt: '2026-05-11T01:00:00.000Z',
          status: 'scheduled',
        }),
      },
    );

    expect(response.status).toBe(400);
    expect(dependencyCalled).toBe(false);
  });

  it('lists attendance records through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAttendanceRecords: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedSessionId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedSessionId).toBe(attendanceSessionId);
          return [
            AttendanceRecord.parse({
              id: attendanceRecordId,
              tenantId,
              sessionId: attendanceSessionId,
              studentId: actorId,
              status: 'present',
              note: null,
              recordedAt: now,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/attendance-sessions/${attendanceSessionId}/records`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: attendanceRecordId,
        tenantId,
        sessionId: attendanceSessionId,
        studentId: actorId,
        status: 'present',
        note: null,
        recordedAt: '2026-05-10T00:00:00.000Z',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('records attendance through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        recordAttendanceRecord: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedSessionId,
          requestedStudentId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedSessionId).toBe(attendanceSessionId);
          expect(requestedStudentId).toBe(actorId);
          expect(input).toEqual({
            status: 'late',
            note: 'Arrived after the opening activity.',
          });
          return AttendanceRecord.parse({
            id: attendanceRecordId,
            tenantId,
            sessionId: attendanceSessionId,
            studentId: actorId,
            status: 'late',
            note: 'Arrived after the opening activity.',
            recordedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/attendance-sessions/${attendanceSessionId}/records/${actorId}`,
      {
        method: 'PUT',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          status: 'late',
          note: 'Arrived after the opening activity.',
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: attendanceRecordId,
      tenantId,
      sessionId: attendanceSessionId,
      studentId: actorId,
      status: 'late',
      note: 'Arrived after the opening activity.',
      recordedAt: '2026-05-10T00:00:00.000Z',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course completion requirements through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCompletionRequirements: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedModuleId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedModuleId).toBe(moduleId);
          return [
            CompletionRequirement.parse({
              id: completionRequirementId,
              tenantId,
              courseId,
              moduleId,
              title: 'Submit the evidence essay',
              description: 'Students must submit the main writing assignment.',
              requirementType: 'submit_assignment',
              targetType: 'assignment',
              targetId: assignmentId,
              minScorePercent: null,
              status: 'active',
              required: true,
              position: 0,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/completion-requirements?moduleId=${moduleId}`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: completionRequirementId,
        tenantId,
        courseId,
        moduleId,
        title: 'Submit the evidence essay',
        description: 'Students must submit the main writing assignment.',
        requirementType: 'submit_assignment',
        targetType: 'assignment',
        targetId: assignmentId,
        minScorePercent: null,
        status: 'active',
        required: true,
        position: 0,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates completion requirements through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCompletionRequirement: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            title: 'Submit Essay 1',
            description: 'Submit the evidence-based essay before the unit progresses.',
            moduleId,
            requirementType: 'submit_assignment',
            targetType: 'assignment',
            targetId: assignmentId,
            minScorePercent: null,
            status: 'active',
            required: true,
            position: 0,
          });
          return CompletionRequirement.parse({
            id: completionRequirementId,
            tenantId,
            courseId,
            moduleId: input.moduleId,
            title: input.title,
            description: input.description,
            requirementType: input.requirementType,
            targetType: input.targetType,
            targetId: input.targetId,
            minScorePercent: input.minScorePercent,
            status: input.status,
            required: input.required,
            position: input.position,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/completion-requirements`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Submit Essay 1',
          description: 'Submit the evidence-based essay before the unit progresses.',
          moduleId,
          requirementType: 'submit_assignment',
          targetType: 'assignment',
          targetId: assignmentId,
          minScorePercent: null,
          status: 'active',
          required: true,
          position: 0,
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: completionRequirementId,
      tenantId,
      courseId,
      moduleId,
      title: 'Submit Essay 1',
      description: 'Submit the evidence-based essay before the unit progresses.',
      requirementType: 'submit_assignment',
      targetType: 'assignment',
      targetId: assignmentId,
      minScorePercent: null,
      status: 'active',
      required: true,
      position: 0,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists completion progress through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCompletionProgress: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedRequirementId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedRequirementId).toBe(completionRequirementId);
          return [
            CompletionProgress.parse({
              id: completionProgressId,
              tenantId,
              requirementId: completionRequirementId,
              studentId: actorId,
              status: 'completed',
              completedAt: now,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/completion-requirements/${completionRequirementId}/progress`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: completionProgressId,
        tenantId,
        requirementId: completionRequirementId,
        studentId: actorId,
        status: 'completed',
        completedAt: '2026-05-10T00:00:00.000Z',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('lists course credentials through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCredentials: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            CourseCredential.parse({
              id: credentialId,
              tenantId,
              courseId,
              credentialType: 'certificate',
              title: 'Evidence writing certificate',
              description: 'Issued when a student completes the evidence writing course.',
              criteriaSummary: 'Complete all required activities.',
              status: 'published',
              imageUrl: null,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/credentials`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: credentialId,
        tenantId,
        courseId,
        credentialType: 'certificate',
        title: 'Evidence writing certificate',
        description: 'Issued when a student completes the evidence writing course.',
        criteriaSummary: 'Complete all required activities.',
        status: 'published',
        imageUrl: null,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates course credentials through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseCredential: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            credentialType: 'badge',
            title: 'Evidence-based writing badge',
            description: 'Awarded for sustained evidence-based argumentation.',
            criteriaSummary: 'Earn 85% or higher on at least three essay rubrics.',
            status: 'draft',
            imageUrl: 'https://images.example.test/badges/evidence-writing.png',
          });
          return CourseCredential.parse({
            id: credentialId,
            tenantId,
            courseId,
            credentialType: input.credentialType,
            title: input.title,
            description: input.description,
            criteriaSummary: input.criteriaSummary,
            status: input.status,
            imageUrl: input.imageUrl,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/credentials`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          credentialType: 'badge',
          title: 'Evidence-based writing badge',
          description: 'Awarded for sustained evidence-based argumentation.',
          criteriaSummary: 'Earn 85% or higher on at least three essay rubrics.',
          status: 'draft',
          imageUrl: 'https://images.example.test/badges/evidence-writing.png',
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: credentialId,
      tenantId,
      courseId,
      credentialType: 'badge',
      title: 'Evidence-based writing badge',
      description: 'Awarded for sustained evidence-based argumentation.',
      criteriaSummary: 'Earn 85% or higher on at least three essay rubrics.',
      status: 'draft',
      imageUrl: 'https://images.example.test/badges/evidence-writing.png',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists credential awards through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCredentialAwards: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedCredentialId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedCredentialId).toBe(credentialId);
          return [
            CredentialAward.parse({
              id: credentialAwardId,
              tenantId,
              credentialId,
              studentId: actorId,
              status: 'issued',
              issuedAt: now,
              revokedAt: null,
              expiresAt: null,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/credentials/${credentialId}/awards`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: credentialAwardId,
        tenantId,
        credentialId,
        studentId: actorId,
        status: 'issued',
        issuedAt: '2026-05-10T00:00:00.000Z',
        revokedAt: null,
        expiresAt: null,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates credential awards through the API prefix', async () => {
    const issuedAt = new Date('2026-05-10T00:00:00.000Z');
    const studentTargetId = '01J9QW7B6N5W2YH3D3A1V0KE8P';
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCredentialAward: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedCredentialId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedCredentialId).toBe(credentialId);
          expect(input).toEqual({
            studentId: studentTargetId,
            status: 'issued',
            issuedAt,
            revokedAt: null,
            expiresAt: null,
          });
          return CredentialAward.parse({
            id: credentialAwardId,
            tenantId,
            credentialId,
            studentId: input.studentId,
            status: input.status,
            issuedAt: input.issuedAt,
            revokedAt: input.revokedAt,
            expiresAt: input.expiresAt,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/credentials/${credentialId}/awards`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentTargetId,
          status: 'issued',
          issuedAt: '2026-05-10T00:00:00.000Z',
          revokedAt: null,
          expiresAt: null,
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: credentialAwardId,
      tenantId,
      credentialId,
      studentId: studentTargetId,
      status: 'issued',
      issuedAt: '2026-05-10T00:00:00.000Z',
      revokedAt: null,
      expiresAt: null,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course conversation threads through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listConversationThreads: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            ConversationThread.parse({
              id: conversationThreadId,
              tenantId,
              courseId,
              subject: 'Essay feedback question',
              status: 'open',
              participantIds: [actorId, '01J9QW7B6N5W2YH3D3A1V0KE4Z'],
              lastMessageAt: now,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/conversations`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: conversationThreadId,
        tenantId,
        courseId,
        subject: 'Essay feedback question',
        status: 'open',
        participantIds: [actorId, '01J9QW7B6N5W2YH3D3A1V0KE4Z'],
        lastMessageAt: '2026-05-10T00:00:00.000Z',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('lists conversation messages through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listConversationMessages: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedThreadId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedThreadId).toBe(conversationThreadId);
          return [
            ConversationMessage.parse({
              id: conversationMessageId,
              tenantId,
              threadId: conversationThreadId,
              senderId: actorId,
              body: 'Can you clarify the evidence note?',
              sentAt: now,
              createdAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/conversations/${conversationThreadId}/messages`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: conversationMessageId,
        tenantId,
        threadId: conversationThreadId,
        senderId: actorId,
        body: 'Can you clarify the evidence note?',
        sentAt: '2026-05-10T00:00:00.000Z',
        createdAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('lists course group sets through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseGroupSets: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            CourseGroupSet.parse({
              id: courseGroupSetId,
              tenantId,
              courseId,
              name: 'Project teams',
              selfSignupEnabled: false,
              status: 'active',
              position: 0,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/group-sets`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: courseGroupSetId,
        tenantId,
        courseId,
        name: 'Project teams',
        selfSignupEnabled: false,
        status: 'active',
        position: 0,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates course group sets through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseGroupSet: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            name: 'Project teams',
            selfSignupEnabled: false,
            status: 'active',
            position: 0,
          });
          return CourseGroupSet.parse({
            id: courseGroupSetId,
            tenantId,
            courseId,
            name: input.name,
            selfSignupEnabled: input.selfSignupEnabled,
            status: input.status,
            position: input.position,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/group-sets`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Project teams',
          selfSignupEnabled: false,
          status: 'active',
          position: 0,
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: courseGroupSetId,
      tenantId,
      courseId,
      name: 'Project teams',
      selfSignupEnabled: false,
      status: 'active',
      position: 0,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course groups through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseGroups: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            CourseGroup.parse({
              id: courseGroupId,
              tenantId,
              courseId,
              groupSetId: courseGroupSetId,
              name: 'Team Alpha',
              description: 'Collaborative evidence project group.',
              status: 'active',
              position: 0,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/groups`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: courseGroupId,
        tenantId,
        courseId,
        groupSetId: courseGroupSetId,
        name: 'Team Alpha',
        description: 'Collaborative evidence project group.',
        status: 'active',
        position: 0,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates course groups through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseGroup: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            groupSetId: courseGroupSetId,
            name: 'Team Alpha',
            description: 'Project team for week 1.',
            status: 'active',
            position: 0,
          });
          return CourseGroup.parse({
            id: courseGroupId,
            tenantId,
            courseId,
            groupSetId: input.groupSetId,
            name: input.name,
            description: input.description,
            status: input.status,
            position: input.position,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/groups`, {
      method: 'POST',
      headers: {
        ...authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        groupSetId: courseGroupSetId,
        name: 'Team Alpha',
        description: 'Project team for week 1.',
        status: 'active',
        position: 0,
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: courseGroupId,
      tenantId,
      courseId,
      groupSetId: courseGroupSetId,
      name: 'Team Alpha',
      description: 'Project team for week 1.',
      status: 'active',
      position: 0,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course group members through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseGroupMembers: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedGroupId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedGroupId).toBe(courseGroupId);
          return [
            CourseGroupMember.parse({
              id: courseGroupMemberId,
              tenantId,
              groupId: courseGroupId,
              userId: actorId,
              role: 'member',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/groups/${courseGroupId}/members`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: courseGroupMemberId,
        tenantId,
        groupId: courseGroupId,
        userId: actorId,
        role: 'member',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates course group members through the API prefix', async () => {
    const newMemberId = '01J9QW7B6N5W2YH3D3A1V0KE8M';
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseGroupMember: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedGroupId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedGroupId).toBe(courseGroupId);
          expect(input).toEqual({
            userId: newMemberId,
            role: 'member',
          });
          return CourseGroupMember.parse({
            id: courseGroupMemberId,
            tenantId,
            groupId: courseGroupId,
            userId: input.userId,
            role: input.role,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/groups/${courseGroupId}/members`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          userId: newMemberId,
          role: 'member',
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: courseGroupMemberId,
      tenantId,
      groupId: courseGroupId,
      userId: newMemberId,
      role: 'member',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('maps a duplicate course group member to a 409 conflict response', async () => {
    const newMemberId = '01J9QW7B6N5W2YH3D3A1V0KE8M';
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseGroupMember: async () => {
          throw new ApiError(
            'conflict',
            'User is already a member of this group. Remove the existing membership before adding them again.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/groups/${courseGroupId}/members`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          userId: newMemberId,
          role: 'member',
        }),
      },
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: {
        code: 'conflict',
        message:
          'User is already a member of this group. Remove the existing membership before adding them again.',
      },
    });
  });

  it('lists assignment submissions visible to the authenticated user', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAssignmentSubmissions: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedAssignmentId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedAssignmentId).toBe(assignmentId);
          return [
            Submission.parse({
              id: submissionId,
              tenantId,
              assignmentId,
              studentId: actorId,
              sourceDraftId: draftId,
              version: 1,
              status: 'submitted',
              contentSnapshot: [{ blockId: 'intro', text: 'Evidence supports the claim.' }],
              submittedAt: now,
              createdAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: submissionId,
        tenantId,
        assignmentId,
        studentId: actorId,
        groupId: null,
        sourceDraftId: draftId,
        version: 1,
        status: 'submitted',
        contentSnapshot: [{ blockId: 'intro', text: 'Evidence supports the claim.' }],
        submittedAt: '2026-05-10T00:00:00.000Z',
        createdAt: '2026-05-10T00:00:00.000Z',
        anonymousLabel: null,
      },
    ]);
  });

  it('saves assignment drafts through the API prefix', async () => {
    const blocks = [{ blockId: 'intro', text: 'Evidence supports the claim.' }];
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        saveAssignmentDraft: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedAssignmentId,
          requestedDraftId,
          requestedBlocks,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedAssignmentId).toBe(assignmentId);
          expect(requestedDraftId).toBe(draftId);
          expect(requestedBlocks).toEqual(blocks);
          return Draft.parse({
            id: draftId,
            tenantId,
            assignmentId,
            studentId: actorId,
            blocks,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/drafts/${draftId}`,
      {
        method: 'PUT',
        headers: { ...authorization, 'content-type': 'application/json' },
        body: JSON.stringify({ blocks }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: draftId,
      tenantId,
      assignmentId,
      studentId: actorId,
      blocks,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('submits assignment drafts through the API prefix', async () => {
    const blocks = [{ blockId: 'intro', text: 'Evidence supports the claim.' }];
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        submitAssignmentDraft: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedAssignmentId,
          requestedDraftId,
          requestedBlocks,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedAssignmentId).toBe(assignmentId);
          expect(requestedDraftId).toBe(draftId);
          expect(requestedBlocks).toEqual(blocks);
          return Submission.parse({
            id: submissionId,
            tenantId,
            assignmentId,
            studentId: actorId,
            sourceDraftId: draftId,
            version: 1,
            status: 'submitted',
            contentSnapshot: blocks,
            submittedAt: now,
            createdAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/drafts/${draftId}/submit`,
      {
        method: 'POST',
        headers: { ...authorization, 'content-type': 'application/json' },
        body: JSON.stringify({ blocks }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: submissionId,
      tenantId,
      assignmentId,
      studentId: actorId,
      groupId: null,
      sourceDraftId: draftId,
      version: 1,
      status: 'submitted',
      contentSnapshot: blocks,
      submittedAt: '2026-05-10T00:00:00.000Z',
      createdAt: '2026-05-10T00:00:00.000Z',
      anonymousLabel: null,
    });
  });

  it('returns not found when assignment submissions are requested for another course', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAssignmentSubmissions: async () => {
          throw new ApiError(
            'not_found',
            'Assignment was not found in this course. Check the assignment id and retry the request.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions`,
      { headers: authorization },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: 'not_found',
        message:
          'Assignment was not found in this course. Check the assignment id and retry the request.',
      },
    });
  });

  it('imports assignment grades from CSV through the API prefix', async () => {
    const csv = ['submission_id,score,max_score,status', `${submissionId},8.5,10,published`].join(
      '\n',
    );
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        importSubmissionGradesCsv: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedAssignmentId,
          requestedCsv,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedAssignmentId).toBe(assignmentId);
          expect(requestedCsv).toBe(csv);
          const grade = Grade.parse({
            id: '01J9QW7B6N5W2YH3D3A1V0KE39',
            tenantId,
            submissionId,
            score: 8.5,
            maxScore: 10,
            status: 'published',
            source: 'manual',
            createdAt: now,
            updatedAt: now,
          });
          return {
            results: [
              {
                submissionId: grade.submissionId,
                status: 'saved',
                grade,
                error: null,
              },
            ],
            savedCount: 1,
            failedCount: 0,
          };
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/grades/import-csv`,
      {
        method: 'POST',
        headers: { ...authorization, 'content-type': 'text/csv' },
        body: csv,
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      results: [
        {
          submissionId,
          status: 'saved',
          grade: {
            id: '01J9QW7B6N5W2YH3D3A1V0KE39',
            tenantId,
            submissionId,
            score: 8.5,
            maxScore: 10,
            status: 'published',
            source: 'manual',
            createdAt: '2026-05-10T00:00:00.000Z',
            updatedAt: '2026-05-10T00:00:00.000Z',
          },
          error: null,
        },
      ],
      savedCount: 1,
      failedCount: 0,
    });
  });

  it('lists assignment peer reviews visible to the authenticated user', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAssignmentPeerReviews: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedAssignmentId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedAssignmentId).toBe(assignmentId);
          return [
            AssignmentPeerReview.parse({
              id: '01J9QW7B6N5W2YH3D3A1V0KE7Q',
              tenantId,
              assignmentId,
              submissionId,
              reviewerId: actorId,
              status: 'assigned',
              dueAt: new Date('2026-05-12T00:00:00.000Z'),
              submittedAt: null,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/peer-reviews`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE7Q',
        tenantId,
        assignmentId,
        submissionId,
        reviewerId: actorId,
        status: 'assigned',
        dueAt: '2026-05-12T00:00:00.000Z',
        submittedAt: null,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('lists submission attachments visible to the authenticated user', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listSubmissionAttachments: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedAssignmentId,
          requestedSubmissionId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedAssignmentId).toBe(assignmentId);
          expect(requestedSubmissionId).toBe(submissionId);
          return [
            SubmissionAttachment.parse({
              id: submissionAttachmentId,
              tenantId,
              submissionId,
              fileResourceId: fileId,
              displayName: 'evidence-appendix.pdf',
              position: 0,
              createdAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/attachments`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: submissionAttachmentId,
        tenantId,
        submissionId,
        fileResourceId: fileId,
        displayName: 'evidence-appendix.pdf',
        position: 0,
        createdAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates submission attachments through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createSubmissionAttachment: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedAssignmentId,
          requestedSubmissionId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedAssignmentId).toBe(assignmentId);
          expect(requestedSubmissionId).toBe(submissionId);
          expect(input).toEqual({
            fileResourceId: fileId,
            displayName: null,
          });
          return SubmissionAttachment.parse({
            id: submissionAttachmentId,
            tenantId,
            submissionId,
            fileResourceId: fileId,
            displayName: 'evidence-appendix.pdf',
            position: 0,
            createdAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/attachments`,
      {
        method: 'POST',
        headers: { ...authorization, 'content-type': 'application/json' },
        body: JSON.stringify({ fileResourceId: fileId }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: submissionAttachmentId,
      tenantId,
      submissionId,
      fileResourceId: fileId,
      displayName: 'evidence-appendix.pdf',
      position: 0,
      createdAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('returns not found when submission attachments are requested for another assignment', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listSubmissionAttachments: async () => {
          throw new ApiError(
            'not_found',
            'Submission was not found in this assignment. Check the submission id and retry the request.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/attachments`,
      { headers: authorization },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: 'not_found',
        message:
          'Submission was not found in this assignment. Check the submission id and retry the request.',
      },
    });
  });

  it('lists submission comments visible to the authenticated user', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listSubmissionComments: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedAssignmentId,
          requestedSubmissionId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedAssignmentId).toBe(assignmentId);
          expect(requestedSubmissionId).toBe(submissionId);
          return [
            SubmissionComment.parse({
              id: submissionCommentId,
              tenantId,
              submissionId,
              authorId: actorId,
              body: 'Please expand the evidence explanation.',
              visibility: 'student_visible',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/comments`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: submissionCommentId,
        tenantId,
        submissionId,
        authorId: actorId,
        body: 'Please expand the evidence explanation.',
        visibility: 'student_visible',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates submission comments through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createSubmissionComment: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedAssignmentId,
          requestedSubmissionId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedAssignmentId).toBe(assignmentId);
          expect(requestedSubmissionId).toBe(submissionId);
          expect(input).toEqual({
            body: 'Please expand the evidence explanation.',
            visibility: 'student_visible',
          });
          return SubmissionComment.parse({
            id: submissionCommentId,
            tenantId,
            submissionId,
            authorId: actorId,
            body: 'Please expand the evidence explanation.',
            visibility: 'student_visible',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/comments`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          body: 'Please expand the evidence explanation.',
          visibility: 'student_visible',
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: submissionCommentId,
      tenantId,
      submissionId,
      authorId: actorId,
      body: 'Please expand the evidence explanation.',
      visibility: 'student_visible',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('returns not found when submission comments are requested for another assignment', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listSubmissionComments: async () => {
          throw new ApiError(
            'not_found',
            'Submission was not found in this assignment. Check the submission id and retry the request.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/comments`,
      { headers: authorization },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: 'not_found',
        message:
          'Submission was not found in this assignment. Check the submission id and retry the request.',
      },
    });
  });

  it('lists course gradebook entries through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listGradebookEntries: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            GradebookEntry.parse({
              id: 'gradebook_entry:01J9QW7B6N5W2YH3D3A1V0KE31',
              tenantId,
              courseId,
              assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE30',
              assignmentTitle: 'Evidence essay',
              assignmentDueAt: new Date('2026-05-12T03:00:00.000Z'),
              gradebookCategoryId: '01J9QW7B6N5W2YH3D3A1V0KE5Z',
              gradebookCategoryName: 'Essays',
              studentId: actorId,
              submissionId: '01J9QW7B6N5W2YH3D3A1V0KE32',
              submittedAt: now,
              gradeId: '01J9QW7B6N5W2YH3D3A1V0KE31',
              score: 9,
              maxScore: 10,
              gradeStatus: 'published',
              gradeSource: 'manual',
              gradedAt: now,
            }),
            GradebookEntry.parse({
              id: 'gradebook_entry:01J9QW7B6N5W2YH3D3A1V0KE33',
              tenantId,
              courseId,
              assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE34',
              assignmentTitle: 'Reading response',
              assignmentDueAt: null,
              gradebookCategoryId: null,
              gradebookCategoryName: null,
              studentId: actorId,
              submissionId: '01J9QW7B6N5W2YH3D3A1V0KE35',
              submittedAt: now,
              gradeId: '01J9QW7B6N5W2YH3D3A1V0KE33',
              score: 8,
              maxScore: 10,
              gradeStatus: 'published',
              gradeSource: 'manual',
              gradedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: 'gradebook_entry:01J9QW7B6N5W2YH3D3A1V0KE31',
        tenantId,
        courseId,
        assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE30',
        assignmentTitle: 'Evidence essay',
        assignmentDueAt: '2026-05-12T03:00:00.000Z',
        assignmentExtraCredit: false,
        gradebookCategoryId: '01J9QW7B6N5W2YH3D3A1V0KE5Z',
        gradebookCategoryName: 'Essays',
        studentId: actorId,
        submissionId: '01J9QW7B6N5W2YH3D3A1V0KE32',
        submittedAt: '2026-05-10T00:00:00.000Z',
        gradeId: '01J9QW7B6N5W2YH3D3A1V0KE31',
        score: 9,
        maxScore: 10,
        gradeStatus: 'published',
        gradeSource: 'manual',
        gradedAt: '2026-05-10T00:00:00.000Z',
      },
      {
        id: 'gradebook_entry:01J9QW7B6N5W2YH3D3A1V0KE33',
        tenantId,
        courseId,
        assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE34',
        assignmentTitle: 'Reading response',
        assignmentDueAt: null,
        assignmentExtraCredit: false,
        gradebookCategoryId: null,
        gradebookCategoryName: null,
        studentId: actorId,
        submissionId: '01J9QW7B6N5W2YH3D3A1V0KE35',
        submittedAt: '2026-05-10T00:00:00.000Z',
        gradeId: '01J9QW7B6N5W2YH3D3A1V0KE33',
        score: 8,
        maxScore: 10,
        gradeStatus: 'published',
        gradeSource: 'manual',
        gradedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('lists manual gradebook items through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listGradebookManualItems: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            GradebookManualItem.parse({
              id: gradebookManualItemId,
              tenantId,
              courseId,
              gradebookCategoryId: '01J9QW7B6N5W2YH3D3A1V0KE5Z',
              title: 'In-class participation',
              description: 'Participation points recorded outside assignment submissions.',
              maxScore: 10,
              dueAt: null,
              position: 2,
              status: 'active',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/manual-items`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: gradebookManualItemId,
        tenantId,
        courseId,
        gradebookCategoryId: '01J9QW7B6N5W2YH3D3A1V0KE5Z',
        title: 'In-class participation',
        description: 'Participation points recorded outside assignment submissions.',
        maxScore: 10,
        dueAt: null,
        position: 2,
        status: 'active',
        extraCredit: false,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates manual gradebook items through the API prefix', async () => {
    const dueAt = new Date('2026-09-15T17:00:00.000Z');
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createGradebookManualItem: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            gradebookCategoryId: gradebookCategoryId,
            title: 'Participation',
            description: 'Weekly discussion contributions.',
            maxScore: 100,
            dueAt,
            position: 0,
            status: 'active',
          });
          return GradebookManualItem.parse({
            id: gradebookManualItemId,
            tenantId,
            courseId,
            gradebookCategoryId: input.gradebookCategoryId,
            title: input.title,
            description: input.description,
            maxScore: input.maxScore,
            dueAt: input.dueAt,
            position: input.position,
            status: input.status,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/manual-items`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          gradebookCategoryId: gradebookCategoryId,
          title: 'Participation',
          description: 'Weekly discussion contributions.',
          maxScore: 100,
          dueAt: '2026-09-15T17:00:00.000Z',
          position: 0,
          status: 'active',
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: gradebookManualItemId,
      tenantId,
      courseId,
      gradebookCategoryId: gradebookCategoryId,
      title: 'Participation',
      description: 'Weekly discussion contributions.',
      maxScore: 100,
      dueAt: '2026-09-15T17:00:00.000Z',
      position: 0,
      status: 'active',
      extraCredit: false,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists manual gradebook grades through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listGradebookManualGrades: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedManualItemId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedManualItemId).toBe(gradebookManualItemId);
          return [
            GradebookManualGrade.parse({
              id: gradebookManualGradeId,
              tenantId,
              gradebookManualItemId,
              studentId: actorId,
              score: 9,
              maxScore: 10,
              status: 'published',
              source: 'manual',
              gradedAt: now,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/manual-items/${gradebookManualItemId}/grades`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: gradebookManualGradeId,
        tenantId,
        gradebookManualItemId,
        studentId: actorId,
        score: 9,
        maxScore: 10,
        status: 'published',
        source: 'manual',
        gradedAt: '2026-05-10T00:00:00.000Z',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('records manual gradebook grades through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        saveGradebookManualGrade: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedManualItemId,
          requestedStudentId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedManualItemId).toBe(gradebookManualItemId);
          expect(requestedStudentId).toBe(actorId);
          expect(input).toEqual({ score: 8, status: 'published' });
          return GradebookManualGrade.parse({
            id: gradebookManualGradeId,
            tenantId,
            gradebookManualItemId,
            studentId: actorId,
            score: 8,
            maxScore: 10,
            status: 'published',
            source: 'manual',
            gradedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/manual-items/${gradebookManualItemId}/grades/${actorId}`,
      {
        method: 'PUT',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ score: 8, status: 'published' }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: gradebookManualGradeId,
      tenantId,
      gradebookManualItemId,
      studentId: actorId,
      score: 8,
      maxScore: 10,
      status: 'published',
      source: 'manual',
      gradedAt: '2026-05-10T00:00:00.000Z',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course gradebook categories through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listGradebookCategories: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            GradebookCategory.parse({
              id: '01J9QW7B6N5W2YH3D3A1V0KE5Z',
              tenantId,
              courseId,
              name: 'Essays',
              position: 0,
              weightPercent: 40,
              dropLowest: 1,
              status: 'active',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/categories`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE5Z',
        tenantId,
        courseId,
        name: 'Essays',
        position: 0,
        weightPercent: 40,
        dropLowest: 1,
        status: 'active',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates gradebook categories through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createGradebookCategory: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            name: 'Homework',
            position: 0,
            weightPercent: 40,
            dropLowest: 1,
            status: 'active',
          });
          return GradebookCategory.parse({
            id: gradebookCategoryId,
            tenantId,
            courseId,
            name: input.name,
            position: input.position,
            weightPercent: input.weightPercent,
            dropLowest: input.dropLowest,
            status: input.status,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/categories`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Homework',
          position: 0,
          weightPercent: 40,
          dropLowest: 1,
          status: 'active',
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: gradebookCategoryId,
      tenantId,
      courseId,
      name: 'Homework',
      position: 0,
      weightPercent: 40,
      dropLowest: 1,
      status: 'active',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course grading schemes through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseGradingSchemes: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            CourseGradingScheme.parse({
              id: '01J9QW7B6N5W2YH3D3A1V0KE6A',
              tenantId,
              courseId,
              name: 'Letter grades',
              status: 'active',
              entries: [
                { label: 'A', minPercent: 90 },
                { label: 'B', minPercent: 80 },
                { label: 'C', minPercent: 70 },
                { label: 'D', minPercent: 60 },
                { label: 'F', minPercent: 0 },
              ],
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/grading-schemes`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE6A',
        tenantId,
        courseId,
        name: 'Letter grades',
        status: 'active',
        entries: [
          { label: 'A', minPercent: 90 },
          { label: 'B', minPercent: 80 },
          { label: 'C', minPercent: 70 },
          { label: 'D', minPercent: 60 },
          { label: 'F', minPercent: 0 },
        ],
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates course grading schemes through the API prefix', async () => {
    const sampleEntries = [
      { label: 'A', minPercent: 90 },
      { label: 'B', minPercent: 80 },
      { label: 'F', minPercent: 0 },
    ];
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseGradingScheme: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            name: 'Standard 4-tier',
            status: 'active',
            entries: sampleEntries,
          });
          return CourseGradingScheme.parse({
            id: courseGradingSchemeId,
            tenantId,
            courseId,
            name: input.name,
            status: input.status,
            entries: input.entries,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/grading-schemes`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Standard 4-tier',
          status: 'active',
          entries: sampleEntries,
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: courseGradingSchemeId,
      tenantId,
      courseId,
      name: 'Standard 4-tier',
      status: 'active',
      entries: sampleEntries,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course external tools through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseExternalTools: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            CourseExternalTool.parse({
              id: '01J9QW7B6N5W2YH3D3A1V0KE6B',
              tenantId,
              courseId,
              integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE6C',
              name: 'Lab simulator',
              description: 'Launch the virtual science lab.',
              launchUrl: 'https://tools.example.edu/lti/launch/lab-simulator',
              placement: 'module_item',
              status: 'active',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/external-tools`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE6B',
        tenantId,
        courseId,
        integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE6C',
        name: 'Lab simulator',
        description: 'Launch the virtual science lab.',
        launchUrl: 'https://tools.example.edu/lti/launch/lab-simulator',
        placement: 'module_item',
        status: 'active',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates LTI 1.3 OIDC launch initiations through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        launchCourseExternalToolLti1p3: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedToolId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedToolId).toBe(courseExternalToolId);
          return Lti1p3OidcLoginInitiation.parse({
            method: 'redirect',
            url: 'https://tools.example.edu/oidc/login?iss=https%3A%2F%2Flms.example.edu',
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/external-tools/${courseExternalToolId}/lti-1p3/launch`,
      { method: 'POST', headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      method: 'redirect',
      url: 'https://tools.example.edu/oidc/login?iss=https%3A%2F%2Flms.example.edu',
    });
  });

  it('creates LTI 1.3 deep linking launch initiations through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        launchCourseExternalToolLti1p3DeepLinking: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedToolId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedToolId).toBe(courseExternalToolId);
          return Lti1p3OidcLoginInitiation.parse({
            method: 'redirect',
            url: 'https://tools.example.edu/oidc/login?iss=https%3A%2F%2Flms.example.edu',
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/external-tools/${courseExternalToolId}/lti-1p3/deep-linking/launch`,
      { method: 'POST', headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      method: 'redirect',
      url: 'https://tools.example.edu/oidc/login?iss=https%3A%2F%2Flms.example.edu',
    });
  });

  it('creates LTI 1.3 launch authorization form-post responses through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseExternalToolLti1p3LaunchAuthorizationResponse: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedToolId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedToolId).toBe(courseExternalToolId);
          expect(input).toEqual({
            redirectUri: 'https://tools.example.edu/lti/launch',
            state: 'state-123',
            nonce: 'nonce-456',
          });
          return Lti1p3LaunchAuthorizationResponse.parse({
            method: 'form_post',
            url: 'https://tools.example.edu/lti/launch',
            fields: {
              id_token: 'header.payload.signature',
              state: 'state-123',
            },
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/external-tools/${courseExternalToolId}/lti-1p3/launch-response`,
      {
        method: 'POST',
        headers: { ...authorization, 'content-type': 'application/json' },
        body: JSON.stringify({
          redirectUri: 'https://tools.example.edu/lti/launch',
          state: 'state-123',
          nonce: 'nonce-456',
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      method: 'form_post',
      url: 'https://tools.example.edu/lti/launch',
      fields: {
        id_token: 'header.payload.signature',
        state: 'state-123',
      },
    });
  });

  it('authorizes LTI 1.3 OIDC launch redirects through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        authorizeLti1p3OidcLaunch: async (sessionToken, input) => {
          expect(sessionToken).toBe('session-token');
          expect(input).toEqual({
            scope: 'openid',
            response_type: 'id_token',
            response_mode: 'form_post',
            prompt: 'none',
            client_id: 'client-123',
            redirect_uri: 'https://tools.example.edu/lti/launch',
            login_hint: actorId,
            lti_message_hint: 'message-hint-123',
            nonce: 'nonce-456',
            state: 'state-123',
          });
          return Lti1p3LaunchAuthorizationResponse.parse({
            method: 'form_post',
            url: 'https://tools.example.edu/lti/launch',
            fields: {
              id_token: 'header.payload.signature',
              state: 'state-123',
            },
          });
        },
      },
    });
    const query = new URLSearchParams({
      scope: 'openid',
      response_type: 'id_token',
      response_mode: 'form_post',
      prompt: 'none',
      client_id: 'client-123',
      redirect_uri: 'https://tools.example.edu/lti/launch',
      login_hint: actorId,
      lti_message_hint: 'message-hint-123',
      nonce: 'nonce-456',
      state: 'state-123',
    });

    const response = await app.request(`/api/v1/lti-1p3/authorize?${query.toString()}`, {
      method: 'GET',
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      method: 'form_post',
      url: 'https://tools.example.edu/lti/launch',
      fields: {
        id_token: 'header.payload.signature',
        state: 'state-123',
      },
    });
  });

  it('processes LTI 1.3 deep linking returns through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        processLti1p3DeepLinkingReturn: async (jwt) => {
          expect(jwt).toBe('tool.return.jwt');
          return Lti1p3DeepLinkingReturnResult.parse({
            createdExternalTools: [
              {
                id: courseExternalToolId,
                tenantId,
                courseId,
                integrationConnectionId,
                name: 'Chapter 12 quiz',
                description: 'External quiz activity.',
                launchUrl: 'https://tools.example.edu/lti/launch/chapter-12',
                placement: 'module_item',
                status: 'active',
                createdAt: now,
                updatedAt: now,
              },
            ],
            ignoredContentItemCount: 0,
          });
        },
      },
    });

    const response = await app.request('/api/v1/lti-1p3/deep-linking/return', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ JWT: 'tool.return.jwt' }).toString(),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      createdExternalTools: [
        {
          id: courseExternalToolId,
          name: 'Chapter 12 quiz',
          placement: 'module_item',
        },
      ],
      ignoredContentItemCount: 0,
    });
  });

  it('creates course external tools through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseExternalTool: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            integrationConnectionId,
            name: 'Mathway',
            description: 'Step-by-step math problem solver.',
            launchUrl: 'https://launch.example.test/mathway',
            placement: 'course_navigation',
            status: 'active',
          });
          return CourseExternalTool.parse({
            id: courseExternalToolId,
            tenantId,
            courseId,
            integrationConnectionId: input.integrationConnectionId,
            name: input.name,
            description: input.description,
            launchUrl: input.launchUrl,
            placement: input.placement,
            status: input.status,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/external-tools`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          integrationConnectionId,
          name: 'Mathway',
          description: 'Step-by-step math problem solver.',
          launchUrl: 'https://launch.example.test/mathway',
          placement: 'course_navigation',
          status: 'active',
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: courseExternalToolId,
      tenantId,
      courseId,
      integrationConnectionId,
      name: 'Mathway',
      description: 'Step-by-step math problem solver.',
      launchUrl: 'https://launch.example.test/mathway',
      placement: 'course_navigation',
      status: 'active',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists notifications for the authenticated recipient through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listNotifications: async (requestedActorId, requestedTenantId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          return [
            NotificationRecord.parse({
              id: '01J9QW7B6N5W2YH3D3A1V0KE31',
              tenantId,
              recipientId: actorId,
              category: 'feedback_published',
              title: 'Feedback published',
              body: 'Your instructor published feedback for Evidence essay.',
              resourceType: 'published_feedback',
              resourceId: '01J9QW7B6N5W2YH3D3A1V0KE32',
              deliveryState: 'sent',
              readAt: null,
              createdAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/notifications`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE31',
        tenantId,
        recipientId: actorId,
        category: 'feedback_published',
        title: 'Feedback published',
        body: 'Your instructor published feedback for Evidence essay.',
        resourceType: 'published_feedback',
        resourceId: '01J9QW7B6N5W2YH3D3A1V0KE32',
        deliveryState: 'sent',
        readAt: null,
        createdAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('lists notification preferences for the authenticated user through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listNotificationPreferences: async (requestedActorId, requestedTenantId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          return [
            NotificationPreference.parse({
              id: '01J9QW7B6N5W2YH3D3A1V0KE84',
              tenantId,
              userId: actorId,
              category: 'grade_published',
              channel: 'email',
              frequency: 'daily_digest',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/notifications/preferences`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE84',
        tenantId,
        userId: actorId,
        category: 'grade_published',
        channel: 'email',
        frequency: 'daily_digest',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('marks a notification read for the authenticated recipient', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        markNotificationRead: async (
          requestedActorId,
          requestedTenantId,
          requestedNotificationId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedNotificationId).toBe('01J9QW7B6N5W2YH3D3A1V0KE31');
          return NotificationRecord.parse({
            id: requestedNotificationId,
            tenantId,
            recipientId: actorId,
            category: 'feedback_published',
            title: 'Feedback published',
            body: 'Your instructor published feedback for Evidence essay.',
            resourceType: 'published_feedback',
            resourceId: '01J9QW7B6N5W2YH3D3A1V0KE32',
            deliveryState: 'sent',
            readAt: new Date('2026-05-10T00:05:00.000Z'),
            createdAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/notifications/01J9QW7B6N5W2YH3D3A1V0KE31/read`,
      { method: 'post', headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: '01J9QW7B6N5W2YH3D3A1V0KE31',
      readAt: '2026-05-10T00:05:00.000Z',
    });
  });

  it('returns not found when a notification cannot be marked read', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        markNotificationRead: async () => {
          throw new ApiError(
            'not_found',
            'Notification was not found. Check the notification id and retry the request.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/notifications/01J9QW7B6N5W2YH3D3A1V0KE31/read`,
      { method: 'post', headers: authorization },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: 'not_found',
        message: 'Notification was not found. Check the notification id and retry the request.',
      },
    });
  });

  it('lists file metadata owned by the authenticated user through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listFiles: async (requestedActorId, requestedTenantId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          return [
            FileResource.parse({
              id: fileId,
              tenantId,
              ownerId: actorId,
              storageProvider: 's3_compatible',
              storageKey: 'tenant/owner/evidence.pdf',
              filename: 'evidence.pdf',
              mediaType: 'application/pdf',
              byteSize: 42000,
              checksumSha256: 'a'.repeat(64),
              visibility: 'private',
              createdAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/files`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: fileId,
        tenantId,
        ownerId: actorId,
        courseId: null,
        filename: 'evidence.pdf',
        mediaType: 'application/pdf',
        byteSize: 42000,
        checksumSha256: 'a'.repeat(64),
        visibility: 'private',
        altText: null,
        transcriptText: null,
        license: null,
        copyrightHolder: null,
        createdAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('reads file metadata owned by the authenticated user through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        getFile: async (requestedActorId, requestedTenantId, requestedFileId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedFileId).toBe(fileId);
          return FileResource.parse({
            id: fileId,
            tenantId,
            ownerId: actorId,
            storageProvider: 's3_compatible',
            storageKey: 'tenant/owner/evidence.pdf',
            filename: 'evidence.pdf',
            mediaType: 'application/pdf',
            byteSize: 42000,
            checksumSha256: 'a'.repeat(64),
            visibility: 'private',
            createdAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/files/${fileId}`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      id: fileId,
      ownerId: actorId,
      filename: 'evidence.pdf',
    });
    expect(responseBody).not.toHaveProperty('storageProvider');
    expect(responseBody).not.toHaveProperty('storageKey');
  });

  it('returns not found when owned file metadata is missing', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        getFile: async () => {
          throw new ApiError(
            'not_found',
            'File metadata was not found. Check the file id and retry the request.',
          );
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/files/${fileId}`, {
      headers: authorization,
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: 'not_found',
        message: 'File metadata was not found. Check the file id and retry the request.',
      },
    });
  });

  it('lists course modules through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseModules: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            CourseModule.parse({
              id: moduleId,
              tenantId,
              courseId,
              title: 'Argument writing',
              summary: 'Evidence, claims, and reasoning.',
              visibility: 'published',
              accessPolicy: 'course_member',
              version: 1,
              position: 0,
              learningObjectiveIds: [],
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/modules`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: moduleId,
        tenantId,
        courseId,
        title: 'Argument writing',
        summary: 'Evidence, claims, and reasoning.',
        visibility: 'published',
        accessPolicy: 'course_member',
        version: 1,
        position: 0,
        learningObjectiveIds: [],
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates course modules through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseModule: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            title: 'Foundations of evidence-based writing',
            summary: 'Introduces the core argument structure used throughout the course.',
            visibility: 'published',
            accessPolicy: 'course_member',
            position: 0,
            learningObjectiveIds: [learningObjectiveId],
          });
          return CourseModule.parse({
            id: moduleId,
            tenantId,
            courseId,
            title: input.title,
            summary: input.summary,
            visibility: input.visibility,
            accessPolicy: input.accessPolicy,
            version: 1,
            position: input.position,
            learningObjectiveIds: input.learningObjectiveIds,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/modules`, {
      method: 'POST',
      headers: {
        ...authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Foundations of evidence-based writing',
        summary: 'Introduces the core argument structure used throughout the course.',
        visibility: 'published',
        accessPolicy: 'course_member',
        position: 0,
        learningObjectiveIds: [learningObjectiveId],
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: moduleId,
      tenantId,
      courseId,
      title: 'Foundations of evidence-based writing',
      summary: 'Introduces the core argument structure used throughout the course.',
      visibility: 'published',
      accessPolicy: 'course_member',
      version: 1,
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course units through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseUnits: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedModuleId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedModuleId).toBe(moduleId);
          return [
            CourseUnit.parse({
              id: unitId,
              tenantId,
              courseId,
              moduleId,
              title: 'Explaining evidence',
              summary: null,
              visibility: 'published',
              accessPolicy: 'course_member',
              version: 1,
              position: 0,
              learningObjectiveIds: [],
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/units?moduleId=${moduleId}`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([
      {
        id: unitId,
        moduleId,
        title: 'Explaining evidence',
      },
    ]);
  });

  it('creates course units through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseUnit: async (requestedActorId, requestedTenantId, requestedCourseId, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            moduleId,
            title: 'Defining a claim',
            summary: 'How to phrase a defensible thesis statement.',
            visibility: 'published',
            accessPolicy: 'course_member',
            position: 0,
            learningObjectiveIds: [learningObjectiveId],
          });
          return CourseUnit.parse({
            id: unitId,
            tenantId,
            courseId,
            moduleId: input.moduleId,
            title: input.title,
            summary: input.summary,
            visibility: input.visibility,
            accessPolicy: input.accessPolicy,
            version: 1,
            position: input.position,
            learningObjectiveIds: input.learningObjectiveIds,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/units`, {
      method: 'POST',
      headers: {
        ...authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        moduleId,
        title: 'Defining a claim',
        summary: 'How to phrase a defensible thesis statement.',
        visibility: 'published',
        accessPolicy: 'course_member',
        position: 0,
        learningObjectiveIds: [learningObjectiveId],
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: unitId,
      tenantId,
      courseId,
      moduleId,
      title: 'Defining a claim',
      summary: 'How to phrase a defensible thesis statement.',
      visibility: 'published',
      accessPolicy: 'course_member',
      version: 1,
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course resources through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseResources: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedModuleId,
          requestedUnitId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedModuleId).toBe(moduleId);
          expect(requestedUnitId).toBe(unitId);
          return [
            CourseResource.parse({
              id: resourceId,
              tenantId,
              courseId,
              moduleId,
              unitId,
              resourceType: 'reading_material',
              title: 'Evidence guide',
              body: 'A quote needs reasoning that connects it to the claim.',
              sourceUri: null,
              visibility: 'published',
              accessPolicy: 'course_member',
              version: 1,
              position: 0,
              learningObjectiveIds: [],
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/resources?moduleId=${moduleId}&unitId=${unitId}`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([
      {
        id: resourceId,
        moduleId,
        unitId,
        title: 'Evidence guide',
        position: 0,
      },
    ]);
  });

  it('creates course resources through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseResource: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            moduleId,
            unitId,
            resourceType: 'reading_material',
            title: 'Argument structure primer',
            body: 'Claim → reasoning → evidence.',
            sourceUri: null,
            visibility: 'published',
            accessPolicy: 'course_member',
            position: 0,
            learningObjectiveIds: [learningObjectiveId],
          });
          return CourseResource.parse({
            id: resourceId,
            tenantId,
            courseId,
            moduleId: input.moduleId,
            unitId: input.unitId,
            resourceType: input.resourceType,
            title: input.title,
            body: input.body,
            sourceUri: input.sourceUri,
            visibility: input.visibility,
            accessPolicy: input.accessPolicy,
            version: 1,
            position: input.position,
            learningObjectiveIds: input.learningObjectiveIds,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/resources`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          moduleId,
          unitId,
          resourceType: 'reading_material',
          title: 'Argument structure primer',
          body: 'Claim → reasoning → evidence.',
          sourceUri: null,
          visibility: 'published',
          accessPolicy: 'course_member',
          position: 0,
          learningObjectiveIds: [learningObjectiveId],
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: resourceId,
      tenantId,
      courseId,
      moduleId,
      unitId,
      resourceType: 'reading_material',
      title: 'Argument structure primer',
      body: 'Claim → reasoning → evidence.',
      sourceUri: null,
      visibility: 'published',
      accessPolicy: 'course_member',
      version: 1,
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course learning objectives through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listLearningObjectives: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            LearningObjective.parse({
              id: learningObjectiveId,
              tenantId,
              courseId,
              code: 'LO-1',
              title: 'Explain evidence',
              description: 'Connect quoted evidence to the claim it supports.',
              status: 'active',
              position: 0,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/learning-objectives`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: learningObjectiveId,
        tenantId,
        courseId,
        code: 'LO-1',
        title: 'Explain evidence',
        description: 'Connect quoted evidence to the claim it supports.',
        status: 'active',
        position: 0,
        masteryThresholdPercent: null,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates learning objectives through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createLearningObjective: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            code: 'LO-1',
            title: 'Construct evidence-based arguments',
            description: 'Students can defend claims with cited evidence.',
            status: 'active',
            position: 0,
          });
          return LearningObjective.parse({
            id: learningObjectiveId,
            tenantId,
            courseId,
            code: input.code,
            title: input.title,
            description: input.description,
            status: input.status,
            position: input.position,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/learning-objectives`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          code: 'LO-1',
          title: 'Construct evidence-based arguments',
          description: 'Students can defend claims with cited evidence.',
          status: 'active',
          position: 0,
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: learningObjectiveId,
      tenantId,
      courseId,
      code: 'LO-1',
      title: 'Construct evidence-based arguments',
      description: 'Students can defend claims with cited evidence.',
      status: 'active',
      position: 0,
      masteryThresholdPercent: null,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course learning objective mastery through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listLearningObjectiveMastery: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            LearningObjectiveMastery.parse({
              id: learningObjectiveMasteryId,
              tenantId,
              courseId,
              learningObjectiveId,
              studentId: actorId,
              status: 'proficient',
              score: 8,
              maxScore: 10,
              lastAssessedAt: now,
              evidenceCount: 2,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/learning-objective-mastery`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: learningObjectiveMasteryId,
        tenantId,
        courseId,
        learningObjectiveId,
        studentId: actorId,
        status: 'proficient',
        score: 8,
        maxScore: 10,
        lastAssessedAt: '2026-05-10T00:00:00.000Z',
        evidenceCount: 2,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('lists course pages through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCoursePages: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            CoursePage.parse({
              id: pageId,
              tenantId,
              courseId,
              title: 'Evidence page',
              body: 'Evidence needs reasoning that connects it to a claim.',
              visibility: 'published',
              version: 1,
              learningObjectiveIds: [learningObjectiveId],
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/pages`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: pageId,
        tenantId,
        courseId,
        title: 'Evidence page',
        body: 'Evidence needs reasoning that connects it to a claim.',
        visibility: 'published',
        version: 1,
        learningObjectiveIds: [learningObjectiveId],
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates course pages through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCoursePage: async (requestedActorId, requestedTenantId, requestedCourseId, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            title: 'Evidence page',
            body: 'Evidence needs reasoning that connects it to a claim.',
            visibility: 'published',
            learningObjectiveIds: [learningObjectiveId],
          });
          return CoursePage.parse({
            id: pageId,
            tenantId,
            courseId,
            title: input.title,
            body: input.body,
            visibility: input.visibility,
            version: 1,
            learningObjectiveIds: input.learningObjectiveIds,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/pages`, {
      method: 'POST',
      headers: {
        ...authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Evidence page',
        body: 'Evidence needs reasoning that connects it to a claim.',
        visibility: 'published',
        learningObjectiveIds: [learningObjectiveId],
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: pageId,
      tenantId,
      courseId,
      title: 'Evidence page',
      body: 'Evidence needs reasoning that connects it to a claim.',
      visibility: 'published',
      version: 1,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('reads the canonical course syllabus through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        getCourseSyllabus: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return CourseSyllabus.parse({
            id: syllabusId,
            tenantId,
            courseId,
            body: 'Course policies, grading expectations, and weekly rhythm.',
            visibility: 'published',
            version: 1,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/syllabus`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: syllabusId,
      tenantId,
      courseId,
      body: 'Course policies, grading expectations, and weekly rhythm.',
      visibility: 'published',
      version: 1,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('upserts the course syllabus through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        upsertCourseSyllabus: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            body: 'Revised syllabus body.',
            visibility: 'published',
          });
          return CourseSyllabus.parse({
            id: syllabusId,
            tenantId,
            courseId,
            body: input.body,
            visibility: input.visibility,
            version: 2,
            createdAt: now,
            updatedAt: new Date('2026-05-12T00:00:00.000Z'),
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/syllabus`, {
      method: 'PUT',
      headers: {
        ...authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        body: 'Revised syllabus body.',
        visibility: 'published',
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: syllabusId,
      tenantId,
      courseId,
      body: 'Revised syllabus body.',
      visibility: 'published',
      version: 2,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-12T00:00:00.000Z',
    });
  });

  it('reads a course page through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        getCoursePage: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedPageId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedPageId).toBe(pageId);
          return CoursePage.parse({
            id: pageId,
            tenantId,
            courseId,
            title: 'Evidence page',
            body: 'Evidence needs reasoning that connects it to a claim.',
            visibility: 'published',
            version: 1,
            learningObjectiveIds: [learningObjectiveId],
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/pages/${pageId}`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: pageId,
      title: 'Evidence page',
      visibility: 'published',
    });
  });

  it('lists discussion topics through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listDiscussionTopics: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedModuleId,
          requestedUnitId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedModuleId).toBe(moduleId);
          expect(requestedUnitId).toBe(unitId);
          return [
            DiscussionTopic.parse({
              id: discussionTopicId,
              tenantId,
              courseId,
              moduleId,
              unitId,
              title: 'Essay workshop',
              prompt: 'Share one paragraph and ask for one specific kind of feedback.',
              visibility: 'published',
              position: 0,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/discussion-topics?moduleId=${moduleId}&unitId=${unitId}`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: discussionTopicId,
        tenantId,
        courseId,
        moduleId,
        unitId,
        title: 'Essay workshop',
        prompt: 'Share one paragraph and ask for one specific kind of feedback.',
        visibility: 'published',
        position: 0,
        gradingEnabled: false,
        pointsPossible: null,
        rubricId: null,
        requirePostBeforeSeeingOthers: false,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates discussion topics through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createDiscussionTopic: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            moduleId,
            unitId,
            title: 'Week 2 evidence workshop',
            prompt: 'Share the sentence where your evidence needs the most help.',
            visibility: 'draft',
            position: 2,
          });
          return DiscussionTopic.parse({
            id: discussionTopicId,
            tenantId,
            courseId,
            moduleId: input.moduleId,
            unitId: input.unitId,
            title: input.title,
            prompt: input.prompt,
            visibility: input.visibility,
            position: input.position,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/discussion-topics`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          moduleId,
          unitId,
          title: 'Week 2 evidence workshop',
          prompt: 'Share the sentence where your evidence needs the most help.',
          visibility: 'draft',
          position: 2,
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: discussionTopicId,
      tenantId,
      courseId,
      moduleId,
      unitId,
      title: 'Week 2 evidence workshop',
      prompt: 'Share the sentence where your evidence needs the most help.',
      visibility: 'draft',
      position: 2,
      gradingEnabled: false,
      pointsPossible: null,
      rubricId: null,
      requirePostBeforeSeeingOthers: false,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('rejects discussion topics with a unit but no module before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createDiscussionTopic: async () => {
          dependencyCalled = true;
          return dependencies.createDiscussionTopic(actorId, tenantId, courseId, {
            moduleId: null,
            unitId,
            title: 'Week 2 evidence workshop',
            prompt: null,
            visibility: 'draft',
            position: 2,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/discussion-topics`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          unitId,
          title: 'Week 2 evidence workshop',
          visibility: 'draft',
          position: 2,
        }),
      },
    );

    expect(response.status).toBe(400);
    expect(dependencyCalled).toBe(false);
  });

  it('lists discussion posts through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listDiscussionPosts: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedTopicId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedTopicId).toBe(discussionTopicId);
          return [
            DiscussionPost.parse({
              id: discussionPostId,
              tenantId,
              topicId: discussionTopicId,
              authorId: actorId,
              parentPostId: null,
              body: 'I am unsure whether my evidence connects clearly enough.',
              status: 'published',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/discussion-topics/${discussionTopicId}/posts`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: discussionPostId,
        tenantId,
        topicId: discussionTopicId,
        authorId: actorId,
        parentPostId: null,
        body: 'I am unsure whether my evidence connects clearly enough.',
        status: 'published',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates discussion posts through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createDiscussionPost: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedTopicId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedTopicId).toBe(discussionTopicId);
          expect(input).toEqual({
            body: 'I can clarify the evidence in the second sentence.',
            parentPostId: null,
          });
          return DiscussionPost.parse({
            id: discussionPostId,
            tenantId,
            topicId: discussionTopicId,
            authorId: actorId,
            parentPostId: null,
            body: 'I can clarify the evidence in the second sentence.',
            status: 'published',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/discussion-topics/${discussionTopicId}/posts`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          body: 'I can clarify the evidence in the second sentence.',
          parentPostId: null,
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: discussionPostId,
      tenantId,
      topicId: discussionTopicId,
      authorId: actorId,
      parentPostId: null,
      body: 'I can clarify the evidence in the second sentence.',
      status: 'published',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists glossary entries through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listGlossaryEntries: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            GlossaryEntry.parse({
              id: glossaryEntryId,
              tenantId,
              courseId,
              term: 'thesis',
              definition: 'A central claim supported by evidence and reasoning.',
              status: 'published',
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/glossary`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: glossaryEntryId,
        tenantId,
        courseId,
        term: 'thesis',
        definition: 'A central claim supported by evidence and reasoning.',
        status: 'published',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates glossary entries through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createGlossaryEntry: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            term: 'thesis',
            definition: 'A central claim supported by evidence and reasoning.',
            status: 'published',
          });
          return GlossaryEntry.parse({
            id: glossaryEntryId,
            tenantId,
            courseId,
            term: input.term,
            definition: input.definition,
            status: input.status,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/glossary`, {
      method: 'POST',
      headers: {
        ...authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        term: 'thesis',
        definition: 'A central claim supported by evidence and reasoning.',
        status: 'published',
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: glossaryEntryId,
      tenantId,
      courseId,
      term: 'thesis',
      definition: 'A central claim supported by evidence and reasoning.',
      status: 'published',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('updates glossary entries through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        updateGlossaryEntry: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedEntryId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedEntryId).toBe(glossaryEntryId);
          expect(input).toEqual({
            term: 'thesis',
            definition: 'Updated definition.',
            status: 'archived',
          });
          return GlossaryEntry.parse({
            id: glossaryEntryId,
            tenantId,
            courseId,
            term: input.term,
            definition: input.definition,
            status: input.status,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/glossary/${glossaryEntryId}`,
      {
        method: 'PUT',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          term: 'thesis',
          definition: 'Updated definition.',
          status: 'archived',
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: glossaryEntryId,
      tenantId,
      courseId,
      term: 'thesis',
      definition: 'Updated definition.',
      status: 'archived',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('deletes glossary entries through the API prefix', async () => {
    let deletedId: string | null = null;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        deleteGlossaryEntry: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedEntryId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          deletedId = requestedEntryId;
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/glossary/${glossaryEntryId}`,
      {
        method: 'DELETE',
        headers: authorization,
      },
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(deletedId).toBe(glossaryEntryId);
  });

  it('lists wiki pages through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listWikiPages: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            WikiPage.parse({
              id: wikiPageId,
              tenantId,
              courseId,
              slug: 'arguing-from-evidence',
              title: 'Arguing from evidence',
              content: 'A starting outline for class collaboration.',
              status: 'published',
              learningObjectiveIds: [],
              createdById: actorId,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/wiki-pages`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: wikiPageId,
        tenantId,
        courseId,
        slug: 'arguing-from-evidence',
        title: 'Arguing from evidence',
        content: 'A starting outline for class collaboration.',
        status: 'published',
        learningObjectiveIds: [],
        createdById: actorId,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates wiki pages through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createWikiPage: async (requestedActorId, requestedTenantId, requestedCourseId, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            slug: 'arguing-from-evidence',
            title: 'Arguing from evidence',
            content: 'A starting outline for class collaboration.',
            status: 'published',
            learningObjectiveIds: [],
          });
          return WikiPage.parse({
            id: wikiPageId,
            tenantId,
            courseId,
            slug: input.slug,
            title: input.title,
            content: input.content,
            status: input.status,
            learningObjectiveIds: input.learningObjectiveIds,
            createdById: actorId,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/wiki-pages`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          slug: 'arguing-from-evidence',
          title: 'Arguing from evidence',
          content: 'A starting outline for class collaboration.',
          status: 'published',
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: wikiPageId,
      tenantId,
      courseId,
      slug: 'arguing-from-evidence',
      title: 'Arguing from evidence',
      content: 'A starting outline for class collaboration.',
      status: 'published',
      learningObjectiveIds: [],
      createdById: actorId,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('updates a wiki page through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        updateWikiPage: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedPageId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedPageId).toBe(wikiPageId);
          expect(input).toEqual({
            title: 'Arguing from evidence v2',
            content: 'Refreshed outline after class discussion.',
            status: 'published',
            learningObjectiveIds: [],
            summary: 'Tightened thesis section.',
          });
          return WikiPage.parse({
            id: wikiPageId,
            tenantId,
            courseId,
            slug: 'arguing-from-evidence',
            title: input.title,
            content: input.content,
            status: input.status,
            learningObjectiveIds: input.learningObjectiveIds,
            createdById: actorId,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/wiki-pages/${wikiPageId}`,
      {
        method: 'PUT',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Arguing from evidence v2',
          content: 'Refreshed outline after class discussion.',
          status: 'published',
          summary: 'Tightened thesis section.',
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: wikiPageId,
      tenantId,
      courseId,
      slug: 'arguing-from-evidence',
      title: 'Arguing from evidence v2',
      content: 'Refreshed outline after class discussion.',
      status: 'published',
      learningObjectiveIds: [],
      createdById: actorId,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists wiki page revisions through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listWikiPageRevisions: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedPageId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedPageId).toBe(wikiPageId);
          return [
            WikiPageRevision.parse({
              id: wikiPageRevisionId,
              tenantId,
              wikiPageId,
              revision: 2,
              authorId: actorId,
              title: 'Arguing from evidence v2',
              content: 'Refreshed outline.',
              learningObjectiveIds: [],
              summary: 'Tightened thesis section.',
              createdAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/wiki-pages/${wikiPageId}/revisions`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: wikiPageRevisionId,
        tenantId,
        wikiPageId,
        revision: 2,
        authorId: actorId,
        title: 'Arguing from evidence v2',
        content: 'Refreshed outline.',
        learningObjectiveIds: [],
        summary: 'Tightened thesis section.',
        createdAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('gets a wiki page revision diff through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        getWikiPageRevisionDiff: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedPageId,
          baseRevision,
          targetRevision,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedPageId).toBe(wikiPageId);
          expect(baseRevision).toBe(1);
          expect(targetRevision).toBe(2);
          return WikiPageRevisionDiff.parse({
            wikiPageId,
            baseRevision,
            targetRevision,
            title: {
              changed: true,
              base: 'Arguing from evidence',
              target: 'Arguing from evidence v2',
            },
            learningObjectiveIds: {
              added: [],
              removed: [],
            },
            content: [
              {
                kind: 'removed',
                oldLineNumber: 1,
                newLineNumber: null,
                text: 'Original outline.',
              },
              {
                kind: 'added',
                oldLineNumber: null,
                newLineNumber: 1,
                text: 'Refreshed outline.',
              },
            ],
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/wiki-pages/${wikiPageId}/revisions/1/diff/2`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      wikiPageId,
      baseRevision: 1,
      targetRevision: 2,
      title: {
        changed: true,
        base: 'Arguing from evidence',
        target: 'Arguing from evidence v2',
      },
      learningObjectiveIds: {
        added: [],
        removed: [],
      },
      content: [
        {
          kind: 'removed',
          oldLineNumber: 1,
          newLineNumber: null,
          text: 'Original outline.',
        },
        {
          kind: 'added',
          oldLineNumber: null,
          newLineNumber: 1,
          text: 'Refreshed outline.',
        },
      ],
    });
  });

  it('restores wiki page revisions through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        restoreWikiPageRevision: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedPageId,
          revision,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedPageId).toBe(wikiPageId);
          expect(revision).toBe(1);
          expect(input).toEqual({ summary: 'Restored revision 1.' });
          return WikiPage.parse({
            id: wikiPageId,
            tenantId,
            courseId,
            slug: 'arguing-from-evidence',
            title: 'Arguing from evidence',
            content: 'Original outline.',
            status: 'published',
            learningObjectiveIds: [],
            createdById: actorId,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/wiki-pages/${wikiPageId}/revisions/1/restore`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ summary: 'Restored revision 1.' }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: wikiPageId,
      tenantId,
      courseId,
      slug: 'arguing-from-evidence',
      title: 'Arguing from evidence',
      content: 'Original outline.',
      status: 'published',
      learningObjectiveIds: [],
      createdById: actorId,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists course surveys through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listSurveys: async (requestedActorId, requestedTenantId, requestedCourseId) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          return [
            Survey.parse({
              id: surveyId,
              tenantId,
              courseId,
              title: 'End-of-term reflection',
              description: 'Anonymous feedback on workshop pacing.',
              status: 'published',
              opensAt: null,
              closesAt: null,
              allowsAnonymousResponses: true,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/surveys`, {
      headers: authorization,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: surveyId,
        tenantId,
        courseId,
        title: 'End-of-term reflection',
        description: 'Anonymous feedback on workshop pacing.',
        status: 'published',
        opensAt: null,
        closesAt: null,
        allowsAnonymousResponses: true,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates course surveys through the API prefix', async () => {
    const opensAt = new Date('2026-09-01T00:00:00.000Z');
    const closesAt = new Date('2026-09-15T23:59:00.000Z');
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createSurvey: async (requestedActorId, requestedTenantId, requestedCourseId, input) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(input).toEqual({
            title: 'End-of-term reflection',
            description: 'Anonymous feedback on workshop pacing.',
            status: 'published',
            opensAt,
            closesAt,
            allowsAnonymousResponses: true,
          });
          return Survey.parse({
            id: surveyId,
            tenantId,
            courseId,
            title: input.title,
            description: input.description,
            status: input.status,
            opensAt: input.opensAt,
            closesAt: input.closesAt,
            allowsAnonymousResponses: input.allowsAnonymousResponses,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/surveys`, {
      method: 'POST',
      headers: {
        ...authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'End-of-term reflection',
        description: 'Anonymous feedback on workshop pacing.',
        status: 'published',
        opensAt: opensAt.toISOString(),
        closesAt: closesAt.toISOString(),
        allowsAnonymousResponses: true,
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: surveyId,
      tenantId,
      courseId,
      title: 'End-of-term reflection',
      description: 'Anonymous feedback on workshop pacing.',
      status: 'published',
      opensAt: '2026-09-01T00:00:00.000Z',
      closesAt: '2026-09-15T23:59:00.000Z',
      allowsAnonymousResponses: true,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists survey questions through the API prefix', async () => {
    const choices = [
      { id: 'a', text: 'Too slow' },
      { id: 'b', text: 'Just right' },
      { id: 'c', text: 'Too fast' },
    ];
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listSurveyQuestions: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedSurveyId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedSurveyId).toBe(surveyId);
          return [
            SurveyQuestion.parse({
              id: surveyQuestionId,
              tenantId,
              surveyId,
              position: 0,
              questionType: 'single_choice',
              prompt: 'How did the pacing feel?',
              required: true,
              choices,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/surveys/${surveyId}/questions`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: surveyQuestionId,
        tenantId,
        surveyId,
        position: 0,
        questionType: 'single_choice',
        prompt: 'How did the pacing feel?',
        required: true,
        choices,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('creates survey questions through the API prefix', async () => {
    const choices = [
      { id: 'a', text: 'Too slow' },
      { id: 'b', text: 'Just right' },
      { id: 'c', text: 'Too fast' },
    ];
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createSurveyQuestion: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedSurveyId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedSurveyId).toBe(surveyId);
          expect(input).toEqual({
            position: 0,
            questionType: 'single_choice',
            prompt: 'How did the pacing feel?',
            required: true,
            choices,
          });
          return SurveyQuestion.parse({
            id: surveyQuestionId,
            tenantId,
            surveyId,
            position: input.position,
            questionType: input.questionType,
            prompt: input.prompt,
            required: input.required,
            choices: input.choices,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/surveys/${surveyId}/questions`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          position: 0,
          questionType: 'single_choice',
          prompt: 'How did the pacing feel?',
          required: true,
          choices,
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: surveyQuestionId,
      tenantId,
      surveyId,
      position: 0,
      questionType: 'single_choice',
      prompt: 'How did the pacing feel?',
      required: true,
      choices,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('lists survey responses through the API prefix', async () => {
    const submittedAt = new Date('2026-09-12T10:00:00.000Z');
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listSurveyResponses: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedSurveyId,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedSurveyId).toBe(surveyId);
          return [
            SurveyResponse.parse({
              id: surveyResponseId,
              tenantId,
              surveyId,
              surveyQuestionId,
              respondentId: null,
              answer: { kind: 'single_choice', choiceId: 'b' },
              submittedAt,
              createdAt: now,
              updatedAt: now,
            }),
          ];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/surveys/${surveyId}/responses`,
      { headers: authorization },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: surveyResponseId,
        tenantId,
        surveyId,
        surveyQuestionId,
        respondentId: null,
        answer: { kind: 'single_choice', choiceId: 'b' },
        submittedAt: '2026-09-12T10:00:00.000Z',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ]);
  });

  it('submits a survey response through the API prefix', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        submitSurveyResponse: async (
          requestedActorId,
          requestedTenantId,
          requestedCourseId,
          requestedSurveyId,
          input,
        ) => {
          expect(requestedActorId).toBe(actorId);
          expect(requestedTenantId).toBe(tenantId);
          expect(requestedCourseId).toBe(courseId);
          expect(requestedSurveyId).toBe(surveyId);
          expect(input).toEqual({
            surveyQuestionId,
            answer: { kind: 'single_choice', choiceId: 'b' },
          });
          return SurveyResponse.parse({
            id: surveyResponseId,
            tenantId,
            surveyId,
            surveyQuestionId,
            respondentId: null,
            answer: input.answer,
            submittedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/surveys/${surveyId}/responses`,
      {
        method: 'POST',
        headers: {
          ...authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          surveyQuestionId,
          answer: { kind: 'single_choice', choiceId: 'b' },
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: surveyResponseId,
      tenantId,
      surveyId,
      surveyQuestionId,
      respondentId: null,
      answer: { kind: 'single_choice', choiceId: 'b' },
      submittedAt: '2026-05-10T00:00:00.000Z',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    });
  });

  it('returns not found when a course page is missing', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        getCoursePage: async () => {
          throw new ApiError(
            'not_found',
            'Course page was not found. Check the page id and retry the request.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/pages/${pageId}`,
      { headers: authorization },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: 'not_found',
        message: 'Course page was not found. Check the page id and retry the request.',
      },
    });
  });

  it('rejects invalid tenant ids before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourses: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request('/api/v1/tenants/not-a-ulid/courses', {
      headers: authorization,
    });

    expect(response.status).toBe(400);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects tenant listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listTenants: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request('/api/v1/tenants');

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourses: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses`);

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course membership listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseMemberships: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/memberships`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course membership creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseMembership: async () => {
          dependencyCalled = true;
          return CourseMembership.parse({
            id: courseMembershipId,
            tenantId,
            courseId,
            userId: actorId,
            role: 'student',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/memberships`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: actorId, role: 'student' }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects self-enrollment without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        selfEnrollInCourse: async () => {
          dependencyCalled = true;
          return CourseMembership.parse({
            id: courseMembershipId,
            tenantId,
            courseId,
            userId: actorId,
            role: 'student',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/self-enroll`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enrollmentCode: 'JOIN-WRIT-101' }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects catalog settings update without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        updateCourseCatalogSettings: async () => {
          dependencyCalled = true;
          return CourseCatalogSettings.parse({
            tenantId,
            courseId,
            catalogVisibility: 'listed',
            enrollmentCode: 'JOIN-WRIT-101',
            catalogCategory: 'Writing',
            academicTerm: '2026 Fall',
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/catalog-settings`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          catalogVisibility: 'listed',
          enrollmentCode: 'JOIN-WRIT-101',
          catalogCategory: 'Writing',
          academicTerm: '2026 Fall',
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects assignment listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAssignments: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects quiz listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuizzes: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes`);

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects quiz question listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuizQuestions: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/questions`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects quiz attempt listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuizAttempts: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects quiz attempt starting without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        startQuizAttempt: async () => {
          dependencyCalled = true;
          return dependencies.startQuizAttempt(actorId, tenantId, courseId, quizId);
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts`,
      { method: 'post' },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects quiz attempt submitting without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        submitQuizAttempt: async () => {
          dependencyCalled = true;
          return dependencies.submitQuizAttempt(actorId, tenantId, courseId, quizId, quizAttemptId);
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts/${quizAttemptId}/submit`,
      { method: 'post' },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects quiz attempt response listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuizAttemptResponses: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts/${quizAttemptId}/responses`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects quiz attempt response saving without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        saveQuizAttemptResponse: async () => {
          dependencyCalled = true;
          return dependencies.saveQuizAttemptResponse(
            actorId,
            tenantId,
            courseId,
            quizId,
            quizAttemptId,
            quizQuestionId,
            { kind: 'choice', selectedChoiceIds: ['b'] },
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts/${quizAttemptId}/responses/${quizQuestionId}`,
      {
        method: 'put',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answer: { kind: 'choice', selectedChoiceIds: ['b'] } }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects attendance session listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAttendanceSessions: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/attendance-sessions`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects attendance session creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createAttendanceSession: async () => {
          dependencyCalled = true;
          return dependencies.createAttendanceSession(actorId, tenantId, courseId, {
            title: 'Week 2 seminar',
            startsAt: now,
            endsAt: new Date('2026-05-10T01:00:00.000Z'),
            status: 'scheduled',
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/attendance-sessions`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Week 2 seminar',
          startsAt: '2026-05-11T00:00:00.000Z',
          endsAt: '2026-05-11T01:00:00.000Z',
          status: 'scheduled',
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects attendance record listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAttendanceRecords: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/attendance-sessions/${attendanceSessionId}/records`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects attendance recording without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        recordAttendanceRecord: async () => {
          dependencyCalled = true;
          return AttendanceRecord.parse({
            id: attendanceRecordId,
            tenantId,
            sessionId: attendanceSessionId,
            studentId: actorId,
            status: 'late',
            note: 'Arrived after the opening activity.',
            recordedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/attendance-sessions/${attendanceSessionId}/records/${actorId}`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status: 'late',
          note: 'Arrived after the opening activity.',
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects completion requirement listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCompletionRequirements: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/completion-requirements`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects completion progress listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCompletionProgress: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/completion-requirements/${completionRequirementId}/progress`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects credential listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCredentials: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/credentials`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects credential award listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCredentialAwards: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/credentials/${credentialId}/awards`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects conversation listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listConversationThreads: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/conversations`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects conversation message listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listConversationMessages: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/conversations/${conversationThreadId}/messages`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course group set listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseGroupSets: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/group-sets`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course group listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseGroups: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/groups`);

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course group member listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseGroupMembers: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/groups/${courseGroupId}/members`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects submission listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAssignmentSubmissions: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects assignment draft saving without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        saveAssignmentDraft: async () => {
          dependencyCalled = true;
          return Draft.parse({
            id: draftId,
            tenantId,
            assignmentId,
            studentId: actorId,
            blocks: [],
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/drafts/${draftId}`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ blocks: [] }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects assignment draft submitting without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        submitAssignmentDraft: async () => {
          dependencyCalled = true;
          return Submission.parse({
            id: submissionId,
            tenantId,
            assignmentId,
            studentId: actorId,
            groupId: null,
            sourceDraftId: draftId,
            version: 1,
            status: 'submitted',
            contentSnapshot: [],
            submittedAt: now,
            createdAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/drafts/${draftId}/submit`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ blocks: [] }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects peer review listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAssignmentPeerReviews: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/peer-reviews`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects submission comment creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createSubmissionComment: async () => {
          dependencyCalled = true;
          return SubmissionComment.parse({
            id: submissionCommentId,
            tenantId,
            submissionId,
            authorId: actorId,
            body: 'Please expand the evidence explanation.',
            visibility: 'student_visible',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/comments`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          body: 'Please expand the evidence explanation.',
          visibility: 'student_visible',
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects gradebook listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listGradebookEntries: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook`);

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects manual grade saving without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        saveGradebookManualGrade: async () => {
          dependencyCalled = true;
          return GradebookManualGrade.parse({
            id: gradebookManualGradeId,
            tenantId,
            gradebookManualItemId,
            studentId: actorId,
            score: 8,
            maxScore: 10,
            status: 'published',
            source: 'manual',
            gradedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/manual-items/${gradebookManualItemId}/grades/${actorId}`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ score: 8, status: 'published' }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects grade CSV imports without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        importSubmissionGradesCsv: async () => {
          dependencyCalled = true;
          return {
            results: [],
            savedCount: 0,
            failedCount: 0,
          };
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/grades/import-csv`,
      {
        method: 'POST',
        headers: { 'content-type': 'text/csv' },
        body: 'submission_id,score,max_score,status',
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects grading scheme listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseGradingSchemes: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/grading-schemes`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course external tool listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseExternalTools: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/external-tools`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('returns forbidden course external tool listing errors from dependencies', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseExternalTools: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/external-tools`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: 'forbidden',
        message:
          'You are not a member of this course. Switch courses or ask an instructor for access.',
      },
    });
  });

  it('rejects course section listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseSections: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/sections`);

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course section creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseSection: async () => {
          dependencyCalled = true;
          return CourseSection.parse({
            id: courseSectionId,
            tenantId,
            courseId,
            name: 'Section B',
            status: 'active',
            position: 1,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/sections`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Section B',
        status: 'active',
        position: 1,
      }),
    });

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course announcement listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseAnnouncements: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/announcements`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course announcement creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseAnnouncement: async () => {
          dependencyCalled = true;
          return CourseAnnouncement.parse({
            id: announcementId,
            tenantId,
            courseId,
            authorId: actorId,
            title: 'Essay workshop reminder',
            body: 'Bring one paragraph and one question for peer review.',
            status: 'published',
            pinned: true,
            postedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/announcements`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Essay workshop reminder',
          body: 'Bring one paragraph and one question for peer review.',
          status: 'published',
          pinned: true,
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course module listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseModules: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/modules`);

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects learning objective listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listLearningObjectives: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/learning-objectives`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('propagates learning objective mastery authorization failures', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listLearningObjectiveMastery: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/learning-objective-mastery`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: 'forbidden',
        message:
          'You are not a member of this course. Switch courses or ask an instructor for access.',
      },
    });
  });

  it('rejects course page listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCoursePages: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/pages`);

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course page creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCoursePage: async () => {
          dependencyCalled = true;
          return CoursePage.parse({
            id: pageId,
            tenantId,
            courseId,
            title: 'Evidence page',
            body: 'Evidence needs reasoning that connects it to a claim.',
            visibility: 'published',
            version: 1,
            learningObjectiveIds: [learningObjectiveId],
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/pages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Evidence page',
        body: 'Evidence needs reasoning that connects it to a claim.',
        visibility: 'published',
        learningObjectiveIds: [learningObjectiveId],
      }),
    });

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects discussion topic creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createDiscussionTopic: async () => {
          dependencyCalled = true;
          return DiscussionTopic.parse({
            id: discussionTopicId,
            tenantId,
            courseId,
            moduleId: null,
            unitId: null,
            title: 'Course Q&A',
            prompt: null,
            visibility: 'published',
            position: 0,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/discussion-topics`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Course Q&A',
          visibility: 'published',
          position: 0,
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects survey creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createSurvey: async () => {
          dependencyCalled = true;
          return Survey.parse({
            id: surveyId,
            tenantId,
            courseId,
            title: 'End-of-term reflection',
            description: null,
            status: 'draft',
            opensAt: null,
            closesAt: null,
            allowsAnonymousResponses: true,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/surveys`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'End-of-term reflection',
        description: null,
        status: 'draft',
        opensAt: null,
        closesAt: null,
        allowsAnonymousResponses: true,
      }),
    });

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects survey question creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createSurveyQuestion: async () => {
          dependencyCalled = true;
          return SurveyQuestion.parse({
            id: surveyQuestionId,
            tenantId,
            surveyId,
            position: 0,
            questionType: 'single_choice',
            prompt: 'How did the pacing feel?',
            required: true,
            choices: [],
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/surveys/${surveyId}/questions`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          position: 0,
          questionType: 'single_choice',
          prompt: 'How did the pacing feel?',
          required: true,
          choices: [],
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects survey response submission without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        submitSurveyResponse: async () => {
          dependencyCalled = true;
          return SurveyResponse.parse({
            id: surveyResponseId,
            tenantId,
            surveyId,
            surveyQuestionId,
            respondentId: null,
            answer: { kind: 'single_choice', choiceId: 'b' },
            submittedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/surveys/${surveyId}/responses`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          surveyQuestionId,
          answer: { kind: 'single_choice', choiceId: 'b' },
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects glossary entry creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createGlossaryEntry: async () => {
          dependencyCalled = true;
          return GlossaryEntry.parse({
            id: glossaryEntryId,
            tenantId,
            courseId,
            term: 'thesis',
            definition: 'A central claim.',
            status: 'draft',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/glossary`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        term: 'thesis',
        definition: 'A central claim.',
        status: 'draft',
      }),
    });

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects wiki page creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createWikiPage: async () => {
          dependencyCalled = true;
          return WikiPage.parse({
            id: wikiPageId,
            tenantId,
            courseId,
            slug: 'arguing-from-evidence',
            title: 'Arguing from evidence',
            content: 'A starting outline.',
            status: 'draft',
            createdById: actorId,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/wiki-pages`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug: 'arguing-from-evidence',
          title: 'Arguing from evidence',
          content: 'A starting outline.',
          status: 'draft',
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects wiki page update without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        updateWikiPage: async () => {
          dependencyCalled = true;
          return WikiPage.parse({
            id: wikiPageId,
            tenantId,
            courseId,
            slug: 'arguing-from-evidence',
            title: 'Arguing from evidence v2',
            content: 'Updated outline.',
            status: 'published',
            createdById: actorId,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/wiki-pages/${wikiPageId}`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Arguing from evidence v2',
          content: 'Updated outline.',
          status: 'published',
          summary: null,
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course calendar event creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseCalendarEvent: async () => {
          dependencyCalled = true;
          return CourseCalendarEvent.parse({
            id: courseCalendarEventId,
            tenantId,
            courseId,
            title: 'Weekly workshop',
            description: null,
            location: null,
            startsAt: new Date('2026-09-10T15:00:00.000Z'),
            endsAt: null,
            visibility: 'draft',
            recurrenceRule: null,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/calendar-events`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Weekly workshop',
          description: null,
          location: null,
          startsAt: '2026-09-10T15:00:00.000Z',
          endsAt: null,
          visibility: 'draft',
          recurrenceRule: null,
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course meeting creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseMeeting: async () => {
          dependencyCalled = true;
          return CourseMeeting.parse({
            id: courseMeetingId,
            tenantId,
            courseId,
            title: 'Live workshop',
            description: null,
            provider: 'zoom',
            externalUrl: 'https://example.zoom.us/j/123456789',
            startsAt: new Date('2026-09-10T15:00:00.000Z'),
            endsAt: null,
            status: 'scheduled',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/meetings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Live workshop',
        description: null,
        provider: 'zoom',
        externalUrl: 'https://example.zoom.us/j/123456789',
        startsAt: '2026-09-10T15:00:00.000Z',
        endsAt: null,
        status: 'scheduled',
      }),
    });

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course module creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseModule: async () => {
          dependencyCalled = true;
          return CourseModule.parse({
            id: moduleId,
            tenantId,
            courseId,
            title: 'Foundations of evidence-based writing',
            summary: 'Introduces the core argument structure used throughout the course.',
            visibility: 'published',
            accessPolicy: 'course_member',
            version: 1,
            position: 0,
            learningObjectiveIds: [learningObjectiveId],
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/modules`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Foundations of evidence-based writing',
        summary: 'Introduces the core argument structure used throughout the course.',
        visibility: 'published',
        accessPolicy: 'course_member',
        position: 0,
        learningObjectiveIds: [learningObjectiveId],
      }),
    });

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourse: async () => {
          dependencyCalled = true;
          return Course.parse({
            id: courseId,
            tenantId,
            code: 'WRIT-101',
            title: 'Evidence-Based Writing',
            status: 'draft',
            startsAt: null,
            endsAt: null,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        code: 'WRIT-101',
        title: 'Evidence-Based Writing',
        status: 'draft',
        startsAt: null,
        endsAt: null,
      }),
    });

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects rubric creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createRubric: async () => {
          dependencyCalled = true;
          return Rubric.parse({
            id: rubricId,
            tenantId,
            title: 'Argument writing rubric',
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
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/rubrics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Argument writing rubric',
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
      }),
    });

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects assignment creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createAssignment: async () => {
          dependencyCalled = true;
          return Assignment.parse({
            id: assignmentId,
            tenantId,
            courseId,
            moduleId: null,
            unitId: null,
            position: null,
            title: 'Essay',
            instructions: 'Write an essay.',
            status: 'draft',
            dueAt: null,
            allowResubmission: false,
            activeRubricId: null,
            aiSettings: {
              precheckEnabled: false,
              feedbackDraftEnabled: false,
              scoreSuggestionEnabled: false,
            },
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          moduleId: null,
          unitId: null,
          position: null,
          title: 'Essay',
          instructions: 'Write an essay.',
          status: 'draft',
          dueAt: null,
          allowResubmission: false,
          activeRubricId: null,
          aiSettings: {
            precheckEnabled: false,
            feedbackDraftEnabled: false,
            scoreSuggestionEnabled: false,
          },
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects syllabus upsert without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        upsertCourseSyllabus: async () => {
          dependencyCalled = true;
          return CourseSyllabus.parse({
            id: syllabusId,
            tenantId,
            courseId,
            body: 'Body.',
            visibility: 'published',
            version: 1,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/syllabus`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        body: 'Body.',
        visibility: 'published',
      }),
    });

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects gradebook category creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createGradebookCategory: async () => {
          dependencyCalled = true;
          return GradebookCategory.parse({
            id: gradebookCategoryId,
            tenantId,
            courseId,
            name: 'Homework',
            position: 0,
            weightPercent: 40,
            dropLowest: 1,
            status: 'active',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/categories`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Homework',
          position: 0,
          weightPercent: 40,
          dropLowest: 1,
          status: 'active',
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course external tool creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseExternalTool: async () => {
          dependencyCalled = true;
          return CourseExternalTool.parse({
            id: courseExternalToolId,
            tenantId,
            courseId,
            integrationConnectionId,
            name: 'Mathway',
            description: null,
            launchUrl: 'https://launch.example.test/mathway',
            placement: 'course_navigation',
            status: 'active',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/external-tools`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          integrationConnectionId,
          name: 'Mathway',
          description: null,
          launchUrl: 'https://launch.example.test/mathway',
          placement: 'course_navigation',
          status: 'active',
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects completion requirement creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCompletionRequirement: async () => {
          dependencyCalled = true;
          return CompletionRequirement.parse({
            id: completionRequirementId,
            tenantId,
            courseId,
            moduleId: null,
            title: 'Submit Essay 1',
            description: null,
            requirementType: 'submit_assignment',
            targetType: 'assignment',
            targetId: assignmentId,
            minScorePercent: null,
            status: 'active',
            required: true,
            position: 0,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/completion-requirements`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Submit Essay 1',
          description: null,
          moduleId: null,
          requirementType: 'submit_assignment',
          targetType: 'assignment',
          targetId: assignmentId,
          minScorePercent: null,
          status: 'active',
          required: true,
          position: 0,
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects manual gradebook item creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createGradebookManualItem: async () => {
          dependencyCalled = true;
          return GradebookManualItem.parse({
            id: gradebookManualItemId,
            tenantId,
            courseId,
            gradebookCategoryId: null,
            title: 'Participation',
            description: null,
            maxScore: 100,
            dueAt: null,
            position: 0,
            status: 'active',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/manual-items`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          gradebookCategoryId: null,
          title: 'Participation',
          description: null,
          maxScore: 100,
          dueAt: null,
          position: 0,
          status: 'active',
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course credential creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseCredential: async () => {
          dependencyCalled = true;
          return CourseCredential.parse({
            id: credentialId,
            tenantId,
            courseId,
            credentialType: 'badge',
            title: 'Evidence-based writing badge',
            description: null,
            criteriaSummary: 'Earn 85% or higher on at least three essay rubrics.',
            status: 'draft',
            imageUrl: null,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/credentials`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          credentialType: 'badge',
          title: 'Evidence-based writing badge',
          description: null,
          criteriaSummary: 'Earn 85% or higher on at least three essay rubrics.',
          status: 'draft',
          imageUrl: null,
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course group set creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseGroupSet: async () => {
          dependencyCalled = true;
          return CourseGroupSet.parse({
            id: courseGroupSetId,
            tenantId,
            courseId,
            name: 'Project teams',
            selfSignupEnabled: false,
            status: 'active',
            position: 0,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/group-sets`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Project teams',
          selfSignupEnabled: false,
          status: 'active',
          position: 0,
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course group creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseGroup: async () => {
          dependencyCalled = true;
          return CourseGroup.parse({
            id: courseGroupId,
            tenantId,
            courseId,
            groupSetId: courseGroupSetId,
            name: 'Team Alpha',
            description: null,
            status: 'active',
            position: 0,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/groups`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        groupSetId: courseGroupSetId,
        name: 'Team Alpha',
        description: null,
        status: 'active',
        position: 0,
      }),
    });

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course group member creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseGroupMember: async () => {
          dependencyCalled = true;
          return CourseGroupMember.parse({
            id: courseGroupMemberId,
            tenantId,
            groupId: courseGroupId,
            userId: actorId,
            role: 'member',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/groups/${courseGroupId}/members`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: actorId,
          role: 'member',
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects credential award creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCredentialAward: async () => {
          dependencyCalled = true;
          return CredentialAward.parse({
            id: credentialAwardId,
            tenantId,
            credentialId,
            studentId: actorId,
            status: 'issued',
            issuedAt: now,
            revokedAt: null,
            expiresAt: null,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/credentials/${credentialId}/awards`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          studentId: actorId,
          status: 'issued',
          issuedAt: '2026-05-10T00:00:00.000Z',
          revokedAt: null,
          expiresAt: null,
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects question bank creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createQuestionBank: async () => {
          dependencyCalled = true;
          return QuestionBank.parse({
            id: questionBankId,
            tenantId,
            courseId,
            title: 'Argumentation question bank',
            description: null,
            status: 'active',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/question-banks`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Argumentation question bank',
          description: null,
          status: 'active',
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects question bank question creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createQuestionBankQuestion: async () => {
          dependencyCalled = true;
          return QuestionBankQuestion.parse({
            id: questionBankQuestionId,
            tenantId,
            questionBankId,
            position: 0,
            questionType: 'multiple_choice',
            prompt: 'Which element connects evidence to a claim?',
            points: 2,
            choices: [],
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/question-banks/${questionBankId}/questions`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          position: 0,
          questionType: 'multiple_choice',
          prompt: 'Which element connects evidence to a claim?',
          points: 2,
          choices: [],
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects quiz creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createQuiz: async () => {
          dependencyCalled = true;
          return Quiz.parse({
            id: quizId,
            tenantId,
            courseId,
            moduleId: null,
            unitId: null,
            position: null,
            title: 'Quiz',
            description: null,
            status: 'draft',
            opensAt: null,
            closesAt: null,
            timeLimitMinutes: null,
            shuffleQuestions: false,
            maxAttempts: 1,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        moduleId: null,
        unitId: null,
        position: null,
        title: 'Quiz',
        description: null,
        status: 'draft',
        opensAt: null,
        closesAt: null,
        timeLimitMinutes: null,
        shuffleQuestions: false,
        maxAttempts: 1,
      }),
    });

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects quiz question creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createQuizQuestion: async () => {
          dependencyCalled = true;
          return QuizQuestion.parse({
            id: quizQuestionId,
            tenantId,
            quizId,
            position: 0,
            questionType: 'multiple_choice',
            prompt: 'Which element connects evidence to a claim?',
            points: 2,
            choices: [],
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/questions`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          position: 0,
          questionType: 'multiple_choice',
          prompt: 'Which element connects evidence to a claim?',
          points: 2,
          choices: [],
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course grading scheme creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseGradingScheme: async () => {
          dependencyCalled = true;
          return CourseGradingScheme.parse({
            id: courseGradingSchemeId,
            tenantId,
            courseId,
            name: 'Standard 4-tier',
            status: 'active',
            entries: [
              { label: 'A', minPercent: 90 },
              { label: 'F', minPercent: 0 },
            ],
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/grading-schemes`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Standard 4-tier',
          status: 'active',
          entries: [
            { label: 'A', minPercent: 90 },
            { label: 'F', minPercent: 0 },
          ],
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course unit creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseUnit: async () => {
          dependencyCalled = true;
          return CourseUnit.parse({
            id: unitId,
            tenantId,
            courseId,
            moduleId,
            title: 'Defining a claim',
            summary: 'How to phrase a defensible thesis statement.',
            visibility: 'published',
            accessPolicy: 'course_member',
            version: 1,
            position: 0,
            learningObjectiveIds: [learningObjectiveId],
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/units`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        moduleId,
        title: 'Defining a claim',
        summary: 'How to phrase a defensible thesis statement.',
        visibility: 'published',
        accessPolicy: 'course_member',
        position: 0,
        learningObjectiveIds: [learningObjectiveId],
      }),
    });

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course resource creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createCourseResource: async () => {
          dependencyCalled = true;
          return CourseResource.parse({
            id: resourceId,
            tenantId,
            courseId,
            moduleId,
            unitId,
            resourceType: 'reading_material',
            title: 'Argument structure primer',
            body: 'Claim → reasoning → evidence.',
            sourceUri: null,
            visibility: 'published',
            accessPolicy: 'course_member',
            version: 1,
            position: 0,
            learningObjectiveIds: [learningObjectiveId],
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/resources`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          unitId,
          resourceType: 'reading_material',
          title: 'Argument structure primer',
          body: 'Claim → reasoning → evidence.',
          sourceUri: null,
          visibility: 'published',
          accessPolicy: 'course_member',
          position: 0,
          learningObjectiveIds: [learningObjectiveId],
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects learning objective creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createLearningObjective: async () => {
          dependencyCalled = true;
          return LearningObjective.parse({
            id: learningObjectiveId,
            tenantId,
            courseId,
            code: 'LO-1',
            title: 'Construct evidence-based arguments',
            description: 'Students can defend claims with cited evidence.',
            status: 'active',
            position: 0,
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/learning-objectives`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          code: 'LO-1',
          title: 'Construct evidence-based arguments',
          description: 'Students can defend claims with cited evidence.',
          status: 'active',
          position: 0,
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects discussion post creation without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        createDiscussionPost: async () => {
          dependencyCalled = true;
          return DiscussionPost.parse({
            id: discussionPostId,
            tenantId,
            topicId: discussionTopicId,
            authorId: actorId,
            parentPostId: null,
            body: 'I can clarify the evidence in the second sentence.',
            status: 'published',
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/discussion-topics/${discussionTopicId}/posts`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: 'I can clarify the evidence in the second sentence.' }),
      },
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('returns forbidden when gradebook entries are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listGradebookEntries: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: 'forbidden',
        message:
          'You are not a member of this course. Switch courses or ask an instructor for access.',
      },
    });
  });

  it('returns forbidden when grading schemes are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseGradingSchemes: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/grading-schemes`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: 'forbidden',
        message:
          'You are not a member of this course. Switch courses or ask an instructor for access.',
      },
    });
  });

  it('returns forbidden when course memberships are requested without staff access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseMemberships: async () => {
          throw new ApiError(
            'forbidden',
            'Only course staff can view course memberships. Ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/memberships`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: 'forbidden',
        message: 'Only course staff can view course memberships. Ask an instructor for access.',
      },
    });
  });

  it('returns forbidden when assignments are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAssignments: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: 'forbidden',
        message:
          'You are not a member of this course. Switch courses or ask an instructor for access.',
      },
    });
  });

  it('returns forbidden when quizzes are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuizzes: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes`, {
      headers: authorization,
    });

    expect(response.status).toBe(403);
  });

  it('returns forbidden when quiz questions are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuizQuestions: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/questions`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when quiz attempts are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listQuizAttempts: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when attendance sessions are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAttendanceSessions: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/attendance-sessions`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when attendance records are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAttendanceRecords: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/attendance-sessions/${attendanceSessionId}/records`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when completion requirements are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCompletionRequirements: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/completion-requirements`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when completion progress is requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCompletionProgress: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/completion-requirements/${completionRequirementId}/progress`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when credentials are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCredentials: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/credentials`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when credential awards are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCredentialAwards: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/credentials/${credentialId}/awards`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when conversations are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listConversationThreads: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/conversations`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when conversation messages are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listConversationMessages: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/conversations/${conversationThreadId}/messages`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when course group sets are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseGroupSets: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/group-sets`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when course groups are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseGroups: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/groups`, {
      headers: authorization,
    });

    expect(response.status).toBe(403);
  });

  it('returns forbidden when course group members are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseGroupMembers: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/groups/${courseGroupId}/members`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when submissions are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAssignmentSubmissions: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when peer reviews are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listAssignmentPeerReviews: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/peer-reviews`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when course sections are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseSections: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/sections`, {
      headers: authorization,
    });

    expect(response.status).toBe(403);
  });

  it('returns forbidden when course announcements are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseAnnouncements: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/announcements`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when course modules are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCourseModules: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/modules`, {
      headers: authorization,
    });

    expect(response.status).toBe(403);
  });

  it('returns forbidden when learning objectives are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listLearningObjectives: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/learning-objectives`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
  });

  it('returns forbidden when course pages are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCoursePages: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/pages`, {
      headers: authorization,
    });

    expect(response.status).toBe(403);
  });

  it('returns forbidden when course syllabi are requested outside course access', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        getCourseSyllabus: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this course. Switch courses or ask an instructor for access.',
          );
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/syllabus`, {
      headers: authorization,
    });

    expect(response.status).toBe(403);
  });

  it('rejects calendar item listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCalendarItems: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/calendar-items?from=2026-05-11T00:00:00.000Z&to=2026-05-18T00:00:00.000Z`,
    );

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects course syllabus reads without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        getCourseSyllabus: async () => {
          dependencyCalled = true;
          return dependencies.getCourseSyllabus(actorId, tenantId, courseId);
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses/${courseId}/syllabus`);

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects calendar item listing when the requested range is invalid', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCalendarItems: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/calendar-items?from=2026-05-18T00:00:00.000Z&to=2026-05-11T00:00:00.000Z`,
      { headers: authorization },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: 'bad_request',
        message: 'Request validation failed. Check the request path, query, and body.',
      },
    });
    expect(dependencyCalled).toBe(false);
  });

  it('rejects notification listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listNotifications: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/notifications`);

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects notification preference listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listNotificationPreferences: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/notifications/preferences`);

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('rejects file listing without authentication before calling dependencies', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listFiles: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/files`);

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });

  it('returns forbidden when files are requested outside tenant membership', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listFiles: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this tenant. Switch tenants or ask an administrator for access.',
          );
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/files`, {
      headers: authorization,
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: 'forbidden',
        message:
          'You are not a member of this tenant. Switch tenants or ask an administrator for access.',
      },
    });
  });

  it('returns forbidden when notifications are requested outside tenant membership', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listNotifications: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this tenant. Switch tenants or ask an administrator for access.',
          );
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/notifications`, {
      headers: authorization,
    });

    expect(response.status).toBe(403);
  });

  it('returns forbidden when calendar items are requested outside tenant membership', async () => {
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        listCalendarItems: async () => {
          throw new ApiError(
            'forbidden',
            'You are not a member of this tenant. Switch tenants or ask an administrator for access.',
          );
        },
      },
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantId}/calendar-items?from=2026-05-11T00:00:00.000Z&to=2026-05-18T00:00:00.000Z`,
      { headers: authorization },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: 'forbidden',
        message:
          'You are not a member of this tenant. Switch tenants or ask an administrator for access.',
      },
    });
  });

  it('rejects expired sessions before listing tenant courses', async () => {
    let dependencyCalled = false;
    const app = createApiApp({
      dependencies: {
        ...dependencies,
        getSessionByToken: async () =>
          CoreSession.parse({
            userId: actorId,
            activeTenantId: tenantId,
            expiresAt: new Date('2000-05-10T00:00:00.000Z'),
          }),
        listCourses: async () => {
          dependencyCalled = true;
          return [];
        },
      },
    });

    const response = await app.request(`/api/v1/tenants/${tenantId}/courses`, {
      headers: authorization,
    });

    expect(response.status).toBe(401);
    expect(dependencyCalled).toBe(false);
  });
});
