import { Buffer } from 'node:buffer';
import { createHash, randomUUID } from 'node:crypto';
import { aiActions } from '@openlms/ai';
import {
  AssignmentId,
  AttendanceSessionId,
  CommonCartridgeImportResult,
  CourseCalendarEventId,
  CourseId,
  type CourseMembershipId,
  CourseModuleId,
  CourseModuleReleaseRuleId,
  DiscussionPostId,
  DraftId,
  GradebookManualItemId,
  IntegrationConnectionId,
  LearningObjectiveId,
  Lti1p3ConnectionConfig,
  Lti1p3DeepLinkingReturnResult,
  Lti1p3DeepLinkingSessionId,
  type Lti1p3NamesRolesRole,
  ProviderConfigSummary as ProviderConfigSummarySchema,
  QtiQuizItemExport,
  QtiQuizItemImportResult,
  QuizId,
  RosterImportSummary,
  SisFinalGradeSubmission,
  type SubmissionId,
  TenantId,
  UserId,
  lti1p3AgsResultReadonlyScope,
  lti1p3AgsScoreScope,
  lti1p3NamesRolesContextMembershipReadonlyScope,
} from '@openlms/contracts';
import type {
  AiAction,
  AiProviderType,
  AiUsageByAction,
  AiUsageByActor,
  AiUsageSummary,
  Assignment,
  AssignmentAiSettings,
  AssignmentEffectiveSchedule,
  AssignmentOverride,
  AssignmentOverrideStatus,
  AssignmentOverrideTargetType,
  AssignmentPeerReview,
  AssignmentPeerReviewResponse,
  AssignmentStatus,
  AttendanceRecord,
  AttendanceRecordStatus,
  AttendanceSession,
  AttendanceSessionStatus,
  AuditCategory,
  AuditLog,
  CalendarItem,
  CatalogCourse,
  CatalogVisibility,
  CommonCartridgeCourseExport,
  CommonCartridgeImportRequest,
  CommonCartridgeImportResult as CommonCartridgeImportResultContract,
  CompletionProgress,
  CompletionRequirement,
  CompletionRequirementStatus,
  CompletionRequirementType,
  CompletionTargetType,
  Consent,
  ConsentActionType,
  ConsentScope,
  ConversationMessage,
  ConversationThread,
  ConversationThreadStatus,
  Course,
  CourseAnalyticsSummary,
  CourseAnnouncement,
  CourseAnnouncementStatus,
  CourseBackup,
  CourseCalendarEvent,
  CourseCalendarEventOccurrence,
  CourseCalendarEventVisibility,
  CourseCatalogSettings,
  CourseCredential,
  CourseCredentialStatus,
  CourseCredentialType,
  CourseExternalTool,
  CourseExternalToolOutcome,
  CourseExternalToolOutcomeStatus,
  CourseExternalToolPlacement,
  CourseExternalToolStatus,
  CourseFavorite,
  CourseFinalGrade,
  CourseGradingScheme,
  CourseGradingSchemeEntry,
  CourseGradingSchemeStatus,
  CourseGroup,
  CourseGroupMember,
  CourseGroupMemberRole,
  CourseGroupSet,
  CourseGroupSetStatus,
  CourseGroupStatus,
  CourseMeeting,
  CourseMeetingProvider,
  CourseMeetingStatus,
  CourseMembership,
  CourseMembershipStatus,
  CourseModule,
  CoursePage,
  CoursePageVisibility,
  CourseResource,
  CourseResourceViewEvent,
  CourseRole,
  CourseSection,
  CourseSectionInstructor,
  CourseSectionMeetingDay,
  CourseSectionMember,
  CourseSectionStatus,
  CourseSyllabus,
  CourseUnit,
  CreateFileUpload,
  CredentialAward,
  CredentialAwardStatus,
  DiscussionGradebookEntry,
  DiscussionPost,
  DiscussionPostGrade,
  DiscussionPostGradeStatus,
  DiscussionPostStatus,
  DiscussionTopic,
  DiscussionTopicSubscription,
  DiscussionTopicVisibility,
  Draft,
  DraftBlock,
  FileResource,
  GlossaryEntry,
  GlossaryEntryStatus,
  Grade,
  GradeAppeal,
  GradeAppealStatus,
  GradeHistory,
  GradeSource,
  GradeStatus,
  GradebookCategory,
  GradebookCategoryStatus,
  GradebookEntry,
  GradebookManualGrade,
  GradebookManualItem,
  GradebookManualItemStatus,
  IntegrationConnection,
  LearningObjective,
  LearningObjectiveCoverage,
  LearningObjectiveMastery,
  LearningObjectiveStatus,
  Lti1p3AgsResultContainer,
  Lti1p3AgsScore,
  Lti1p3JsonWebKeySet,
  Lti1p3LaunchAuthorizationRequest as Lti1p3LaunchAuthorizationRequestContract,
  Lti1p3LaunchAuthorizationResponse,
  Lti1p3NamesRolesMembershipContainer,
  Lti1p3OidcAuthorizationRequest as Lti1p3OidcAuthorizationRequestContract,
  Lti1p3OidcLoginInitiation,
  Lti1p3ServiceAccessToken,
  Lti1p3ServiceTokenRequest,
  MessageableUser,
  ModelPreferences,
  ModuleReleaseCombinator,
  ModuleReleaseDecision,
  ModuleReleaseOverride,
  ModuleReleaseOverrideState,
  ModuleReleasePolicy,
  ModuleReleaseRule,
  ModuleReleaseRuleStatus,
  ModuleReleaseRuleType,
  ModuleReleaseState,
  ModuleReleaseTargetType,
  MyCredentialAward,
  NotificationCategory,
  NotificationChannel,
  NotificationFrequency,
  NotificationPreference,
  NotificationRecord,
  ProviderCapabilities,
  ProviderConfigSummary,
  ProviderQuota,
  QtiQuizItemImportRequest,
  QuestionBank,
  QuestionBankQuestion,
  QuestionBankStatus,
  Quiz,
  QuizAggregateGrade,
  QuizAttempt,
  QuizAttemptQuestionGrade,
  QuizAttemptResponse,
  QuizAttemptResponseAnswer,
  QuizEffectiveSettings,
  QuizOverride,
  QuizOverrideStatus,
  QuizOverrideTargetType,
  QuizQuestion,
  QuizQuestionAnswerKey,
  QuizQuestionChoice,
  QuizQuestionType,
  QuizStatus,
  RetentionPolicy,
  RetentionPolicyTargetType,
  RosterImportResult,
  Rubric,
  RubricCriterion,
  ScormAttempt,
  ScormPackage,
  ScormRuntimeCommit,
  ScormRuntimeState,
  SisFinalGradeSubmission as SisFinalGradeSubmissionContract,
  Submission,
  SubmissionAttachment,
  SubmissionComment,
  SubmissionCommentVisibility,
  SubmissionPlagiarismReport,
  SubmissionPlagiarismReportStatus,
  Survey,
  SurveyQuestion,
  SurveyQuestionChoice,
  SurveyQuestionType,
  SurveyResponse,
  SurveyResponseAnswer,
  SurveyStatus,
  Tenant,
  TenantFeatureFlag,
  TenantMembership,
  TenantMessageableUser,
  TenantRole,
  User,
  UserLegalHold,
  UserPushToken,
  UserPushTokenPlatform,
  WebhookSubscription,
  WikiPage,
  WikiPageRevision,
  WikiPageRevisionDiff,
  WikiPageStatus,
  XapiStatement,
  XapiStatementIngest,
} from '@openlms/contracts';
import {
  AttendanceSessionUnavailableError,
  AttendanceStudentUnavailableError,
  CommonCartridgeParseError,
  CourseCopySameCourseError,
  CourseResourceViewTargetNotFoundError,
  CourseRestoreTargetMissingError,
  CourseRestoreVersionError,
  InvalidRecurrenceRuleError,
  LocalFileStorageProvider,
  ManualGradebookItemUnavailableError,
  ManualGradebookScoreExceedsMaxScoreError,
  ManualGradebookStudentUnavailableError,
  QtiParseError,
  UnsupportedQtiItemError,
  UserDeletionBlockedByLegalHoldError,
  aggregateQuizGradesPerStudent,
  anonymizeAuthUserForDeletion,
  appendConsent,
  applyLatePenalty,
  applyScormRuntimeCommit,
  assignInstructorToSection,
  assignStudentToSection,
  buildCourseAnnouncementPublishedEvent,
  buildDiscussionReplyCreatedEvent,
  buildGradeChangeAuditLog,
  buildGradeChangedEvent,
  buildGradePublishedEvent,
  buildInitialScormRuntimeAttempt,
  buildLti1p3AgsResultContainer,
  buildLti1p3JsonWebKeySet,
  buildLti1p3NamesRolesMembershipContainer,
  buildScormRuntimeState,
  buildSisFinalGradesSubmittedEvent,
  buildTenantFileStorageQuotaChangedAuditLog,
  buildTenantMembershipRoleChangedAuditLog,
  calculateCourseFinalGrades,
  calculateUserRetainUntil,
  completeLti1p3DeepLinkingSessionWithExternalTools,
  completePassQuizRequirementsForAttempt,
  completeSubmitAssignmentRequirementsForSubmission,
  computeLatePenaltyPercent,
  copyCourseTemplate,
  countCourseMembershipsByStatus,
  createAssignmentOverride as createAssignmentOverrideRecord,
  createAssignment as createAssignmentRecord,
  createAttendanceSession as createAttendanceSessionRecord,
  createCompletionRequirement as createCompletionRequirementRecord,
  createConversationMessage as createConversationMessageRecord,
  createConversationThread as createConversationThreadRecord,
  createCourseAnnouncement as createCourseAnnouncementRecord,
  createCourseCalendarEvent as createCourseCalendarEventRecord,
  createCourseCredential as createCourseCredentialRecord,
  createCourseExternalTool as createCourseExternalToolRecord,
  createCourseGradingScheme as createCourseGradingSchemeRecord,
  createCourseGroupMember as createCourseGroupMemberRecord,
  createCourseGroup as createCourseGroupRecord,
  createCourseGroupSet as createCourseGroupSetRecord,
  createCourseMeeting as createCourseMeetingRecord,
  createCourseMembership as createCourseMembershipRecord,
  createCourseModule as createCourseModuleRecord,
  createCoursePage as createCoursePageRecord,
  createCourse as createCourseRecord,
  createCourseResource as createCourseResourceRecord,
  createCourseSection as createCourseSectionRecord,
  createCourseUnit as createCourseUnitRecord,
  createCredentialAward as createCredentialAwardRecord,
  createDbHandle,
  createDiscussionPost as createDiscussionPostRecord,
  createDiscussionTopic as createDiscussionTopicRecord,
  createFileResource,
  createFileResourceId,
  createGlossaryEntry as createGlossaryEntryRecord,
  createGradeAppeal as createGradeAppealRecord,
  createGradebookCategory as createGradebookCategoryRecord,
  createGradebookManualItem as createGradebookManualItemRecord,
  createLearningObjective as createLearningObjectiveRecord,
  createLti1p3DeepLinkingAuthorizationResponse,
  createLti1p3DeepLinkingSession,
  createLti1p3LaunchAuthorizationResponse,
  createLti1p3OidcLoginInitiation,
  createLti1p3ServiceAccessToken as createLti1p3ServiceAccessTokenRecord,
  createQuestionBankQuestion as createQuestionBankQuestionRecord,
  createQuestionBank as createQuestionBankRecord,
  createQuizOverride as createQuizOverrideRecord,
  createQuizQuestion as createQuizQuestionRecord,
  createQuiz as createQuizRecord,
  createReleaseRule,
  createRubric as createRubricRecord,
  createScormPackage as createScormPackageRecord,
  createSubmissionAttachment as createSubmissionAttachmentRecord,
  createSubmissionComment as createSubmissionCommentRecord,
  createSubmissionFromDraft,
  createSurveyQuestion as createSurveyQuestionRecord,
  createSurvey as createSurveyRecord,
  createSurveyResponse as createSurveyResponseRecord,
  createUserLegalHold as createUserLegalHoldRecord,
  createWebhookSubscription as createWebhookSubscriptionRecord,
  createWikiPage as createWikiPageRecord,
  decryptSecret,
  deleteAssignmentOverride as deleteAssignmentOverrideRecord,
  deleteAssignment as deleteAssignmentRecord,
  deleteCourseAnnouncement as deleteCourseAnnouncementRecord,
  deleteCourseCalendarEvent as deleteCourseCalendarEventRecord,
  deleteCourseCredential as deleteCourseCredentialRecord,
  deleteCourseExternalTool as deleteCourseExternalToolRecord,
  deleteCourseGroupMembershipForUser,
  deleteCourseGroup as deleteCourseGroupRecord,
  deleteCourseGroupSet as deleteCourseGroupSetRecord,
  deleteCourseMeeting as deleteCourseMeetingRecord,
  deleteCourseMembership as deleteCourseMembershipRecord,
  deleteCourseModule as deleteCourseModuleRecord,
  deleteCoursePage as deleteCoursePageRecord,
  deleteCourseResource as deleteCourseResourceRecord,
  deleteCourseSection as deleteCourseSectionRecord,
  deleteCourseUnit as deleteCourseUnitRecord,
  deleteDiscussionPost as deleteDiscussionPostRecord,
  deleteDiscussionTopic as deleteDiscussionTopicRecord,
  deleteFileResourceForOwner,
  deleteGlossaryEntry as deleteGlossaryEntryRecord,
  deleteGradebookCategory as deleteGradebookCategoryRecord,
  deleteGradebookManualItem as deleteGradebookManualItemRecord,
  deleteLearningObjective as deleteLearningObjectiveRecord,
  deleteProviderConfigByTenantId,
  deleteQuestionBank as deleteQuestionBankRecord,
  deleteQuizOverride as deleteQuizOverrideRecord,
  deleteQuiz as deleteQuizRecord,
  deleteReleaseRule,
  deleteRubric as deleteRubricRecord,
  deleteSurvey as deleteSurveyRecord,
  deleteTenantFeatureFlag as deleteTenantFeatureFlagRecord,
  deleteWebhookSubscription as deleteWebhookSubscriptionRecord,
  deleteWikiPage as deleteWikiPageRecord,
  encodeLti1p3DeepLinkingSessionData,
  encryptSecret,
  evaluateCourseReleases,
  expandRecurrence,
  exportCourseBackup,
  exportCourseBackupAsCommonCartridge,
  exportQuizQuestionToQtiItem,
  extractLti1p3DeepLinkingReturnSessionData,
  extractLti1p3ServiceTokenClientId,
  favoriteCourse,
  filterAssignmentOverridesForLearner,
  filterQuizOverridesForLearner,
  getActiveLti1p3PlatformSigningKey,
  getAiUsageByAction,
  getAiUsageByActor,
  getAiUsageSummary,
  getAssignmentById,
  getAssignmentOverrideById,
  getAttendanceSessionForCourse,
  getCompletionRequirementForCourse,
  getConversationThreadForCourse,
  getConversationThreadInTenant,
  getCourseAnalyticsSummary,
  getCourseAnnouncementForCourse,
  getCourseById,
  getCourseEnrollmentInfo,
  getCourseExternalToolForCourse,
  getCourseGroupForCourse,
  getCourseGroupSetById,
  getCoursePageForCourse,
  getCourseResourceForCourse,
  getCourseSyllabusForCourse,
  getCredentialForCourse,
  getDiscussionPostForTopic,
  getDiscussionTopicForCourse,
  getFileResourceById,
  getFileStorageUsage,
  getGlossaryEntryForCourse,
  getGradeAppealById,
  getGradeBySubmissionId,
  getGradebookManualItemForCourse,
  getIntegrationConnectionById,
  getLearningObjectiveById,
  getLearningObjectiveCoverage,
  getLti1p3DeepLinkingSessionById,
  getLti1p3IntegrationConnectionByClientId,
  getNextPositionForScope,
  getProviderConfigByTenantId,
  getQuestionBankForCourse,
  getQuizAccessControlsForCourse,
  getQuizForCourse,
  getQuizOverrideById,
  getReleasePolicy as getReleasePolicyRecord,
  getRetentionPolicy,
  getRubricById,
  getScormAttemptForStudent,
  getScormPackageForCourse,
  getSubmissionAttachmentById,
  getSubmissionById,
  getSurveyForCourse,
  getSurveyQuestionForSurvey,
  getTenantById,
  getTenantMembershipById,
  getUserById,
  getWikiPageForCourse,
  getWikiPageRevisionDiff as getWikiPageRevisionDiffRecord,
  gradeQuizAttemptResponses,
  gradeQuizAttemptResponsesWithManualGrades,
  hashQuizAccessPassword,
  isClientIpAllowedByRanges,
  isQuizAttemptExpired,
  isUserLegalHoldActiveDuplicate,
  listActiveLti1p3PlatformKeys,
  listAssignmentOverridesForAssignment,
  listAssignmentPeerReviewsForAssignment,
  listAssignmentsForCourse,
  listAttendanceRecordsForSession,
  listAttendanceSessionsForCourse,
  listAuditLogsForTenant,
  listCalendarItemsForUser,
  listCatalogCoursesForTenant,
  listCompletionProgressForRequirement,
  listCompletionRequirementsForCourse,
  listConsentsForSubject,
  listConversationMessagesForThread,
  listConversationThreadsForCourse,
  listCourseAnnouncementsForCourse,
  listCourseCalendarEventsForCourse,
  listCourseExternalToolOutcomesForAssignment,
  listCourseExternalToolsForCourse,
  listCourseFavoritesForUser,
  listCourseGradingSchemesForCourse,
  listCourseGroupMembers as listCourseGroupMemberRecords,
  listCourseGroupMembershipsForUser,
  listCourseGroupSetsForCourse,
  listCourseGroupsForCourse,
  listCourseMeetingsForCourse,
  listCourseMemberships as listCourseMembershipRecords,
  listCourseModules,
  listCoursePagesForCourse,
  listCourseResources,
  listCourseSectionsForCourse,
  listCourseUnits,
  listCourses,
  listCredentialAwardsForCredential,
  listCredentialAwardsForStudent,
  listCredentialsForCourse,
  listDiscussionGradebookEntriesForCourse,
  listDiscussionPostGradesForTopic,
  listDiscussionPostsForTopic,
  listDiscussionTopicSubscriptions,
  listDiscussionTopicsForCourse,
  listFileResourcesForCourse,
  listFileResourcesForOwner,
  listGlossaryEntriesForCourse,
  listGradeAppealsForCourse as listGradeAppealRecordsForCourse,
  listGradeHistoryForSubmission,
  listGradebookCategoriesForCourse,
  listGradebookEntriesForCourse,
  listGradebookManualGradesForItem,
  listGradebookManualItemsForCourse,
  listInboxThreadsForUser,
  listLatestPlagiarismReportsForCourse,
  listLearningObjectiveMasteryForCourse,
  listLearningObjectivesForCourse,
  listMessageableUsersInCourse,
  listMessageableUsersInTenant,
  listNotificationPreferencesForUser,
  listNotificationsForRecipient,
  listPeerReviewResponsesForReview,
  listQuestionBankQuestionsForBank,
  listQuestionBanksForCourse,
  listQuizAttemptQuestionGradesForAttempt,
  listQuizAttemptResponsesForAttempt,
  listQuizAttemptsForQuiz,
  listQuizOverridesForQuiz,
  listQuizQuestionsForQuiz,
  listQuizQuestionsWithAnswerKeysForQuiz,
  listQuizzesForCourse,
  listReleaseOverridesForModule,
  listReleaseOverridesForStudent,
  listReleasePoliciesForCourse,
  listReleaseRulesForCourse,
  listReleaseRulesForModule,
  listResourceViewsForResource,
  listRetentionPolicies as listRetentionPolicyRecords,
  listRubricsForTenant,
  listScormPackagesForCourse,
  listSectionInstructorsForSection,
  listSectionMembersForSection,
  listSectionMembershipsForStudent,
  listSubmissionAttachmentsForSubmission,
  listSubmissionCommentsForSubmission,
  listSubmissionPlagiarismReports,
  listSubmissionsForAssignment,
  listSubmissionsForStudentAssignment,
  listSurveyQuestionsForSurvey,
  listSurveyResponsesForSurvey,
  listSurveysForCourse,
  listTenantFeatureFlags as listTenantFeatureFlagRecords,
  listTenantMembers,
  listUserCourseMemberships,
  listUserLegalHolds as listUserLegalHoldRecords,
  listUserPushTokens,
  listUserTenantMemberships,
  listWebhookSubscriptions as listWebhookSubscriptionRecords,
  listWikiPageRevisionsForPage,
  listWikiPagesForCourse,
  mapLti1p3AgsScoreToOutcomeInput,
  markNotificationReadForRecipient,
  normalizeQuizAllowedIpRanges,
  parseCommonCartridgeCoursePackage,
  parseEncryptedSecret,
  parseLti1p3ServiceScopes,
  parseQtiAssessmentItem,
  parseRosterCsv,
  parseSubmissionGradeImportCsv,
  recordAttendanceRecord as recordAttendanceRecordUpsert,
  recordCourseExternalToolOutcome,
  recordGradebookManualGrade,
  recordQuizAttempt,
  recordQuizAttemptQuestionGrade as recordQuizAttemptQuestionGradeRecord,
  recordQuizAttemptResponse,
  recordResourceViewWithCompletion,
  recordSubmissionPlagiarismReport,
  registerUserPushToken,
  releaseUserLegalHold as releaseUserLegalHoldRecord,
  removeInstructorFromSection,
  removeReleaseOverride,
  removeStudentFromSection,
  reorderInScope,
  requiresManualQuizQuestionGrade,
  resolveEffectiveAssignmentSchedule,
  resolveEffectiveQuizSettings,
  resolveLti1p3OidcAuthorizationRequest,
  restoreCourseBackup,
  restoreDeletedCourse as restoreDeletedCourseRecord,
  restoreWikiPageRevision as restoreWikiPageRevisionRecord,
  revokeUserPushToken,
  saveAuditLog,
  saveOutboxEvent,
  saveStudentDraft,
  saveSubmission,
  saveXapiStatement,
  serializeAuditLogsAsCsv,
  serializeCalendarItemsAsIcs,
  serializeCourseFinalGradesAsCsv,
  serializeCourseRosterCsv,
  serializeDiscussionGradebookEntriesAsCsv,
  serializeEncryptedSecret,
  serializeGradebookEntriesAsCsv,
  serializeSisFinalGradesAsCsv,
  softDeleteCourse as softDeleteCourseRecord,
  submitQuizAttempt as submitQuizAttemptRecord,
  subscribeToDiscussionTopic as subscribeToDiscussionTopicRecord,
  unfavoriteCourse,
  unsubscribeFromDiscussionTopic as unsubscribeFromDiscussionTopicRecord,
  updateAssignmentOverride as updateAssignmentOverrideRecord,
  updateAssignment as updateAssignmentRecord,
  updateCourseAnnouncement as updateCourseAnnouncementRecord,
  updateCourseCalendarEvent as updateCourseCalendarEventRecord,
  updateCourseCatalogSettings as updateCourseCatalogSettingsRecord,
  updateCourseCredential as updateCourseCredentialRecord,
  updateCourseExternalTool as updateCourseExternalToolRecord,
  updateCourseGroup as updateCourseGroupRecord,
  updateCourseGroupSet as updateCourseGroupSetRecord,
  updateCourseMeeting as updateCourseMeetingRecord,
  updateCourseMembership as updateCourseMembershipRecord,
  updateCourseModule as updateCourseModuleRecord,
  updateCoursePage as updateCoursePageRecord,
  updateCourse as updateCourseRecord,
  updateCourseResource as updateCourseResourceRecord,
  updateCourseSection as updateCourseSectionRecord,
  updateCourseUnit as updateCourseUnitRecord,
  updateDiscussionPost as updateDiscussionPostRecord,
  updateDiscussionTopic as updateDiscussionTopicRecord,
  updateGlossaryEntry as updateGlossaryEntryRecord,
  updateGradeAppealStatus,
  updateGradebookCategory as updateGradebookCategoryRecord,
  updateGradebookManualItem as updateGradebookManualItemRecord,
  updateLearningObjective as updateLearningObjectiveRecord,
  updateQuestionBank as updateQuestionBankRecord,
  updateQuizAttemptGrade as updateQuizAttemptGradeRecord,
  updateQuizOverride as updateQuizOverrideRecord,
  updateQuiz as updateQuizRecord,
  updateReleaseRule,
  updateRubric as updateRubricRecord,
  updateSurvey as updateSurveyRecord,
  updateTenantFileStorageQuotas as updateTenantFileStorageQuotasRecord,
  updateTenantMembership as updateTenantMembershipRecord,
  updateUserProfile as updateUserProfileRecord,
  updateWebhookSubscription as updateWebhookSubscriptionRecord,
  updateWikiPage as updateWikiPageRecord,
  upsertCourseSyllabus as upsertCourseSyllabusRecord,
  upsertDiscussionPostGrade,
  upsertNotificationPreference as upsertNotificationPreferenceRecord,
  upsertPeerReviewResponse as upsertPeerReviewResponseRecord,
  upsertProviderConfig as upsertProviderConfigRecord,
  upsertReleaseOverride,
  upsertReleasePolicy as upsertReleasePolicyRecord,
  upsertRetentionPolicy as upsertRetentionPolicyRecord,
  upsertScormAttempt as upsertScormAttemptRecord,
  upsertSubmissionGrade as upsertSubmissionGradeRecord,
  upsertTenantFeatureFlag as upsertTenantFeatureFlagRecord,
  verifyLti1p3DeepLinkingReturn,
  verifyLti1p3ServiceAccessToken,
  verifyQuizAccessPassword,
} from '@openlms/core';
import {
  type Database,
  type DatabaseExecutor,
  type ModuleReleaseStatusDependencies,
  assertCorePermission,
} from '@openlms/core';
import { type Auth, createAuth } from '@openlms/core/auth';
import { TenantSlugTakenError, signUpWithTenant } from '@openlms/core/auth/onboarding';
import { type CoreSession, getCoreSessionByToken } from '@openlms/core/auth/session';
import { ApiError } from './http-error.ts';

export type ApiDependencies = {
  authHandler: ((request: Request) => Promise<Response>) | null;
  getSessionByToken: (sessionToken: string) => Promise<CoreSession | null>;
  createInitialTenant: (
    actorUserId: string,
    input: { slug: string; displayName: string },
  ) => Promise<Tenant>;
  getCurrentUser: (actorUserId: string) => Promise<User>;
  updateCurrentUser: (actorUserId: string, input: UpdateCurrentUserApiInput) => Promise<User>;
  deleteCurrentUser: (actorUserId: string) => Promise<void>;
  listMyTenantMemberships: (actorUserId: string) => Promise<TenantMembership[]>;
  listMyCourseMemberships: (actorUserId: string) => Promise<CourseMembership[]>;
  listTenants: (actorUserId: string) => Promise<Tenant[]>;
  listTenantMembers: (actorUserId: string, tenantId: string) => Promise<TenantMembership[]>;
  updateTenantFileStorageQuotas: (
    actorUserId: string,
    tenantId: string,
    input: UpdateTenantFileStorageQuotasApiInput,
  ) => Promise<Tenant>;
  listTenantFeatureFlags: (actorUserId: string, tenantId: string) => Promise<TenantFeatureFlag[]>;
  listWebhookSubscriptions: (
    actorUserId: string,
    tenantId: string,
  ) => Promise<WebhookSubscription[]>;
  createWebhookSubscription: (
    actorUserId: string,
    tenantId: string,
    input: CreateWebhookSubscriptionApiInput,
  ) => Promise<WebhookSubscription>;
  updateWebhookSubscription: (
    actorUserId: string,
    tenantId: string,
    webhookSubscriptionId: string,
    input: UpdateWebhookSubscriptionApiInput,
  ) => Promise<WebhookSubscription>;
  deleteWebhookSubscription: (
    actorUserId: string,
    tenantId: string,
    webhookSubscriptionId: string,
  ) => Promise<void>;
  listUserLegalHolds: (
    actorUserId: string,
    tenantId: string,
    input: ListUserLegalHoldsApiInput,
  ) => Promise<UserLegalHold[]>;
  createUserLegalHold: (
    actorUserId: string,
    tenantId: string,
    input: CreateUserLegalHoldApiInput,
  ) => Promise<UserLegalHold>;
  releaseUserLegalHold: (
    actorUserId: string,
    tenantId: string,
    legalHoldId: string,
  ) => Promise<UserLegalHold>;
  listRetentionPolicies: (actorUserId: string, tenantId: string) => Promise<RetentionPolicy[]>;
  upsertRetentionPolicy: (
    actorUserId: string,
    tenantId: string,
    targetType: RetentionPolicyTargetType,
    input: UpsertRetentionPolicyApiInput,
  ) => Promise<RetentionPolicy>;
  upsertTenantFeatureFlag: (
    actorUserId: string,
    tenantId: string,
    key: string,
    input: UpsertTenantFeatureFlagApiInput,
  ) => Promise<TenantFeatureFlag>;
  deleteTenantFeatureFlag: (actorUserId: string, tenantId: string, key: string) => Promise<void>;
  listAiActions: (actorUserId: string, tenantId: string) => Promise<AiAction[]>;
  getProviderConfig: (actorUserId: string, tenantId: string) => Promise<ProviderConfigSummary>;
  listMyConsents: (actorUserId: string, tenantId: string) => Promise<Consent[]>;
  listMyCredentialAwards: (actorUserId: string, tenantId: string) => Promise<MyCredentialAward[]>;
  recordMyConsent: (
    actorUserId: string,
    tenantId: string,
    input: {
      actionType: ConsentActionType;
      scope: ConsentScope;
      scopeId: string;
      state: 'granted' | 'revoked';
      expiresAt: Date | null;
      evidence: string | null;
    },
  ) => Promise<Consent>;
  upsertProviderConfig: (
    actorUserId: string,
    tenantId: string,
    input: UpsertProviderConfigApiInput,
  ) => Promise<ProviderConfigSummary>;
  deleteProviderConfig: (actorUserId: string, tenantId: string) => Promise<void>;
  getAiUsageSummary: (
    actorUserId: string,
    tenantId: string,
    from: Date,
    to: Date,
  ) => Promise<AiUsageSummary>;
  listAiUsageByAction: (
    actorUserId: string,
    tenantId: string,
    from: Date,
    to: Date,
  ) => Promise<AiUsageByAction[]>;
  listAiUsageByActor: (
    actorUserId: string,
    tenantId: string,
    from: Date,
    to: Date,
  ) => Promise<AiUsageByActor[]>;
  listAuditLogs: (
    actorUserId: string,
    tenantId: string,
    input: AuditLogQueryInput,
  ) => Promise<AuditLog[]>;
  exportAuditLogsCsv: (
    actorUserId: string,
    tenantId: string,
    input: AuditLogQueryInput,
  ) => Promise<string>;
  ingestXapiStatement: (
    actorUserId: string,
    tenantId: string,
    input: XapiStatementIngest,
  ) => Promise<XapiStatement>;
  updateTenantMembership: (
    actorUserId: string,
    tenantId: string,
    membershipId: string,
    input: UpdateTenantMembershipApiInput,
  ) => Promise<TenantMembership>;
  listCourses: (actorUserId: string, tenantId: string) => Promise<Course[]>;
  listCatalogCourses: (
    tenantId: string,
    options?: { isBlueprint?: boolean; catalogCategory?: string; academicTerm?: string },
  ) => Promise<CatalogCourse[]>;
  listCourseFavorites: (actorUserId: string, tenantId: string) => Promise<CourseFavorite[]>;
  favoriteCourse: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseFavorite>;
  unfavoriteCourse: (actorUserId: string, tenantId: string, courseId: string) => Promise<void>;
  getCourseNextPosition: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    scope: ApiNextPositionScope,
  ) => Promise<{ nextPosition: number }>;
  reorderCourseContent: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: ReorderCourseContentInput,
  ) => Promise<{ reordered: number }>;
  createCourse: (
    actorUserId: string,
    tenantId: string,
    input: CreateCourseInput,
  ) => Promise<Course>;
  updateCourse: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: UpdateCourseDependencyInput,
  ) => Promise<Course>;
  deleteCourse: (actorUserId: string, tenantId: string, courseId: string) => Promise<void>;
  restoreDeletedCourse: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<Course>;
  copyCourse: (
    actorUserId: string,
    tenantId: string,
    sourceCourseId: string,
    input: CopyCourseInput,
  ) => Promise<{
    learningObjectivesCopied: number;
    modulesCopied: number;
    unitsCopied: number;
    pagesCopied: number;
    resourcesCopied: number;
    wikiPagesCopied: number;
    glossaryEntriesCopied: number;
  }>;
  exportCourseBackup: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseBackup>;
  exportCourseCommonCartridge: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CommonCartridgeCourseExport>;
  importCourseCommonCartridge: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CommonCartridgeImportRequest,
  ) => Promise<CommonCartridgeImportResultContract>;
  getCourseAnalyticsSummary: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseAnalyticsSummary>;
  restoreCourseBackup: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: RestoreCourseBackupInput,
  ) => Promise<{
    learningObjectivesRestored: number;
    modulesRestored: number;
    unitsRestored: number;
    pagesRestored: number;
    resourcesRestored: number;
  }>;
  listRubrics: (actorUserId: string, tenantId: string) => Promise<Rubric[]>;
  getRubric: (actorUserId: string, tenantId: string, rubricId: string) => Promise<Rubric>;
  createRubric: (
    actorUserId: string,
    tenantId: string,
    input: CreateRubricInput,
  ) => Promise<Rubric>;
  updateRubric: (
    actorUserId: string,
    tenantId: string,
    rubricId: string,
    input: UpdateRubricInput,
  ) => Promise<Rubric>;
  deleteRubric: (actorUserId: string, tenantId: string, rubricId: string) => Promise<void>;
  listCourseSections: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseSection[]>;
  createCourseSection: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCourseSectionInput,
  ) => Promise<CourseSection>;
  updateCourseSection: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    courseSectionId: string,
    input: UpdateCourseSectionInput,
  ) => Promise<CourseSection>;
  deleteCourseSection: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    courseSectionId: string,
  ) => Promise<void>;
  listCourseAnnouncements: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseAnnouncement[]>;
  createCourseAnnouncement: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCourseAnnouncementInput,
  ) => Promise<CourseAnnouncement>;
  updateCourseAnnouncement: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    announcementId: string,
    input: UpdateCourseAnnouncementInput,
  ) => Promise<CourseAnnouncement>;
  deleteCourseAnnouncement: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    announcementId: string,
  ) => Promise<void>;
  listCourseMemberships: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    role?: CourseRole,
    status?: CourseMembershipStatus,
  ) => Promise<CourseMembership[]>;
  listMessageableUsers: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<MessageableUser[]>;
  listTenantMessageableUsers: (
    actorUserId: string,
    tenantId: string,
  ) => Promise<TenantMessageableUser[]>;
  createCourseMembership: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCourseMembershipInput,
  ) => Promise<CourseMembership>;
  updateCourseMembership: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    courseMembershipId: string,
    input: UpdateCourseMembershipInput,
  ) => Promise<CourseMembership>;
  deleteCourseMembership: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    courseMembershipId: string,
  ) => Promise<void>;
  selfEnrollInCourse: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: SelfEnrollInCourseInput,
  ) => Promise<CourseMembership>;
  updateCourseCatalogSettings: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: UpdateCourseCatalogSettingsInput,
  ) => Promise<CourseCatalogSettings>;
  listAssignments: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string | undefined,
    unitId: string | undefined,
  ) => Promise<Assignment[]>;
  createAssignment: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateAssignmentInput,
  ) => Promise<Assignment>;
  updateAssignment: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    input: UpdateAssignmentInput,
  ) => Promise<Assignment>;
  deleteAssignment: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
  ) => Promise<void>;
  getAssignmentEffectiveSchedule: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
  ) => Promise<AssignmentEffectiveSchedule>;
  listAssignmentOverrides: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
  ) => Promise<AssignmentOverride[]>;
  updateAssignmentOverride: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    overrideId: string,
    input: UpdateAssignmentOverrideApiInput,
  ) => Promise<AssignmentOverride>;
  createAssignmentOverride: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    input: CreateAssignmentOverrideApiInput,
  ) => Promise<AssignmentOverride>;
  deleteAssignmentOverride: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    overrideId: string,
  ) => Promise<void>;
  getAssignmentRubric: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
  ) => Promise<Rubric>;
  listQuizzes: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string | undefined,
    unitId: string | undefined,
  ) => Promise<Quiz[]>;
  createQuiz: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateQuizInput,
  ) => Promise<Quiz>;
  updateQuiz: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    input: UpdateQuizInput,
  ) => Promise<Quiz>;
  deleteQuiz: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
  ) => Promise<void>;
  listQuizQuestions: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
  ) => Promise<QuizQuestion[]>;
  createQuizQuestion: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    input: CreateQuizQuestionInput,
  ) => Promise<QuizQuestion>;
  exportQuizQtiItems: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
  ) => Promise<QtiQuizItemExport>;
  importQuizQtiItems: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    input: QtiQuizItemImportRequest,
  ) => Promise<QtiQuizItemImportResult>;
  listQuizAttempts: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
  ) => Promise<QuizAttempt[]>;
  listQuizAggregateGrades: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
  ) => Promise<QuizAggregateGrade[]>;
  listQuizOverrides: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
  ) => Promise<QuizOverride[]>;
  createQuizOverride: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    input: CreateQuizOverrideApiInput,
  ) => Promise<QuizOverride>;
  updateQuizOverride: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    overrideId: string,
    input: UpdateQuizOverrideApiInput,
  ) => Promise<QuizOverride>;
  deleteQuizOverride: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    overrideId: string,
  ) => Promise<void>;
  getQuizEffectiveSettings: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
  ) => Promise<QuizEffectiveSettings>;
  listQuizAttemptQuestionGrades: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    attemptId: string,
  ) => Promise<QuizAttemptQuestionGrade[]>;
  recordQuizAttemptQuestionGrade: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    attemptId: string,
    questionId: string,
    input: { score: number; feedback: string | null },
  ) => Promise<QuizAttemptQuestionGrade>;
  regradeQuizAttempt: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    attemptId: string,
  ) => Promise<QuizAttempt>;
  startQuizAttempt: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    input?: StartQuizAttemptInput,
  ) => Promise<QuizAttempt>;
  submitQuizAttempt: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    attemptId: string,
  ) => Promise<QuizAttempt>;
  listQuizAttemptResponses: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    attemptId: string,
  ) => Promise<QuizAttemptResponse[]>;
  saveQuizAttemptResponse: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    attemptId: string,
    questionId: string,
    answer: QuizAttemptResponseAnswer,
  ) => Promise<QuizAttemptResponse>;
  listQuestionBanks: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<QuestionBank[]>;
  createQuestionBank: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateQuestionBankInput,
  ) => Promise<QuestionBank>;
  updateQuestionBank: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    questionBankId: string,
    input: UpdateQuestionBankInput,
  ) => Promise<QuestionBank>;
  deleteQuestionBank: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    questionBankId: string,
  ) => Promise<void>;
  listQuestionBankQuestions: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    questionBankId: string,
  ) => Promise<QuestionBankQuestion[]>;
  createQuestionBankQuestion: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    questionBankId: string,
    input: CreateQuestionBankQuestionInput,
  ) => Promise<QuestionBankQuestion>;
  listAttendanceSessions: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<AttendanceSession[]>;
  createAttendanceSession: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateAttendanceSessionInput,
  ) => Promise<AttendanceSession>;
  listAttendanceRecords: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    sessionId: string,
  ) => Promise<AttendanceRecord[]>;
  recordAttendanceRecord: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    sessionId: string,
    studentId: string,
    input: RecordAttendanceRecordInput,
  ) => Promise<AttendanceRecord>;
  listCompletionRequirements: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string | undefined,
  ) => Promise<CompletionRequirement[]>;
  createCompletionRequirement: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCompletionRequirementInput,
  ) => Promise<CompletionRequirement>;
  listCompletionProgress: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    requirementId: string,
  ) => Promise<CompletionProgress[]>;
  listCredentials: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseCredential[]>;
  createCourseCredential: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCourseCredentialInput,
  ) => Promise<CourseCredential>;
  updateCourseCredential: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    credentialId: string,
    input: UpdateCourseCredentialInput,
  ) => Promise<CourseCredential>;
  deleteCourseCredential: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    credentialId: string,
  ) => Promise<void>;
  listCredentialAwards: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    credentialId: string,
  ) => Promise<CredentialAward[]>;
  createCredentialAward: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    credentialId: string,
    input: CreateCredentialAwardInput,
  ) => Promise<CredentialAward>;
  listConversationThreads: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<ConversationThread[]>;
  createConversationThread: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateConversationThreadApiInput,
  ) => Promise<ConversationThread>;
  listConversationMessages: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    threadId: string,
  ) => Promise<ConversationMessage[]>;
  createConversationMessage: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    threadId: string,
    input: CreateConversationMessageApiInput,
  ) => Promise<ConversationMessage>;
  listCourseGroupSets: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseGroupSet[]>;
  createCourseGroupSet: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCourseGroupSetInput,
  ) => Promise<CourseGroupSet>;
  updateCourseGroupSet: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    groupSetId: string,
    input: CreateCourseGroupSetInput,
  ) => Promise<CourseGroupSet>;
  deleteCourseGroupSet: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    groupSetId: string,
  ) => Promise<void>;
  listCourseGroups: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseGroup[]>;
  createCourseGroup: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCourseGroupInput,
  ) => Promise<CourseGroup>;
  updateCourseGroup: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    groupId: string,
    input: Omit<CreateCourseGroupInput, 'groupSetId'>,
  ) => Promise<CourseGroup>;
  deleteCourseGroup: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    groupId: string,
  ) => Promise<void>;
  listCourseGroupMembers: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    groupId: string,
  ) => Promise<CourseGroupMember[]>;
  createCourseGroupMember: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    groupId: string,
    input: CreateCourseGroupMemberInput,
  ) => Promise<CourseGroupMember>;
  joinCourseGroup: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    groupId: string,
  ) => Promise<CourseGroupMember>;
  leaveCourseGroup: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    groupId: string,
  ) => Promise<void>;
  listAssignmentSubmissions: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
  ) => Promise<AssignmentSubmissionListItem[]>;
  upsertSubmissionGrade: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    submissionId: string,
    input: UpsertSubmissionGradeApiInput,
  ) => Promise<Grade>;
  batchUpsertSubmissionGrades: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    items: BatchUpsertSubmissionGradeItem[],
  ) => Promise<{
    results: BatchUpsertSubmissionGradeResult[];
    savedCount: number;
    failedCount: number;
  }>;
  importSubmissionGradesCsv: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    csv: string,
  ) => Promise<{
    results: BatchUpsertSubmissionGradeResult[];
    savedCount: number;
    failedCount: number;
  }>;
  bulkEnrollInCourse: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    items: BulkEnrollCourseItem[],
  ) => Promise<{
    results: BulkEnrollCourseResult[];
    enrolledCount: number;
    failedCount: number;
  }>;
  bulkDeleteCourseMemberships: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    courseMembershipIds: string[],
  ) => Promise<{
    results: BulkDeleteMembershipResult[];
    deletedCount: number;
    failedCount: number;
  }>;
  importCourseRosterCsv: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    csv: string,
  ) => Promise<RosterImportSummary>;
  exportCourseRosterCsv: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<string>;
  listDiscussionGradebookEntries: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<DiscussionGradebookEntry[]>;
  listInboxThreads: (actorUserId: string, tenantId: string) => Promise<ConversationThread[]>;
  createInboxThread: (
    actorUserId: string,
    tenantId: string,
    input: {
      subject: string;
      body: string;
      participantIds: string[];
      courseId: string | null;
    },
  ) => Promise<ConversationThread>;
  listInboxThreadMessages: (
    actorUserId: string,
    tenantId: string,
    threadId: string,
  ) => Promise<ConversationMessage[]>;
  createInboxThreadMessage: (
    actorUserId: string,
    tenantId: string,
    threadId: string,
    input: { body: string },
  ) => Promise<ConversationMessage>;
  recordResourceView: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    resourceId: string,
  ) => Promise<CourseResourceViewEvent>;
  listResourceViews: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    resourceId: string,
  ) => Promise<CourseResourceViewEvent[]>;
  listScormPackages: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<ScormPackage[]>;
  createScormPackage: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateScormPackageApiInput,
  ) => Promise<ScormPackage>;
  upsertScormAttempt: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    scormPackageId: string,
    input: UpsertScormAttemptApiInput,
  ) => Promise<ScormAttempt>;
  initializeScormRuntime: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    scormPackageId: string,
  ) => Promise<ScormRuntimeState>;
  commitScormRuntime: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    scormPackageId: string,
    input: ScormRuntimeCommitApiInput,
  ) => Promise<ScormRuntimeState>;
  finishScormRuntime: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    scormPackageId: string,
    input: ScormRuntimeCommitApiInput,
  ) => Promise<ScormRuntimeState>;
  listPeerReviewResponses: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    peerReviewId: string,
  ) => Promise<AssignmentPeerReviewResponse[]>;
  upsertPeerReviewResponse: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    peerReviewId: string,
    criterionId: string,
    input: UpsertPeerReviewResponseApiInput,
  ) => Promise<AssignmentPeerReviewResponse>;
  listSectionMembers: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    sectionId: string,
  ) => Promise<CourseSectionMember[]>;
  listSectionInstructors: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    sectionId: string,
  ) => Promise<CourseSectionInstructor[]>;
  assignSectionMember: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    sectionId: string,
    studentId: string,
  ) => Promise<CourseSectionMember>;
  assignSectionInstructor: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    sectionId: string,
    instructorId: string,
  ) => Promise<CourseSectionInstructor>;
  removeSectionMember: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    sectionId: string,
    studentId: string,
  ) => Promise<void>;
  removeSectionInstructor: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    sectionId: string,
    instructorId: string,
  ) => Promise<void>;
  exportDiscussionGradebookCsv: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<string>;
  saveAssignmentDraft: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    draftId: string,
    blocks: DraftBlock[],
  ) => Promise<Draft>;
  submitAssignmentDraft: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    draftId: string,
    blocks: DraftBlock[],
  ) => Promise<Submission>;
  listAssignmentPeerReviews: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
  ) => Promise<AssignmentPeerReview[]>;
  listSubmissionAttachments: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    submissionId: string,
  ) => Promise<SubmissionAttachment[]>;
  createSubmissionAttachment: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    submissionId: string,
    input: CreateSubmissionAttachmentInput,
  ) => Promise<SubmissionAttachment>;
  downloadSubmissionAttachment: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    submissionId: string,
    attachmentId: string,
  ) => Promise<{ file: FileResource; bytes: Uint8Array }>;
  listSubmissionComments: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    submissionId: string,
  ) => Promise<SubmissionComment[]>;
  createSubmissionComment: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    submissionId: string,
    input: CreateSubmissionCommentInput,
  ) => Promise<SubmissionComment>;
  recordSubmissionPlagiarismReport: (
    actorUserId: string,
    tenantId: string,
    submissionId: string,
    input: RecordSubmissionPlagiarismReportApiInput,
  ) => Promise<SubmissionPlagiarismReport>;
  listSubmissionPlagiarismReports: (
    actorUserId: string,
    tenantId: string,
    submissionId: string,
  ) => Promise<SubmissionPlagiarismReport[]>;
  listCoursePlagiarismReports: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<SubmissionPlagiarismReport[]>;
  listGradebookEntries: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<GradebookEntry[]>;
  exportGradebookCsv: (actorUserId: string, tenantId: string, courseId: string) => Promise<string>;
  listCourseFinalGrades: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseFinalGrade[]>;
  exportCourseFinalGradesCsv: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<string>;
  submitCourseFinalGradesToSis: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: SubmitCourseFinalGradesToSisInput,
  ) => Promise<SisFinalGradeSubmissionContract>;
  listSubmissionGradeHistory: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    submissionId: string,
  ) => Promise<GradeHistory[]>;
  createGradeAppeal: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    submissionId: string,
    input: CreateGradeAppealApiInput,
  ) => Promise<GradeAppeal>;
  listGradeAppeals: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<GradeAppeal[]>;
  updateGradeAppeal: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    gradeAppealId: string,
    input: UpdateGradeAppealApiInput,
  ) => Promise<GradeAppeal>;
  listGradebookManualItems: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<GradebookManualItem[]>;
  createGradebookManualItem: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateGradebookManualItemInput,
  ) => Promise<GradebookManualItem>;
  updateGradebookManualItem: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    gradebookManualItemId: string,
    input: UpdateGradebookManualItemInput,
  ) => Promise<GradebookManualItem>;
  deleteGradebookManualItem: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    gradebookManualItemId: string,
  ) => Promise<void>;
  listGradebookManualGrades: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    gradebookManualItemId: string,
  ) => Promise<GradebookManualGrade[]>;
  saveGradebookManualGrade: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    gradebookManualItemId: string,
    studentId: string,
    input: SaveGradebookManualGradeInput,
  ) => Promise<GradebookManualGrade>;
  listGradebookCategories: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<GradebookCategory[]>;
  createGradebookCategory: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateGradebookCategoryInput,
  ) => Promise<GradebookCategory>;
  updateGradebookCategory: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    gradebookCategoryId: string,
    input: UpdateGradebookCategoryInput,
  ) => Promise<GradebookCategory>;
  deleteGradebookCategory: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    gradebookCategoryId: string,
  ) => Promise<void>;
  listCourseGradingSchemes: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseGradingScheme[]>;
  createCourseGradingScheme: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCourseGradingSchemeInput,
  ) => Promise<CourseGradingScheme>;
  listCourseExternalTools: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseExternalTool[]>;
  getLti1p3JsonWebKeySet: (tenantId: string) => Promise<Lti1p3JsonWebKeySet>;
  launchCourseExternalToolLti1p3: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    toolId: string,
  ) => Promise<Lti1p3OidcLoginInitiation>;
  launchCourseExternalToolLti1p3DeepLinking: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    toolId: string,
  ) => Promise<Lti1p3OidcLoginInitiation>;
  createCourseExternalToolLti1p3LaunchAuthorizationResponse: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    toolId: string,
    input: Lti1p3LaunchAuthorizationRequestContract,
  ) => Promise<Lti1p3LaunchAuthorizationResponse>;
  authorizeLti1p3OidcLaunch: (
    sessionToken: string,
    input: Lti1p3OidcAuthorizationRequestContract,
  ) => Promise<Lti1p3LaunchAuthorizationResponse>;
  createLti1p3ServiceAccessToken: (
    tenantId: string,
    input: Lti1p3ServiceTokenRequest,
  ) => Promise<Lti1p3ServiceAccessToken>;
  getLti1p3NamesRolesMemberships: (
    accessToken: string,
    tenantId: string,
    courseId: string,
    role?: Lti1p3NamesRolesRole,
  ) => Promise<Lti1p3NamesRolesMembershipContainer>;
  publishLti1p3AgsScore: (
    accessToken: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    toolId: string,
    score: Lti1p3AgsScore,
  ) => Promise<void>;
  listLti1p3AgsResults: (
    accessToken: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    toolId: string,
    userId?: string,
  ) => Promise<Lti1p3AgsResultContainer>;
  processLti1p3DeepLinkingReturn: (jwt: string) => Promise<Lti1p3DeepLinkingReturnResult>;
  createCourseExternalTool: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCourseExternalToolInput,
  ) => Promise<CourseExternalTool>;
  updateCourseExternalTool: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    toolId: string,
    input: UpdateCourseExternalToolInput,
  ) => Promise<CourseExternalTool>;
  deleteCourseExternalTool: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    toolId: string,
  ) => Promise<void>;
  recordCourseExternalToolOutcome: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    input: RecordCourseExternalToolOutcomeApiInput,
  ) => Promise<CourseExternalToolOutcome>;
  listCourseExternalToolOutcomes: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
  ) => Promise<CourseExternalToolOutcome[]>;
  listCourseModules: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseModule[]>;
  createCourseModule: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCourseModuleInput,
  ) => Promise<CourseModule>;
  updateCourseModule: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    courseModuleId: string,
    input: UpdateCourseModuleInput,
  ) => Promise<CourseModule>;
  deleteCourseModule: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    courseModuleId: string,
  ) => Promise<void>;
  listCourseUnits: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string | undefined,
  ) => Promise<CourseUnit[]>;
  createCourseUnit: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCourseUnitInput,
  ) => Promise<CourseUnit>;
  updateCourseUnit: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    courseUnitId: string,
    input: UpdateCourseUnitInput,
  ) => Promise<CourseUnit>;
  deleteCourseUnit: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    courseUnitId: string,
  ) => Promise<void>;
  createCourseResource: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCourseResourceInput,
  ) => Promise<CourseResource>;
  updateCourseResource: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    courseResourceId: string,
    input: UpdateCourseResourceInput,
  ) => Promise<CourseResource>;
  deleteCourseResource: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    courseResourceId: string,
  ) => Promise<void>;
  listCourseResources: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string | undefined,
    unitId: string | undefined,
  ) => Promise<CourseResource[]>;
  listLearningObjectives: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<LearningObjective[]>;
  getLearningObjectiveCoverage: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    learningObjectiveId: string,
  ) => Promise<LearningObjectiveCoverage>;
  createLearningObjective: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateLearningObjectiveInput,
  ) => Promise<LearningObjective>;
  updateLearningObjective: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    learningObjectiveId: string,
    input: UpdateLearningObjectiveInput,
  ) => Promise<LearningObjective>;
  deleteLearningObjective: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    learningObjectiveId: string,
  ) => Promise<void>;
  listLearningObjectiveMastery: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<LearningObjectiveMastery[]>;
  listCoursePages: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CoursePage[]>;
  createCoursePage: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCoursePageInput,
  ) => Promise<CoursePage>;
  updateCoursePage: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    coursePageId: string,
    input: UpdateCoursePageInput,
  ) => Promise<CoursePage>;
  deleteCoursePage: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    coursePageId: string,
  ) => Promise<void>;
  getCourseSyllabus: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseSyllabus>;
  upsertCourseSyllabus: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: UpsertCourseSyllabusInput,
  ) => Promise<CourseSyllabus>;
  listDiscussionTopics: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string | undefined,
    unitId: string | undefined,
  ) => Promise<DiscussionTopic[]>;
  createDiscussionTopic: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateDiscussionTopicInput,
  ) => Promise<DiscussionTopic>;
  updateDiscussionTopic: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    topicId: string,
    input: UpdateDiscussionTopicInput,
  ) => Promise<DiscussionTopic>;
  deleteDiscussionTopic: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    topicId: string,
  ) => Promise<void>;
  listDiscussionPosts: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    topicId: string,
  ) => Promise<DiscussionPost[]>;
  createDiscussionPost: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    topicId: string,
    input: CreateDiscussionPostInput,
  ) => Promise<DiscussionPost>;
  subscribeToDiscussionTopic: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    topicId: string,
  ) => Promise<DiscussionTopicSubscription>;
  unsubscribeFromDiscussionTopic: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    topicId: string,
  ) => Promise<void>;
  updateDiscussionPost: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    topicId: string,
    postId: string,
    input: UpdateDiscussionPostInput,
  ) => Promise<DiscussionPost>;
  deleteDiscussionPost: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    topicId: string,
    postId: string,
  ) => Promise<void>;
  listDiscussionPostGrades: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    topicId: string,
    studentId: string | undefined,
  ) => Promise<DiscussionPostGrade[]>;
  upsertDiscussionPostGrade: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    topicId: string,
    postId: string,
    input: UpsertDiscussionPostGradeInput,
  ) => Promise<DiscussionPostGrade>;
  listGlossaryEntries: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<GlossaryEntry[]>;
  createGlossaryEntry: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateGlossaryEntryInput,
  ) => Promise<GlossaryEntry>;
  updateGlossaryEntry: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    glossaryEntryId: string,
    input: UpdateGlossaryEntryInput,
  ) => Promise<GlossaryEntry>;
  deleteGlossaryEntry: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    glossaryEntryId: string,
  ) => Promise<void>;
  listWikiPages: (actorUserId: string, tenantId: string, courseId: string) => Promise<WikiPage[]>;
  createWikiPage: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateWikiPageInput,
  ) => Promise<WikiPage>;
  updateWikiPage: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    wikiPageId: string,
    input: UpdateWikiPageInput,
  ) => Promise<WikiPage>;
  deleteWikiPage: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    wikiPageId: string,
  ) => Promise<void>;
  listWikiPageRevisions: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    wikiPageId: string,
  ) => Promise<WikiPageRevision[]>;
  getWikiPageRevisionDiff: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    wikiPageId: string,
    baseRevision: number,
    targetRevision: number,
  ) => Promise<WikiPageRevisionDiff>;
  restoreWikiPageRevision: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    wikiPageId: string,
    revision: number,
    input: RestoreWikiPageRevisionInput,
  ) => Promise<WikiPage>;
  listSurveys: (actorUserId: string, tenantId: string, courseId: string) => Promise<Survey[]>;
  createSurvey: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateSurveyInput,
  ) => Promise<Survey>;
  updateSurvey: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    surveyId: string,
    input: UpdateSurveyInput,
  ) => Promise<Survey>;
  deleteSurvey: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    surveyId: string,
  ) => Promise<void>;
  listSurveyQuestions: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    surveyId: string,
  ) => Promise<SurveyQuestion[]>;
  createSurveyQuestion: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    surveyId: string,
    input: CreateSurveyQuestionInput,
  ) => Promise<SurveyQuestion>;
  listSurveyResponses: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    surveyId: string,
  ) => Promise<SurveyResponse[]>;
  submitSurveyResponse: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    surveyId: string,
    input: SubmitSurveyResponseInput,
  ) => Promise<SurveyResponse>;
  getCoursePage: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    pageId: string,
  ) => Promise<CoursePage>;
  listCalendarItems: (
    actorUserId: string,
    tenantId: string,
    from: Date,
    to: Date,
  ) => Promise<CalendarItem[]>;
  exportCalendarIcs: (
    actorUserId: string,
    tenantId: string,
    from: Date,
    to: Date,
  ) => Promise<string>;
  listCourseCalendarEvents: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseCalendarEvent[]>;
  listCourseCalendarEventOccurrences: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: ListCourseCalendarEventOccurrencesInput,
  ) => Promise<CourseCalendarEventOccurrence[]>;
  createCourseCalendarEvent: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCourseCalendarEventInput,
  ) => Promise<CourseCalendarEvent>;
  updateCourseCalendarEvent: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    eventId: string,
    input: UpdateCourseCalendarEventInput,
  ) => Promise<CourseCalendarEvent>;
  deleteCourseCalendarEvent: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    eventId: string,
  ) => Promise<void>;
  listCourseMeetings: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<CourseMeeting[]>;
  createCourseMeeting: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    input: CreateCourseMeetingInput,
  ) => Promise<CourseMeeting>;
  updateCourseMeeting: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    meetingId: string,
    input: UpdateCourseMeetingInput,
  ) => Promise<CourseMeeting>;
  deleteCourseMeeting: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    meetingId: string,
  ) => Promise<void>;
  listNotifications: (actorUserId: string, tenantId: string) => Promise<NotificationRecord[]>;
  listNotificationPreferences: (
    actorUserId: string,
    tenantId: string,
  ) => Promise<NotificationPreference[]>;
  upsertNotificationPreference: (
    actorUserId: string,
    tenantId: string,
    input: UpsertNotificationPreferenceApiInput,
  ) => Promise<NotificationPreference>;
  listMyPushTokens: (actorUserId: string, tenantId: string) => Promise<UserPushToken[]>;
  registerMyPushToken: (
    actorUserId: string,
    tenantId: string,
    input: RegisterPushTokenInput,
  ) => Promise<UserPushToken>;
  revokeMyPushToken: (actorUserId: string, tenantId: string, tokenId: string) => Promise<void>;
  listFiles: (actorUserId: string, tenantId: string, courseId?: string) => Promise<FileResource[]>;
  getFile: (actorUserId: string, tenantId: string, fileId: string) => Promise<FileResource>;
  uploadFile: (
    actorUserId: string,
    tenantId: string,
    input: CreateFileUpload,
  ) => Promise<FileResource>;
  downloadFile: (
    actorUserId: string,
    tenantId: string,
    fileId: string,
  ) => Promise<{ file: FileResource; bytes: Uint8Array }>;
  deleteFile: (actorUserId: string, tenantId: string, fileId: string) => Promise<void>;
  markNotificationRead: (
    actorUserId: string,
    tenantId: string,
    notificationId: string,
  ) => Promise<NotificationRecord>;
  listModuleReleaseRules: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string,
    targetType: ModuleReleaseTargetType | undefined,
    targetId: string | undefined,
  ) => Promise<ModuleReleaseRule[]>;
  createModuleReleaseRule: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string,
    input: ModuleReleaseRuleInput,
  ) => Promise<ModuleReleaseRule>;
  updateModuleReleaseRule: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string,
    ruleId: string,
    input: ModuleReleaseRuleInput,
  ) => Promise<ModuleReleaseRule>;
  deleteModuleReleaseRule: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string,
    ruleId: string,
  ) => Promise<void>;
  upsertModuleReleasePolicy: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string,
    combinator: ModuleReleaseCombinator,
  ) => Promise<ModuleReleasePolicy>;
  getModuleReleasePolicy: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string,
  ) => Promise<ModuleReleasePolicy>;
  listModuleReleaseOverrides: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string,
  ) => Promise<ModuleReleaseOverride[]>;
  upsertModuleReleaseOverride: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string,
    studentId: string,
    input: ModuleReleaseOverrideInput,
  ) => Promise<ModuleReleaseOverride>;
  removeModuleReleaseOverride: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    moduleId: string,
    studentId: string,
  ) => Promise<void>;
  getMyModuleReleaseStatus: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ) => Promise<ModuleReleaseDecision[]>;
  getStudentModuleReleaseStatus: (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    studentId: string,
  ) => Promise<ModuleReleaseDecision[]>;
  close: () => Promise<void>;
};

export type ModuleReleaseRuleInput = {
  targetType: ModuleReleaseTargetType;
  targetId: string | null;
  ruleType: ModuleReleaseRuleType;
  config: ModuleReleaseRule['config'];
  position: number;
  status: ModuleReleaseRuleStatus;
};

export type ModuleReleaseOverrideInput = {
  state: ModuleReleaseOverrideState;
  reason: string | null;
  expiresAt: Date | null;
};

export type AuditLogQueryInput = {
  category?: AuditCategory;
  action?: string;
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  from?: Date;
  to?: Date;
  limit: number;
};

export type ApiEnvironment = {
  DATABASE_CONNECTION_STRING?: string;
  FILE_STORAGE_ROOT?: string;
  ENCRYPTION_KEY_BASE64?: string;
  LTI_PRIVATE_KEY_ENCRYPTION_KEY?: string;
  WEBHOOK_SIGNING_SECRET_ENCRYPTION_KEY?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
};

type CourseContentItem = Pick<
  CourseModule | CourseUnit | CourseResource,
  'visibility' | 'accessPolicy'
>;
type LearningObjectiveItem = Pick<LearningObjective, 'status'>;
type CoursePageItem = Pick<CoursePage, 'visibility'>;
type CourseSyllabusItem = Pick<CourseSyllabus, 'visibility'>;
type CourseSectionItem = Pick<CourseSection, 'status'>;
type DiscussionTopicItem = Pick<DiscussionTopic, 'visibility'>;
type DiscussionPostItem = Pick<DiscussionPost, 'authorId' | 'status'>;
type QuizItem = Pick<Quiz, 'status'>;
type AttendanceSessionItem = Pick<AttendanceSession, 'status'>;
type CompletionRequirementItem = Pick<CompletionRequirement, 'status'>;
type CourseCredentialItem = Pick<CourseCredential, 'status'>;
type ConversationThreadItem = { participantIds: string[] };
type CourseGroupItem = Pick<CourseGroup, 'status'>;
type AssignmentItem = Pick<Assignment, 'status'>;
type AssignmentRubricItem = Pick<Assignment, 'activeRubricId' | 'courseId' | 'status'>;
type SubmissionItem = Pick<Submission, 'studentId'> & Partial<Pick<Submission, 'groupId'>>;
type SubmissionAttachmentItem = Pick<Submission, 'studentId' | 'groupId'>;

export type SaveGradebookManualGradeInput = {
  score: number;
  status: Extract<GradeStatus, 'draft' | 'published' | 'incomplete'>;
};

export type CreateCourseMembershipInput = {
  userId: string;
  role: CourseRole;
  status?: CourseMembershipStatus;
};

export type UpdateCourseMembershipInput = {
  role?: CourseRole;
  status?: CourseMembershipStatus;
};

export type SelfEnrollInCourseInput = {
  enrollmentCode: string;
};

export type UpdateCourseCatalogSettingsInput = {
  catalogVisibility: CatalogVisibility;
  enrollmentCode: string | null;
  catalogCategory: string | null;
  academicTerm: string | null;
  maxEnrollments?: number | null;
  waitlistEnabled?: boolean;
  enrollmentApprovalRequired?: boolean;
};

export type CreateCourseSectionInput = {
  name: string;
  status: CourseSectionStatus;
  position: number;
  meetingDays: CourseSectionMeetingDay[];
  meetingStartTime: string | null;
  meetingEndTime: string | null;
  location: string | null;
};

export type UpdateCourseSectionInput = CreateCourseSectionInput;

export type CreateDiscussionPostInput = {
  body: string;
  parentPostId?: string | null;
  status?: 'draft' | 'published';
};

export type UpdateDiscussionPostInput = {
  body: string;
  status?: 'draft' | 'published';
};

export type CreateDiscussionTopicInput = {
  moduleId: string | null;
  unitId: string | null;
  title: string;
  prompt: string | null;
  visibility: DiscussionTopicVisibility;
  position: number;
  gradingEnabled?: boolean;
  pointsPossible?: number | null;
  rubricId?: string | null;
};

export type UpdateDiscussionTopicInput = CreateDiscussionTopicInput;

export type UpsertDiscussionPostGradeInput = {
  score: number;
  maxScore: number;
  status: DiscussionPostGradeStatus;
  comment: string | null;
};

export type CreateGlossaryEntryInput = {
  term: string;
  definition: string;
  status: GlossaryEntryStatus;
};

export type UpdateGlossaryEntryInput = {
  term: string;
  definition: string;
  status: GlossaryEntryStatus;
};

export type CreateWikiPageInput = {
  slug: string;
  title: string;
  content: string;
  status: WikiPageStatus;
  learningObjectiveIds?: string[];
};

export type UpdateWikiPageInput = {
  title: string;
  content: string;
  status: WikiPageStatus;
  learningObjectiveIds?: string[];
  summary: string | null;
};

export type RestoreWikiPageRevisionInput = {
  summary: string | null;
};

export type CreateSurveyInput = {
  title: string;
  description: string | null;
  status: SurveyStatus;
  opensAt: Date | null;
  closesAt: Date | null;
  allowsAnonymousResponses: boolean;
};

export type UpdateSurveyInput = CreateSurveyInput;

export type CreateSurveyQuestionInput = {
  position: number;
  questionType: SurveyQuestionType;
  prompt: string;
  required: boolean;
  choices: SurveyQuestionChoice[];
};

export type SubmitSurveyResponseInput = {
  surveyQuestionId: string;
  answer: SurveyResponseAnswer;
};

export type CreateCourseAnnouncementInput = {
  title: string;
  body: string;
  status: Extract<CourseAnnouncementStatus, 'draft' | 'published'>;
  pinned: boolean;
};

export type UpdateCourseAnnouncementInput = CreateCourseAnnouncementInput;

export type CreateCourseCalendarEventInput = {
  title: string;
  description: string | null;
  location: string | null;
  startsAt: Date;
  endsAt: Date | null;
  visibility: CourseCalendarEventVisibility;
  recurrenceRule: string | null;
};

export type UpdateCourseCalendarEventInput = CreateCourseCalendarEventInput;

export type ListCourseCalendarEventOccurrencesInput = {
  windowStart: Date;
  windowEnd: Date;
};

export type CreateCourseMeetingInput = {
  title: string;
  description: string | null;
  provider: CourseMeetingProvider;
  externalUrl: string;
  startsAt: Date;
  endsAt: Date | null;
  recordingUrl: string | null;
  playbackUrl: string | null;
  status: CourseMeetingStatus;
};

export type UpdateCourseMeetingInput = CreateCourseMeetingInput;

export type RecordAttendanceRecordInput = {
  status: AttendanceRecordStatus;
  note: string | null;
};

export type CreateAttendanceSessionInput = {
  title: string;
  startsAt: Date;
  endsAt: Date;
  status: AttendanceSessionStatus;
};

export type CreateCourseInput = {
  code: string;
  title: string;
  status: Exclude<Course['status'], 'deleted'>;
  startsAt: Date | null;
  endsAt: Date | null;
  catalogCategory?: string | null;
  academicTerm?: string | null;
  isBlueprint?: boolean;
};

export type UpdateCourseDependencyInput = {
  code: string;
  title: string;
  status: Exclude<Course['status'], 'deleted'>;
  startsAt: Date | null;
  endsAt: Date | null;
  catalogCategory?: string | null;
  academicTerm?: string | null;
  isBlueprint?: boolean;
};

export type ApiNextPositionScope =
  | { kind: 'course_module' }
  | { kind: 'course_section' }
  | { kind: 'course_unit'; moduleId: string }
  | { kind: 'gradebook_category' };

export type ReorderCourseContentInput = {
  scope: ApiNextPositionScope;
  orderedIds: readonly string[];
};

export type CopyCourseInput = {
  targetCourseId: string;
};

export type RestoreCourseBackupInput = {
  backup: CourseBackup;
};

export type CreateAssignmentInput = {
  moduleId: string | null;
  unitId: string | null;
  position: number | null;
  title: string;
  instructions: string;
  status: AssignmentStatus;
  dueAt: Date | null;
  allowResubmission: boolean;
  activeRubricId: string | null;
  aiSettings: AssignmentAiSettings;
  extraCredit?: boolean;
  anonymousGradingEnabled?: boolean;
  groupSubmissionEnabled?: boolean;
  groupSetId?: string | null;
  allowedFileExtensions?: string[];
  maxFileSizeBytes?: number | null;
};

export type UpdateAssignmentInput = CreateAssignmentInput;

export type CreateCourseModuleInput = {
  title: string;
  summary: string | null;
  visibility: CourseModule['visibility'];
  accessPolicy: CourseModule['accessPolicy'];
  position: number;
  learningObjectiveIds: string[];
};

export type UpdateCourseModuleInput = CreateCourseModuleInput;

export type CreateCourseUnitInput = {
  moduleId: string;
  title: string;
  summary: string | null;
  visibility: CourseUnit['visibility'];
  accessPolicy: CourseUnit['accessPolicy'];
  position: number;
  learningObjectiveIds: string[];
};

export type UpdateCourseUnitInput = CreateCourseUnitInput;

export type CreateCourseResourceInput = {
  moduleId: string | null;
  unitId: string | null;
  resourceType: CourseResource['resourceType'];
  title: string;
  body: string;
  sourceUri: string | null;
  visibility: CourseResource['visibility'];
  accessPolicy: CourseResource['accessPolicy'];
  position: number;
  learningObjectiveIds: string[];
};

export type UpdateCourseResourceInput = CreateCourseResourceInput;

export type CreateCoursePageInput = {
  title: string;
  body: string;
  visibility: CoursePageVisibility;
  learningObjectiveIds: string[];
};

export type UpdateCoursePageInput = CreateCoursePageInput;

export type CreateCourseGroupSetInput = {
  name: string;
  selfSignupEnabled: boolean;
  status: CourseGroupSetStatus;
  position: number;
};

export type CreateCourseGroupInput = {
  groupSetId: string;
  name: string;
  description: string | null;
  status: CourseGroupStatus;
  position: number;
};

export type CreateCourseGroupMemberInput = {
  userId: string;
  role: CourseGroupMemberRole;
};

export type CreateQuestionBankInput = {
  title: string;
  description: string | null;
  status: QuestionBankStatus;
};

export type UpdateQuestionBankInput = CreateQuestionBankInput;

export type CreateQuestionBankQuestionInput = {
  position: number;
  questionType: QuizQuestionType;
  prompt: string;
  points: number;
  choices: QuizQuestionChoice[];
};

export type CreateQuizQuestionInput = {
  position: number;
  questionType: QuizQuestionType;
  prompt: string;
  points: number;
  choices: QuizQuestionChoice[];
  answerKey?: QuizQuestionAnswerKey | null;
};

export type CreateCourseGradingSchemeInput = {
  name: string;
  status: CourseGradingSchemeStatus;
  entries: CourseGradingSchemeEntry[];
};

export type CreateQuizInput = {
  moduleId: string | null;
  unitId: string | null;
  position: number | null;
  title: string;
  description: string | null;
  status: QuizStatus;
  opensAt: Date | null;
  closesAt: Date | null;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  maxAttempts: number;
  accessPassword?: string | null;
  allowedIpRanges?: string[];
};

export type UpdateQuizInput = CreateQuizInput;

export type StartQuizAttemptInput = {
  accessPassword?: string | null;
  clientIp?: string | null;
};

export type CreateQuizOverrideApiInput = {
  targetType: QuizOverrideTargetType;
  targetId: string;
  opensAt: Date | null;
  closesAt: Date | null;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  status: QuizOverrideStatus;
};

export type UpdateQuizOverrideApiInput = {
  opensAt: Date | null;
  closesAt: Date | null;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  status: QuizOverrideStatus;
};

export type CreateCourseCredentialInput = {
  credentialType: CourseCredentialType;
  title: string;
  description: string | null;
  criteriaSummary: string;
  status: CourseCredentialStatus;
  imageUrl: string | null;
};

export type UpdateCourseCredentialInput = CreateCourseCredentialInput;

export type CreateCredentialAwardInput = {
  studentId: string;
  status: CredentialAwardStatus;
  issuedAt: Date;
  revokedAt: Date | null;
  expiresAt: Date | null;
};

export type CreateCompletionRequirementInput = {
  title: string;
  description: string | null;
  moduleId: string | null;
  requirementType: CompletionRequirementType;
  targetType: CompletionTargetType;
  targetId: string | null;
  minScorePercent: number | null;
  status: CompletionRequirement['status'];
  required: boolean;
  position: number;
};

export type CreateCourseExternalToolInput = {
  integrationConnectionId: string;
  name: string;
  description: string | null;
  launchUrl: string;
  placement: CourseExternalToolPlacement;
  status: CourseExternalToolStatus;
};

export type UpdateCourseExternalToolInput = CreateCourseExternalToolInput;

export type RecordCourseExternalToolOutcomeApiInput = {
  studentId: string;
  externalToolId: string;
  score: number;
  maxScore: number;
  status: CourseExternalToolOutcomeStatus;
  reportedAt: Date;
};

export type RecordSubmissionPlagiarismReportApiInput = {
  integrationConnectionId: string;
  similarityPercent: number;
  reportUrl: string | null;
  status: SubmissionPlagiarismReportStatus;
  checkedAt: Date;
};

export type RegisterPushTokenInput = {
  platform: UserPushTokenPlatform;
  token: string;
  locale: string | null;
  appVersion: string | null;
};

export type CreateConversationMessageApiInput = {
  body: string;
};

export type CreateConversationThreadApiInput = {
  subject: string;
  participantIds: string[];
  body: string;
};

export type UpsertSubmissionGradeApiInput = {
  score: number;
  maxScore: number;
  status: GradeStatus;
};

export type AssignmentSubmissionListItem = Omit<Submission, 'studentId'> & {
  studentId: Submission['studentId'] | null;
};

export type CreateGradeAppealApiInput = {
  reason: string;
};

export type SubmitCourseFinalGradesToSisInput = {
  integrationConnectionId: string;
};

export type UpdateGradeAppealApiInput = {
  status: GradeAppealStatus;
  resolution: string | null;
};

export type BatchUpsertSubmissionGradeItem = {
  submissionId: SubmissionId;
  score: number;
  maxScore: number;
  status: GradeStatus;
};

export type BatchUpsertSubmissionGradeResult = {
  submissionId: SubmissionId;
  status: 'saved' | 'failed';
  grade: Grade | null;
  error: string | null;
};

export type BulkEnrollCourseItem = {
  userId: UserId;
  role: CourseRole;
  status?: CourseMembershipStatus;
};

export type BulkEnrollCourseResult = {
  userId: UserId;
  status: 'enrolled' | 'failed';
  membership: CourseMembership | null;
  error: string | null;
};

export type BulkDeleteMembershipResult = {
  courseMembershipId: CourseMembershipId;
  status: 'deleted' | 'failed';
  error: string | null;
};

export type CreateScormPackageApiInput = {
  title: string;
  scormVersion: '1.2' | '2004';
  launchUrl: string;
  manifest: Record<string, unknown>;
  status: 'draft' | 'published' | 'archived';
};

export type UpsertScormAttemptApiInput = {
  completionStatus: 'not_attempted' | 'incomplete' | 'completed';
  successStatus: 'unknown' | 'passed' | 'failed';
  scoreScaled: number | null;
  totalTimeSeconds: number | null;
  suspendData: string | null;
};

export type ScormRuntimeCommitApiInput = ScormRuntimeCommit;

export type UpsertPeerReviewResponseApiInput = {
  score: number | null;
  comment: string | null;
  status: 'draft' | 'submitted';
};

export type UpdateAssignmentOverrideApiInput = {
  opensAt: Date | null;
  dueAt: Date | null;
  closesAt: Date | null;
  status: AssignmentOverrideStatus;
};

export type UpsertNotificationPreferenceApiInput = {
  category: NotificationCategory;
  channel: NotificationChannel;
  frequency: NotificationFrequency;
};

export type UpdateTenantMembershipApiInput = {
  role: TenantRole;
};

export type UpdateTenantFileStorageQuotasApiInput = {
  storageByteLimit: number | null;
  defaultUserStorageByteLimit: number | null;
};

export type CreateWebhookSubscriptionApiInput = {
  name: string;
  endpointUrl: string;
  topics: string[];
  status: WebhookSubscription['status'];
  signingSecret: string;
};

export type UpdateWebhookSubscriptionApiInput = {
  name: string;
  endpointUrl: string;
  topics: string[];
  status: WebhookSubscription['status'];
  signingSecret?: string;
};

export type UpsertTenantFeatureFlagApiInput = {
  enabled: boolean;
  description: string | null;
};

export type UpsertProviderConfigApiInput = {
  providerType: AiProviderType;
  baseUrl: string | null;
  apiKey?: string;
  modelPreferences: ModelPreferences;
  capabilities: ProviderCapabilities;
  quota: ProviderQuota;
};

export type ListUserLegalHoldsApiInput = {
  userId?: string;
  status?: 'active' | 'released' | 'all';
};

export type CreateUserLegalHoldApiInput = {
  userId: string;
  reason: string;
};

export type UpsertRetentionPolicyApiInput = {
  retainDays: number;
};

export type CreateAssignmentOverrideApiInput = {
  targetType: AssignmentOverrideTargetType;
  targetId: string;
  opensAt: Date | null;
  dueAt: Date | null;
  closesAt: Date | null;
  status: AssignmentOverrideStatus;
};

export type UpdateCurrentUserApiInput = {
  displayName?: string;
  locale?: string | null;
  timezone?: string | null;
};

export type CreateGradebookCategoryInput = {
  name: string;
  position: number;
  weightPercent: number | null;
  dropLowest: number;
  status: GradebookCategoryStatus;
};

export type UpdateGradebookCategoryInput = CreateGradebookCategoryInput;

export type CreateGradebookManualItemInput = {
  gradebookCategoryId: string | null;
  title: string;
  description: string | null;
  maxScore: number;
  dueAt: Date | null;
  position: number;
  status: GradebookManualItemStatus;
  extraCredit?: boolean;
};

export type UpdateGradebookManualItemInput = CreateGradebookManualItemInput;

export type UpsertCourseSyllabusInput = {
  body: string;
  visibility: CourseSyllabus['visibility'];
};

export type CreateLearningObjectiveInput = {
  code: string;
  title: string;
  description: string | null;
  status: LearningObjectiveStatus;
  position: number;
};

export type UpdateLearningObjectiveInput = CreateLearningObjectiveInput;

export type CreateRubricInput = {
  title: string;
  sourceTemplateId: string | null;
  criteria: Array<
    Omit<RubricCriterion, 'learningObjectiveIds'> & {
      learningObjectiveIds?: RubricCriterion['learningObjectiveIds'];
    }
  >;
};

export type UpdateRubricInput = CreateRubricInput;

export type CreateSubmissionCommentInput = {
  body: string;
  visibility: SubmissionCommentVisibility;
};

export type CreateSubmissionAttachmentInput = {
  fileResourceId: string;
  displayName: string | null;
};

const isQuizAttemptStartConflict = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'quiz_attempt_tenant_quiz_student_attempt_uq';
};

const isQuizAllowedIpRangeInvalid = (error: unknown): boolean =>
  error instanceof Error &&
  error.message === 'Quiz allowed IP ranges must be IPv4 addresses or CIDR ranges.';

const quizAttemptNotInProgressMessage =
  'Only in-progress quiz attempts can be submitted. Start a new attempt if allowed.';

const quizNotOpenMessage = 'Quiz is not open yet. Check the opening time and retry later.';
const quizClosedMessage = 'Quiz availability window has closed. Ask an instructor for next steps.';
const quizTimeLimitExpiredMessage =
  'Quiz time limit has expired. Ask an instructor for next steps.';
const quizAccessPasswordMessage =
  'Quiz access password is required or incorrect. Enter the quiz access password and retry.';
const quizIpRangeMessage =
  'Quiz attempt is restricted to approved networks. Connect from an approved network and retry.';
const assignmentNotFoundMessage =
  'Assignment was not found in this course. Check the assignment id and retry the request.';
const learnerAssignmentWorkflowMessage =
  'Only learners can save assignment drafts through the learner workflow.';
const assignmentResubmissionDisabledMessage =
  'This assignment does not allow resubmission. Review your existing submission or ask an instructor for next steps.';
const assignmentDraftOwnershipMessage =
  'Assignment draft was not found for this learner and assignment. Check the draft id and retry the request.';
const assignmentSubmissionRaceMessage =
  'A submission was already created. Refresh submissions and retry if another attempt is allowed.';
const manualGradebookItemNotFoundMessage =
  'Manual gradebook item was not found in this course. Check the item id and retry the request.';
const manualGradebookStaffOnlyMessage =
  'Only course staff can record manual gradebook grades. Ask an instructor for access.';
const manualGradebookScoreTooHighMessage =
  'Score cannot exceed the manual gradebook item max score. Enter a score less than or equal to the item max score.';
const manualGradebookStudentNotFoundMessage =
  'Student was not found in this course. Check the student id and retry the request.';
const courseMembershipDuplicateMessage =
  'Course membership already exists for this user and role. Refresh memberships and retry only if another role is needed.';
const courseMembershipTenantMemberRequiredMessage =
  'User is not a member of this tenant. Add the user to the tenant before creating a course membership.';
const courseMembershipNotFoundMessage =
  'Course membership was not found in this course. Check the membership id and retry the request.';
const courseMembershipStaffOnlyMessage =
  'Only course staff can manage course memberships. Ask an instructor for access.';
const discussionTopicNotFoundMessage =
  'Discussion topic was not found in this course. Check the topic id and retry the request.';
const discussionParentPostNotFoundMessage =
  'Parent discussion post was not found in this topic. Check the parent post id and retry the request.';
const discussionPostNotFoundMessage =
  'Discussion post was not found in this topic. Check the post id and retry the request.';
const discussionPostAuthorOrStaffOnlyMessage =
  'Only the author or course staff can modify this discussion post.';
const courseMissingMessage =
  'Course was not found in this tenant. Check the course id and retry the request.';
const discussionTopicStaffOnlyMessage =
  'Only course staff can create discussion topics. Ask an instructor for access.';
const discussionTopicPlacementMissingMessage =
  'Discussion topic placement was not found in this course. Check the module and unit ids and retry the request.';
const coursePageStaffOnlyMessage =
  'Only course staff can create course pages. Ask an instructor for access.';
const courseModuleStaffOnlyMessage =
  'Only course staff can create course modules. Ask an instructor for access.';
const courseUnitStaffOnlyMessage =
  'Only course staff can create course units. Ask an instructor for access.';
const courseUnitModuleMissingMessage =
  'Course module was not found in this tenant. Check the module id and retry the request.';
const courseResourceStaffOnlyMessage =
  'Only course staff can create course resources. Ask an instructor for access.';
const courseResourceUnitMissingMessage =
  'Course unit was not found in this tenant. Check the unit id and retry the request.';
const courseResourceModuleUnitMismatchMessage =
  'Course unit does not belong to the specified module. Check the module and unit ids and retry the request.';
const learningObjectiveStaffOnlyMessage =
  'Only course staff can create learning objectives. Ask an instructor for access.';
const learningObjectiveDuplicateCodeMessage =
  'Learning objective code already exists in this course. Choose a unique code and retry the request.';
const attendanceRecordStaffOnlyMessage =
  'Only course staff can record attendance. Ask an instructor for access.';
const attendanceSessionStaffOnlyMessage =
  'Only course staff can create attendance sessions. Ask an instructor for access.';
const attendanceSessionNotFoundMessage =
  'Attendance session was not found in this course. Check the session id and retry the request.';
const attendanceStudentNotFoundMessage =
  'Student was not found in this course. Check the student id and retry the request.';
const submissionNotFoundMessage =
  'Submission was not found in this assignment. Check the submission id and retry the request.';
const submissionAttachmentFileNotFoundMessage =
  'File metadata was not found. Check the file id and retry the request.';
const submissionAttachmentFileAccessMessage =
  'Only the file owner or course staff with access to the course library file can attach this file.';
const submissionAttachmentFileTypeMessage =
  'File type is not allowed for this assignment. Upload a file with an allowed extension and retry.';
const submissionAttachmentFileSizeMessage =
  'File is larger than this assignment allows. Upload a smaller file and retry.';
const tenantFileStorageQuotaExceededMessage =
  'Tenant file storage quota would be exceeded. Delete files or ask an administrator to increase the quota.';
const userFileStorageQuotaExceededMessage =
  'User file storage quota would be exceeded. Delete files or ask an administrator to increase the quota.';
const tenantFileStorageQuotaAdminOnlyMessage =
  'Only institution admins can manage tenant file storage quotas. Ask an administrator for access.';
const webhookSubscriptionAdminOnlyMessage =
  'Only institution admins can manage tenant webhook subscriptions. Ask an administrator for access.';
const webhookSigningSecretEncryptionKeyMessage =
  'Webhook signing secret encryption is not configured. Set WEBHOOK_SIGNING_SECRET_ENCRYPTION_KEY and retry.';
const learnerSubmissionCommentVisibilityMessage =
  'Learners can only create comments that are visible to students.';
const peerReviewerSubmissionCommentVisibilityMessage =
  'Peer reviewers can only create comments that are visible to assigned peer reviewers.';
const courseSectionStaffOnlyMessage =
  'Only course staff can create course sections. Ask an instructor for access.';
const courseSectionNotFoundMessage =
  'Course section was not found in this course. Check the section id and retry the request.';
const courseTenantStaffOnlyMessage =
  'Only tenant staff can create courses. Ask an institution administrator for access.';
const courseDeleteTenantStaffOnlyMessage =
  'Only tenant staff can delete courses. Ask an institution administrator for access.';
const courseRestoreTenantStaffOnlyMessage =
  'Only tenant staff can restore courses. Ask an institution administrator for access.';
const courseDuplicateCodeMessage =
  'Course code already exists in this tenant. Choose a unique code and retry the request.';
const courseNotFoundForTenantMessage =
  'Course was not found in this tenant. Check the course id and retry the request.';
const courseSelfEnrollmentClosedMessage = 'Self-enrollment is not available for this course.';
const courseSelfEnrollmentCodeWrongMessage =
  'Enrollment code is incorrect. Check the code and retry the request.';
const isCourseEnrollmentDateWindowOpen = (
  course: { startsAt: Date | null; endsAt: Date | null },
  now = new Date(),
): boolean =>
  (course.startsAt === null || course.startsAt.getTime() <= now.getTime()) &&
  (course.endsAt === null || course.endsAt.getTime() >= now.getTime());
const wouldExceedFileStorageQuota = (
  currentBytes: number,
  incomingBytes: number,
  limitBytes: number | null,
): boolean => limitBytes !== null && currentBytes + incomingBytes > limitBytes;
const surveyStaffOnlyMessage =
  'Only course staff can create surveys. Ask an instructor for access.';
const surveyCourseMissingMessage =
  'Course was not found in this tenant. Check the course id and retry the request.';
const surveyQuestionStaffOnlyMessage =
  'Only course staff can author survey questions. Ask an instructor for access.';
const surveyNotFoundMessage =
  'Survey was not found in this course. Check the survey id and retry the request.';
const surveyQuestionDuplicatePositionMessage =
  'Survey question position is already used. Choose a unique position and retry the request.';
const surveyResponseStaffOnlyMessage =
  'Only course staff can view survey responses. Ask an instructor for access.';
const surveyResponseQuestionMissingMessage =
  'Survey question was not found in this survey. Check the question id and retry the request.';
const glossaryEntryStaffOnlyMessage =
  'Only course staff can create glossary entries. Ask an instructor for access.';
const glossaryEntryDuplicateTermMessage =
  'Glossary term already exists in this course. Choose a unique term and retry the request.';
const glossaryEntryNotFoundMessage =
  'Glossary entry was not found in this course. Check the entry id and retry the request.';
const wikiPageDuplicateSlugMessage =
  'Wiki page slug already exists in this course. Choose a unique slug and retry the request.';
const wikiPageNotFoundMessage =
  'Wiki page was not found in this course. Check the page id and retry the request.';
const wikiPageRevisionNotFoundMessage =
  'Wiki revision was not found for this page. Check the revision number and retry.';
const calendarEventStaffOnlyMessage =
  'Only course staff can create calendar events. Ask an instructor for access.';
const calendarEventCourseMissingMessage =
  'Course was not found in this tenant. Check the course id and retry the request.';
const calendarEventNotFoundMessage =
  'Calendar event was not found in this course. Check the event id and retry the request.';
const catalogSettingsStaffOnlyMessage =
  'Only course staff can change catalog settings. Ask an instructor for access.';
const catalogSettingsCourseMissingMessage =
  'Course was not found in this tenant. Check the course id and retry the request.';
const courseMeetingStaffOnlyMessage =
  'Only course staff can create meetings. Ask an instructor for access.';
const courseMeetingCourseMissingMessage =
  'Course was not found in this tenant. Check the course id and retry the request.';
const courseMeetingNotFoundMessage =
  'Meeting was not found in this course. Check the meeting id and retry the request.';
const rubricTenantStaffOnlyMessage =
  'Only tenant staff can create rubrics. Ask an institution administrator for access.';
const rubricTemplateMissingMessage =
  'Rubric template was not found. Check the source template id and retry the request.';
const rubricNotFoundMessage =
  'Rubric was not found in this tenant. Check the rubric id and retry the request.';
const assignmentStaffOnlyMessage =
  'Only course staff can create assignments. Ask an instructor for access.';
const courseSyllabusStaffOnlyMessage =
  'Only course staff can update the syllabus. Ask an instructor for access.';
const gradebookCategoryStaffOnlyMessage =
  'Only course staff can create gradebook categories. Ask an instructor for access.';
const gradebookCategoryNotFoundMessage =
  'Gradebook category was not found in this course. Check the category id and retry the request.';
const courseExternalToolStaffOnlyMessage =
  'Only course staff can create external tools. Ask an instructor for access.';
const completionRequirementStaffOnlyMessage =
  'Only course staff can create completion requirements. Ask an instructor for access.';
const courseCredentialStaffOnlyMessage =
  'Only course staff can create credentials. Ask an instructor for access.';
const credentialAwardStaffOnlyMessage =
  'Only course staff can award credentials. Ask an instructor for access.';
const credentialAwardDuplicateMessage =
  'Student already has an award for this credential. Revoke the existing award before awarding again.';
const credentialNotFoundMessage =
  'Credential was not found in this course. Check the credential id and retry the request.';
const courseGroupSetStaffOnlyMessage =
  'Only course staff can create group sets. Ask an instructor for access.';
const courseGroupStaffOnlyMessage =
  'Only course staff can create course groups. Ask an instructor for access.';
const courseGroupSetMissingMessage =
  'Course group set was not found in this tenant. Check the group set id and retry the request.';
const courseGroupMissingMessage =
  'Course group was not found in this tenant. Check the group id and retry the request.';
const courseGroupMemberStaffOnlyMessage =
  'Only course staff can add members to course groups. Ask an instructor for access.';
const courseGroupMemberDuplicateMessage =
  'User is already a member of this group. Remove the existing membership before adding them again.';
const questionBankStaffOnlyMessage =
  'Only course staff can create question banks. Ask an instructor for access.';
const questionBankQuestionStaffOnlyMessage =
  'Only course staff can author question bank questions. Ask an instructor for access.';
const questionBankNotFoundMessage =
  'Question bank was not found in this course. Check the question bank id and retry the request.';
const questionBankQuestionDuplicatePositionMessage =
  'Question bank question position is already used. Choose a unique position and retry the request.';
const quizStaffOnlyMessage = 'Only course staff can create quizzes. Ask an instructor for access.';
const quizQuestionStaffOnlyMessage =
  'Only course staff can author quiz questions. Ask an instructor for access.';
const quizQtiExportStaffOnlyMessage =
  'Only course staff can export QTI quiz items. Ask an instructor for access.';
const quizQtiImportStaffOnlyMessage =
  'Only course staff can import QTI quiz items. Ask an instructor for access.';
const quizNotFoundMessage =
  'Quiz was not found in this course. Check the quiz id and retry the request.';
const quizGradingStaffOnlyMessage =
  'Only course staff can grade quiz attempts. Ask an instructor for access.';
const quizManualGradeScoreTooHighMessage =
  'Score cannot exceed the quiz question points. Enter a score within the question point value.';
const quizQuestionNotManualGradeableMessage =
  'This quiz question is automatically graded. Regrade the attempt instead of recording a manual question score.';
const quizAttemptNotGradeableMessage =
  'Only submitted or graded quiz attempts can be manually graded. Ask the learner to submit first.';
const quizQuestionDuplicatePositionMessage =
  'Quiz question position is already used. Choose a unique position and retry the request.';
const quizOverrideDuplicateTargetMessage =
  'An override already exists for this quiz and target. Edit the existing override instead.';
const courseGradingSchemeStaffOnlyMessage =
  'Only course staff can create grading schemes. Ask an instructor for access.';
const courseGradingSchemeDuplicateNameMessage =
  'Grading scheme name already exists in this course. Choose a unique name and retry the request.';
const quizUnitMissingMessage =
  'Course unit was not found in this tenant. Check the unit id and retry the request.';
const courseGroupNotFoundMessage =
  'Course group was not found in this course. Check the group id and retry the request.';
const courseExternalToolConnectionMissingMessage =
  'Integration connection was not found in this tenant. Check the connection id and retry the request.';
const courseExternalToolDuplicateNameMessage =
  'External tool name already exists in this course. Choose a unique name and retry the request.';
const courseExternalToolNotFoundMessage =
  'External tool was not found in this course. Check the tool id and retry the request.';
const ltiInstructorRole = 'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor';
const ltiLearnerRole = 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner';
const ltiPrivateKeyEncryptionMissingMessage =
  'LTI launch signing is not configured. Set LTI_PRIVATE_KEY_ENCRYPTION_KEY and retry.';
const ltiPlatformSigningKeyMissingMessage =
  'LTI platform signing key is not configured for this tenant. Add an active platform key and retry.';
const ltiOidcSessionUserMismatchMessage =
  'LTI launch session does not match the requested launch user. Sign in as the requested user and retry.';
const ltiOidcSessionTenantMismatchMessage =
  'LTI launch tenant is not the active tenant for this session. Switch tenants and retry.';
const ltiDeepLinkingStaffOnlyMessage =
  'Only course staff can start LTI deep linking. Ask an instructor for access.';
const ltiDeepLinkingCompleteStaffOnlyMessage =
  'Only course staff can complete LTI deep linking. Ask an instructor for access.';
const ltiDeepLinkingSessionUnavailableMessage =
  'LTI deep linking session is expired, completed, or unavailable. Start deep linking again.';
const ltiServiceTokenConnectionMissingMessage =
  'LTI service token connection was not found. Check the client assertion and retry.';
const ltiServiceTokenToolUnavailableMessage =
  'LTI service token cannot access this course because no external tool from this connection is installed in the course.';
const ltiNamesRolesCourseMissingMessage =
  'Course was not found for the LTI Names and Roles service. Check the context membership URL and retry.';
const ltiNamesRolesUserMissingMessage =
  'A course member user record was not found. Fix the roster data and retry.';
const ltiAgsAssignmentMissingMessage =
  'Assignment was not found for the LTI Assignment and Grade service. Check the line item URL and retry.';
const ltiAgsStudentMissingMessage =
  'LTI AGS score user is not an active learner in this course. Check the userId and retry.';
const gradebookCategoryDuplicatePositionMessage =
  'Gradebook category position is already used in this course. Choose a unique position and retry the request.';
const gradebookManualItemStaffOnlyMessage =
  'Only course staff can create manual gradebook items. Ask an instructor for access.';
const gradebookExportStaffOnlyMessage =
  'Only course staff can export the gradebook. Ask an instructor for access.';
const sisFinalGradeConnectionMissingMessage =
  'Enabled SIS CSV integration connection was not found. Check the connection id and retry.';
const gradebookManualItemNotFoundMessage =
  'Manual gradebook item was not found in this course. Check the item id and retry the request.';
const gradebookManualItemCategoryMissingMessage =
  'Gradebook category was not found in this course. Check the category id and retry the request.';
const gradebookManualItemDuplicatePositionMessage =
  'Manual gradebook item position is already used in this course. Choose a unique position and retry the request.';
const assignmentRubricMissingMessage =
  'Rubric was not found in this tenant. Check the rubric id and retry the request.';
const assignmentUnitMissingMessage =
  'Course unit was not found in this tenant. Check the unit id and retry the request.';
const assignmentModuleUnitMismatchMessage =
  'Course unit does not belong to the specified module. Check the module and unit ids and retry the request.';

const isCourseMembershipDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'course_membership_tenant_course_user_role_uq';
};

const isCourseMembershipCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_membership_tenant_course_fk';
};

const isCourseSectionCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_section_tenant_course_fk';
};

const isCourseModuleCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_module_tenant_course_fk';
};

const isCourseUnitCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_unit_tenant_course_fk';
};

const isCourseUnitModuleMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_unit_tenant_module_fk';
};

const isCourseResourceCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_resource_tenant_course_fk';
};

const isCourseResourceModuleMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_resource_tenant_module_fk';
};

const isCourseResourceUnitMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_resource_tenant_unit_fk';
};

const isCourseResourceModuleUnitMismatch = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_resource_tenant_module_unit_fk';
};

const isCourseGradingSchemeCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_grading_scheme_tenant_course_fk';
};

const isCourseGradingSchemeNameDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'course_grading_scheme_tenant_course_name_uq';
};

const isQuizCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'quiz_tenant_course_fk';
};

const isQuizModuleMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'quiz_tenant_module_fk';
};

const isQuizUnitMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'quiz_tenant_unit_fk';
};

const isQuizModuleUnitMismatch = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'quiz_tenant_module_unit_fk';
};

const isQuestionBankQuestionPositionDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'question_bank_question_tenant_bank_position_uq';
};

const isQuizQuestionPositionDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'quiz_question_tenant_quiz_position_uq';
};

const isQuizOverrideDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'quiz_override_tenant_quiz_target_uq';
};

const isSurveyQuestionPositionDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'survey_question_tenant_survey_position_uq';
};

const isGlossaryEntryTermDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'glossary_entry_tenant_course_term_uq';
};

const isWikiPageSlugDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'wiki_page_tenant_course_slug_uq';
};

const isCourseCodeDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'course_tenant_code_uq';
};

const isCalendarEventCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return (
    code === '23503' &&
    (constraintName === 'course_calendar_event_tenant_course_fk' ||
      constraintName === 'course_calendar_event_course_id_course_id_fk')
  );
};

const isCourseMeetingCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return (
    code === '23503' &&
    (constraintName === 'course_meeting_tenant_course_fk' ||
      constraintName === 'course_meeting_course_id_course_id_fk')
  );
};

const isQuestionBankCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'question_bank_tenant_course_fk';
};

const isCourseGroupMemberDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'course_group_member_tenant_group_user_uq';
};

const isTenantMembershipDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'tenant_membership_tenant_user_role_uq';
};

const isAssignmentOverrideDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'assignment_override_tenant_assignment_target_uq';
};

const isCourseGroupCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_group_tenant_course_fk';
};

const isCourseGroupSetMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_group_tenant_group_set_fk';
};

const isCourseGroupSetCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_group_set_tenant_course_fk';
};

const isCredentialAwardDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'credential_award_tenant_credential_student_uq';
};

const isGradeAppealDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'grade_appeal_tenant_grade_student_open_uq';
};

const isCourseCredentialCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_credential_tenant_course_fk';
};

const isCompletionRequirementCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'completion_requirement_tenant_course_fk';
};

const isCompletionRequirementModuleMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return (
    code === '23503' &&
    (constraintName === 'completion_requirement_tenant_module_fk' ||
      constraintName === 'completion_requirement_tenant_course_module_fk')
  );
};

const isCourseExternalToolCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_external_tool_tenant_course_fk';
};

const isCourseExternalToolConnectionMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_external_tool_tenant_connection_fk';
};

const isCourseExternalToolNameDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'course_external_tool_tenant_course_name_uq';
};

const isGradebookManualItemCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'gradebook_manual_item_tenant_course_fk';
};

const isGradebookManualItemCategoryMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'gradebook_manual_item_tenant_course_category_fk';
};

const isGradebookManualItemPositionDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'gradebook_manual_item_tenant_course_position_uq';
};

const isGradebookCategoryCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'gradebook_category_tenant_course_fk';
};

const isGradebookCategoryPositionDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'gradebook_category_tenant_course_position_uq';
};

const isCourseSyllabusCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_syllabus_tenant_course_fk';
};

const isAssignmentCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'assignment_tenant_course_fk';
};

const isAssignmentModuleMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'assignment_tenant_module_fk';
};

const isAssignmentUnitMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'assignment_tenant_unit_fk';
};

const isAssignmentModuleUnitMismatch = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'assignment_tenant_module_unit_fk';
};

const isAssignmentRubricMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'assignment_tenant_active_rubric_fk';
};

const isRubricSourceTemplateMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'rubric_source_template_id_rubric_template_id_fk';
};

const isCoursePageCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'course_page_tenant_course_fk';
};

const isLearningObjectiveCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'learning_objective_tenant_course_fk';
};

const isLearningObjectiveCodeDuplicate = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23505' && constraintName === 'learning_objective_tenant_course_code_uq';
};

const isAttendanceSessionCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'attendance_session_tenant_course_fk';
};

const isDiscussionParentPostMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'discussion_post_tenant_parent_post_fk';
};

const isCourseAnnouncementCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return (
    code === '23503' &&
    (constraintName === 'course_announcement_tenant_course_fk' ||
      constraintName === 'course_announcement_course_id_course_id_fk')
  );
};

const isSurveyCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return (
    code === '23503' &&
    (constraintName === 'survey_tenant_course_fk' ||
      constraintName === 'survey_course_id_course_id_fk')
  );
};

const isDiscussionTopicCourseMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return code === '23503' && constraintName === 'discussion_topic_tenant_course_fk';
};

const isDiscussionTopicPlacementMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return (
    code === '23503' &&
    (constraintName === 'discussion_topic_tenant_module_fk' ||
      constraintName === 'discussion_topic_tenant_unit_fk' ||
      constraintName === 'discussion_topic_tenant_module_unit_fk')
  );
};

const isSubmissionCommentSubmissionMissing = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return (
    code === '23503' &&
    (constraintName === 'submission_comment_tenant_submission_fk' ||
      constraintName === 'submission_comment_submission_id_submission_id_fk')
  );
};

const isQuizAttemptSubmitConflict = (error: unknown): boolean =>
  error instanceof Error &&
  error.message ===
    'Quiz attempt could not be submitted because it was not found or is no longer in progress.';

const isAssignmentResubmissionDisabled = (error: unknown): boolean =>
  error instanceof Error && error.message === 'This assignment does not allow resubmission.';

const isAssignmentDraftOwnershipConflict = (error: unknown): boolean =>
  error instanceof Error &&
  error.message ===
    'Draft could not be saved because it belongs to a different assignment or student.';

const isAssignmentSubmissionVersionConflict = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const constraintName = 'constraint_name' in error ? error.constraint_name : undefined;

  return (
    code === '23505' &&
    (constraintName === 'submission_tenant_assignment_student_version_uq' ||
      constraintName === 'submission_tenant_assignment_group_version_uq')
  );
};

const assertQuizStartAvailability = (quiz: Pick<Quiz, 'opensAt' | 'closesAt'>, now: Date): void => {
  if (quiz.opensAt && now.getTime() < quiz.opensAt.getTime()) {
    throw new ApiError('forbidden', quizNotOpenMessage);
  }

  if (quiz.closesAt && now.getTime() > quiz.closesAt.getTime()) {
    throw new ApiError('forbidden', quizClosedMessage);
  }
};

const assertQuizAccessControls = (
  accessControls: { accessPasswordHash: string | null; allowedIpRanges: string[] },
  input: StartQuizAttemptInput | undefined,
): void => {
  if (
    accessControls.accessPasswordHash &&
    (!input?.accessPassword ||
      !verifyQuizAccessPassword(input.accessPassword, accessControls.accessPasswordHash))
  ) {
    throw new ApiError('forbidden', quizAccessPasswordMessage);
  }

  if (accessControls.allowedIpRanges.length === 0) {
    return;
  }

  if (
    !input?.clientIp ||
    !isClientIpAllowedByRanges(input.clientIp, accessControls.allowedIpRanges)
  ) {
    throw new ApiError('forbidden', quizIpRangeMessage);
  }
};

const assertQuizSubmitAvailability = (
  quiz: Pick<Quiz, 'closesAt' | 'timeLimitMinutes'>,
  attempt: Pick<QuizAttempt, 'startedAt'>,
  now: Date,
): void => {
  if (quiz.closesAt && now.getTime() > quiz.closesAt.getTime()) {
    throw new ApiError('forbidden', quizClosedMessage);
  }

  if (
    isQuizAttemptExpired(
      { startedAt: attempt.startedAt, timeLimitMinutes: quiz.timeLimitMinutes },
      now,
    )
  ) {
    throw new ApiError('forbidden', quizTimeLimitExpiredMessage);
  }
};

const assertLearnerAssignmentWorkflow = (
  assignment: Assignment | null,
  courseId: string,
  canViewAllContent: boolean,
): Assignment => {
  if (canViewAllContent) {
    throw new ApiError('forbidden', learnerAssignmentWorkflowMessage);
  }

  if (!assignment || assignment.courseId !== courseId || !canViewAssignment(assignment, false)) {
    throw new ApiError('not_found', assignmentNotFoundMessage);
  }

  return assignment;
};

const resolveAssignmentSubmissionGroupId = async (
  db: Database,
  tenantId: string,
  courseId: string,
  actorUserId: string,
  assignment: Pick<Assignment, 'groupSubmissionEnabled' | 'groupSetId'>,
): Promise<string | null> => {
  if (!assignment.groupSubmissionEnabled) {
    return null;
  }

  const groups = await listCourseGroupsForCourse(db, {
    tenantId,
    courseId,
    statuses: ['active'],
    memberUserId: actorUserId,
  });
  const assignmentGroups = groups.filter((group) => group.groupSetId === assignment.groupSetId);

  if (assignmentGroups.length !== 1) {
    throw new ApiError(
      'forbidden',
      'Join exactly one active assignment group before submitting this group assignment.',
    );
  }

  return assignmentGroups[0]?.id ?? null;
};

export const canViewCourseContentItem = (
  item: CourseContentItem,
  canViewAllContent: boolean,
): boolean =>
  canViewAllContent || (item.visibility === 'published' && item.accessPolicy !== 'course_staff');

export const canViewLearningObjective = (
  objective: LearningObjectiveItem,
  canViewAllContent: boolean,
): boolean => canViewAllContent || objective.status === 'active';

export const canViewCoursePage = (page: CoursePageItem, canViewAllContent: boolean): boolean =>
  canViewAllContent || page.visibility === 'published';

export const canViewCourseSyllabus = (
  syllabus: CourseSyllabusItem,
  canViewAllContent: boolean,
): boolean => canViewAllContent || syllabus.visibility === 'published';

export const canViewCourseSection = (
  section: CourseSectionItem,
  canViewAllContent: boolean,
): boolean => canViewAllContent || section.status === 'active';

export const canViewDiscussionTopic = (
  topic: DiscussionTopicItem,
  canViewAllContent: boolean,
): boolean => canViewAllContent || topic.visibility === 'published';

export const canViewDiscussionPost = (
  post: DiscussionPostItem,
  canViewAllContent: boolean,
  actorUserId?: string,
): boolean =>
  canViewAllContent ||
  post.status === 'published' ||
  (post.status === 'draft' && post.authorId === actorUserId);

export const canViewQuiz = (quiz: QuizItem, canViewAllContent: boolean): boolean =>
  canViewAllContent || quiz.status === 'published';

export const canViewAttendanceSession = (
  session: AttendanceSessionItem,
  canViewAllContent: boolean,
): boolean => canViewAllContent || session.status !== 'cancelled';

export const canViewCompletionRequirement = (
  requirement: CompletionRequirementItem,
  canViewAllContent: boolean,
): boolean => canViewAllContent || requirement.status === 'active';

export const canViewCredential = (
  credential: CourseCredentialItem,
  canViewAllContent: boolean,
): boolean => canViewAllContent || credential.status === 'published';

export const canViewConversationThread = (
  thread: ConversationThreadItem,
  actorUserId: string,
  canViewAllContent: boolean,
): boolean => canViewAllContent || thread.participantIds.includes(actorUserId);

export const canViewCourseGroup = (
  group: CourseGroupItem,
  isGroupMember: boolean,
  canViewAllContent: boolean,
): boolean => canViewAllContent || (group.status === 'active' && isGroupMember);

export const canViewAssignment = (
  assignment: AssignmentItem,
  canViewAllContent: boolean,
): boolean => canViewAllContent || assignment.status === 'published';

export type ReleaseVisibilityIndex = {
  moduleStateById: ReadonlyMap<string, ModuleReleaseState>;
  itemStateByTarget: ReadonlyMap<string, ModuleReleaseState>;
};

const itemReleaseTargetKey = (targetType: Exclude<ModuleReleaseTargetType, 'module'>, id: string) =>
  `${targetType}:${id}`;

export const createReleaseVisibilityIndex = (
  decisions: Pick<ModuleReleaseDecision, 'moduleId' | 'targetType' | 'targetId' | 'state'>[],
): ReleaseVisibilityIndex => {
  const moduleStateById = new Map<string, ModuleReleaseState>();
  const itemStateByTarget = new Map<string, ModuleReleaseState>();

  for (const decision of decisions) {
    if (decision.targetType === 'module') {
      moduleStateById.set(decision.moduleId, decision.state);
      continue;
    }

    if (decision.targetId === null) {
      continue;
    }

    const key = itemReleaseTargetKey(decision.targetType, decision.targetId);
    const existing = itemStateByTarget.get(key);
    itemStateByTarget.set(key, existing === 'locked' ? 'locked' : decision.state);
  }

  return { moduleStateById, itemStateByTarget };
};

export const canAccessReleasedModuleItem = (
  item: { id: string; moduleId: string | null },
  targetType: 'assignment' | 'course_resource',
  releaseVisibility: ReleaseVisibilityIndex | null,
): boolean => {
  if (releaseVisibility === null) {
    return true;
  }

  if (item.moduleId !== null) {
    const moduleState = releaseVisibility.moduleStateById.get(item.moduleId);
    if (moduleState !== 'released') {
      return false;
    }
  }

  return (
    releaseVisibility.itemStateByTarget.get(itemReleaseTargetKey(targetType, item.id)) !== 'locked'
  );
};

export const canAccessReleasedCoursePage = (
  page: { id: string },
  releaseVisibility: ReleaseVisibilityIndex | null,
): boolean =>
  releaseVisibility === null ||
  releaseVisibility.itemStateByTarget.get(itemReleaseTargetKey('course_page', page.id)) !==
    'locked';

export const selectVisibleAssignmentRubric = (
  assignment: AssignmentRubricItem | null,
  rubric: Rubric | null,
  courseId: string,
  canViewAllContent: boolean,
): Rubric | null => {
  if (
    !assignment ||
    assignment.courseId !== courseId ||
    !assignment.activeRubricId ||
    !canViewAssignment(assignment, canViewAllContent) ||
    !rubric
  ) {
    return null;
  }

  return rubric;
};

export type CourseRosterAccessContext = {
  hasTenantStaffAccess: boolean;
  hasCourseStaffAccess: boolean;
};

export const canViewCourseRoster = (access: CourseRosterAccessContext): boolean =>
  access.hasTenantStaffAccess || access.hasCourseStaffAccess;

export const canViewSubmissionScopedResource = (
  submission: SubmissionItem,
  actorUserId: string,
  access: CourseRosterAccessContext,
): boolean =>
  access.hasTenantStaffAccess ||
  access.hasCourseStaffAccess ||
  submission.studentId === actorUserId;

export const canViewSubmissionAttachment = canViewSubmissionScopedResource;

const isSubmissionGroupMember = async (
  db: Database,
  tenantId: string,
  courseId: string,
  actorUserId: string,
  assignment: Pick<Assignment, 'groupSubmissionEnabled' | 'groupSetId'>,
  submission: Pick<Submission, 'groupId'>,
): Promise<boolean> => {
  if (
    !assignment.groupSubmissionEnabled ||
    assignment.groupSetId === null ||
    submission.groupId === null
  ) {
    return false;
  }

  const groups = await listCourseGroupsForCourse(db, {
    tenantId,
    courseId,
    statuses: ['active'],
    memberUserId: actorUserId,
  });

  return groups.some(
    (group) => group.id === submission.groupId && group.groupSetId === assignment.groupSetId,
  );
};

const canViewSubmissionAttachmentForAssignment = async (
  db: Database,
  tenantId: string,
  courseId: string,
  actorUserId: string,
  access: CourseRosterAccessContext,
  assignment: Pick<Assignment, 'groupSubmissionEnabled' | 'groupSetId'>,
  submission: SubmissionAttachmentItem,
): Promise<boolean> =>
  canViewSubmissionScopedResource(submission, actorUserId, access) ||
  (await isSubmissionGroupMember(db, tenantId, courseId, actorUserId, assignment, submission));

const getFilenameExtension = (filename: string): string => {
  const dotIndex = filename.lastIndexOf('.');

  if (dotIndex <= 0 || dotIndex === filename.length - 1) {
    return '';
  }

  return filename.slice(dotIndex + 1).toLowerCase();
};

const canAttachFileResource = (
  file: FileResource,
  actorUserId: string,
  courseId: string,
  access: CourseRosterAccessContext,
): boolean => {
  if (file.ownerId === actorUserId) {
    return file.courseId === null || file.courseId === courseId;
  }

  return file.courseId === courseId && file.visibility !== 'private' && canViewCourseRoster(access);
};

const assertFileSatisfiesAssignmentAttachmentConstraints = (
  assignment: Pick<Assignment, 'allowedFileExtensions' | 'maxFileSizeBytes'>,
  file: FileResource,
): void => {
  if (
    assignment.allowedFileExtensions.length > 0 &&
    !assignment.allowedFileExtensions.includes(getFilenameExtension(file.filename))
  ) {
    throw new ApiError('bad_request', submissionAttachmentFileTypeMessage);
  }

  if (assignment.maxFileSizeBytes !== null && file.byteSize > assignment.maxFileSizeBytes) {
    throw new ApiError('bad_request', submissionAttachmentFileSizeMessage);
  }
};

export const visibleSubmissionCommentVisibilities = (
  access: CourseRosterAccessContext,
  options: { canViewStudentVisible?: boolean; canViewPeerReviewerVisible?: boolean } = {
    canViewStudentVisible: true,
  },
): SubmissionCommentVisibility[] => {
  if (access.hasTenantStaffAccess || access.hasCourseStaffAccess) {
    return ['student_visible', 'staff_only', 'peer_reviewer_visible'];
  }

  return [
    ...(options.canViewStudentVisible === false ? [] : (['student_visible'] as const)),
    ...(options.canViewPeerReviewerVisible ? (['peer_reviewer_visible'] as const) : []),
  ];
};

const applyAssignmentLatePenalty = (
  assignment: Pick<Assignment, 'dueAt' | 'latePenaltyPercentPerDay' | 'lateMaxPenaltyPercent'>,
  submission: Pick<Submission, 'submittedAt'>,
  score: number,
): number => {
  const penaltyPercent = computeLatePenaltyPercent({
    dueAt: assignment.dueAt,
    submittedAt: submission.submittedAt,
    percentPerDay: assignment.latePenaltyPercentPerDay,
    maxPercent: assignment.lateMaxPenaltyPercent,
  });

  return applyLatePenalty({ score, penaltyPercent });
};

const hasGradeChanged = (previousGrade: Grade, grade: Grade): boolean =>
  previousGrade.score !== grade.score ||
  previousGrade.maxScore !== grade.maxScore ||
  previousGrade.status !== grade.status ||
  previousGrade.source !== grade.source;

const isStudentVisibleGradeStatus = (status: GradeStatus): boolean => status !== 'draft';

const recordGradeLifecycleSideEffects = async (
  db: Database,
  actorUserId: string,
  previousGrade: Grade | null,
  grade: Grade,
  now = new Date(),
): Promise<void> => {
  if (!previousGrade) {
    if (isStudentVisibleGradeStatus(grade.status)) {
      await saveOutboxEvent(db, buildGradePublishedEvent({ grade }, now));
    }
    return;
  }

  if (!hasGradeChanged(previousGrade, grade)) {
    return;
  }

  await saveAuditLog(
    db,
    buildGradeChangeAuditLog({ actorId: actorUserId, previousGrade, grade }, now),
  );
  await saveOutboxEvent(db, buildGradeChangedEvent({ previousGrade, grade }, now));
};

const saveAnnouncementPublishedEvent = async (
  db: DatabaseExecutor,
  announcement: CourseAnnouncement,
  now = new Date(),
): Promise<void> => {
  await saveOutboxEvent(
    db,
    buildCourseAnnouncementPublishedEvent(
      {
        tenantId: announcement.tenantId,
        courseId: announcement.courseId,
        announcementId: announcement.id,
        authorId: announcement.authorId,
        title: announcement.title,
      },
      announcement.postedAt ?? now,
    ),
  );
};

const assertSubmissionBelongsToCourseAssignment = async (
  db: Database,
  tenantId: string,
  courseId: string,
  assignmentId: string,
  submission: Submission,
): Promise<void> => {
  if (submission.assignmentId !== assignmentId) {
    throw new ApiError(
      'not_found',
      'Submission was not found for this assignment. Check the submission id and retry the request.',
    );
  }

  const assignment = await getAssignmentById(db, tenantId, assignmentId);
  if (!assignment || assignment.courseId !== courseId) {
    throw new ApiError(
      'not_found',
      'Assignment was not found in this course. Check the assignment id and retry the request.',
    );
  }
};

export const createApiDependencies = (environment: ApiEnvironment): ApiDependencies => {
  if (!environment.DATABASE_CONNECTION_STRING) {
    throw new Error('DATABASE_CONNECTION_STRING is required to start the API server.');
  }

  const dbHandle = createDbHandle(environment.DATABASE_CONNECTION_STRING);
  const fileStorage = new LocalFileStorageProvider(
    environment.FILE_STORAGE_ROOT ?? '.openlms-files',
  );

  const tenantStaffRoles = [
    'instructor',
    'teaching_assistant',
    'course_admin',
    'institution_admin',
  ];
  const sectionInstructorRoles: CourseRole[] = ['instructor', 'teaching_assistant', 'course_admin'];
  const allAssignmentStatuses: AssignmentStatus[] = ['draft', 'published', 'archived'];
  const allAssignmentOverrideStatuses: AssignmentOverrideStatus[] = ['active', 'archived'];
  const allCourseAnnouncementStatuses: CourseAnnouncementStatus[] = [
    'draft',
    'published',
    'archived',
  ];
  const allCourseSectionStatuses: CourseSectionStatus[] = ['active', 'archived'];
  const allQuizStatuses: QuizStatus[] = ['draft', 'published', 'archived'];
  const allQuizOverrideStatuses: QuizOverrideStatus[] = ['active', 'archived'];
  const allQuestionBankStatuses = ['active', 'archived'] as const;
  const allAttendanceSessionStatuses: AttendanceSessionStatus[] = [
    'scheduled',
    'completed',
    'cancelled',
  ];
  const visibleAttendanceSessionStatuses: AttendanceSessionStatus[] = ['scheduled', 'completed'];
  const allCompletionRequirementStatuses: CompletionRequirementStatus[] = ['active', 'archived'];
  const allCredentialStatuses: CourseCredentialStatus[] = ['draft', 'published', 'archived'];
  const allConversationThreadStatuses: ConversationThreadStatus[] = ['open', 'archived'];
  const allCourseGroupSetStatuses: CourseGroupSetStatus[] = ['active', 'archived'];
  const allCourseGroupStatuses: CourseGroupStatus[] = ['active', 'archived'];
  const allDiscussionTopicVisibilities: DiscussionTopicVisibility[] = [
    'draft',
    'published',
    'archived',
  ];
  const allDiscussionPostStatuses: DiscussionPostStatus[] = [
    'draft',
    'published',
    'hidden',
    'deleted',
  ];
  const allGradeStatuses: GradeStatus[] = [
    'draft',
    'published',
    'locked',
    'appealed',
    'revised',
    'incomplete',
  ];
  const studentVisibleGradeStatuses: GradeStatus[] = [
    'published',
    'locked',
    'appealed',
    'revised',
    'incomplete',
  ];
  const allGradebookCategoryStatuses: GradebookCategoryStatus[] = ['active', 'archived'];
  const allGradebookManualItemStatuses: GradebookManualItemStatus[] = ['active', 'archived'];
  const allCourseGradingSchemeStatuses: CourseGradingSchemeStatus[] = ['active', 'archived'];
  const allCourseExternalToolStatuses: CourseExternalToolStatus[] = ['active', 'archived'];

  const assertTenantMembership = async (actorUserId: string, tenantId: string): Promise<void> => {
    const memberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
    const isTenantMember = memberships.some((membership) => membership.tenantId === tenantId);

    if (!isTenantMember) {
      throw new ApiError(
        'forbidden',
        'You are not a member of this tenant. Switch tenants or ask an administrator for access.',
      );
    }
  };

  const assertInstitutionAdmin = async (
    actorUserId: string,
    tenantId: string,
    message: string,
  ): Promise<void> => {
    const memberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
    const isAdmin = memberships.some(
      (membership) => membership.tenantId === tenantId && membership.role === 'institution_admin',
    );

    if (!isAdmin) {
      throw new ApiError('forbidden', message);
    }
  };

  const assertAuditLogViewPermission = async (
    actorUserId: string,
    tenantId: string,
  ): Promise<void> => {
    const memberships = await listUserTenantMemberships(dbHandle.db, actorUserId);

    try {
      assertCorePermission({
        tenantId,
        actorId: actorUserId,
        memberships,
        permission: 'view_audit_log',
      });
    } catch (_error) {
      throw new ApiError(
        'forbidden',
        'Only tenant staff can view audit logs. Ask an administrator for access.',
      );
    }
  };

  const readCourseAccessContext = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ): Promise<{
    hasTenantStaffAccess: boolean;
    hasCourseStaffAccess: boolean;
    hasCourseStudentAccess: boolean;
  }> => {
    const [tenantMemberships, courseMemberships] = await Promise.all([
      listUserTenantMemberships(dbHandle.db, actorUserId),
      listUserCourseMemberships(dbHandle.db, actorUserId),
    ]);
    const matchingTenantMemberships = tenantMemberships.filter(
      (membership) => membership.tenantId === tenantId,
    );

    if (matchingTenantMemberships.length === 0) {
      throw new ApiError(
        'forbidden',
        'You are not a member of this tenant. Switch tenants or ask an administrator for access.',
      );
    }

    const matchingCourseMemberships = courseMemberships.filter(
      (membership) => membership.tenantId === tenantId && membership.courseId === courseId,
    );
    const hasTenantStaffAccess = matchingTenantMemberships.some((membership) =>
      tenantStaffRoles.includes(membership.role),
    );
    const hasCourseStaffAccess = matchingCourseMemberships.some(
      (membership) => membership.role !== 'student',
    );
    const hasCourseStudentAccess = matchingCourseMemberships.some(
      (membership) => membership.role === 'student',
    );
    const hasCourseAccess = matchingCourseMemberships.length > 0 || hasTenantStaffAccess;

    if (!hasCourseAccess) {
      throw new ApiError(
        'forbidden',
        'You are not a member of this course. Switch courses or ask an instructor for access.',
      );
    }

    return { hasTenantStaffAccess, hasCourseStaffAccess, hasCourseStudentAccess };
  };

  const assertCourseSectionExists = async (
    tenantId: string,
    courseId: string,
    sectionId: string,
  ): Promise<void> => {
    const sections = await listCourseSectionsForCourse(dbHandle.db, {
      tenantId,
      courseId,
      statuses: allCourseSectionStatuses,
    });
    const sectionExists = sections.some((section) => section.id === sectionId);

    if (!sectionExists) {
      throw new ApiError(
        'not_found',
        'Section was not found in this course. Check the section id and retry the request.',
      );
    }
  };

  const assertQuizOverrideTargetExists = async (
    tenantId: string,
    courseId: string,
    input: Pick<CreateQuizOverrideApiInput, 'targetType' | 'targetId'>,
  ): Promise<void> => {
    switch (input.targetType) {
      case 'user': {
        const memberships = await listUserCourseMemberships(dbHandle.db, input.targetId);
        const hasCourseMembership = memberships.some(
          (membership) => membership.tenantId === tenantId && membership.courseId === courseId,
        );

        if (!hasCourseMembership) {
          throw new ApiError(
            'bad_request',
            'Quiz override target user is not enrolled in this course. Choose a course member and retry.',
          );
        }
        return;
      }
      case 'group': {
        const group = await getCourseGroupForCourse(
          dbHandle.db,
          tenantId,
          courseId,
          input.targetId,
        );

        if (!group) {
          throw new ApiError(
            'bad_request',
            'Quiz override target group was not found in this course. Choose a course group and retry.',
          );
        }
        return;
      }
      case 'section': {
        const sections = await listCourseSectionsForCourse(dbHandle.db, {
          tenantId,
          courseId,
          statuses: allCourseSectionStatuses,
        });
        const section = sections.find((candidate) => candidate.id === input.targetId);

        if (!section) {
          throw new ApiError(
            'bad_request',
            'Quiz override target section was not found in this course. Choose a course section and retry.',
          );
        }
        return;
      }
    }
  };

  const readVisibleQuizAttempt = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    attemptId: string,
  ): Promise<{
    attempt: QuizAttempt;
    canViewAllContent: boolean;
    quiz: Quiz;
  }> => {
    const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
      actorUserId,
      tenantId,
      courseId,
    );
    const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
    const quiz = await getQuizForCourse(dbHandle.db, tenantId, courseId, quizId);

    if (!quiz || !canViewQuiz(quiz, canViewAllContent)) {
      throw new ApiError(
        'not_found',
        'Quiz was not found in this course. Check the quiz id and retry the request.',
      );
    }

    const attempts = await listQuizAttemptsForQuiz(dbHandle.db, {
      tenantId,
      quizId,
      studentId: canViewAllContent ? undefined : actorUserId,
    });
    const attempt = attempts.find((candidate) => candidate.id === attemptId);

    if (!attempt) {
      throw new ApiError(
        'not_found',
        'Quiz attempt was not found. Check the attempt id and retry the request.',
      );
    }

    return { attempt, canViewAllContent, quiz };
  };

  const resolveEffectiveQuizSettingsForActor = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quiz: Quiz,
  ): Promise<QuizEffectiveSettings> => {
    const [overrides, groupMemberships, sectionMemberships] = await Promise.all([
      listQuizOverridesForQuiz(dbHandle.db, {
        tenantId,
        quizId: quiz.id,
        statuses: ['active'],
      }),
      listCourseGroupMembershipsForUser(dbHandle.db, { tenantId, userId: actorUserId }),
      listSectionMembershipsForStudent(dbHandle.db, {
        tenantId,
        courseId,
        studentId: actorUserId,
      }),
    ]);
    const applicable = filterQuizOverridesForLearner(overrides, {
      userId: actorUserId,
      groupIds: groupMemberships.map((membership) => membership.groupId),
      sectionIds: sectionMemberships.map((membership) => membership.sectionId),
    });
    const effectiveSettings = resolveEffectiveQuizSettings({
      quizId: quiz.id,
      baseOpensAt: quiz.opensAt,
      baseClosesAt: quiz.closesAt,
      baseTimeLimitMinutes: quiz.timeLimitMinutes,
      baseMaxAttempts: quiz.maxAttempts,
      overrides: applicable,
    });

    return {
      ...effectiveSettings,
      quizId: QuizId.parse(effectiveSettings.quizId),
    };
  };

  const readQuizAttemptForGrading = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    quizId: string,
    attemptId: string,
  ): Promise<{ attempt: QuizAttempt; quiz: Quiz }> => {
    const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

    if (!canViewCourseRoster(access)) {
      throw new ApiError('forbidden', quizGradingStaffOnlyMessage);
    }

    const quiz = await getQuizForCourse(dbHandle.db, tenantId, courseId, quizId);

    if (!quiz) {
      throw new ApiError('not_found', quizNotFoundMessage);
    }

    const attempts = await listQuizAttemptsForQuiz(dbHandle.db, { tenantId, quizId });
    const attempt = attempts.find((candidate) => candidate.id === attemptId);

    if (!attempt) {
      throw new ApiError(
        'not_found',
        'Quiz attempt was not found. Check the attempt id and retry the request.',
      );
    }

    return { attempt, quiz };
  };

  const assertQuizAttemptCanBeManuallyGraded = (attempt: QuizAttempt): void => {
    if (attempt.status !== 'submitted' && attempt.status !== 'graded') {
      throw new ApiError('forbidden', quizAttemptNotGradeableMessage);
    }
  };

  const assertReleaseStaffPermission = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
  ): Promise<void> => {
    const [tenantMemberships, courseMemberships] = await Promise.all([
      listUserTenantMemberships(dbHandle.db, actorUserId),
      listUserCourseMemberships(dbHandle.db, actorUserId),
    ]);
    try {
      assertCorePermission({
        tenantId,
        courseId,
        actorId: actorUserId,
        memberships: tenantMemberships,
        courseMemberships,
        permission: 'manage_module_release_rules',
      });
    } catch (_error) {
      throw new ApiError(
        'forbidden',
        'Only course staff can manage module release rules. Ask an instructor for access.',
      );
    }
  };

  const assertReleaseViewPermission = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    studentId: string,
  ): Promise<void> => {
    const [tenantMemberships, courseMemberships] = await Promise.all([
      listUserTenantMemberships(dbHandle.db, actorUserId),
      listUserCourseMemberships(dbHandle.db, actorUserId),
    ]);
    if (actorUserId === studentId) {
      try {
        assertCorePermission({
          tenantId,
          courseId,
          actorId: actorUserId,
          memberships: tenantMemberships,
          courseMemberships,
          permission: 'view_module_release_status',
        });
        return;
      } catch (_error) {
        throw new ApiError(
          'forbidden',
          'You are not enrolled in this course. Ask an instructor for access.',
        );
      }
    }
    try {
      assertCorePermission({
        tenantId,
        courseId,
        actorId: actorUserId,
        memberships: tenantMemberships,
        courseMemberships,
        permission: 'manage_module_release_rules',
      });
    } catch (_error) {
      throw new ApiError(
        'forbidden',
        'Only course staff can view another learner’s release status. Ask an instructor for access.',
      );
    }
  };

  const buildReleaseStatusDependencies = (): ModuleReleaseStatusDependencies => ({
    listCourseModules: ({ tenantId, courseId }) =>
      listCourseModules(dbHandle.db, { tenantId, courseId }),
    listReleaseRulesForCourse: ({ tenantId, courseId }) =>
      listReleaseRulesForCourse(dbHandle.db, { tenantId, courseId }),
    getReleasePoliciesForCourse: async ({ tenantId, courseId }) => {
      const policies = await listReleasePoliciesForCourse(dbHandle.db, { tenantId, courseId });
      return new Map(policies.map((policy) => [policy.moduleId, policy]));
    },
    listOverridesForStudent: async ({ tenantId, courseId, studentId }) => {
      const overrides = await listReleaseOverridesForStudent(dbHandle.db, {
        tenantId,
        courseId,
        studentId,
      });
      return new Map(overrides.map((override) => [override.moduleId, override]));
    },
    listMasteryForStudent: ({ tenantId, courseId, studentId }) =>
      listLearningObjectiveMasteryForCourse(dbHandle.db, { tenantId, courseId, studentId }),
  });

  const readLearnerReleaseVisibilityIndex = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    canViewAllContent: boolean,
  ): Promise<ReleaseVisibilityIndex | null> => {
    if (canViewAllContent) {
      return null;
    }

    const decisions = await evaluateCourseReleases(buildReleaseStatusDependencies(), {
      tenantId: TenantId.parse(tenantId),
      courseId: CourseId.parse(courseId),
      studentId: UserId.parse(actorUserId),
      now: new Date(),
    });

    return createReleaseVisibilityIndex(decisions);
  };

  const assertReleasedAssignmentAccess = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignment: Assignment,
    canViewAllContent: boolean,
  ): Promise<void> => {
    const releaseVisibility =
      assignment.moduleId === null
        ? null
        : await readLearnerReleaseVisibilityIndex(
            actorUserId,
            tenantId,
            courseId,
            canViewAllContent,
          );

    if (!canAccessReleasedModuleItem(assignment, 'assignment', releaseVisibility)) {
      throw new ApiError('not_found', assignmentNotFoundMessage);
    }
  };

  const assertReleaseRuleTargetBelongsToModule = async (
    tenantId: string,
    courseId: string,
    moduleId: string,
    input: Pick<ModuleReleaseRuleInput, 'targetType' | 'targetId' | 'ruleType'>,
  ): Promise<void> => {
    if (input.ruleType === 'manual_unlock' && input.targetType !== 'module') {
      throw new ApiError(
        'bad_request',
        'Manual unlock release rules can only target modules. Use a date, mastery, or prerequisite rule for module items.',
      );
    }

    if (input.targetType === 'module') {
      return;
    }

    if (input.targetId === null) {
      throw new ApiError(
        'bad_request',
        'Release rule target was not found in this module. Choose a module item and retry.',
      );
    }

    if (input.targetType === 'course_resource') {
      const resource = await getCourseResourceForCourse(dbHandle.db, {
        tenantId,
        courseId,
        courseResourceId: input.targetId,
      });

      if (!resource || resource.moduleId !== moduleId) {
        throw new ApiError(
          'bad_request',
          'Release rule target was not found in this module. Choose a module item and retry.',
        );
      }
      return;
    }

    if (input.targetType === 'course_page') {
      const page = await getCoursePageForCourse(dbHandle.db, {
        tenantId,
        courseId,
        coursePageId: input.targetId,
      });

      if (!page) {
        throw new ApiError(
          'bad_request',
          'Release rule target was not found in this module. Choose a module item and retry.',
        );
      }
      return;
    }

    const assignment = await getAssignmentById(dbHandle.db, tenantId, input.targetId);
    if (!assignment || assignment.courseId !== courseId || assignment.moduleId !== moduleId) {
      throw new ApiError(
        'bad_request',
        'Release rule target was not found in this module. Choose a module item and retry.',
      );
    }
  };

  const buildLti1p3DeepLinkReturnUrl = (connection: IntegrationConnection): string => {
    const config = Lti1p3ConnectionConfig.parse(connection.config);
    return new URL('/api/v1/lti-1p3/deep-linking/return', config.issuer).toString();
  };

  const buildLti1p3ServiceTokenUrl = (
    connection: IntegrationConnection,
    tenantId: string,
  ): string => {
    const config = Lti1p3ConnectionConfig.parse(connection.config);
    return new URL(`/api/v1/tenants/${tenantId}/lti-1p3/token`, config.issuer).toString();
  };

  const buildLti1p3NamesRolesServiceUrl = (
    connection: IntegrationConnection,
    tenantId: string,
    courseId: string,
  ): string => {
    const config = Lti1p3ConnectionConfig.parse(connection.config);
    return new URL(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/lti-1p3/namesroles`,
      config.issuer,
    ).toString();
  };

  const buildLti1p3AgsLineItemUrl = (
    connection: IntegrationConnection,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    toolId: string,
  ): string => {
    const config = Lti1p3ConnectionConfig.parse(connection.config);
    return new URL(
      `/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/external-tools/${toolId}/lti-ags/lineitem`,
      config.issuer,
    ).toString();
  };

  const readLti1p3LaunchSigningContextForCourseTool = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    toolId: string,
  ): Promise<{
    access: Awaited<ReturnType<typeof readCourseAccessContext>>;
    tool: CourseExternalTool;
    connection: IntegrationConnection;
    platformKey: NonNullable<Awaited<ReturnType<typeof getActiveLti1p3PlatformSigningKey>>>;
    privateJwk: unknown;
  }> => {
    const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
    const tool = await getCourseExternalToolForCourse(dbHandle.db, tenantId, courseId, toolId);

    if (!tool) {
      throw new ApiError('not_found', courseExternalToolNotFoundMessage);
    }

    const connection = await getIntegrationConnectionById(
      dbHandle.db,
      tenantId,
      tool.integrationConnectionId,
    );

    if (!connection) {
      throw new ApiError('bad_request', courseExternalToolConnectionMissingMessage);
    }

    const platformKey = await getActiveLti1p3PlatformSigningKey(dbHandle.db, tenantId);

    if (!platformKey) {
      throw new ApiError('bad_request', ltiPlatformSigningKeyMissingMessage);
    }

    if (!environment.LTI_PRIVATE_KEY_ENCRYPTION_KEY) {
      throw new ApiError('bad_request', ltiPrivateKeyEncryptionMissingMessage);
    }

    try {
      const privateJwk = JSON.parse(
        decryptSecret(
          parseEncryptedSecret(platformKey.encryptedPrivateJwk),
          environment.LTI_PRIVATE_KEY_ENCRYPTION_KEY,
        ),
      ) as unknown;

      return { access, tool, connection, platformKey, privateJwk };
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError('bad_request', error.message);
      }

      throw error;
    }
  };

  const createLti1p3LaunchResponseForCourseTool = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    toolId: string,
    request: Lti1p3LaunchAuthorizationRequestContract,
    expectedClientId?: string,
  ): Promise<Lti1p3LaunchAuthorizationResponse> => {
    const { access, tool, connection, platformKey, privateJwk } =
      await readLti1p3LaunchSigningContextForCourseTool(actorUserId, tenantId, courseId, toolId);

    try {
      const isStaffLaunch = access.hasTenantStaffAccess || access.hasCourseStaffAccess;
      const launchInput = {
        actorUserId,
        tenantId,
        courseId,
        tool,
        connection,
        platformKey,
        privateJwk,
        roles: [isStaffLaunch ? ltiInstructorRole : ltiLearnerRole],
        namesRolesServiceUrl: buildLti1p3NamesRolesServiceUrl(connection, tenantId, courseId),
        request,
      };

      return createLti1p3LaunchAuthorizationResponse(
        expectedClientId === undefined ? launchInput : { ...launchInput, expectedClientId },
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError('bad_request', error.message);
      }

      throw error;
    }
  };

  const createLti1p3DeepLinkingResponseForCourseTool = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    toolId: string,
    request: Lti1p3LaunchAuthorizationRequestContract,
    data: string,
    expectedClientId?: string,
  ): Promise<Lti1p3LaunchAuthorizationResponse> => {
    const { access, tool, connection, platformKey, privateJwk } =
      await readLti1p3LaunchSigningContextForCourseTool(actorUserId, tenantId, courseId, toolId);

    if (!access.hasTenantStaffAccess && !access.hasCourseStaffAccess) {
      throw new ApiError('forbidden', ltiDeepLinkingStaffOnlyMessage);
    }

    try {
      const launchInput = {
        actorUserId,
        tenantId,
        courseId,
        tool,
        connection,
        platformKey,
        privateJwk,
        roles: [ltiInstructorRole],
        request: {
          ...request,
          deepLinkReturnUrl: buildLti1p3DeepLinkReturnUrl(connection),
        },
        data,
      };

      return createLti1p3DeepLinkingAuthorizationResponse(
        expectedClientId === undefined ? launchInput : { ...launchInput, expectedClientId },
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError('bad_request', error.message);
      }

      throw error;
    }
  };

  const processLti1p3DeepLinkingReturnForSession = async (
    jwt: string,
  ): Promise<Lti1p3DeepLinkingReturnResult> => {
    let sessionData: ReturnType<typeof extractLti1p3DeepLinkingReturnSessionData>;

    try {
      sessionData = extractLti1p3DeepLinkingReturnSessionData(jwt);
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError('bad_request', error.message);
      }

      throw error;
    }

    const session = await getLti1p3DeepLinkingSessionById(dbHandle.db, sessionData.sessionId);

    if (!session) {
      throw new ApiError('bad_request', ltiDeepLinkingSessionUnavailableMessage);
    }

    const access = await readCourseAccessContext(
      session.actorUserId,
      session.tenantId,
      session.courseId,
    );

    if (!access.hasTenantStaffAccess && !access.hasCourseStaffAccess) {
      throw new ApiError('forbidden', ltiDeepLinkingCompleteStaffOnlyMessage);
    }

    const tool = await getCourseExternalToolForCourse(
      dbHandle.db,
      session.tenantId,
      session.courseId,
      session.toolId,
    );

    if (!tool) {
      throw new ApiError('bad_request', courseExternalToolNotFoundMessage);
    }

    const connection = await getIntegrationConnectionById(
      dbHandle.db,
      session.tenantId,
      tool.integrationConnectionId,
    );

    if (!connection) {
      throw new ApiError('bad_request', courseExternalToolConnectionMissingMessage);
    }

    const expectedData = encodeLti1p3DeepLinkingSessionData({ sessionId: session.id });
    let verified: ReturnType<typeof verifyLti1p3DeepLinkingReturn>;

    try {
      verified = verifyLti1p3DeepLinkingReturn({
        jwt,
        config: Lti1p3ConnectionConfig.parse(connection.config),
        expectedData,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError('bad_request', error.message);
      }

      throw error;
    }

    let completed: Awaited<ReturnType<typeof completeLti1p3DeepLinkingSessionWithExternalTools>>;

    try {
      completed = await completeLti1p3DeepLinkingSessionWithExternalTools(dbHandle.db, {
        tenantId: session.tenantId,
        courseId: session.courseId,
        sessionId: session.id,
        integrationConnectionId: tool.integrationConnectionId,
        sourceLaunchUrl: tool.launchUrl,
        contentItems: verified.contentItems,
      });
    } catch (error) {
      if (isCourseExternalToolNameDuplicate(error)) {
        throw new ApiError('conflict', courseExternalToolDuplicateNameMessage);
      }

      throw error;
    }

    if (!completed) {
      throw new ApiError('bad_request', ltiDeepLinkingSessionUnavailableMessage);
    }

    return Lti1p3DeepLinkingReturnResult.parse({
      createdExternalTools: completed.externalTools,
      ignoredContentItemCount: 0,
    });
  };

  const decryptLti1p3PlatformPrivateJwk = (
    platformKey: NonNullable<Awaited<ReturnType<typeof getActiveLti1p3PlatformSigningKey>>>,
  ): unknown => {
    if (!environment.LTI_PRIVATE_KEY_ENCRYPTION_KEY) {
      throw new ApiError('bad_request', ltiPrivateKeyEncryptionMissingMessage);
    }

    try {
      return JSON.parse(
        decryptSecret(
          parseEncryptedSecret(platformKey.encryptedPrivateJwk),
          environment.LTI_PRIVATE_KEY_ENCRYPTION_KEY,
        ),
      ) as unknown;
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError('bad_request', error.message);
      }

      throw error;
    }
  };

  const createLti1p3ServiceAccessTokenForTool = async (
    tenantId: string,
    input: Lti1p3ServiceTokenRequest,
  ): Promise<Lti1p3ServiceAccessToken> => {
    let clientId: string;
    let requestedScopes: ReturnType<typeof parseLti1p3ServiceScopes>;

    try {
      clientId = extractLti1p3ServiceTokenClientId(input.client_assertion);
      requestedScopes = parseLti1p3ServiceScopes(input.scope);
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError('bad_request', error.message);
      }

      throw error;
    }

    const connection = await getLti1p3IntegrationConnectionByClientId(
      dbHandle.db,
      tenantId,
      clientId,
    );

    if (!connection) {
      throw new ApiError('bad_request', ltiServiceTokenConnectionMissingMessage);
    }

    const platformKey = await getActiveLti1p3PlatformSigningKey(dbHandle.db, tenantId);

    if (!platformKey) {
      throw new ApiError('bad_request', ltiPlatformSigningKeyMissingMessage);
    }

    try {
      return createLti1p3ServiceAccessTokenRecord({
        tenantId,
        integrationConnectionId: connection.id,
        tokenUrl: buildLti1p3ServiceTokenUrl(connection, tenantId),
        requestedScopes,
        clientAssertion: input.client_assertion,
        config: Lti1p3ConnectionConfig.parse(connection.config),
        platformKey,
        privateJwk: decryptLti1p3PlatformPrivateJwk(platformKey),
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError('bad_request', error.message);
      }

      throw error;
    }
  };

  const getLti1p3NamesRolesMembershipsForTool = async (
    accessToken: string,
    tenantId: string,
    courseId: string,
    role?: Lti1p3NamesRolesRole,
  ): Promise<Lti1p3NamesRolesMembershipContainer> => {
    const platformKeys = await listActiveLti1p3PlatformKeys(dbHandle.db, tenantId);
    let verified: ReturnType<typeof verifyLti1p3ServiceAccessToken>;

    try {
      verified = verifyLti1p3ServiceAccessToken({
        accessToken,
        expectedTenantId: tenantId,
        requiredScope: lti1p3NamesRolesContextMembershipReadonlyScope,
        platformKeys: platformKeys.map((key) => key.publicJwk),
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError('unauthorized', error.message);
      }

      throw error;
    }

    const connection = await getIntegrationConnectionById(
      dbHandle.db,
      tenantId,
      verified.integrationConnectionId,
    );

    if (!connection) {
      throw new ApiError('forbidden', ltiServiceTokenConnectionMissingMessage);
    }

    const connectionConfig = Lti1p3ConnectionConfig.parse(connection.config);
    if (connectionConfig.clientId !== verified.clientId) {
      throw new ApiError('forbidden', ltiServiceTokenConnectionMissingMessage);
    }

    const tools = await listCourseExternalToolsForCourse(dbHandle.db, {
      tenantId,
      courseId,
      statuses: ['active'],
    });

    if (!tools.some((tool) => tool.integrationConnectionId === verified.integrationConnectionId)) {
      throw new ApiError('forbidden', ltiServiceTokenToolUnavailableMessage);
    }

    const course = await getCourseById(dbHandle.db, tenantId, courseId);

    if (!course) {
      throw new ApiError('not_found', ltiNamesRolesCourseMissingMessage);
    }

    const memberships = await listCourseMembershipRecords(dbHandle.db, {
      tenantId,
      courseId,
      status: 'active',
    });
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await getUserById(dbHandle.db, membership.userId);

        if (!user) {
          throw new ApiError('bad_request', ltiNamesRolesUserMissingMessage);
        }

        return { membership, user };
      }),
    );

    return buildLti1p3NamesRolesMembershipContainer({
      serviceUrl: buildLti1p3NamesRolesServiceUrl(connection, tenantId, courseId),
      course,
      members,
      role,
    });
  };

  const readLti1p3AgsLineItemContextForTool = async (
    accessToken: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    toolId: string,
    requiredScope: typeof lti1p3AgsScoreScope | typeof lti1p3AgsResultReadonlyScope,
  ): Promise<{ connection: IntegrationConnection; lineItemUrl: string }> => {
    const platformKeys = await listActiveLti1p3PlatformKeys(dbHandle.db, tenantId);
    let verified: ReturnType<typeof verifyLti1p3ServiceAccessToken>;

    try {
      verified = verifyLti1p3ServiceAccessToken({
        accessToken,
        expectedTenantId: tenantId,
        requiredScope,
        platformKeys: platformKeys.map((key) => key.publicJwk),
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError('unauthorized', error.message);
      }

      throw error;
    }

    const connection = await getIntegrationConnectionById(
      dbHandle.db,
      tenantId,
      verified.integrationConnectionId,
    );

    if (!connection) {
      throw new ApiError('forbidden', ltiServiceTokenConnectionMissingMessage);
    }

    const connectionConfig = Lti1p3ConnectionConfig.parse(connection.config);
    if (connectionConfig.clientId !== verified.clientId) {
      throw new ApiError('forbidden', ltiServiceTokenConnectionMissingMessage);
    }

    const tool = await getCourseExternalToolForCourse(dbHandle.db, tenantId, courseId, toolId);

    if (!tool || tool.status !== 'active') {
      throw new ApiError('forbidden', courseExternalToolNotFoundMessage);
    }

    if (tool.integrationConnectionId !== verified.integrationConnectionId) {
      throw new ApiError('forbidden', ltiServiceTokenToolUnavailableMessage);
    }

    const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);

    if (!assignment || assignment.courseId !== courseId) {
      throw new ApiError('not_found', ltiAgsAssignmentMissingMessage);
    }

    return {
      connection,
      lineItemUrl: buildLti1p3AgsLineItemUrl(connection, tenantId, courseId, assignmentId, toolId),
    };
  };

  const publishLti1p3AgsScoreForTool = async (
    accessToken: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    toolId: string,
    score: Lti1p3AgsScore,
  ): Promise<void> => {
    await readLti1p3AgsLineItemContextForTool(
      accessToken,
      tenantId,
      courseId,
      assignmentId,
      toolId,
      lti1p3AgsScoreScope,
    );

    const activeMemberships = await listCourseMembershipRecords(dbHandle.db, {
      tenantId,
      courseId,
      status: 'active',
    });

    if (!activeMemberships.some((membership) => membership.userId === score.userId)) {
      throw new ApiError('bad_request', ltiAgsStudentMissingMessage);
    }

    let outcomeInput: ReturnType<typeof mapLti1p3AgsScoreToOutcomeInput>;

    try {
      outcomeInput = mapLti1p3AgsScoreToOutcomeInput({
        tenantId,
        courseId,
        assignmentId,
        externalToolId: toolId,
        score,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError('bad_request', error.message);
      }

      throw error;
    }

    await recordCourseExternalToolOutcome(dbHandle.db, outcomeInput);
  };

  const listLti1p3AgsResultsForTool = async (
    accessToken: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    toolId: string,
    userId?: string,
  ): Promise<Lti1p3AgsResultContainer> => {
    const { lineItemUrl } = await readLti1p3AgsLineItemContextForTool(
      accessToken,
      tenantId,
      courseId,
      assignmentId,
      toolId,
      lti1p3AgsResultReadonlyScope,
    );
    const outcomes = await listCourseExternalToolOutcomesForAssignment(dbHandle.db, {
      tenantId,
      courseId,
      assignmentId,
    });

    return buildLti1p3AgsResultContainer({
      lineItemUrl,
      outcomes: outcomes.filter((outcome) => outcome.externalToolId === toolId),
      userId,
    });
  };

  const readPublishedScormPackageForRuntime = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    scormPackageId: string,
  ): Promise<ScormPackage> => {
    await readCourseAccessContext(actorUserId, tenantId, courseId);
    const scormPackage = await getScormPackageForCourse(dbHandle.db, {
      tenantId,
      courseId,
      scormPackageId,
    });

    if (!scormPackage || scormPackage.status !== 'published') {
      throw new ApiError(
        'not_found',
        'Published SCORM package was not found in this course. Check the package and retry.',
      );
    }

    return scormPackage;
  };

  const initializeScormRuntimeForActor = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    scormPackageId: string,
  ): Promise<ScormRuntimeState> => {
    await readPublishedScormPackageForRuntime(actorUserId, tenantId, courseId, scormPackageId);
    const existingAttempt = await getScormAttemptForStudent(dbHandle.db, {
      tenantId,
      scormPackageId,
      studentId: actorUserId,
    });
    const now = new Date();
    const attemptInput =
      existingAttempt === null
        ? buildInitialScormRuntimeAttempt({
            tenantId,
            scormPackageId,
            studentId: actorUserId,
            now,
          })
        : {
            tenantId,
            scormPackageId,
            studentId: actorUserId,
            completionStatus: existingAttempt.completionStatus,
            successStatus: existingAttempt.successStatus,
            scoreScaled: existingAttempt.scoreScaled,
            totalTimeSeconds: existingAttempt.totalTimeSeconds,
            suspendData: existingAttempt.suspendData,
            lastVisitedAt: now,
          };
    const attempt = await upsertScormAttemptRecord(dbHandle.db, attemptInput);

    return buildScormRuntimeState(attempt);
  };

  const commitScormRuntimeForActor = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    scormPackageId: string,
    input: ScormRuntimeCommitApiInput,
  ): Promise<ScormRuntimeState> => {
    await readPublishedScormPackageForRuntime(actorUserId, tenantId, courseId, scormPackageId);
    const existingAttempt = await getScormAttemptForStudent(dbHandle.db, {
      tenantId,
      scormPackageId,
      studentId: actorUserId,
    });
    const now = new Date();
    const attempt =
      existingAttempt ??
      buildInitialScormRuntimeAttempt({
        tenantId,
        scormPackageId,
        studentId: actorUserId,
        now,
      });
    let attemptInput: ReturnType<typeof applyScormRuntimeCommit>;

    try {
      attemptInput = applyScormRuntimeCommit({ attempt, values: input.values, now });
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError('bad_request', error.message);
      }

      throw error;
    }

    const savedAttempt = await upsertScormAttemptRecord(dbHandle.db, attemptInput);

    return buildScormRuntimeState(savedAttempt);
  };

  const batchUpsertSubmissionGradesForAssignment = async (
    actorUserId: string,
    tenantId: string,
    courseId: string,
    assignmentId: string,
    items: BatchUpsertSubmissionGradeItem[],
  ): Promise<{
    results: BatchUpsertSubmissionGradeResult[];
    savedCount: number;
    failedCount: number;
  }> => {
    const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
    if (!canViewCourseRoster(access)) {
      throw new ApiError(
        'forbidden',
        'Only course staff can grade submissions. Ask an instructor for access.',
      );
    }
    const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);
    if (!assignment || assignment.courseId !== courseId) {
      throw new ApiError(
        'not_found',
        'Assignment was not found in this course. Check the assignment id and retry the request.',
      );
    }
    if (assignment.gradingLocked) {
      throw new ApiError(
        'forbidden',
        'Grading is locked for this assignment. Unlock the assignment before recording grades.',
      );
    }

    const submissions = await listSubmissionsForAssignment(dbHandle.db, tenantId, assignmentId);
    const submissionIndex = new Map(submissions.map((entry) => [entry.id as string, entry]));

    const results = await Promise.all(
      items.map(async (item) => {
        const submission = submissionIndex.get(item.submissionId);
        if (!submission) {
          return {
            submissionId: item.submissionId,
            status: 'failed' as const,
            grade: null,
            error: 'Submission not found for this assignment.',
          };
        }
        try {
          const previousGrade = await getGradeBySubmissionId(
            dbHandle.db,
            tenantId,
            item.submissionId,
          );
          const grade = await upsertSubmissionGradeRecord(dbHandle.db, {
            tenantId,
            submissionId: item.submissionId,
            score: applyAssignmentLatePenalty(assignment, submission, item.score),
            maxScore: item.maxScore,
            status: item.status,
            source: 'manual' satisfies GradeSource,
            actorId: actorUserId,
          });
          await recordGradeLifecycleSideEffects(dbHandle.db, actorUserId, previousGrade, grade);
          return {
            submissionId: item.submissionId,
            status: 'saved' as const,
            grade,
            error: null,
          };
        } catch (error) {
          return {
            submissionId: item.submissionId,
            status: 'failed' as const,
            grade: null,
            error: error instanceof Error ? error.message : 'Unknown error.',
          };
        }
      }),
    );

    const savedCount = results.filter((result) => result.status === 'saved').length;
    return {
      results,
      savedCount,
      failedCount: results.length - savedCount,
    };
  };

  let auth: Auth | null = null;
  if (environment.BETTER_AUTH_SECRET && environment.BETTER_AUTH_URL) {
    auth = createAuth({
      db: dbHandle.db,
      secret: environment.BETTER_AUTH_SECRET,
      baseUrl: environment.BETTER_AUTH_URL,
      trustedOrigins: environment.BETTER_AUTH_TRUSTED_ORIGINS?.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      sendPasswordResetEmail: async (input) => {
        if (process.env.NODE_ENV !== 'production') {
          // Dev no-op: print the reset URL so the link can be opened locally.
          console.info('[better-auth] password reset', {
            to: input.user.email,
            url: input.url,
          });
        }
      },
      sendVerificationEmail: async (input) => {
        if (process.env.NODE_ENV !== 'production') {
          // Dev no-op: print the verification URL so the link can be opened locally.
          console.info('[better-auth] email verification', {
            to: input.user.email,
            url: input.url,
          });
        }
      },
    });
  }

  return {
    authHandler: auth ? (request) => auth.handler(request) : null,
    getSessionByToken: (sessionToken) => getCoreSessionByToken(dbHandle.db, sessionToken),
    createInitialTenant: async (actorUserId, input) => {
      try {
        const result = await signUpWithTenant(dbHandle.db, {
          userId: actorUserId,
          tenantSlug: input.slug,
          tenantDisplayName: input.displayName,
        });
        return result.tenant;
      } catch (error) {
        if (error instanceof TenantSlugTakenError) {
          throw new ApiError(
            'conflict',
            'That institution slug is already taken. Pick a different one.',
          );
        }
        throw error;
      }
    },
    listTenants: async (actorUserId) => {
      const memberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const tenants = await Promise.all(
        memberships.map((membership) => getTenantById(dbHandle.db, membership.tenantId)),
      );

      return tenants.filter((tenant): tenant is Tenant => tenant !== null);
    },
    listTenantMembers: async (actorUserId, tenantId) => {
      const memberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const isStaff = memberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!isStaff) {
        throw new ApiError(
          'forbidden',
          'Only tenant staff can list tenant members. Ask an administrator for access.',
        );
      }

      return listTenantMembers(dbHandle.db, tenantId);
    },
    updateTenantFileStorageQuotas: async (actorUserId, tenantId, input) => {
      await assertInstitutionAdmin(actorUserId, tenantId, tenantFileStorageQuotaAdminOnlyMessage);

      const previousTenant = await getTenantById(dbHandle.db, tenantId);
      if (!previousTenant) {
        throw new ApiError(
          'not_found',
          'Tenant was not found. Check the tenant id and retry the request.',
        );
      }

      const updatedTenant = await updateTenantFileStorageQuotasRecord(dbHandle.db, {
        tenantId,
        storageByteLimit: input.storageByteLimit,
        defaultUserStorageByteLimit: input.defaultUserStorageByteLimit,
      });

      if (!updatedTenant) {
        throw new ApiError(
          'not_found',
          'Tenant was not found. Check the tenant id and retry the request.',
        );
      }

      if (
        previousTenant.storageByteLimit !== updatedTenant.storageByteLimit ||
        previousTenant.defaultUserStorageByteLimit !== updatedTenant.defaultUserStorageByteLimit
      ) {
        await saveAuditLog(
          dbHandle.db,
          buildTenantFileStorageQuotaChangedAuditLog({
            tenantId,
            actorId: actorUserId,
            previousStorageByteLimit: previousTenant.storageByteLimit,
            storageByteLimit: updatedTenant.storageByteLimit,
            previousDefaultUserStorageByteLimit: previousTenant.defaultUserStorageByteLimit,
            defaultUserStorageByteLimit: updatedTenant.defaultUserStorageByteLimit,
            updatedAt: updatedTenant.updatedAt,
          }),
        );
      }

      return updatedTenant;
    },
    listWebhookSubscriptions: async (actorUserId, tenantId) => {
      await assertInstitutionAdmin(actorUserId, tenantId, webhookSubscriptionAdminOnlyMessage);

      return listWebhookSubscriptionRecords(dbHandle.db, tenantId);
    },
    createWebhookSubscription: async (actorUserId, tenantId, input) => {
      await assertInstitutionAdmin(actorUserId, tenantId, webhookSubscriptionAdminOnlyMessage);

      if (
        environment.WEBHOOK_SIGNING_SECRET_ENCRYPTION_KEY === undefined ||
        environment.WEBHOOK_SIGNING_SECRET_ENCRYPTION_KEY.trim() === ''
      ) {
        throw new ApiError('bad_request', webhookSigningSecretEncryptionKeyMessage);
      }

      const encryptedSigningSecret = serializeEncryptedSecret(
        encryptSecret(input.signingSecret, environment.WEBHOOK_SIGNING_SECRET_ENCRYPTION_KEY),
      );

      return createWebhookSubscriptionRecord(dbHandle.db, {
        tenantId,
        name: input.name,
        endpointUrl: input.endpointUrl,
        topics: input.topics,
        status: input.status,
        encryptedSigningSecret,
      });
    },
    updateWebhookSubscription: async (actorUserId, tenantId, webhookSubscriptionId, input) => {
      await assertInstitutionAdmin(actorUserId, tenantId, webhookSubscriptionAdminOnlyMessage);

      let encryptedSigningSecret: string | undefined;
      if (input.signingSecret !== undefined) {
        if (
          environment.WEBHOOK_SIGNING_SECRET_ENCRYPTION_KEY === undefined ||
          environment.WEBHOOK_SIGNING_SECRET_ENCRYPTION_KEY.trim() === ''
        ) {
          throw new ApiError('bad_request', webhookSigningSecretEncryptionKeyMessage);
        }

        encryptedSigningSecret = serializeEncryptedSecret(
          encryptSecret(input.signingSecret, environment.WEBHOOK_SIGNING_SECRET_ENCRYPTION_KEY),
        );
      }

      const updated = await updateWebhookSubscriptionRecord(dbHandle.db, {
        tenantId,
        webhookSubscriptionId,
        name: input.name,
        endpointUrl: input.endpointUrl,
        topics: input.topics,
        status: input.status,
        ...(encryptedSigningSecret === undefined ? {} : { encryptedSigningSecret }),
      });

      if (!updated) {
        throw new ApiError(
          'not_found',
          'Webhook subscription was not found for this tenant. Check the subscription id and retry the request.',
        );
      }

      return updated;
    },
    deleteWebhookSubscription: async (actorUserId, tenantId, webhookSubscriptionId) => {
      await assertInstitutionAdmin(actorUserId, tenantId, webhookSubscriptionAdminOnlyMessage);

      const deleted = await deleteWebhookSubscriptionRecord(dbHandle.db, {
        tenantId,
        webhookSubscriptionId,
      });

      if (!deleted) {
        throw new ApiError(
          'not_found',
          'Webhook subscription was not found for this tenant. Check the subscription id and retry the request.',
        );
      }
    },
    listTenantFeatureFlags: async (actorUserId, tenantId) => {
      await assertInstitutionAdmin(
        actorUserId,
        tenantId,
        'Only institution admins can manage tenant feature flags. Ask an administrator for access.',
      );

      return listTenantFeatureFlagRecords(dbHandle.db, tenantId);
    },
    listUserLegalHolds: async (actorUserId, tenantId, input) => {
      await assertInstitutionAdmin(
        actorUserId,
        tenantId,
        'Only institution admins can manage legal holds. Ask an administrator for access.',
      );

      return listUserLegalHoldRecords(dbHandle.db, {
        tenantId,
        userId: input.userId,
        status: input.status ?? 'active',
      });
    },
    createUserLegalHold: async (actorUserId, tenantId, input) => {
      await assertInstitutionAdmin(
        actorUserId,
        tenantId,
        'Only institution admins can manage legal holds. Ask an administrator for access.',
      );

      const targetMemberships = await listUserTenantMemberships(dbHandle.db, input.userId);
      const isTenantMember = targetMemberships.some(
        (membership) => membership.tenantId === tenantId,
      );

      if (!isTenantMember) {
        throw new ApiError(
          'not_found',
          'User was not found in this tenant. Add the user to the tenant before creating a legal hold.',
        );
      }

      try {
        return await createUserLegalHoldRecord(dbHandle.db, {
          tenantId,
          userId: input.userId,
          createdById: actorUserId,
          reason: input.reason,
        });
      } catch (error) {
        if (isUserLegalHoldActiveDuplicate(error)) {
          throw new ApiError(
            'conflict',
            'An active legal hold already exists for this user in this tenant. Release the existing hold before creating another.',
          );
        }

        throw error;
      }
    },
    releaseUserLegalHold: async (actorUserId, tenantId, legalHoldId) => {
      await assertInstitutionAdmin(
        actorUserId,
        tenantId,
        'Only institution admins can manage legal holds. Ask an administrator for access.',
      );

      const legalHold = await releaseUserLegalHoldRecord(dbHandle.db, {
        tenantId,
        legalHoldId,
      });

      if (!legalHold) {
        throw new ApiError(
          'not_found',
          'Active legal hold was not found for this tenant. Check the hold id and retry the request.',
        );
      }

      return legalHold;
    },
    listRetentionPolicies: async (actorUserId, tenantId) => {
      await assertInstitutionAdmin(
        actorUserId,
        tenantId,
        'Only institution admins can manage retention policies. Ask an administrator for access.',
      );

      return listRetentionPolicyRecords(dbHandle.db, tenantId);
    },
    upsertRetentionPolicy: async (actorUserId, tenantId, targetType, input) => {
      await assertInstitutionAdmin(
        actorUserId,
        tenantId,
        'Only institution admins can manage retention policies. Ask an administrator for access.',
      );

      return upsertRetentionPolicyRecord(dbHandle.db, {
        tenantId,
        targetType,
        retainDays: input.retainDays,
      });
    },
    upsertTenantFeatureFlag: async (actorUserId, tenantId, key, input) => {
      await assertInstitutionAdmin(
        actorUserId,
        tenantId,
        'Only institution admins can manage tenant feature flags. Ask an administrator for access.',
      );

      return upsertTenantFeatureFlagRecord(dbHandle.db, {
        tenantId,
        key,
        enabled: input.enabled,
        description: input.description,
      });
    },
    deleteTenantFeatureFlag: async (actorUserId, tenantId, key) => {
      await assertInstitutionAdmin(
        actorUserId,
        tenantId,
        'Only institution admins can manage tenant feature flags. Ask an administrator for access.',
      );

      const deleted = await deleteTenantFeatureFlagRecord(dbHandle.db, tenantId, key);
      if (!deleted) {
        throw new ApiError(
          'not_found',
          'Feature flag was not found for this tenant. Check the feature flag key and retry the request.',
        );
      }
    },
    listAiActions: async (actorUserId, tenantId) => {
      const memberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const isStaff = memberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!isStaff) {
        throw new ApiError(
          'forbidden',
          'Only tenant staff can view the AI action registry. Ask an administrator for access.',
        );
      }

      return aiActions;
    },
    listAuditLogs: async (actorUserId, tenantId, input) => {
      await assertAuditLogViewPermission(actorUserId, tenantId);

      return listAuditLogsForTenant(dbHandle.db, { tenantId, ...input });
    },
    exportAuditLogsCsv: async (actorUserId, tenantId, input) => {
      await assertAuditLogViewPermission(actorUserId, tenantId);

      const logs = await listAuditLogsForTenant(dbHandle.db, { tenantId, ...input });
      return serializeAuditLogsAsCsv(logs);
    },
    ingestXapiStatement: async (actorUserId, tenantId, input) => {
      await assertTenantMembership(actorUserId, tenantId);

      return saveXapiStatement(dbHandle.db, {
        tenantId,
        statementId: input.id ?? randomUUID(),
        receivedById: actorUserId,
        actor: input.actor,
        verb: input.verb,
        object: input.object,
        result: input.result ?? null,
        context: input.context ?? null,
        timestamp: input.timestamp ? new Date(input.timestamp) : null,
      });
    },
    listMyConsents: async (actorUserId, tenantId) => {
      await assertTenantMembership(actorUserId, tenantId);
      return listConsentsForSubject(dbHandle.db, tenantId, actorUserId);
    },
    listMyCredentialAwards: async (actorUserId, tenantId) => {
      await assertTenantMembership(actorUserId, tenantId);
      return listCredentialAwardsForStudent(dbHandle.db, tenantId, actorUserId);
    },
    recordMyConsent: async (actorUserId, tenantId, input) => {
      await assertTenantMembership(actorUserId, tenantId);

      return appendConsent(dbHandle.db, {
        tenantId,
        subjectId: actorUserId,
        actionType: input.actionType,
        scope: input.scope,
        scopeId: input.scopeId,
        state: input.state,
        evidence: input.evidence,
        expiresAt: input.expiresAt,
      });
    },
    getProviderConfig: async (actorUserId, tenantId) => {
      await assertInstitutionAdmin(
        actorUserId,
        tenantId,
        'Only institution admins can view AI provider config. Ask an administrator for access.',
      );

      const config = await getProviderConfigByTenantId(dbHandle.db, tenantId);

      if (!config) {
        throw new ApiError(
          'not_found',
          'No AI provider config has been set for this tenant. Configure one to enable AI features.',
        );
      }

      return toProviderConfigSummary(config);
    },
    upsertProviderConfig: async (actorUserId, tenantId, input) => {
      await assertInstitutionAdmin(
        actorUserId,
        tenantId,
        'Only institution admins can change AI provider config. Ask an administrator for access.',
      );

      if (
        environment.ENCRYPTION_KEY_BASE64 === undefined ||
        environment.ENCRYPTION_KEY_BASE64.trim() === ''
      ) {
        throw new ApiError(
          'internal_error',
          'AI provider credential encryption is not configured. Set ENCRYPTION_KEY_BASE64 and retry.',
        );
      }

      const encryptedApiKey =
        input.apiKey !== undefined && input.apiKey.trim() !== ''
          ? serializeEncryptedSecret(encryptSecret(input.apiKey, environment.ENCRYPTION_KEY_BASE64))
          : null;

      try {
        const saved = await upsertProviderConfigRecord(dbHandle.db, {
          tenantId,
          providerType: input.providerType,
          baseUrl: input.baseUrl,
          encryptedApiKey,
          modelPreferences: input.modelPreferences,
          capabilities: input.capabilities,
          quota: input.quota,
        });

        return toProviderConfigSummary(saved);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message ===
            'Provider config cannot be created without an encrypted API key — none was supplied.'
        ) {
          throw new ApiError(
            'bad_request',
            'An API key is required when creating a new provider config.',
          );
        }
        throw error;
      }
    },
    deleteProviderConfig: async (actorUserId, tenantId) => {
      await assertInstitutionAdmin(
        actorUserId,
        tenantId,
        'Only institution admins can delete AI provider config. Ask an administrator for access.',
      );

      const deleted = await deleteProviderConfigByTenantId(dbHandle.db, tenantId);
      if (!deleted) {
        throw new ApiError(
          'not_found',
          'No AI provider config exists for this tenant. Nothing to delete.',
        );
      }
    },
    getAiUsageSummary: async (actorUserId, tenantId, from, to) => {
      const memberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const isStaff = memberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!isStaff) {
        throw new ApiError(
          'forbidden',
          'Only tenant staff can view AI usage telemetry. Ask an administrator for access.',
        );
      }

      return getAiUsageSummary(dbHandle.db, { tenantId, from, to });
    },
    listAiUsageByAction: async (actorUserId, tenantId, from, to) => {
      const memberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const isStaff = memberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!isStaff) {
        throw new ApiError(
          'forbidden',
          'Only tenant staff can view AI usage telemetry. Ask an administrator for access.',
        );
      }

      return getAiUsageByAction(dbHandle.db, { tenantId, from, to });
    },
    listAiUsageByActor: async (actorUserId, tenantId, from, to) => {
      const memberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const isStaff = memberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!isStaff) {
        throw new ApiError(
          'forbidden',
          'Only tenant staff can view AI usage telemetry. Ask an administrator for access.',
        );
      }

      return getAiUsageByActor(dbHandle.db, { tenantId, from, to });
    },
    updateTenantMembership: async (actorUserId, tenantId, membershipId, input) => {
      await assertInstitutionAdmin(
        actorUserId,
        tenantId,
        'Only institution admins can change tenant member roles. Ask an administrator to make the change.',
      );

      const previousMembership = await getTenantMembershipById(dbHandle.db, {
        tenantId,
        membershipId,
      });

      if (!previousMembership) {
        throw new ApiError(
          'not_found',
          'Tenant membership was not found. Check the membership id and retry the request.',
        );
      }

      try {
        const updated = await updateTenantMembershipRecord(dbHandle.db, {
          tenantId,
          membershipId,
          role: input.role,
        });

        if (!updated) {
          throw new ApiError(
            'not_found',
            'Tenant membership was not found. Check the membership id and retry the request.',
          );
        }

        if (previousMembership.role !== updated.role) {
          await saveAuditLog(
            dbHandle.db,
            buildTenantMembershipRoleChangedAuditLog({
              tenantId,
              actorId: actorUserId,
              membershipId: updated.id,
              targetUserId: updated.userId,
              previousRole: previousMembership.role,
              role: updated.role,
              updatedAt: updated.updatedAt,
            }),
          );
        }

        return updated;
      } catch (error) {
        if (isTenantMembershipDuplicate(error)) {
          throw new ApiError(
            'conflict',
            'This user already has the requested role in this tenant.',
          );
        }

        throw error;
      }
    },
    getCurrentUser: async (actorUserId) => {
      const user = await getUserById(dbHandle.db, actorUserId);

      if (!user) {
        throw new ApiError(
          'unauthorized',
          'The authenticated user no longer exists. Sign in again to continue.',
        );
      }

      return user;
    },
    updateCurrentUser: async (actorUserId, input) => {
      const user = await updateUserProfileRecord(dbHandle.db, actorUserId, input);

      if (!user) {
        throw new ApiError(
          'unauthorized',
          'The authenticated user no longer exists. Sign in again to continue.',
        );
      }

      return user;
    },
    deleteCurrentUser: async (actorUserId) => {
      let user: User | null;
      const deletedAt = new Date();
      const tenantMemberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      let retainUntil: Date | null = null;

      for (const membership of tenantMemberships) {
        const policy = await getRetentionPolicy(dbHandle.db, membership.tenantId, 'deleted_user');
        const candidate = calculateUserRetainUntil(deletedAt, policy);

        if (candidate && (!retainUntil || candidate > retainUntil)) {
          retainUntil = candidate;
        }
      }

      try {
        user = await anonymizeAuthUserForDeletion(dbHandle.db, actorUserId, deletedAt, retainUntil);
      } catch (error) {
        if (error instanceof UserDeletionBlockedByLegalHoldError) {
          throw new ApiError(
            'forbidden',
            'This account cannot be deleted while an active legal hold exists. Contact an administrator to resolve the hold.',
          );
        }

        throw error;
      }

      if (!user) {
        throw new ApiError(
          'unauthorized',
          'The authenticated user no longer exists. Sign in again to continue.',
        );
      }
    },
    listMyTenantMemberships: async (actorUserId) => {
      return listUserTenantMemberships(dbHandle.db, actorUserId);
    },
    listMyCourseMemberships: async (actorUserId) => {
      return listUserCourseMemberships(dbHandle.db, actorUserId);
    },
    listCourses: async (actorUserId, tenantId) => {
      await assertTenantMembership(actorUserId, tenantId);

      return listCourses(dbHandle.db, tenantId);
    },
    listCatalogCourses: async (tenantId, options) => {
      return listCatalogCoursesForTenant(dbHandle.db, {
        tenantId,
        ...(options?.isBlueprint !== undefined ? { isBlueprint: options.isBlueprint } : {}),
        ...(options?.catalogCategory !== undefined
          ? { catalogCategory: options.catalogCategory }
          : {}),
        ...(options?.academicTerm !== undefined ? { academicTerm: options.academicTerm } : {}),
      });
    },
    listCourseFavorites: async (actorUserId, tenantId) => {
      await assertTenantMembership(actorUserId, tenantId);

      return listCourseFavoritesForUser(dbHandle.db, tenantId, actorUserId);
    },
    favoriteCourse: async (actorUserId, tenantId, courseId) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      return favoriteCourse(dbHandle.db, {
        tenantId,
        courseId,
        userId: actorUserId,
      });
    },
    unfavoriteCourse: async (actorUserId, tenantId, courseId) => {
      await assertTenantMembership(actorUserId, tenantId);

      await unfavoriteCourse(dbHandle.db, {
        tenantId,
        courseId,
        userId: actorUserId,
      });
    },
    getCourseNextPosition: async (actorUserId, tenantId, courseId, scope) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can read auto-positions. Ask an instructor for access.',
        );
      }

      const nextPosition = await getNextPositionForScope(
        dbHandle.db,
        scope.kind === 'course_unit'
          ? { kind: 'course_unit', tenantId, courseId, moduleId: scope.moduleId }
          : { kind: scope.kind, tenantId, courseId },
      );

      return { nextPosition };
    },
    reorderCourseContent: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can reorder course content. Ask an instructor for access.',
        );
      }

      try {
        return await reorderInScope(
          dbHandle.db,
          input.scope.kind === 'course_unit'
            ? {
                kind: 'course_unit',
                tenantId,
                courseId,
                moduleId: input.scope.moduleId,
              }
            : { kind: input.scope.kind, tenantId, courseId },
          input.orderedIds,
        );
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.startsWith('Duplicate id')) {
            throw new ApiError('bad_request', 'orderedIds contains duplicate values.');
          }
          if (error.message.startsWith('Id not found')) {
            throw new ApiError(
              'bad_request',
              'orderedIds references items that are not in the requested scope.',
            );
          }
        }

        throw error;
      }
    },
    createCourse: async (actorUserId, tenantId, input) => {
      const tenantMemberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const hasTenantStaffAccess = tenantMemberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!hasTenantStaffAccess) {
        throw new ApiError('forbidden', courseTenantStaffOnlyMessage);
      }

      try {
        return await createCourseRecord(dbHandle.db, {
          tenantId,
          code: input.code,
          title: input.title,
          status: input.status,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          ...(input.catalogCategory !== undefined
            ? { catalogCategory: input.catalogCategory }
            : {}),
          ...(input.academicTerm !== undefined ? { academicTerm: input.academicTerm } : {}),
          ...(input.isBlueprint !== undefined ? { isBlueprint: input.isBlueprint } : {}),
        });
      } catch (error) {
        if (isCourseCodeDuplicate(error)) {
          throw new ApiError('conflict', courseDuplicateCodeMessage);
        }

        throw error;
      }
    },
    updateCourse: async (actorUserId, tenantId, courseId, input) => {
      const tenantMemberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const hasTenantStaffAccess = tenantMemberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!hasTenantStaffAccess) {
        throw new ApiError('forbidden', courseTenantStaffOnlyMessage);
      }

      try {
        const updated = await updateCourseRecord(dbHandle.db, {
          tenantId,
          courseId,
          code: input.code,
          title: input.title,
          status: input.status,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          catalogCategory: input.catalogCategory ?? null,
          academicTerm: input.academicTerm ?? null,
          isBlueprint: input.isBlueprint ?? false,
        });

        if (!updated) {
          throw new ApiError('not_found', courseNotFoundForTenantMessage);
        }

        return updated;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        if (isCourseCodeDuplicate(error)) {
          throw new ApiError('conflict', courseDuplicateCodeMessage);
        }
        throw error;
      }
    },
    deleteCourse: async (actorUserId, tenantId, courseId) => {
      const tenantMemberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const hasTenantStaffAccess = tenantMemberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!hasTenantStaffAccess) {
        throw new ApiError('forbidden', courseDeleteTenantStaffOnlyMessage);
      }

      const deleted = await softDeleteCourseRecord(dbHandle.db, { tenantId, courseId });

      if (!deleted) {
        throw new ApiError('not_found', courseNotFoundForTenantMessage);
      }
    },
    restoreDeletedCourse: async (actorUserId, tenantId, courseId) => {
      const tenantMemberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const hasTenantStaffAccess = tenantMemberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!hasTenantStaffAccess) {
        throw new ApiError('forbidden', courseRestoreTenantStaffOnlyMessage);
      }

      const restored = await restoreDeletedCourseRecord(dbHandle.db, { tenantId, courseId });

      if (!restored) {
        throw new ApiError('not_found', courseNotFoundForTenantMessage);
      }

      return restored;
    },
    copyCourse: async (actorUserId, tenantId, sourceCourseId, input) => {
      const tenantMemberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const hasTenantStaffAccess = tenantMemberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!hasTenantStaffAccess) {
        throw new ApiError(
          'forbidden',
          'Only tenant staff can copy courses. Ask an institution administrator for access.',
        );
      }

      try {
        return await copyCourseTemplate(dbHandle.db, {
          tenantId,
          sourceCourseId,
          targetCourseId: input.targetCourseId,
        });
      } catch (error) {
        if (error instanceof CourseCopySameCourseError) {
          throw new ApiError('bad_request', error.message);
        }

        throw error;
      }
    },
    exportCourseBackup: async (actorUserId, tenantId, courseId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can export course backups. Ask an instructor for access.',
        );
      }

      const backup = await exportCourseBackup(dbHandle.db, { tenantId, courseId });

      if (!backup) {
        throw new ApiError(
          'not_found',
          'Course was not found in this tenant. Check the course id and retry the request.',
        );
      }

      return backup;
    },
    exportCourseCommonCartridge: async (actorUserId, tenantId, courseId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can export Common Cartridge packages. Ask an instructor for access.',
        );
      }

      const backup = await exportCourseBackup(dbHandle.db, { tenantId, courseId });

      if (!backup) {
        throw new ApiError(
          'not_found',
          'Course was not found in this tenant. Check the course id and retry the request.',
        );
      }

      return exportCourseBackupAsCommonCartridge(backup, new Date());
    },
    importCourseCommonCartridge: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can import Common Cartridge packages. Ask an instructor for access.',
        );
      }

      let backup: CourseBackup;

      try {
        backup = parseCommonCartridgeCoursePackage({
          package: input,
          tenantId,
          courseId,
          now: new Date(),
        });
      } catch (error) {
        if (error instanceof CommonCartridgeParseError) {
          throw new ApiError('bad_request', error.message);
        }

        throw error;
      }

      try {
        const result = await restoreCourseBackup(dbHandle.db, {
          tenantId,
          targetCourseId: courseId,
          backup,
        });

        return CommonCartridgeImportResult.parse({
          format: 'imscc_1_3',
          ...result,
        });
      } catch (error) {
        if (error instanceof CourseRestoreVersionError) {
          throw new ApiError('bad_request', error.message);
        }
        if (error instanceof CourseRestoreTargetMissingError) {
          throw new ApiError('not_found', error.message);
        }

        throw error;
      }
    },
    getCourseAnalyticsSummary: async (actorUserId, tenantId, courseId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can view course analytics. Ask an instructor for access.',
        );
      }

      return getCourseAnalyticsSummary(dbHandle.db, { tenantId, courseId });
    },
    restoreCourseBackup: async (actorUserId, tenantId, courseId, input) => {
      const tenantMemberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const hasTenantStaffAccess = tenantMemberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!hasTenantStaffAccess) {
        throw new ApiError(
          'forbidden',
          'Only tenant staff can restore course backups. Ask an institution administrator for access.',
        );
      }

      try {
        return await restoreCourseBackup(dbHandle.db, {
          tenantId,
          targetCourseId: courseId,
          backup: input.backup,
        });
      } catch (error) {
        if (error instanceof CourseRestoreVersionError) {
          throw new ApiError('bad_request', error.message);
        }
        if (error instanceof CourseRestoreTargetMissingError) {
          throw new ApiError('not_found', error.message);
        }

        throw error;
      }
    },
    listRubrics: async (actorUserId, tenantId) => {
      const tenantMemberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const hasTenantStaffAccess = tenantMemberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!hasTenantStaffAccess) {
        throw new ApiError('forbidden', rubricTenantStaffOnlyMessage);
      }

      return await listRubricsForTenant(dbHandle.db, tenantId);
    },
    getRubric: async (actorUserId, tenantId, rubricId) => {
      const tenantMemberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const hasTenantStaffAccess = tenantMemberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!hasTenantStaffAccess) {
        throw new ApiError('forbidden', rubricTenantStaffOnlyMessage);
      }

      const rubric = await getRubricById(dbHandle.db, tenantId, rubricId);
      if (!rubric) {
        throw new ApiError('not_found', rubricNotFoundMessage);
      }

      return rubric;
    },
    createRubric: async (actorUserId, tenantId, input) => {
      const tenantMemberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const hasTenantStaffAccess = tenantMemberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!hasTenantStaffAccess) {
        throw new ApiError('forbidden', rubricTenantStaffOnlyMessage);
      }

      try {
        return await createRubricRecord(dbHandle.db, {
          tenantId,
          title: input.title,
          sourceTemplateId: input.sourceTemplateId,
          criteria: input.criteria,
        });
      } catch (error) {
        if (isRubricSourceTemplateMissing(error)) {
          throw new ApiError('bad_request', rubricTemplateMissingMessage);
        }

        throw error;
      }
    },
    updateRubric: async (actorUserId, tenantId, rubricId, input) => {
      const tenantMemberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const hasTenantStaffAccess = tenantMemberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!hasTenantStaffAccess) {
        throw new ApiError('forbidden', rubricTenantStaffOnlyMessage);
      }

      try {
        const updated = await updateRubricRecord(dbHandle.db, {
          tenantId,
          rubricId,
          title: input.title,
          sourceTemplateId: input.sourceTemplateId,
          criteria: input.criteria,
        });

        if (!updated) {
          throw new ApiError('not_found', rubricNotFoundMessage);
        }

        return updated;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        if (isRubricSourceTemplateMissing(error)) {
          throw new ApiError('bad_request', rubricTemplateMissingMessage);
        }

        throw error;
      }
    },
    deleteRubric: async (actorUserId, tenantId, rubricId) => {
      const tenantMemberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const hasTenantStaffAccess = tenantMemberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!hasTenantStaffAccess) {
        throw new ApiError('forbidden', rubricTenantStaffOnlyMessage);
      }

      const deleted = await deleteRubricRecord(dbHandle.db, {
        tenantId,
        rubricId,
      });

      if (!deleted) {
        throw new ApiError('not_found', rubricNotFoundMessage);
      }
    },
    listCourseSections: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const sections = await listCourseSectionsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: canViewAllContent ? allCourseSectionStatuses : ['active'],
      });

      return sections.filter((section) => canViewCourseSection(section, canViewAllContent));
    },
    createCourseSection: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseSectionStaffOnlyMessage);
      }

      try {
        return await createCourseSectionRecord(dbHandle.db, {
          tenantId,
          courseId,
          name: input.name,
          status: input.status,
          position: input.position,
          meetingDays: input.meetingDays,
          meetingStartTime: input.meetingStartTime,
          meetingEndTime: input.meetingEndTime,
          location: input.location,
        });
      } catch (error) {
        if (isCourseSectionCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        throw error;
      }
    },
    updateCourseSection: async (actorUserId, tenantId, courseId, courseSectionId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseSectionStaffOnlyMessage);
      }

      const updated = await updateCourseSectionRecord(dbHandle.db, {
        tenantId,
        courseId,
        courseSectionId,
        name: input.name,
        status: input.status,
        position: input.position,
        meetingDays: input.meetingDays,
        meetingStartTime: input.meetingStartTime,
        meetingEndTime: input.meetingEndTime,
        location: input.location,
      });

      if (!updated) {
        throw new ApiError('not_found', courseSectionNotFoundMessage);
      }

      return updated;
    },
    deleteCourseSection: async (actorUserId, tenantId, courseId, courseSectionId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseSectionStaffOnlyMessage);
      }

      const deleted = await deleteCourseSectionRecord(dbHandle.db, {
        tenantId,
        courseId,
        courseSectionId,
      });

      if (!deleted) {
        throw new ApiError('not_found', courseSectionNotFoundMessage);
      }
    },
    listCourseAnnouncements: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;

      return listCourseAnnouncementsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: canViewAllContent ? allCourseAnnouncementStatuses : ['published'],
      });
    },
    createCourseAnnouncement: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can create announcements. Ask an instructor for access.',
        );
      }

      try {
        return await dbHandle.db.transaction(async (tx) => {
          const announcement = await createCourseAnnouncementRecord(tx, {
            tenantId,
            courseId,
            authorId: UserId.parse(actorUserId),
            title: input.title,
            body: input.body,
            status: input.status,
            pinned: input.pinned,
          });

          if (announcement.status === 'published') {
            await saveAnnouncementPublishedEvent(tx, announcement);
          }

          return announcement;
        });
      } catch (error) {
        if (isCourseAnnouncementCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        throw error;
      }
    },
    updateCourseAnnouncement: async (actorUserId, tenantId, courseId, announcementId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can change announcements. Ask an instructor for access.',
        );
      }

      return dbHandle.db.transaction(async (tx) => {
        const existing = await getCourseAnnouncementForCourse(
          tx,
          tenantId,
          courseId,
          announcementId,
        );

        if (!existing) {
          throw new ApiError(
            'not_found',
            'Announcement was not found in this course. Check the announcement id and retry the request.',
          );
        }

        const updated = await updateCourseAnnouncementRecord(tx, {
          tenantId,
          courseId,
          announcementId,
          title: input.title,
          body: input.body,
          status: input.status,
          pinned: input.pinned,
        });

        if (!updated) {
          throw new ApiError(
            'not_found',
            'Announcement was not found in this course. Check the announcement id and retry the request.',
          );
        }

        if (existing.status !== 'published' && updated.status === 'published') {
          await saveAnnouncementPublishedEvent(tx, updated);
        }

        return updated;
      });
    },
    deleteCourseAnnouncement: async (actorUserId, tenantId, courseId, announcementId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can delete announcements. Ask an instructor for access.',
        );
      }

      const deleted = await deleteCourseAnnouncementRecord(dbHandle.db, {
        tenantId,
        courseId,
        announcementId,
      });

      if (!deleted) {
        throw new ApiError(
          'not_found',
          'Announcement was not found in this course. Check the announcement id and retry the request.',
        );
      }
    },
    listCourseMemberships: async (actorUserId, tenantId, courseId, role, status) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can view course memberships. Ask an instructor for access.',
        );
      }

      return listCourseMembershipRecords(dbHandle.db, { tenantId, courseId, role, status });
    },
    listMessageableUsers: async (actorUserId, tenantId, courseId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      const users = await listMessageableUsersInCourse(dbHandle.db, { tenantId, courseId });
      const isStaff = canViewCourseRoster(access);

      return users.filter((member) => {
        if (member.userId === actorUserId) return false;
        if (isStaff) return true;
        return sectionInstructorRoles.includes(member.role);
      });
    },
    listTenantMessageableUsers: async (actorUserId, tenantId) => {
      const memberships = await listUserTenantMemberships(dbHandle.db, actorUserId);
      const isStaff = memberships.some(
        (membership) =>
          membership.tenantId === tenantId && tenantStaffRoles.includes(membership.role),
      );

      if (!isStaff) {
        throw new ApiError(
          'forbidden',
          'Only tenant staff can list tenant-wide message recipients. Ask an administrator for access.',
        );
      }

      const users = await listMessageableUsersInTenant(dbHandle.db, { tenantId });
      return users.filter((member) => member.userId !== actorUserId);
    },
    createCourseMembership: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can create course memberships. Ask an instructor for access.',
        );
      }

      const targetTenantMemberships = await listUserTenantMemberships(
        dbHandle.db,
        UserId.parse(input.userId),
      );
      const targetIsTenantMember = targetTenantMemberships.some(
        (membership) => membership.tenantId === tenantId,
      );

      if (!targetIsTenantMember) {
        throw new ApiError('bad_request', courseMembershipTenantMemberRequiredMessage);
      }

      try {
        return await createCourseMembershipRecord(dbHandle.db, {
          tenantId,
          courseId,
          userId: UserId.parse(input.userId),
          role: input.role,
          status: input.status ?? 'active',
        });
      } catch (error) {
        if (isCourseMembershipDuplicate(error)) {
          throw new ApiError('conflict', courseMembershipDuplicateMessage);
        }

        if (isCourseMembershipCourseMissing(error)) {
          throw new ApiError(
            'bad_request',
            'Course was not found in this tenant. Check the course id and retry the request.',
          );
        }

        throw error;
      }
    },
    bulkEnrollInCourse: async (actorUserId, tenantId, courseId, items) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can enroll learners in bulk. Ask an instructor for access.',
        );
      }

      const results = await Promise.all(
        items.map(async (item): Promise<BulkEnrollCourseResult> => {
          try {
            const targetMemberships = await listUserTenantMemberships(dbHandle.db, item.userId);
            const targetIsTenantMember = targetMemberships.some(
              (membership) => membership.tenantId === tenantId,
            );
            if (!targetIsTenantMember) {
              return {
                userId: item.userId,
                status: 'failed',
                membership: null,
                error: courseMembershipTenantMemberRequiredMessage,
              };
            }
            const membership = await createCourseMembershipRecord(dbHandle.db, {
              tenantId,
              courseId,
              userId: item.userId,
              role: item.role,
              status: item.status ?? 'active',
            });
            return { userId: item.userId, status: 'enrolled', membership, error: null };
          } catch (error) {
            const errorMessage = isCourseMembershipDuplicate(error)
              ? courseMembershipDuplicateMessage
              : error instanceof Error
                ? error.message
                : 'Unknown error.';
            return {
              userId: item.userId,
              status: 'failed',
              membership: null,
              error: errorMessage,
            };
          }
        }),
      );

      const enrolledCount = results.filter((result) => result.status === 'enrolled').length;
      return {
        results,
        enrolledCount,
        failedCount: results.length - enrolledCount,
      };
    },
    updateCourseMembership: async (actorUserId, tenantId, courseId, courseMembershipId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseMembershipStaffOnlyMessage);
      }

      try {
        const updated = await updateCourseMembershipRecord(dbHandle.db, {
          tenantId,
          courseId,
          courseMembershipId,
          role: input.role,
          status: input.status,
        });

        if (!updated) {
          throw new ApiError('not_found', courseMembershipNotFoundMessage);
        }

        return updated;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        if (isCourseMembershipDuplicate(error)) {
          throw new ApiError('conflict', courseMembershipDuplicateMessage);
        }

        throw error;
      }
    },
    deleteCourseMembership: async (actorUserId, tenantId, courseId, courseMembershipId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseMembershipStaffOnlyMessage);
      }

      const deleted = await deleteCourseMembershipRecord(dbHandle.db, {
        tenantId,
        courseId,
        courseMembershipId,
      });

      if (!deleted) {
        throw new ApiError('not_found', courseMembershipNotFoundMessage);
      }
    },
    bulkDeleteCourseMemberships: async (actorUserId, tenantId, courseId, courseMembershipIds) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseMembershipStaffOnlyMessage);
      }

      const results = await Promise.all(
        courseMembershipIds.map(async (rawId): Promise<BulkDeleteMembershipResult> => {
          const id = rawId as CourseMembershipId;
          try {
            const deleted = await deleteCourseMembershipRecord(dbHandle.db, {
              tenantId,
              courseId,
              courseMembershipId: id,
            });
            if (!deleted) {
              return {
                courseMembershipId: id,
                status: 'failed',
                error: courseMembershipNotFoundMessage,
              };
            }
            return { courseMembershipId: id, status: 'deleted', error: null };
          } catch (error) {
            return {
              courseMembershipId: id,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error.',
            };
          }
        }),
      );

      const deletedCount = results.filter((r) => r.status === 'deleted').length;
      return { results, deletedCount, failedCount: results.length - deletedCount };
    },
    importCourseRosterCsv: async (actorUserId, tenantId, courseId, csv) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can import course rosters. Ask an instructor for access.',
        );
      }

      let rows: ReturnType<typeof parseRosterCsv>;
      try {
        rows = parseRosterCsv(csv);
      } catch (error) {
        throw new ApiError(
          'bad_request',
          error instanceof Error
            ? error.message
            : 'Roster CSV could not be parsed. Check the file and retry.',
        );
      }

      const results = await Promise.all(
        rows.map(async (row): Promise<RosterImportResult> => {
          const userId = UserId.parse(row.userId);
          try {
            const targetMemberships = await listUserTenantMemberships(dbHandle.db, userId);
            const targetIsTenantMember = targetMemberships.some(
              (membership) => membership.tenantId === tenantId,
            );
            if (!targetIsTenantMember) {
              return {
                rowNumber: row.rowNumber,
                userId,
                status: 'failed',
                membership: null,
                error: courseMembershipTenantMemberRequiredMessage,
              };
            }

            const membership = await createCourseMembershipRecord(dbHandle.db, {
              tenantId,
              courseId,
              userId,
              role: row.role,
              status: row.status,
            });

            return {
              rowNumber: row.rowNumber,
              userId,
              status: 'imported',
              membership,
              error: null,
            };
          } catch (error) {
            return {
              rowNumber: row.rowNumber,
              userId,
              status: 'failed',
              membership: null,
              error: isCourseMembershipDuplicate(error)
                ? courseMembershipDuplicateMessage
                : error instanceof Error
                  ? error.message
                  : 'Unknown error.',
            };
          }
        }),
      );

      const importedCount = results.filter((result) => result.status === 'imported').length;
      return RosterImportSummary.parse({
        results,
        importedCount,
        failedCount: results.length - importedCount,
      });
    },
    exportCourseRosterCsv: async (actorUserId, tenantId, courseId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can export course rosters. Ask an instructor for access.',
        );
      }

      const memberships = await listCourseMembershipRecords(dbHandle.db, { tenantId, courseId });
      return serializeCourseRosterCsv(memberships);
    },
    updateCourseCatalogSettings: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', catalogSettingsStaffOnlyMessage);
      }

      const updated = await updateCourseCatalogSettingsRecord(dbHandle.db, {
        tenantId,
        courseId,
        catalogVisibility: input.catalogVisibility,
        enrollmentCode: input.enrollmentCode,
        catalogCategory: input.catalogCategory,
        academicTerm: input.academicTerm,
        maxEnrollments: input.maxEnrollments ?? null,
        waitlistEnabled: input.waitlistEnabled ?? false,
        enrollmentApprovalRequired: input.enrollmentApprovalRequired ?? false,
      });

      if (!updated) {
        throw new ApiError('not_found', catalogSettingsCourseMissingMessage);
      }

      return updated;
    },
    selfEnrollInCourse: async (actorUserId, tenantId, courseId, input) => {
      const enrollmentInfo = await getCourseEnrollmentInfo(dbHandle.db, tenantId, courseId);

      if (!enrollmentInfo) {
        throw new ApiError('not_found', courseNotFoundForTenantMessage);
      }

      if (enrollmentInfo.status !== 'active' || enrollmentInfo.enrollmentCode === null) {
        throw new ApiError('forbidden', courseSelfEnrollmentClosedMessage);
      }

      if (!isCourseEnrollmentDateWindowOpen(enrollmentInfo)) {
        throw new ApiError('forbidden', courseSelfEnrollmentClosedMessage);
      }

      if (enrollmentInfo.enrollmentCode !== input.enrollmentCode) {
        throw new ApiError('bad_request', courseSelfEnrollmentCodeWrongMessage);
      }

      const actorMemberships = await listUserCourseMemberships(dbHandle.db, actorUserId);
      const existing = actorMemberships.find(
        (membership) =>
          membership.tenantId === tenantId &&
          membership.courseId === courseId &&
          membership.role === 'student',
      );

      if (existing) {
        return existing;
      }

      let status: CourseMembershipStatus = 'active';
      if (enrollmentInfo.maxEnrollments !== null) {
        const activeStudentCount = await countCourseMembershipsByStatus(dbHandle.db, {
          tenantId,
          courseId,
          role: 'student',
          status: 'active',
        });

        if (activeStudentCount >= enrollmentInfo.maxEnrollments) {
          if (!enrollmentInfo.waitlistEnabled) {
            throw new ApiError(
              'forbidden',
              'Course enrollment is full. Ask an instructor about waitlist options.',
            );
          }
          status = 'waitlisted';
        }
      }
      if (status === 'active' && enrollmentInfo.enrollmentApprovalRequired) {
        status = 'pending_approval';
      }

      return createCourseMembershipRecord(dbHandle.db, {
        tenantId,
        courseId,
        userId: UserId.parse(actorUserId),
        role: 'student',
        status,
      });
    },
    listAssignments: async (actorUserId, tenantId, courseId, moduleId, unitId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const statuses =
        hasTenantStaffAccess || hasCourseStaffAccess
          ? allAssignmentStatuses
          : (['published'] satisfies AssignmentStatus[]);
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;

      const assignments = await listAssignmentsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses,
        moduleId,
        unitId,
      });
      const releaseVisibility = assignments.some((assignment) => assignment.moduleId !== null)
        ? await readLearnerReleaseVisibilityIndex(
            actorUserId,
            tenantId,
            courseId,
            canViewAllContent,
          )
        : null;

      return assignments.filter(
        (assignment) =>
          canViewAssignment(assignment, canViewAllContent) &&
          canAccessReleasedModuleItem(assignment, 'assignment', releaseVisibility),
      );
    },
    createAssignment: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', assignmentStaffOnlyMessage);
      }

      try {
        return await createAssignmentRecord(dbHandle.db, {
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
          extraCredit: input.extraCredit,
          anonymousGradingEnabled: input.anonymousGradingEnabled,
          groupSubmissionEnabled: input.groupSubmissionEnabled,
          groupSetId: input.groupSetId,
          ...(input.allowedFileExtensions !== undefined
            ? { allowedFileExtensions: input.allowedFileExtensions }
            : {}),
          ...(input.maxFileSizeBytes !== undefined
            ? { maxFileSizeBytes: input.maxFileSizeBytes }
            : {}),
        });
      } catch (error) {
        if (isAssignmentCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        if (isAssignmentModuleMissing(error)) {
          throw new ApiError('bad_request', courseUnitModuleMissingMessage);
        }

        if (isAssignmentUnitMissing(error)) {
          throw new ApiError('bad_request', assignmentUnitMissingMessage);
        }

        if (isAssignmentModuleUnitMismatch(error)) {
          throw new ApiError('bad_request', assignmentModuleUnitMismatchMessage);
        }

        if (isAssignmentRubricMissing(error)) {
          throw new ApiError('bad_request', assignmentRubricMissingMessage);
        }

        throw error;
      }
    },
    updateAssignment: async (actorUserId, tenantId, courseId, assignmentId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', assignmentStaffOnlyMessage);
      }

      try {
        const updated = await updateAssignmentRecord(dbHandle.db, {
          tenantId,
          courseId,
          assignmentId,
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
          extraCredit: input.extraCredit,
          anonymousGradingEnabled: input.anonymousGradingEnabled,
          groupSubmissionEnabled: input.groupSubmissionEnabled,
          groupSetId: input.groupSetId,
          ...(input.allowedFileExtensions !== undefined
            ? { allowedFileExtensions: input.allowedFileExtensions }
            : {}),
          ...(input.maxFileSizeBytes !== undefined
            ? { maxFileSizeBytes: input.maxFileSizeBytes }
            : {}),
        });

        if (!updated) {
          throw new ApiError('not_found', assignmentNotFoundMessage);
        }

        return updated;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        if (isAssignmentModuleMissing(error)) {
          throw new ApiError('bad_request', courseUnitModuleMissingMessage);
        }

        if (isAssignmentUnitMissing(error)) {
          throw new ApiError('bad_request', assignmentUnitMissingMessage);
        }

        if (isAssignmentModuleUnitMismatch(error)) {
          throw new ApiError('bad_request', assignmentModuleUnitMismatchMessage);
        }

        if (isAssignmentRubricMissing(error)) {
          throw new ApiError('bad_request', assignmentRubricMissingMessage);
        }

        throw error;
      }
    },
    deleteAssignment: async (actorUserId, tenantId, courseId, assignmentId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', assignmentStaffOnlyMessage);
      }

      const deleted = await deleteAssignmentRecord(dbHandle.db, {
        tenantId,
        courseId,
        assignmentId,
      });

      if (!deleted) {
        throw new ApiError('not_found', assignmentNotFoundMessage);
      }
    },
    listAssignmentOverrides: async (actorUserId, tenantId, courseId, assignmentId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can view assignment overrides. Ask an instructor for access.',
        );
      }

      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);

      if (!assignment || assignment.courseId !== courseId) {
        throw new ApiError(
          'not_found',
          'Assignment was not found in this course. Check the assignment id and retry the request.',
        );
      }

      return listAssignmentOverridesForAssignment(dbHandle.db, {
        tenantId,
        assignmentId,
        statuses: allAssignmentOverrideStatuses,
      });
    },
    createAssignmentOverride: async (actorUserId, tenantId, courseId, assignmentId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can create assignment overrides. Ask an instructor for access.',
        );
      }

      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);

      if (!assignment || assignment.courseId !== courseId) {
        throw new ApiError(
          'not_found',
          'Assignment was not found in this course. Check the assignment id and retry the request.',
        );
      }

      try {
        return await createAssignmentOverrideRecord(dbHandle.db, {
          tenantId,
          assignmentId,
          targetType: input.targetType,
          targetId: input.targetId,
          opensAt: input.opensAt,
          dueAt: input.dueAt,
          closesAt: input.closesAt,
          status: input.status,
        });
      } catch (error) {
        if (isAssignmentOverrideDuplicate(error)) {
          throw new ApiError(
            'conflict',
            'An override already exists for this assignment and target. Edit the existing override instead.',
          );
        }

        throw error;
      }
    },
    updateAssignmentOverride: async (
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      overrideId,
      input,
    ) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can edit assignment overrides. Ask an instructor for access.',
        );
      }

      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);

      if (!assignment || assignment.courseId !== courseId) {
        throw new ApiError(
          'not_found',
          'Assignment was not found in this course. Check the assignment id and retry the request.',
        );
      }

      const existing = await getAssignmentOverrideById(dbHandle.db, tenantId, overrideId);

      if (!existing || existing.assignmentId !== assignmentId) {
        throw new ApiError(
          'not_found',
          'Assignment override was not found for this assignment. Check the override id and retry the request.',
        );
      }

      return updateAssignmentOverrideRecord(dbHandle.db, {
        tenantId,
        overrideId,
        opensAt: input.opensAt,
        dueAt: input.dueAt,
        closesAt: input.closesAt,
        status: input.status,
      });
    },
    deleteAssignmentOverride: async (actorUserId, tenantId, courseId, assignmentId, overrideId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can delete assignment overrides. Ask an instructor for access.',
        );
      }

      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);

      if (!assignment || assignment.courseId !== courseId) {
        throw new ApiError(
          'not_found',
          'Assignment was not found in this course. Check the assignment id and retry the request.',
        );
      }

      const existing = await getAssignmentOverrideById(dbHandle.db, tenantId, overrideId);

      if (!existing || existing.assignmentId !== assignmentId) {
        throw new ApiError(
          'not_found',
          'Assignment override was not found for this assignment. Check the override id and retry the request.',
        );
      }

      await deleteAssignmentOverrideRecord(dbHandle.db, { tenantId, overrideId });
    },
    getAssignmentEffectiveSchedule: async (actorUserId, tenantId, courseId, assignmentId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);

      if (
        !assignment ||
        assignment.courseId !== courseId ||
        !canViewAssignment(assignment, canViewAllContent)
      ) {
        throw new ApiError(
          'not_found',
          'Assignment was not found in this course. Check the assignment id and retry the request.',
        );
      }
      await assertReleasedAssignmentAccess(
        actorUserId,
        tenantId,
        courseId,
        assignment,
        canViewAllContent,
      );

      const [overrides, groupMemberships, sectionMemberships] = await Promise.all([
        listAssignmentOverridesForAssignment(dbHandle.db, {
          tenantId,
          assignmentId,
          statuses: ['active'],
        }),
        listCourseGroupMembershipsForUser(dbHandle.db, { tenantId, userId: actorUserId }),
        listSectionMembershipsForStudent(dbHandle.db, {
          tenantId,
          courseId,
          studentId: actorUserId,
        }),
      ]);

      const applicable = filterAssignmentOverridesForLearner(overrides, {
        userId: actorUserId,
        groupIds: groupMemberships.map((membership) => membership.groupId),
        sectionIds: sectionMemberships.map((membership) => membership.sectionId),
      });

      const schedule = resolveEffectiveAssignmentSchedule({
        baseDueAt: assignment.dueAt,
        overrides: applicable,
      });

      return {
        assignmentId: AssignmentId.parse(assignmentId),
        opensAt: schedule.opensAt,
        dueAt: schedule.dueAt,
        closesAt: schedule.closesAt,
      };
    },
    getAssignmentRubric: async (actorUserId, tenantId, courseId, assignmentId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);

      if (!assignment || !assignment.activeRubricId) {
        throw new ApiError(
          'not_found',
          'Assignment rubric was not found. Check the assignment id and retry the request.',
        );
      }

      const rubric = await getRubricById(dbHandle.db, tenantId, assignment.activeRubricId);
      const visibleRubric = selectVisibleAssignmentRubric(
        assignment,
        rubric,
        courseId,
        canViewAllContent,
      );
      await assertReleasedAssignmentAccess(
        actorUserId,
        tenantId,
        courseId,
        assignment,
        canViewAllContent,
      );

      if (!visibleRubric) {
        throw new ApiError(
          'not_found',
          'Assignment rubric was not found. Check the assignment id and retry the request.',
        );
      }

      return visibleRubric;
    },
    listQuizzes: async (actorUserId, tenantId, courseId, moduleId, unitId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const quizzes = await listQuizzesForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: canViewAllContent ? allQuizStatuses : ['published'],
        moduleId,
        unitId,
      });

      return quizzes.filter((quiz) => canViewQuiz(quiz, canViewAllContent));
    },
    createQuiz: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', quizStaffOnlyMessage);
      }

      try {
        return await createQuizRecord(dbHandle.db, {
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
          accessPasswordHash: input.accessPassword
            ? hashQuizAccessPassword(input.accessPassword)
            : null,
          allowedIpRanges: normalizeQuizAllowedIpRanges(input.allowedIpRanges ?? []),
        });
      } catch (error) {
        if (isQuizCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        if (isQuizModuleMissing(error)) {
          throw new ApiError('bad_request', courseUnitModuleMissingMessage);
        }

        if (isQuizUnitMissing(error)) {
          throw new ApiError('bad_request', quizUnitMissingMessage);
        }

        if (isQuizModuleUnitMismatch(error)) {
          throw new ApiError('bad_request', assignmentModuleUnitMismatchMessage);
        }

        if (isQuizAllowedIpRangeInvalid(error)) {
          throw new ApiError(
            'bad_request',
            'Quiz allowed IP ranges must be IPv4 addresses or CIDR ranges.',
          );
        }

        throw error;
      }
    },
    updateQuiz: async (actorUserId, tenantId, courseId, quizId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', quizStaffOnlyMessage);
      }

      try {
        const accessPasswordPatch =
          input.accessPassword === undefined
            ? {}
            : {
                accessPasswordHash:
                  input.accessPassword === null
                    ? null
                    : hashQuizAccessPassword(input.accessPassword),
              };
        const allowedIpRangesPatch =
          input.allowedIpRanges === undefined
            ? {}
            : { allowedIpRanges: normalizeQuizAllowedIpRanges(input.allowedIpRanges) };
        const updated = await updateQuizRecord(dbHandle.db, {
          tenantId,
          courseId,
          quizId,
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
          ...accessPasswordPatch,
          ...allowedIpRangesPatch,
        });

        if (!updated) {
          throw new ApiError('not_found', quizNotFoundMessage);
        }

        return updated;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        if (isQuizModuleMissing(error)) {
          throw new ApiError('bad_request', courseUnitModuleMissingMessage);
        }

        if (isQuizUnitMissing(error)) {
          throw new ApiError('bad_request', quizUnitMissingMessage);
        }

        if (isQuizModuleUnitMismatch(error)) {
          throw new ApiError('bad_request', assignmentModuleUnitMismatchMessage);
        }

        if (isQuizAllowedIpRangeInvalid(error)) {
          throw new ApiError(
            'bad_request',
            'Quiz allowed IP ranges must be IPv4 addresses or CIDR ranges.',
          );
        }

        throw error;
      }
    },
    deleteQuiz: async (actorUserId, tenantId, courseId, quizId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', quizStaffOnlyMessage);
      }

      const deleted = await deleteQuizRecord(dbHandle.db, {
        tenantId,
        courseId,
        quizId,
      });

      if (!deleted) {
        throw new ApiError('not_found', quizNotFoundMessage);
      }
    },
    listQuizQuestions: async (actorUserId, tenantId, courseId, quizId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const quiz = await getQuizForCourse(dbHandle.db, tenantId, courseId, quizId);

      if (!quiz || !canViewQuiz(quiz, canViewAllContent)) {
        throw new ApiError(
          'not_found',
          'Quiz was not found in this course. Check the quiz id and retry the request.',
        );
      }

      return listQuizQuestionsForQuiz(dbHandle.db, { tenantId, quizId });
    },
    createQuizQuestion: async (actorUserId, tenantId, courseId, quizId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', quizQuestionStaffOnlyMessage);
      }

      const quiz = await getQuizForCourse(dbHandle.db, tenantId, courseId, quizId);

      if (!quiz) {
        throw new ApiError('not_found', quizNotFoundMessage);
      }

      try {
        return await createQuizQuestionRecord(dbHandle.db, {
          tenantId,
          quizId,
          position: input.position,
          questionType: input.questionType,
          prompt: input.prompt,
          points: input.points,
          choices: input.choices,
          ...(input.answerKey !== undefined ? { answerKey: input.answerKey } : {}),
        });
      } catch (error) {
        if (isQuizQuestionPositionDuplicate(error)) {
          throw new ApiError('conflict', quizQuestionDuplicatePositionMessage);
        }

        throw error;
      }
    },
    exportQuizQtiItems: async (actorUserId, tenantId, courseId, quizId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', quizQtiExportStaffOnlyMessage);
      }

      const quiz = await getQuizForCourse(dbHandle.db, tenantId, courseId, quizId);

      if (!quiz) {
        throw new ApiError('not_found', quizNotFoundMessage);
      }

      const questions = await listQuizQuestionsWithAnswerKeysForQuiz(dbHandle.db, {
        tenantId,
        quizId,
      });

      try {
        const items = questions.map(exportQuizQuestionToQtiItem);

        return QtiQuizItemExport.parse({
          format: 'qti_2_1',
          exportedAt: new Date(),
          itemCount: items.length,
          items,
        });
      } catch (error) {
        if (error instanceof UnsupportedQtiItemError) {
          throw new ApiError('bad_request', error.message);
        }

        throw error;
      }
    },
    importQuizQtiItems: async (actorUserId, tenantId, courseId, quizId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', quizQtiImportStaffOnlyMessage);
      }

      const quiz = await getQuizForCourse(dbHandle.db, tenantId, courseId, quizId);

      if (!quiz) {
        throw new ApiError('not_found', quizNotFoundMessage);
      }

      let parsedItems: ReturnType<typeof parseQtiAssessmentItem>[];

      try {
        parsedItems = input.items.map((item) => parseQtiAssessmentItem(item.xml));
      } catch (error) {
        if (error instanceof QtiParseError || error instanceof UnsupportedQtiItemError) {
          throw new ApiError('bad_request', error.message);
        }

        throw error;
      }

      const existingQuestions = await listQuizQuestionsForQuiz(dbHandle.db, { tenantId, quizId });
      const nextPosition =
        input.startingPosition ??
        existingQuestions.reduce((max, question) => Math.max(max, question.position), -1) + 1;
      const importedQuestions = await dbHandle.db.transaction(async (transaction) => {
        const questions: QuizQuestion[] = [];

        for (const [index, item] of parsedItems.entries()) {
          try {
            const question = await createQuizQuestionRecord(transaction, {
              tenantId,
              quizId,
              position: nextPosition + index,
              questionType: item.questionType,
              prompt: item.prompt,
              points: item.points,
              choices: item.choices,
              ...(item.answerKey !== undefined ? { answerKey: item.answerKey } : {}),
            });
            questions.push(question);
          } catch (error) {
            if (isQuizQuestionPositionDuplicate(error)) {
              throw new ApiError('conflict', quizQuestionDuplicatePositionMessage);
            }

            throw error;
          }
        }

        return questions;
      });

      return QtiQuizItemImportResult.parse({
        format: 'qti_2_1',
        importedCount: importedQuestions.length,
        questions: importedQuestions,
      });
    },
    listQuizAttempts: async (actorUserId, tenantId, courseId, quizId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const quiz = await getQuizForCourse(dbHandle.db, tenantId, courseId, quizId);

      if (!quiz || !canViewQuiz(quiz, canViewAllContent)) {
        throw new ApiError(
          'not_found',
          'Quiz was not found in this course. Check the quiz id and retry the request.',
        );
      }

      return listQuizAttemptsForQuiz(dbHandle.db, {
        tenantId,
        quizId,
        studentId: canViewAllContent ? undefined : actorUserId,
      });
    },
    listQuizAggregateGrades: async (actorUserId, tenantId, courseId, quizId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can view aggregated quiz grades. Ask an instructor for access.',
        );
      }

      const quiz = await getQuizForCourse(dbHandle.db, tenantId, courseId, quizId);

      if (!quiz) {
        throw new ApiError(
          'not_found',
          'Quiz was not found in this course. Check the quiz id and retry the request.',
        );
      }

      const attempts = await listQuizAttemptsForQuiz(dbHandle.db, { tenantId, quizId });
      const aggregated = aggregateQuizGradesPerStudent(
        attempts.map((attempt) => ({
          studentId: attempt.studentId,
          attemptNumber: attempt.attemptNumber,
          status: attempt.status,
          score: attempt.score,
          submittedAt: attempt.submittedAt,
          updatedAt: attempt.updatedAt,
        })),
        quiz.gradingMethod,
      );

      return aggregated.map((entry) => ({
        quizId: QuizId.parse(quizId),
        studentId: UserId.parse(entry.studentId),
        gradingMethod: quiz.gradingMethod,
        aggregateScore: entry.aggregateScore,
        attemptCount: entry.attemptCount,
        latestAttemptAt: entry.latestAttemptAt,
      }));
    },
    listQuizOverrides: async (actorUserId, tenantId, courseId, quizId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can view quiz overrides. Ask an instructor for access.',
        );
      }

      const quiz = await getQuizForCourse(dbHandle.db, tenantId, courseId, quizId);

      if (!quiz) {
        throw new ApiError('not_found', quizNotFoundMessage);
      }

      return listQuizOverridesForQuiz(dbHandle.db, {
        tenantId,
        quizId,
        statuses: allQuizOverrideStatuses,
      });
    },
    createQuizOverride: async (actorUserId, tenantId, courseId, quizId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can create quiz overrides. Ask an instructor for access.',
        );
      }

      const quiz = await getQuizForCourse(dbHandle.db, tenantId, courseId, quizId);

      if (!quiz) {
        throw new ApiError('not_found', quizNotFoundMessage);
      }

      await assertQuizOverrideTargetExists(tenantId, courseId, input);

      try {
        return await createQuizOverrideRecord(dbHandle.db, {
          tenantId,
          quizId,
          targetType: input.targetType,
          targetId: input.targetId,
          opensAt: input.opensAt,
          closesAt: input.closesAt,
          timeLimitMinutes: input.timeLimitMinutes,
          maxAttempts: input.maxAttempts,
          status: input.status,
        });
      } catch (error) {
        if (isQuizOverrideDuplicate(error)) {
          throw new ApiError('conflict', quizOverrideDuplicateTargetMessage);
        }

        throw error;
      }
    },
    updateQuizOverride: async (actorUserId, tenantId, courseId, quizId, overrideId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can edit quiz overrides. Ask an instructor for access.',
        );
      }

      const quiz = await getQuizForCourse(dbHandle.db, tenantId, courseId, quizId);

      if (!quiz) {
        throw new ApiError('not_found', quizNotFoundMessage);
      }

      const existing = await getQuizOverrideById(dbHandle.db, tenantId, overrideId);

      if (!existing || existing.quizId !== quizId) {
        throw new ApiError(
          'not_found',
          'Quiz override was not found for this quiz. Check the override id and retry the request.',
        );
      }

      return updateQuizOverrideRecord(dbHandle.db, {
        tenantId,
        overrideId,
        opensAt: input.opensAt,
        closesAt: input.closesAt,
        timeLimitMinutes: input.timeLimitMinutes,
        maxAttempts: input.maxAttempts,
        status: input.status,
      });
    },
    deleteQuizOverride: async (actorUserId, tenantId, courseId, quizId, overrideId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can delete quiz overrides. Ask an instructor for access.',
        );
      }

      const quiz = await getQuizForCourse(dbHandle.db, tenantId, courseId, quizId);

      if (!quiz) {
        throw new ApiError('not_found', quizNotFoundMessage);
      }

      const existing = await getQuizOverrideById(dbHandle.db, tenantId, overrideId);

      if (!existing || existing.quizId !== quizId) {
        throw new ApiError(
          'not_found',
          'Quiz override was not found for this quiz. Check the override id and retry the request.',
        );
      }

      await deleteQuizOverrideRecord(dbHandle.db, { tenantId, overrideId });
    },
    getQuizEffectiveSettings: async (actorUserId, tenantId, courseId, quizId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const quiz = await getQuizForCourse(dbHandle.db, tenantId, courseId, quizId);

      if (!quiz || !canViewQuiz(quiz, canViewAllContent)) {
        throw new ApiError('not_found', quizNotFoundMessage);
      }

      return resolveEffectiveQuizSettingsForActor(actorUserId, tenantId, courseId, quiz);
    },
    listQuizAttemptQuestionGrades: async (actorUserId, tenantId, courseId, quizId, attemptId) => {
      await readQuizAttemptForGrading(actorUserId, tenantId, courseId, quizId, attemptId);

      return listQuizAttemptQuestionGradesForAttempt(dbHandle.db, { tenantId, attemptId });
    },
    recordQuizAttemptQuestionGrade: async (
      actorUserId,
      tenantId,
      courseId,
      quizId,
      attemptId,
      questionId,
      input,
    ) => {
      const { attempt } = await readQuizAttemptForGrading(
        actorUserId,
        tenantId,
        courseId,
        quizId,
        attemptId,
      );
      assertQuizAttemptCanBeManuallyGraded(attempt);

      const questions = await listQuizQuestionsWithAnswerKeysForQuiz(dbHandle.db, {
        tenantId,
        quizId,
      });
      const question = questions.find((candidate) => candidate.id === questionId);

      if (!question) {
        throw new ApiError(
          'not_found',
          'Quiz question was not found in this quiz. Check the question id and retry the request.',
        );
      }

      if (!requiresManualQuizQuestionGrade(question)) {
        throw new ApiError('bad_request', quizQuestionNotManualGradeableMessage);
      }

      if (input.score > question.points) {
        throw new ApiError('bad_request', quizManualGradeScoreTooHighMessage);
      }

      return recordQuizAttemptQuestionGradeRecord(dbHandle.db, {
        tenantId,
        quizId,
        attemptId,
        questionId,
        graderId: actorUserId,
        score: input.score,
        feedback: input.feedback,
      });
    },
    regradeQuizAttempt: async (actorUserId, tenantId, courseId, quizId, attemptId) => {
      const { attempt } = await readQuizAttemptForGrading(
        actorUserId,
        tenantId,
        courseId,
        quizId,
        attemptId,
      );
      assertQuizAttemptCanBeManuallyGraded(attempt);

      const questions = await listQuizQuestionsWithAnswerKeysForQuiz(dbHandle.db, {
        tenantId,
        quizId,
      });
      const responses = await listQuizAttemptResponsesForAttempt(dbHandle.db, {
        tenantId,
        attemptId,
      });
      const manualGrades = await listQuizAttemptQuestionGradesForAttempt(dbHandle.db, {
        tenantId,
        attemptId,
      });
      const gradeResult =
        questions.length === 0
          ? { status: 'submitted' as const, score: null, maxScore: 0 }
          : gradeQuizAttemptResponsesWithManualGrades({
              questions,
              responses,
              manualGrades: manualGrades.map((grade) => ({
                questionId: grade.questionId,
                score: grade.score,
              })),
            });
      return dbHandle.db.transaction(async (tx) => {
        const updated = await updateQuizAttemptGradeRecord(tx, {
          tenantId,
          attemptId,
          status: gradeResult.status,
          score: gradeResult.score,
        });

        if (!updated) {
          throw new ApiError(
            'not_found',
            'Quiz attempt was not found. Check the attempt id and retry the request.',
          );
        }

        if (gradeResult.score !== null) {
          const completedAt = new Date();
          await completePassQuizRequirementsForAttempt(
            tx,
            {
              tenantId,
              courseId,
              quizId,
              studentId: attempt.studentId,
              score: gradeResult.score,
              maxScore: gradeResult.maxScore,
              completedAt,
            },
            completedAt,
          );
        }

        return updated;
      });
    },
    startQuizAttempt: async (actorUserId, tenantId, courseId, quizId, input) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;

      if (canViewAllContent) {
        throw new ApiError(
          'forbidden',
          'Only learners can start quiz attempts. Use preview tools instead.',
        );
      }

      const quiz = await getQuizForCourse(dbHandle.db, tenantId, courseId, quizId);

      if (!quiz || !canViewQuiz(quiz, false)) {
        throw new ApiError(
          'not_found',
          'Quiz was not found in this course. Check the quiz id and retry the request.',
        );
      }

      const effectiveSettings = await resolveEffectiveQuizSettingsForActor(
        actorUserId,
        tenantId,
        courseId,
        quiz,
      );

      assertQuizStartAvailability(effectiveSettings, new Date());

      const accessControls = await getQuizAccessControlsForCourse(
        dbHandle.db,
        tenantId,
        courseId,
        quizId,
      );

      assertQuizAccessControls(
        accessControls ?? { accessPasswordHash: null, allowedIpRanges: [] },
        input,
      );

      const attempts = await listQuizAttemptsForQuiz(dbHandle.db, {
        tenantId,
        quizId,
        studentId: actorUserId,
      });

      if (attempts.some((attempt) => attempt.status === 'in_progress')) {
        throw new ApiError(
          'forbidden',
          'Finish the in-progress quiz attempt before starting another attempt.',
        );
      }

      if (attempts.length >= effectiveSettings.maxAttempts) {
        throw new ApiError(
          'forbidden',
          'Quiz attempt limit reached. Review your submitted attempts instead.',
        );
      }

      const nextAttemptNumber =
        Math.max(0, ...attempts.map((attempt) => attempt.attemptNumber)) + 1;

      try {
        return await recordQuizAttempt(dbHandle.db, {
          tenantId,
          quizId,
          studentId: actorUserId,
          attemptNumber: nextAttemptNumber,
        });
      } catch (error) {
        if (isQuizAttemptStartConflict(error)) {
          throw new ApiError(
            'forbidden',
            'A quiz attempt was already started. Refresh attempts and continue the in-progress attempt.',
          );
        }

        throw error;
      }
    },
    submitQuizAttempt: async (actorUserId, tenantId, courseId, quizId, attemptId) => {
      const { attempt, canViewAllContent, quiz } = await readVisibleQuizAttempt(
        actorUserId,
        tenantId,
        courseId,
        quizId,
        attemptId,
      );

      if (canViewAllContent) {
        throw new ApiError(
          'forbidden',
          'Only learners can submit quiz attempts through the learner workflow. Use grading tools instead.',
        );
      }

      if (attempt.studentId !== actorUserId) {
        throw new ApiError(
          'forbidden',
          'Only the student who owns a quiz attempt can submit it. Ask the learner to submit their attempt.',
        );
      }

      if (attempt.status !== 'in_progress') {
        throw new ApiError('forbidden', quizAttemptNotInProgressMessage);
      }

      const effectiveSettings = await resolveEffectiveQuizSettingsForActor(
        actorUserId,
        tenantId,
        courseId,
        quiz,
      );

      assertQuizSubmitAvailability(effectiveSettings, attempt, new Date());

      const questions = await listQuizQuestionsWithAnswerKeysForQuiz(dbHandle.db, {
        tenantId,
        quizId,
      });
      const gradeResult =
        questions.length === 0
          ? { status: 'submitted' as const, score: null, maxScore: 0 }
          : gradeQuizAttemptResponses({
              questions,
              responses: await listQuizAttemptResponsesForAttempt(dbHandle.db, {
                tenantId,
                attemptId,
              }),
            });

      try {
        return await dbHandle.db.transaction(async (tx) => {
          const submitted = await submitQuizAttemptRecord(tx, {
            tenantId,
            attemptId,
            score: gradeResult.score,
            status: gradeResult.status,
          });

          if (gradeResult.score !== null) {
            const completedAt = new Date();
            await completePassQuizRequirementsForAttempt(
              tx,
              {
                tenantId,
                courseId,
                quizId,
                studentId: actorUserId,
                score: gradeResult.score,
                maxScore: gradeResult.maxScore,
                completedAt,
              },
              completedAt,
            );
          }

          return submitted;
        });
      } catch (error) {
        if (isQuizAttemptSubmitConflict(error)) {
          throw new ApiError('forbidden', quizAttemptNotInProgressMessage);
        }

        throw error;
      }
    },
    listQuizAttemptResponses: async (actorUserId, tenantId, courseId, quizId, attemptId) => {
      await readVisibleQuizAttempt(actorUserId, tenantId, courseId, quizId, attemptId);

      return listQuizAttemptResponsesForAttempt(dbHandle.db, { tenantId, attemptId });
    },
    saveQuizAttemptResponse: async (
      actorUserId,
      tenantId,
      courseId,
      quizId,
      attemptId,
      questionId,
      answer,
    ) => {
      const { attempt, quiz } = await readVisibleQuizAttempt(
        actorUserId,
        tenantId,
        courseId,
        quizId,
        attemptId,
      );

      if (attempt.studentId !== actorUserId) {
        throw new ApiError(
          'forbidden',
          'Only the student who owns a quiz attempt can save responses. Ask the learner to update their answer.',
        );
      }

      if (attempt.status !== 'in_progress') {
        throw new ApiError(
          'forbidden',
          'Only in-progress quiz attempts can accept responses. Start a new attempt before saving responses.',
        );
      }

      const effectiveSettings = await resolveEffectiveQuizSettingsForActor(
        actorUserId,
        tenantId,
        courseId,
        quiz,
      );

      if (
        isQuizAttemptExpired(
          { startedAt: attempt.startedAt, timeLimitMinutes: effectiveSettings.timeLimitMinutes },
          new Date(),
        )
      ) {
        throw new ApiError('forbidden', quizTimeLimitExpiredMessage);
      }

      const questions = await listQuizQuestionsForQuiz(dbHandle.db, { tenantId, quizId });

      if (!questions.some((question) => question.id === questionId)) {
        throw new ApiError(
          'not_found',
          'Quiz question was not found in this quiz. Check the question id and retry the request.',
        );
      }

      return recordQuizAttemptResponse(dbHandle.db, {
        tenantId,
        quizId,
        attemptId,
        questionId,
        answer,
      });
    },
    listQuestionBanks: async (actorUserId, tenantId, courseId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can view question banks. Ask an instructor for access.',
        );
      }

      return listQuestionBanksForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: [...allQuestionBankStatuses],
      });
    },
    createQuestionBank: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', questionBankStaffOnlyMessage);
      }

      try {
        return await createQuestionBankRecord(dbHandle.db, {
          tenantId,
          courseId,
          title: input.title,
          description: input.description,
          status: input.status,
        });
      } catch (error) {
        if (isQuestionBankCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        throw error;
      }
    },
    updateQuestionBank: async (actorUserId, tenantId, courseId, questionBankId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', questionBankStaffOnlyMessage);
      }

      const updated = await updateQuestionBankRecord(dbHandle.db, {
        tenantId,
        courseId,
        questionBankId,
        title: input.title,
        description: input.description,
        status: input.status,
      });

      if (!updated) {
        throw new ApiError('not_found', questionBankNotFoundMessage);
      }

      return updated;
    },
    deleteQuestionBank: async (actorUserId, tenantId, courseId, questionBankId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', questionBankStaffOnlyMessage);
      }

      const deleted = await deleteQuestionBankRecord(dbHandle.db, {
        tenantId,
        courseId,
        questionBankId,
      });

      if (!deleted) {
        throw new ApiError('not_found', questionBankNotFoundMessage);
      }
    },
    listQuestionBankQuestions: async (actorUserId, tenantId, courseId, questionBankId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can view question banks. Ask an instructor for access.',
        );
      }

      const bank = await getQuestionBankForCourse(dbHandle.db, tenantId, courseId, questionBankId);

      if (!bank) {
        throw new ApiError(
          'not_found',
          'Question bank was not found in this course. Check the question bank id and retry the request.',
        );
      }

      return listQuestionBankQuestionsForBank(dbHandle.db, { tenantId, questionBankId });
    },
    createQuestionBankQuestion: async (actorUserId, tenantId, courseId, questionBankId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', questionBankQuestionStaffOnlyMessage);
      }

      const bank = await getQuestionBankForCourse(dbHandle.db, tenantId, courseId, questionBankId);

      if (!bank) {
        throw new ApiError('not_found', questionBankNotFoundMessage);
      }

      try {
        return await createQuestionBankQuestionRecord(dbHandle.db, {
          tenantId,
          questionBankId,
          position: input.position,
          questionType: input.questionType,
          prompt: input.prompt,
          points: input.points,
          choices: input.choices,
        });
      } catch (error) {
        if (isQuestionBankQuestionPositionDuplicate(error)) {
          throw new ApiError('conflict', questionBankQuestionDuplicatePositionMessage);
        }

        throw error;
      }
    },
    listAttendanceSessions: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const sessions = await listAttendanceSessionsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: canViewAllContent
          ? allAttendanceSessionStatuses
          : visibleAttendanceSessionStatuses,
      });

      return sessions.filter((session) => canViewAttendanceSession(session, canViewAllContent));
    },
    createAttendanceSession: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', attendanceSessionStaffOnlyMessage);
      }

      try {
        return await createAttendanceSessionRecord(dbHandle.db, {
          tenantId,
          courseId,
          title: input.title,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          status: input.status,
        });
      } catch (error) {
        if (isAttendanceSessionCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        throw error;
      }
    },
    listAttendanceRecords: async (actorUserId, tenantId, courseId, sessionId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const session = await getAttendanceSessionForCourse(
        dbHandle.db,
        tenantId,
        courseId,
        sessionId,
      );

      if (!session || !canViewAttendanceSession(session, canViewAllContent)) {
        throw new ApiError(
          'not_found',
          'Attendance session was not found in this course. Check the session id and retry the request.',
        );
      }

      return listAttendanceRecordsForSession(dbHandle.db, {
        tenantId,
        sessionId,
        studentId: canViewAllContent ? undefined : actorUserId,
      });
    },
    recordAttendanceRecord: async (
      actorUserId,
      tenantId,
      courseId,
      sessionId,
      studentId,
      input,
    ) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', attendanceRecordStaffOnlyMessage);
      }

      try {
        return await recordAttendanceRecordUpsert(dbHandle.db, {
          tenantId: TenantId.parse(tenantId),
          courseId,
          sessionId: AttendanceSessionId.parse(sessionId),
          studentId: UserId.parse(studentId),
          status: input.status,
          note: input.note,
        });
      } catch (error) {
        if (error instanceof AttendanceSessionUnavailableError) {
          throw new ApiError('not_found', attendanceSessionNotFoundMessage);
        }

        if (error instanceof AttendanceStudentUnavailableError) {
          throw new ApiError('not_found', attendanceStudentNotFoundMessage);
        }

        throw error;
      }
    },
    listCompletionRequirements: async (actorUserId, tenantId, courseId, moduleId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const requirements = await listCompletionRequirementsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        moduleId,
        statuses: canViewAllContent ? allCompletionRequirementStatuses : ['active'],
      });

      return requirements.filter((requirement) =>
        canViewCompletionRequirement(requirement, canViewAllContent),
      );
    },
    createCompletionRequirement: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', completionRequirementStaffOnlyMessage);
      }

      try {
        return await createCompletionRequirementRecord(dbHandle.db, {
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
        });
      } catch (error) {
        if (isCompletionRequirementCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        if (isCompletionRequirementModuleMissing(error)) {
          throw new ApiError('bad_request', courseUnitModuleMissingMessage);
        }

        throw error;
      }
    },
    listCompletionProgress: async (actorUserId, tenantId, courseId, requirementId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const requirement = await getCompletionRequirementForCourse(
        dbHandle.db,
        tenantId,
        courseId,
        requirementId,
      );

      if (!requirement || !canViewCompletionRequirement(requirement, canViewAllContent)) {
        throw new ApiError(
          'not_found',
          'Completion requirement was not found in this course. Check the requirement id and retry the request.',
        );
      }

      return listCompletionProgressForRequirement(dbHandle.db, {
        tenantId,
        requirementId,
        studentId: canViewAllContent ? undefined : actorUserId,
      });
    },
    listCredentials: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const credentials = await listCredentialsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: canViewAllContent ? allCredentialStatuses : ['published'],
      });

      return credentials.filter((credential) => canViewCredential(credential, canViewAllContent));
    },
    createCourseCredential: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseCredentialStaffOnlyMessage);
      }

      try {
        return await createCourseCredentialRecord(dbHandle.db, {
          tenantId,
          courseId,
          credentialType: input.credentialType,
          title: input.title,
          description: input.description,
          criteriaSummary: input.criteriaSummary,
          status: input.status,
          imageUrl: input.imageUrl,
        });
      } catch (error) {
        if (isCourseCredentialCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        throw error;
      }
    },
    updateCourseCredential: async (actorUserId, tenantId, courseId, credentialId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseCredentialStaffOnlyMessage);
      }

      const updated = await updateCourseCredentialRecord(dbHandle.db, {
        tenantId,
        courseId,
        credentialId,
        credentialType: input.credentialType,
        title: input.title,
        description: input.description,
        criteriaSummary: input.criteriaSummary,
        status: input.status,
        imageUrl: input.imageUrl,
      });

      if (!updated) {
        throw new ApiError('not_found', credentialNotFoundMessage);
      }

      return updated;
    },
    deleteCourseCredential: async (actorUserId, tenantId, courseId, credentialId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseCredentialStaffOnlyMessage);
      }

      const deleted = await deleteCourseCredentialRecord(dbHandle.db, {
        tenantId,
        courseId,
        credentialId,
      });

      if (!deleted) {
        throw new ApiError('not_found', credentialNotFoundMessage);
      }
    },
    listCredentialAwards: async (actorUserId, tenantId, courseId, credentialId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const credential = await getCredentialForCourse(
        dbHandle.db,
        tenantId,
        courseId,
        credentialId,
      );

      if (!credential || !canViewCredential(credential, canViewAllContent)) {
        throw new ApiError(
          'not_found',
          'Credential was not found in this course. Check the credential id and retry the request.',
        );
      }

      return listCredentialAwardsForCredential(dbHandle.db, {
        tenantId,
        credentialId,
        studentId: canViewAllContent ? undefined : actorUserId,
      });
    },
    createCredentialAward: async (actorUserId, tenantId, courseId, credentialId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', credentialAwardStaffOnlyMessage);
      }

      const credential = await getCredentialForCourse(
        dbHandle.db,
        tenantId,
        courseId,
        credentialId,
      );

      if (!credential) {
        throw new ApiError('not_found', credentialNotFoundMessage);
      }

      try {
        return await createCredentialAwardRecord(dbHandle.db, {
          tenantId,
          credentialId,
          studentId: input.studentId,
          status: input.status,
          issuedAt: input.issuedAt,
          revokedAt: input.revokedAt,
          expiresAt: input.expiresAt,
        });
      } catch (error) {
        if (isCredentialAwardDuplicate(error)) {
          throw new ApiError('conflict', credentialAwardDuplicateMessage);
        }

        throw error;
      }
    },
    listConversationThreads: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;

      return listConversationThreadsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: allConversationThreadStatuses,
        participantId: canViewAllContent ? undefined : actorUserId,
      });
    },
    createConversationThread: async (actorUserId, tenantId, courseId, input) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      const courseMemberships = await listCourseMembershipRecords(dbHandle.db, {
        tenantId,
        courseId,
      });
      const courseMemberIds = new Set<string>(
        courseMemberships.map((membership) => membership.userId),
      );

      for (const participantId of input.participantIds) {
        if (participantId === actorUserId) {
          continue;
        }
        if (!courseMemberIds.has(participantId)) {
          throw new ApiError(
            'bad_request',
            'One or more selected participants are not members of this course.',
          );
        }
      }

      const participantIds = Array.from(new Set([actorUserId, ...input.participantIds]));

      return createConversationThreadRecord(dbHandle.db, {
        tenantId,
        courseId,
        subject: input.subject,
        participantIds,
        initialMessageSenderId: actorUserId,
        initialMessageBody: input.body,
      });
    },
    listConversationMessages: async (actorUserId, tenantId, courseId, threadId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const thread = await getConversationThreadForCourse(
        dbHandle.db,
        tenantId,
        courseId,
        threadId,
      );

      if (!thread || !canViewConversationThread(thread, actorUserId, canViewAllContent)) {
        throw new ApiError(
          'not_found',
          'Conversation was not found in this course. Check the conversation id and retry the request.',
        );
      }

      return listConversationMessagesForThread(dbHandle.db, {
        tenantId,
        threadId,
      });
    },
    createConversationMessage: async (actorUserId, tenantId, courseId, threadId, input) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const thread = await getConversationThreadForCourse(
        dbHandle.db,
        tenantId,
        courseId,
        threadId,
      );

      if (!thread || !canViewConversationThread(thread, actorUserId, canViewAllContent)) {
        throw new ApiError(
          'not_found',
          'Conversation was not found in this course. Check the conversation id and retry the request.',
        );
      }

      return createConversationMessageRecord(dbHandle.db, {
        tenantId,
        threadId,
        senderId: actorUserId,
        body: input.body,
        sentAt: new Date(),
      });
    },
    listCourseGroupSets: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;

      return listCourseGroupSetsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: canViewAllContent ? allCourseGroupSetStatuses : ['active'],
      });
    },
    createCourseGroupSet: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseGroupSetStaffOnlyMessage);
      }

      try {
        return await createCourseGroupSetRecord(dbHandle.db, {
          tenantId,
          courseId,
          name: input.name,
          selfSignupEnabled: input.selfSignupEnabled,
          status: input.status,
          position: input.position,
        });
      } catch (error) {
        if (isCourseGroupSetCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        throw error;
      }
    },
    updateCourseGroupSet: async (actorUserId, tenantId, courseId, groupSetId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseGroupSetStaffOnlyMessage);
      }

      const updated = await updateCourseGroupSetRecord(dbHandle.db, {
        tenantId,
        courseId,
        groupSetId,
        name: input.name,
        selfSignupEnabled: input.selfSignupEnabled,
        status: input.status,
        position: input.position,
      });

      if (!updated) {
        throw new ApiError('not_found', courseGroupSetMissingMessage);
      }

      return updated;
    },
    deleteCourseGroupSet: async (actorUserId, tenantId, courseId, groupSetId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseGroupSetStaffOnlyMessage);
      }

      const deleted = await deleteCourseGroupSetRecord(dbHandle.db, {
        tenantId,
        courseId,
        groupSetId,
      });

      if (!deleted) {
        throw new ApiError('not_found', courseGroupSetMissingMessage);
      }
    },
    listCourseGroups: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;

      return listCourseGroupsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: canViewAllContent ? allCourseGroupStatuses : ['active'],
        memberUserId: canViewAllContent ? undefined : actorUserId,
      });
    },
    createCourseGroup: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseGroupStaffOnlyMessage);
      }

      try {
        return await createCourseGroupRecord(dbHandle.db, {
          tenantId,
          courseId,
          groupSetId: input.groupSetId,
          name: input.name,
          description: input.description,
          status: input.status,
          position: input.position,
        });
      } catch (error) {
        if (isCourseGroupCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        if (isCourseGroupSetMissing(error)) {
          throw new ApiError('bad_request', courseGroupSetMissingMessage);
        }

        throw error;
      }
    },
    updateCourseGroup: async (actorUserId, tenantId, courseId, groupId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseGroupStaffOnlyMessage);
      }

      const updated = await updateCourseGroupRecord(dbHandle.db, {
        tenantId,
        courseId,
        groupId,
        name: input.name,
        description: input.description,
        status: input.status,
        position: input.position,
      });

      if (!updated) {
        throw new ApiError('not_found', courseGroupMissingMessage);
      }

      return updated;
    },
    deleteCourseGroup: async (actorUserId, tenantId, courseId, groupId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseGroupStaffOnlyMessage);
      }

      const deleted = await deleteCourseGroupRecord(dbHandle.db, {
        tenantId,
        courseId,
        groupId,
      });

      if (!deleted) {
        throw new ApiError('not_found', courseGroupMissingMessage);
      }
    },
    listCourseGroupMembers: async (actorUserId, tenantId, courseId, groupId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const group = await getCourseGroupForCourse(dbHandle.db, tenantId, courseId, groupId);

      if (!group) {
        throw new ApiError(
          'not_found',
          'Course group was not found in this course. Check the group id and retry the request.',
        );
      }

      const memberships = await listCourseGroupMembershipsForUser(dbHandle.db, {
        tenantId,
        userId: actorUserId,
      });
      const isGroupMember = memberships.some((membership) => membership.groupId === groupId);

      if (!canViewCourseGroup(group, isGroupMember, canViewAllContent)) {
        throw new ApiError(
          'not_found',
          'Course group was not found in this course. Check the group id and retry the request.',
        );
      }

      return listCourseGroupMemberRecords(dbHandle.db, { tenantId, groupId });
    },
    createCourseGroupMember: async (actorUserId, tenantId, courseId, groupId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseGroupMemberStaffOnlyMessage);
      }

      const group = await getCourseGroupForCourse(dbHandle.db, tenantId, courseId, groupId);

      if (!group) {
        throw new ApiError('not_found', courseGroupNotFoundMessage);
      }

      try {
        return await createCourseGroupMemberRecord(dbHandle.db, {
          tenantId,
          groupId,
          userId: input.userId,
          role: input.role,
        });
      } catch (error) {
        if (isCourseGroupMemberDuplicate(error)) {
          throw new ApiError('conflict', courseGroupMemberDuplicateMessage);
        }

        throw error;
      }
    },
    joinCourseGroup: async (actorUserId, tenantId, courseId, groupId) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      const group = await getCourseGroupForCourse(dbHandle.db, tenantId, courseId, groupId);

      if (!group || group.status !== 'active') {
        throw new ApiError('not_found', courseGroupNotFoundMessage);
      }

      const groupSet = await getCourseGroupSetById(dbHandle.db, tenantId, group.groupSetId);

      if (!groupSet || groupSet.status !== 'active') {
        throw new ApiError('not_found', courseGroupNotFoundMessage);
      }

      if (!groupSet.selfSignupEnabled) {
        throw new ApiError(
          'forbidden',
          'Self-signup is disabled for this group set. Ask an instructor to enable it or to assign you to a group.',
        );
      }

      try {
        return await createCourseGroupMemberRecord(dbHandle.db, {
          tenantId,
          groupId,
          userId: actorUserId,
          role: 'member',
        });
      } catch (error) {
        if (isCourseGroupMemberDuplicate(error)) {
          throw new ApiError('conflict', courseGroupMemberDuplicateMessage);
        }

        throw error;
      }
    },
    leaveCourseGroup: async (actorUserId, tenantId, courseId, groupId) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      const group = await getCourseGroupForCourse(dbHandle.db, tenantId, courseId, groupId);

      if (!group) {
        throw new ApiError('not_found', courseGroupNotFoundMessage);
      }

      await deleteCourseGroupMembershipForUser(dbHandle.db, {
        tenantId,
        groupId,
        userId: actorUserId,
      });
    },
    listAssignmentSubmissions: async (actorUserId, tenantId, courseId, assignmentId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);

      if (!assignment || assignment.courseId !== courseId) {
        throw new ApiError(
          'not_found',
          'Assignment was not found in this course. Check the assignment id and retry the request.',
        );
      }

      const isStaff = hasTenantStaffAccess || hasCourseStaffAccess;
      if (isStaff) {
        const submissions = await listSubmissionsForAssignment(dbHandle.db, tenantId, assignmentId);
        if (!assignment.anonymousGradingEnabled) {
          return submissions;
        }
        return applyAnonymousLabels(submissions);
      }

      if (!canViewAssignment(assignment, false)) {
        throw new ApiError('not_found', assignmentNotFoundMessage);
      }

      await assertReleasedAssignmentAccess(actorUserId, tenantId, courseId, assignment, false);

      const groupId = await resolveAssignmentSubmissionGroupId(
        dbHandle.db,
        tenantId,
        courseId,
        actorUserId,
        assignment,
      );
      if (groupId !== null) {
        return (await listSubmissionsForAssignment(dbHandle.db, tenantId, assignmentId)).filter(
          (submission) => submission.groupId === groupId,
        );
      }

      return listSubmissionsForStudentAssignment(dbHandle.db, tenantId, assignmentId, actorUserId);
    },
    upsertSubmissionGrade: async (
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      input,
    ) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can grade submissions. Ask an instructor for access.',
        );
      }

      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);

      if (!assignment || assignment.courseId !== courseId) {
        throw new ApiError(
          'not_found',
          'Assignment was not found in this course. Check the assignment id and retry the request.',
        );
      }

      const submission = await getSubmissionById(dbHandle.db, tenantId, submissionId);

      if (!submission) {
        throw new ApiError(
          'not_found',
          'Submission was not found for this assignment. Check the submission id and retry the request.',
        );
      }
      await assertSubmissionBelongsToCourseAssignment(
        dbHandle.db,
        tenantId,
        courseId,
        assignmentId,
        submission,
      );

      if (assignment.gradingLocked) {
        throw new ApiError(
          'forbidden',
          'Grading is locked for this assignment. Unlock the assignment before recording grades.',
        );
      }

      const previousGrade = await getGradeBySubmissionId(dbHandle.db, tenantId, submissionId);
      const score = applyAssignmentLatePenalty(assignment, submission, input.score);
      const grade = await upsertSubmissionGradeRecord(dbHandle.db, {
        tenantId,
        submissionId,
        score,
        maxScore: input.maxScore,
        status: input.status,
        source: 'manual' satisfies GradeSource,
        actorId: actorUserId,
      });
      await recordGradeLifecycleSideEffects(dbHandle.db, actorUserId, previousGrade, grade);
      return grade;
    },
    batchUpsertSubmissionGrades: (actorUserId, tenantId, courseId, assignmentId, items) =>
      batchUpsertSubmissionGradesForAssignment(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        items,
      ),
    importSubmissionGradesCsv: async (actorUserId, tenantId, courseId, assignmentId, csv) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can grade submissions. Ask an instructor for access.',
        );
      }

      let items: BatchUpsertSubmissionGradeItem[];
      try {
        items = parseSubmissionGradeImportCsv(csv).map((row) => ({
          submissionId: row.submissionId,
          score: row.score,
          maxScore: row.maxScore,
          status: row.status,
        }));
      } catch (error) {
        throw new ApiError(
          'bad_request',
          error instanceof Error
            ? error.message
            : 'Submission grade CSV could not be parsed. Check the file and retry.',
        );
      }

      return batchUpsertSubmissionGradesForAssignment(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        items,
      );
    },
    saveAssignmentDraft: async (actorUserId, tenantId, courseId, assignmentId, draftId, blocks) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);
      const learnerAssignment = assertLearnerAssignmentWorkflow(
        assignment,
        courseId,
        canViewAllContent,
      );
      await assertReleasedAssignmentAccess(
        actorUserId,
        tenantId,
        courseId,
        learnerAssignment,
        canViewAllContent,
      );
      const now = new Date();

      try {
        return await saveStudentDraft(dbHandle.db, {
          id: DraftId.parse(draftId),
          tenantId: TenantId.parse(tenantId),
          assignmentId: AssignmentId.parse(assignmentId),
          studentId: UserId.parse(actorUserId),
          blocks,
          createdAt: now,
          updatedAt: now,
        });
      } catch (error) {
        if (isAssignmentDraftOwnershipConflict(error)) {
          throw new ApiError('not_found', assignmentDraftOwnershipMessage);
        }

        throw error;
      }
    },
    submitAssignmentDraft: async (
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      draftId,
      blocks,
    ) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const assignment = assertLearnerAssignmentWorkflow(
        await getAssignmentById(dbHandle.db, tenantId, assignmentId),
        courseId,
        canViewAllContent,
      );
      await assertReleasedAssignmentAccess(
        actorUserId,
        tenantId,
        courseId,
        assignment,
        canViewAllContent,
      );
      const now = new Date();
      let draft: Draft;
      try {
        draft = await saveStudentDraft(dbHandle.db, {
          id: DraftId.parse(draftId),
          tenantId: TenantId.parse(tenantId),
          assignmentId: AssignmentId.parse(assignmentId),
          studentId: UserId.parse(actorUserId),
          blocks,
          createdAt: now,
          updatedAt: now,
        });
      } catch (error) {
        if (isAssignmentDraftOwnershipConflict(error)) {
          throw new ApiError('not_found', assignmentDraftOwnershipMessage);
        }

        throw error;
      }
      const groupId = await resolveAssignmentSubmissionGroupId(
        dbHandle.db,
        tenantId,
        courseId,
        actorUserId,
        assignment,
      );
      const completionStudentIds =
        groupId === null
          ? [actorUserId]
          : [
              ...new Set([
                actorUserId,
                ...(await listCourseGroupMemberRecords(dbHandle.db, { tenantId, groupId })).map(
                  (membership) => membership.userId,
                ),
              ]),
            ];
      const previousSubmissions =
        groupId === null
          ? await listSubmissionsForStudentAssignment(
              dbHandle.db,
              tenantId,
              assignmentId,
              actorUserId,
            )
          : (await listSubmissionsForAssignment(dbHandle.db, tenantId, assignmentId)).filter(
              (submission) => submission.groupId === groupId,
            );

      try {
        const submission = createSubmissionFromDraft({
          assignment,
          draft,
          previousSubmissions,
          groupId,
          now,
        });

        return await dbHandle.db.transaction(async (tx) => {
          const savedSubmission = await saveSubmission(tx, submission);
          for (const studentId of completionStudentIds) {
            await completeSubmitAssignmentRequirementsForSubmission(
              tx,
              {
                tenantId,
                courseId,
                assignmentId,
                studentId,
                completedAt: now,
              },
              now,
            );
          }

          return savedSubmission;
        });
      } catch (error) {
        if (isAssignmentResubmissionDisabled(error)) {
          throw new ApiError('forbidden', assignmentResubmissionDisabledMessage);
        }

        if (isAssignmentSubmissionVersionConflict(error)) {
          throw new ApiError('forbidden', assignmentSubmissionRaceMessage);
        }

        throw error;
      }
    },
    listAssignmentPeerReviews: async (actorUserId, tenantId, courseId, assignmentId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);

      if (!assignment || assignment.courseId !== courseId) {
        throw new ApiError(
          'not_found',
          'Assignment was not found in this course. Check the assignment id and retry the request.',
        );
      }

      return listAssignmentPeerReviewsForAssignment(dbHandle.db, {
        tenantId,
        assignmentId,
        reviewerId: hasTenantStaffAccess || hasCourseStaffAccess ? undefined : actorUserId,
      });
    },
    listSubmissionAttachments: async (
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
    ) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);
      const submission = await getSubmissionById(dbHandle.db, tenantId, submissionId);

      if (
        !assignment ||
        assignment.courseId !== courseId ||
        !submission ||
        submission.assignmentId !== assignmentId
      ) {
        throw new ApiError(
          'not_found',
          'Submission was not found in this assignment. Check the submission id and retry the request.',
        );
      }

      const canViewAttachments = await canViewSubmissionAttachmentForAssignment(
        dbHandle.db,
        tenantId,
        courseId,
        actorUserId,
        access,
        assignment,
        submission,
      );

      if (!canViewAttachments) {
        throw new ApiError(
          'not_found',
          'Submission was not found in this assignment. Check the submission id and retry the request.',
        );
      }

      return listSubmissionAttachmentsForSubmission(dbHandle.db, { tenantId, submissionId });
    },
    createSubmissionAttachment: async (
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      input,
    ) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);
      const submission = await getSubmissionById(dbHandle.db, tenantId, submissionId);

      if (
        !assignment ||
        assignment.courseId !== courseId ||
        !submission ||
        submission.assignmentId !== assignmentId
      ) {
        throw new ApiError('not_found', submissionNotFoundMessage);
      }

      const canViewAttachments = await canViewSubmissionAttachmentForAssignment(
        dbHandle.db,
        tenantId,
        courseId,
        actorUserId,
        access,
        assignment,
        submission,
      );

      if (!canViewAttachments) {
        throw new ApiError('not_found', submissionNotFoundMessage);
      }

      const file = await getFileResourceById(dbHandle.db, tenantId, input.fileResourceId);

      if (!file) {
        throw new ApiError('not_found', submissionAttachmentFileNotFoundMessage);
      }

      if (!canAttachFileResource(file, actorUserId, courseId, access)) {
        throw new ApiError('forbidden', submissionAttachmentFileAccessMessage);
      }

      assertFileSatisfiesAssignmentAttachmentConstraints(assignment, file);

      const existingAttachments = await listSubmissionAttachmentsForSubmission(dbHandle.db, {
        tenantId,
        submissionId,
      });
      const nextPosition =
        existingAttachments.reduce(
          (highestPosition, attachment) => Math.max(highestPosition, attachment.position),
          -1,
        ) + 1;

      return createSubmissionAttachmentRecord(dbHandle.db, {
        tenantId,
        submissionId,
        fileResourceId: input.fileResourceId,
        displayName: input.displayName ?? file.filename,
        position: nextPosition,
      });
    },
    downloadSubmissionAttachment: async (
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      attachmentId,
    ) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);
      const submission = await getSubmissionById(dbHandle.db, tenantId, submissionId);

      if (
        !assignment ||
        assignment.courseId !== courseId ||
        !submission ||
        submission.assignmentId !== assignmentId
      ) {
        throw new ApiError('not_found', submissionNotFoundMessage);
      }

      const canViewAttachments = await canViewSubmissionAttachmentForAssignment(
        dbHandle.db,
        tenantId,
        courseId,
        actorUserId,
        access,
        assignment,
        submission,
      );

      if (!canViewAttachments) {
        throw new ApiError('not_found', submissionNotFoundMessage);
      }

      const attachment = await getSubmissionAttachmentById(
        dbHandle.db,
        tenantId,
        submissionId,
        attachmentId,
      );
      if (!attachment) {
        throw new ApiError('not_found', submissionNotFoundMessage);
      }

      const file = await getFileResourceById(dbHandle.db, tenantId, attachment.fileResourceId);
      if (!file) {
        throw new ApiError('not_found', submissionAttachmentFileNotFoundMessage);
      }

      const bytes = await fileStorage.download(file.storageKey);
      return { file, bytes };
    },
    listSubmissionComments: async (actorUserId, tenantId, courseId, assignmentId, submissionId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);
      const submission = await getSubmissionById(dbHandle.db, tenantId, submissionId);

      if (
        !assignment ||
        assignment.courseId !== courseId ||
        !submission ||
        submission.assignmentId !== assignmentId
      ) {
        throw new ApiError('not_found', submissionNotFoundMessage);
      }

      const canViewAsStaff = canViewCourseRoster(access);
      const canViewAsSubmitter = submission.studentId === actorUserId;
      const peerReviews =
        canViewAsStaff || canViewAsSubmitter
          ? []
          : await listAssignmentPeerReviewsForAssignment(dbHandle.db, {
              tenantId,
              assignmentId,
              reviewerId: actorUserId,
              submissionId,
            });
      const canViewAsPeerReviewer = peerReviews.length > 0;

      if (!canViewAsStaff && !canViewAsSubmitter && !canViewAsPeerReviewer) {
        throw new ApiError('not_found', submissionNotFoundMessage);
      }

      return listSubmissionCommentsForSubmission(dbHandle.db, {
        tenantId,
        submissionId,
        visibilities: visibleSubmissionCommentVisibilities(access, {
          canViewStudentVisible: canViewAsSubmitter,
          canViewPeerReviewerVisible: canViewAsPeerReviewer,
        }),
      });
    },
    createSubmissionComment: async (
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      input,
    ) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      const assignment = await getAssignmentById(dbHandle.db, tenantId, assignmentId);
      const submission = await getSubmissionById(dbHandle.db, tenantId, submissionId);

      if (
        !assignment ||
        assignment.courseId !== courseId ||
        !submission ||
        submission.assignmentId !== assignmentId
      ) {
        throw new ApiError('not_found', submissionNotFoundMessage);
      }

      const canViewAsStaff = canViewCourseRoster(access);
      const canViewAsSubmitter = submission.studentId === actorUserId;
      const peerReviews =
        canViewAsStaff || canViewAsSubmitter
          ? []
          : await listAssignmentPeerReviewsForAssignment(dbHandle.db, {
              tenantId,
              assignmentId,
              reviewerId: actorUserId,
              submissionId,
            });
      const canViewAsPeerReviewer = peerReviews.length > 0;

      if (!canViewAsStaff && !canViewAsSubmitter && !canViewAsPeerReviewer) {
        throw new ApiError('not_found', submissionNotFoundMessage);
      }

      const canCreateComment =
        canViewAsStaff ||
        (canViewAsSubmitter && input.visibility === 'student_visible') ||
        (canViewAsPeerReviewer && input.visibility === 'peer_reviewer_visible');

      if (!canCreateComment) {
        const message =
          canViewAsPeerReviewer && !canViewAsSubmitter
            ? peerReviewerSubmissionCommentVisibilityMessage
            : learnerSubmissionCommentVisibilityMessage;
        throw new ApiError('forbidden', message);
      }

      try {
        return await createSubmissionCommentRecord(dbHandle.db, {
          tenantId,
          submissionId,
          authorId: actorUserId,
          body: input.body,
          visibility: input.visibility,
        });
      } catch (error) {
        if (isSubmissionCommentSubmissionMissing(error)) {
          throw new ApiError('not_found', submissionNotFoundMessage);
        }

        throw error;
      }
    },
    recordSubmissionPlagiarismReport: async (actorUserId, tenantId, submissionId, input) => {
      const submissionRow = await getSubmissionById(dbHandle.db, tenantId, submissionId);

      if (!submissionRow) {
        throw new ApiError('not_found', submissionNotFoundMessage);
      }

      const assignmentRow = await getAssignmentById(
        dbHandle.db,
        tenantId,
        submissionRow.assignmentId,
      );

      if (!assignmentRow) {
        throw new ApiError('not_found', submissionNotFoundMessage);
      }

      const access = await readCourseAccessContext(actorUserId, tenantId, assignmentRow.courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can record plagiarism reports. Ask an instructor for access.',
        );
      }

      try {
        return await recordSubmissionPlagiarismReport(dbHandle.db, {
          tenantId,
          courseId: assignmentRow.courseId,
          submissionId,
          integrationConnectionId: input.integrationConnectionId,
          similarityPercent: input.similarityPercent,
          reportUrl: input.reportUrl,
          status: input.status,
          checkedAt: input.checkedAt,
        });
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error) {
          const code = (error as { code?: string }).code;
          if (code === '23503') {
            throw new ApiError(
              'bad_request',
              'Referenced integration connection is missing or not in scope.',
            );
          }
        }

        throw error;
      }
    },
    listSubmissionPlagiarismReports: async (actorUserId, tenantId, submissionId) => {
      const submissionRow = await getSubmissionById(dbHandle.db, tenantId, submissionId);

      if (!submissionRow) {
        throw new ApiError('not_found', submissionNotFoundMessage);
      }

      const assignmentRow = await getAssignmentById(
        dbHandle.db,
        tenantId,
        submissionRow.assignmentId,
      );

      if (!assignmentRow) {
        throw new ApiError('not_found', submissionNotFoundMessage);
      }

      const access = await readCourseAccessContext(actorUserId, tenantId, assignmentRow.courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can view plagiarism reports. Ask an instructor for access.',
        );
      }

      return listSubmissionPlagiarismReports(dbHandle.db, { tenantId, submissionId });
    },
    listCoursePlagiarismReports: async (actorUserId, tenantId, courseId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can view plagiarism reports. Ask an instructor for access.',
        );
      }

      return listLatestPlagiarismReportsForCourse(dbHandle.db, tenantId, courseId);
    },
    listSubmissionGradeHistory: async (
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
    ) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      const submission = await getSubmissionById(dbHandle.db, tenantId, submissionId);

      if (!submission || submission.assignmentId !== assignmentId) {
        throw new ApiError(
          'not_found',
          'Submission was not found for this assignment. Check the submission id and retry the request.',
        );
      }
      await assertSubmissionBelongsToCourseAssignment(
        dbHandle.db,
        tenantId,
        courseId,
        assignmentId,
        submission,
      );

      if (!canViewSubmissionScopedResource(submission, actorUserId, access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff and the submitting learner can view grade history.',
        );
      }

      return listGradeHistoryForSubmission(dbHandle.db, { tenantId, submissionId });
    },
    createGradeAppeal: async (
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      input,
    ) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);
      const submission = await getSubmissionById(dbHandle.db, tenantId, submissionId);

      if (!submission) {
        throw new ApiError(
          'not_found',
          'Submission grade was not found for this learner and assignment. Check the submission id and retry the request.',
        );
      }
      await assertSubmissionBelongsToCourseAssignment(
        dbHandle.db,
        tenantId,
        courseId,
        assignmentId,
        submission,
      );

      if (submission.studentId !== actorUserId) {
        throw new ApiError(
          'not_found',
          'Submission grade was not found for this learner and assignment. Check the submission id and retry the request.',
        );
      }

      const grade = await getGradeBySubmissionId(dbHandle.db, tenantId, submissionId);
      if (!grade) {
        throw new ApiError(
          'not_found',
          'Submission grade was not found. Ask the instructor to publish a grade before appealing.',
        );
      }

      try {
        return await createGradeAppealRecord(dbHandle.db, {
          tenantId,
          gradeId: grade.id,
          submissionId,
          studentId: actorUserId,
          reason: input.reason,
        });
      } catch (error) {
        if (isGradeAppealDuplicate(error)) {
          throw new ApiError(
            'conflict',
            'An open grade appeal already exists for this grade. Review the existing appeal before creating another.',
          );
        }
        throw error;
      }
    },
    listGradeAppeals: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllAppeals = hasTenantStaffAccess || hasCourseStaffAccess;
      const assignments = await listAssignmentsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: allAssignmentStatuses,
      });
      const submissions = (
        await Promise.all(
          assignments.map((assignment) =>
            listSubmissionsForAssignment(dbHandle.db, tenantId, assignment.id),
          ),
        )
      ).flat();
      return listGradeAppealRecordsForCourse(dbHandle.db, {
        tenantId,
        submissionIds: submissions.map((submission) => submission.id),
        studentId: canViewAllAppeals ? undefined : actorUserId,
      });
    },
    updateGradeAppeal: async (actorUserId, tenantId, courseId, gradeAppealId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can update grade appeals. Ask an instructor for access.',
        );
      }

      const currentAppeal = await getGradeAppealById(dbHandle.db, tenantId, gradeAppealId);
      if (!currentAppeal) {
        throw new ApiError(
          'not_found',
          'Grade appeal was not found. Check the appeal id and retry the request.',
        );
      }

      const submission = await getSubmissionById(dbHandle.db, tenantId, currentAppeal.submissionId);
      if (!submission) {
        throw new ApiError(
          'not_found',
          'Grade appeal was not found. Check the appeal id and retry the request.',
        );
      }

      const assignment = await getAssignmentById(dbHandle.db, tenantId, submission.assignmentId);
      if (!assignment || assignment.courseId !== courseId) {
        throw new ApiError(
          'not_found',
          'Grade appeal was not found. Check the appeal id and retry the request.',
        );
      }

      if (
        (input.status === 'resolved' || input.status === 'rejected') &&
        input.resolution === null
      ) {
        throw new ApiError(
          'bad_request',
          'Resolved or rejected grade appeals require a resolution.',
        );
      }

      const appeal = await updateGradeAppealStatus(dbHandle.db, {
        tenantId,
        gradeAppealId,
        status: input.status,
        resolution: input.resolution,
      });

      if (!appeal) {
        throw new ApiError(
          'not_found',
          'Grade appeal was not found. Check the appeal id and retry the request.',
        );
      }

      return appeal;
    },
    listGradebookEntries: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllGrades = hasTenantStaffAccess || hasCourseStaffAccess;

      return listGradebookEntriesForCourse(dbHandle.db, {
        tenantId,
        courseId,
        studentId: canViewAllGrades ? undefined : actorUserId,
        statuses: canViewAllGrades ? allGradeStatuses : studentVisibleGradeStatuses,
      });
    },
    listCourseFinalGrades: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllGrades = hasTenantStaffAccess || hasCourseStaffAccess;
      const categories = await listGradebookCategoriesForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: ['active'],
      });
      const entries = await listGradebookEntriesForCourse(dbHandle.db, {
        tenantId,
        courseId,
        studentId: canViewAllGrades ? undefined : actorUserId,
        statuses: studentVisibleGradeStatuses,
      });
      const manualItems = await listGradebookManualItemsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: ['active'],
      });
      const manualGrades = (
        await Promise.all(
          manualItems.map((item) =>
            listGradebookManualGradesForItem(dbHandle.db, {
              tenantId,
              gradebookManualItemId: item.id,
              studentId: canViewAllGrades ? undefined : actorUserId,
              statuses: studentVisibleGradeStatuses,
            }),
          ),
        )
      ).flat();
      const schemes = await listCourseGradingSchemesForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: ['active'],
      });

      return calculateCourseFinalGrades({
        tenantId,
        courseId,
        categories,
        assignmentEntries: entries,
        manualItems,
        manualGrades,
        gradingScheme: schemes[0] ?? null,
      });
    },
    listDiscussionGradebookEntries: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const isCourseStaff = hasTenantStaffAccess || hasCourseStaffAccess;
      return listDiscussionGradebookEntriesForCourse(dbHandle.db, {
        tenantId,
        courseId,
        studentId: isCourseStaff ? undefined : actorUserId,
        statuses: isCourseStaff ? undefined : ['published', 'revised'],
      });
    },
    listInboxThreads: async (actorUserId, tenantId) => {
      await assertTenantMembership(actorUserId, tenantId);
      return listInboxThreadsForUser(dbHandle.db, {
        tenantId,
        userId: actorUserId,
        statuses: ['open'],
      });
    },
    createInboxThread: async (actorUserId, tenantId, input) => {
      await assertTenantMembership(actorUserId, tenantId);

      // Course-scoped threads: ensure actor can access the course, then validate participants are course members.
      // Tenant-wide threads: validate participants are tenant members.
      if (input.courseId !== null) {
        await readCourseAccessContext(actorUserId, tenantId, input.courseId);
        const courseMemberships = await listCourseMembershipRecords(dbHandle.db, {
          tenantId,
          courseId: input.courseId,
        });
        const courseMemberIds = new Set<string>(courseMemberships.map((m) => m.userId));
        for (const participantId of input.participantIds) {
          if (participantId !== actorUserId && !courseMemberIds.has(participantId)) {
            throw new ApiError(
              'bad_request',
              'One or more selected participants are not members of this course.',
            );
          }
        }
      } else {
        for (const participantId of input.participantIds) {
          if (participantId === actorUserId) continue;
          const participantTenantMemberships = await listUserTenantMemberships(
            dbHandle.db,
            participantId,
          );
          if (!participantTenantMemberships.some((m) => m.tenantId === tenantId)) {
            throw new ApiError(
              'bad_request',
              'One or more selected participants are not members of this tenant.',
            );
          }
        }
      }

      const participantIds = Array.from(new Set([actorUserId, ...input.participantIds]));

      return createConversationThreadRecord(dbHandle.db, {
        tenantId,
        courseId: input.courseId,
        subject: input.subject,
        participantIds,
        initialMessageSenderId: actorUserId,
        initialMessageBody: input.body,
      });
    },
    listInboxThreadMessages: async (actorUserId, tenantId, threadId) => {
      await assertTenantMembership(actorUserId, tenantId);
      const thread = await getConversationThreadInTenant(dbHandle.db, tenantId, threadId);

      if (!thread || !thread.participantIds.some((id) => id === actorUserId)) {
        throw new ApiError(
          'not_found',
          'Conversation was not found in this tenant. Check the conversation id and retry the request.',
        );
      }

      return listConversationMessagesForThread(dbHandle.db, { tenantId, threadId });
    },
    createInboxThreadMessage: async (actorUserId, tenantId, threadId, input) => {
      await assertTenantMembership(actorUserId, tenantId);
      const thread = await getConversationThreadInTenant(dbHandle.db, tenantId, threadId);

      if (!thread || !thread.participantIds.some((id) => id === actorUserId)) {
        throw new ApiError(
          'not_found',
          'Conversation was not found in this tenant. Check the conversation id and retry the request.',
        );
      }

      return createConversationMessageRecord(dbHandle.db, {
        tenantId,
        threadId,
        senderId: actorUserId,
        body: input.body,
        sentAt: new Date(),
      });
    },
    recordResourceView: async (actorUserId, tenantId, courseId, resourceId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess, hasCourseStudentAccess } =
        await readCourseAccessContext(actorUserId, tenantId, courseId);
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const resource = await getCourseResourceForCourse(dbHandle.db, {
        tenantId,
        courseId,
        courseResourceId: resourceId,
      });

      if (!resource || !canViewCourseContentItem(resource, canViewAllContent)) {
        throw new ApiError(
          'not_found',
          'Course resource was not found in this course. Check the resource id and retry the request.',
        );
      }

      const releaseVisibility =
        resource.moduleId === null
          ? null
          : await readLearnerReleaseVisibilityIndex(
              actorUserId,
              tenantId,
              courseId,
              canViewAllContent,
            );

      if (!canAccessReleasedModuleItem(resource, 'course_resource', releaseVisibility)) {
        throw new ApiError(
          'not_found',
          'Course resource was not found in this course. Check the resource id and retry the request.',
        );
      }

      try {
        return await recordResourceViewWithCompletion(dbHandle.db, {
          tenantId,
          courseId,
          resourceId,
          viewerId: actorUserId,
          viewedAt: new Date(),
          completeRequirements: hasCourseStudentAccess,
        });
      } catch (error) {
        if (error instanceof CourseResourceViewTargetNotFoundError) {
          throw new ApiError(
            'not_found',
            'Course resource was not found in this course. Check the resource id and retry the request.',
          );
        }
        throw error;
      }
    },
    listResourceViews: async (actorUserId, tenantId, courseId, resourceId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const isCourseStaff = hasTenantStaffAccess || hasCourseStaffAccess;
      return listResourceViewsForResource(dbHandle.db, {
        tenantId,
        resourceId,
        viewerId: isCourseStaff ? undefined : actorUserId,
      });
    },
    listScormPackages: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const isCourseStaff = hasTenantStaffAccess || hasCourseStaffAccess;
      return listScormPackagesForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: isCourseStaff ? undefined : ['published'],
      });
    },
    createScormPackage: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can create SCORM packages. Ask an instructor for access.',
        );
      }
      return createScormPackageRecord(dbHandle.db, {
        tenantId,
        courseId,
        title: input.title,
        scormVersion: input.scormVersion,
        launchUrl: input.launchUrl,
        manifest: input.manifest,
        status: input.status,
      });
    },
    upsertScormAttempt: async (actorUserId, tenantId, courseId, scormPackageId, input) => {
      await readPublishedScormPackageForRuntime(actorUserId, tenantId, courseId, scormPackageId);
      return upsertScormAttemptRecord(dbHandle.db, {
        tenantId,
        scormPackageId,
        studentId: actorUserId,
        completionStatus: input.completionStatus,
        successStatus: input.successStatus,
        scoreScaled: input.scoreScaled,
        totalTimeSeconds: input.totalTimeSeconds,
        suspendData: input.suspendData,
        lastVisitedAt: new Date(),
      });
    },
    initializeScormRuntime: (actorUserId, tenantId, courseId, scormPackageId) =>
      initializeScormRuntimeForActor(actorUserId, tenantId, courseId, scormPackageId),
    commitScormRuntime: (actorUserId, tenantId, courseId, scormPackageId, input) =>
      commitScormRuntimeForActor(actorUserId, tenantId, courseId, scormPackageId, input),
    finishScormRuntime: (actorUserId, tenantId, courseId, scormPackageId, input) =>
      commitScormRuntimeForActor(actorUserId, tenantId, courseId, scormPackageId, input),
    listPeerReviewResponses: async (
      actorUserId,
      tenantId,
      courseId,
      _assignmentId,
      peerReviewId,
    ) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);
      return listPeerReviewResponsesForReview(dbHandle.db, { tenantId, peerReviewId });
    },
    upsertPeerReviewResponse: async (
      actorUserId,
      tenantId,
      courseId,
      _assignmentId,
      peerReviewId,
      criterionId,
      input,
    ) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);
      return upsertPeerReviewResponseRecord(dbHandle.db, {
        tenantId,
        peerReviewId,
        criterionId,
        score: input.score,
        comment: input.comment,
        status: input.status,
        submittedAt: input.status === 'submitted' ? new Date() : null,
      });
    },
    listSectionMembers: async (actorUserId, tenantId, courseId, sectionId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can view section memberships. Ask an instructor for access.',
        );
      }
      return listSectionMembersForSection(dbHandle.db, { tenantId, sectionId });
    },
    listSectionInstructors: async (actorUserId, tenantId, courseId, sectionId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can view section instructors. Ask an instructor for access.',
        );
      }
      await assertCourseSectionExists(tenantId, courseId, sectionId);
      return listSectionInstructorsForSection(dbHandle.db, { tenantId, courseId, sectionId });
    },
    assignSectionMember: async (actorUserId, tenantId, courseId, sectionId, studentId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can assign students to sections. Ask an instructor for access.',
        );
      }
      return assignStudentToSection(dbHandle.db, {
        tenantId,
        courseId,
        sectionId,
        studentId,
      });
    },
    assignSectionInstructor: async (actorUserId, tenantId, courseId, sectionId, instructorId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can assign instructors to sections. Ask an instructor for access.',
        );
      }
      await assertCourseSectionExists(tenantId, courseId, sectionId);

      const targetMemberships = await listUserCourseMemberships(dbHandle.db, instructorId);
      const hasActiveStaffMembership = targetMemberships.some(
        (membership) =>
          membership.tenantId === tenantId &&
          membership.courseId === courseId &&
          membership.status === 'active' &&
          sectionInstructorRoles.includes(membership.role),
      );
      if (!hasActiveStaffMembership) {
        throw new ApiError(
          'bad_request',
          'Section instructors must already have an active staff membership in this course. Add the instructor to the course staff before assigning the section.',
        );
      }

      return assignInstructorToSection(dbHandle.db, {
        tenantId,
        courseId,
        sectionId,
        instructorId,
      });
    },
    removeSectionMember: async (actorUserId, tenantId, courseId, sectionId, studentId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can remove students from sections. Ask an instructor for access.',
        );
      }
      await removeStudentFromSection(dbHandle.db, { tenantId, sectionId, studentId });
    },
    removeSectionInstructor: async (actorUserId, tenantId, courseId, sectionId, instructorId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can remove instructors from sections. Ask an instructor for access.',
        );
      }
      await assertCourseSectionExists(tenantId, courseId, sectionId);
      await removeInstructorFromSection(dbHandle.db, {
        tenantId,
        courseId,
        sectionId,
        instructorId,
      });
    },
    exportDiscussionGradebookCsv: async (actorUserId, tenantId, courseId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can export discussion gradebook CSVs. Ask an instructor for access.',
        );
      }
      const entries = await listDiscussionGradebookEntriesForCourse(dbHandle.db, {
        tenantId,
        courseId,
      });
      return serializeDiscussionGradebookEntriesAsCsv(entries);
    },
    exportGradebookCsv: async (actorUserId, tenantId, courseId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', gradebookExportStaffOnlyMessage);
      }

      const entries = await listGradebookEntriesForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: allGradeStatuses,
      });

      return serializeGradebookEntriesAsCsv(entries);
    },
    exportCourseFinalGradesCsv: async (actorUserId, tenantId, courseId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', gradebookExportStaffOnlyMessage);
      }

      const manualItems = await listGradebookManualItemsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: ['active'],
      });
      const grades = await calculateCourseFinalGrades({
        tenantId,
        courseId,
        categories: await listGradebookCategoriesForCourse(dbHandle.db, {
          tenantId,
          courseId,
          statuses: ['active'],
        }),
        assignmentEntries: await listGradebookEntriesForCourse(dbHandle.db, {
          tenantId,
          courseId,
          statuses: studentVisibleGradeStatuses,
        }),
        manualItems,
        manualGrades: (
          await Promise.all(
            manualItems.map((item) =>
              listGradebookManualGradesForItem(dbHandle.db, {
                tenantId,
                gradebookManualItemId: item.id,
                statuses: studentVisibleGradeStatuses,
              }),
            ),
          )
        ).flat(),
        gradingScheme:
          (
            await listCourseGradingSchemesForCourse(dbHandle.db, {
              tenantId,
              courseId,
              statuses: ['active'],
            })
          )[0] ?? null,
      });

      return serializeCourseFinalGradesAsCsv(grades);
    },
    submitCourseFinalGradesToSis: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', gradebookExportStaffOnlyMessage);
      }

      const integrationConnectionId = IntegrationConnectionId.parse(input.integrationConnectionId);
      const connection = await getIntegrationConnectionById(
        dbHandle.db,
        tenantId,
        integrationConnectionId,
      );
      if (!connection || connection.providerType !== 'sis_csv' || connection.status !== 'enabled') {
        throw new ApiError('not_found', sisFinalGradeConnectionMissingMessage);
      }

      const manualItems = await listGradebookManualItemsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: ['active'],
      });
      const grades = await calculateCourseFinalGrades({
        tenantId,
        courseId,
        categories: await listGradebookCategoriesForCourse(dbHandle.db, {
          tenantId,
          courseId,
          statuses: ['active'],
        }),
        assignmentEntries: await listGradebookEntriesForCourse(dbHandle.db, {
          tenantId,
          courseId,
          statuses: studentVisibleGradeStatuses,
        }),
        manualItems,
        manualGrades: (
          await Promise.all(
            manualItems.map((item) =>
              listGradebookManualGradesForItem(dbHandle.db, {
                tenantId,
                gradebookManualItemId: item.id,
                statuses: studentVisibleGradeStatuses,
              }),
            ),
          )
        ).flat(),
        gradingScheme:
          (
            await listCourseGradingSchemesForCourse(dbHandle.db, {
              tenantId,
              courseId,
              statuses: ['active'],
            })
          )[0] ?? null,
      });
      const csv = serializeSisFinalGradesAsCsv(grades);
      const bytes = new TextEncoder().encode(csv);
      const storageFileId = createFileResourceId();
      const stored = await fileStorage.upload({
        tenantId,
        fileResourceId: storageFileId,
        bytes,
      });
      const submittedAt = new Date();

      try {
        await createFileResource(dbHandle.db, {
          tenantId,
          id: storageFileId,
          courseId,
          ownerId: actorUserId,
          storageProvider: stored.storageProvider,
          storageKey: stored.storageKey,
          filename: `sis-final-grades-${courseId}.csv`,
          mediaType: 'text/csv',
          byteSize: bytes.byteLength,
          checksumSha256: createHash('sha256').update(bytes).digest('hex'),
          visibility: 'course_staff',
          altText: null,
          transcriptText: null,
          license: null,
          copyrightHolder: null,
        });

        await saveOutboxEvent(
          dbHandle.db,
          buildSisFinalGradesSubmittedEvent(
            {
              tenantId,
              courseId,
              integrationConnectionId,
              storageFileId,
              rowCount: grades.length,
            },
            submittedAt,
          ),
        );

        return SisFinalGradeSubmission.parse({
          tenantId,
          courseId,
          integrationConnectionId,
          storageFileId,
          rowCount: grades.length,
          status: 'queued',
          submittedAt,
        });
      } catch (error) {
        await deleteFileResourceForOwner(dbHandle.db, {
          tenantId,
          ownerId: actorUserId,
          fileResourceId: storageFileId,
        });
        await fileStorage.delete(stored.storageKey);
        throw error;
      }
    },
    listGradebookManualItems: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllManualItems = hasTenantStaffAccess || hasCourseStaffAccess;

      return listGradebookManualItemsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: canViewAllManualItems ? allGradebookManualItemStatuses : ['active'],
      });
    },
    createGradebookManualItem: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', gradebookManualItemStaffOnlyMessage);
      }

      try {
        return await createGradebookManualItemRecord(dbHandle.db, {
          tenantId,
          courseId,
          gradebookCategoryId: input.gradebookCategoryId,
          title: input.title,
          description: input.description,
          maxScore: input.maxScore,
          dueAt: input.dueAt,
          position: input.position,
          status: input.status,
          extraCredit: input.extraCredit,
        });
      } catch (error) {
        if (isGradebookManualItemCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        if (isGradebookManualItemCategoryMissing(error)) {
          throw new ApiError('bad_request', gradebookManualItemCategoryMissingMessage);
        }

        if (isGradebookManualItemPositionDuplicate(error)) {
          throw new ApiError('conflict', gradebookManualItemDuplicatePositionMessage);
        }

        throw error;
      }
    },
    updateGradebookManualItem: async (
      actorUserId,
      tenantId,
      courseId,
      gradebookManualItemId,
      input,
    ) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', gradebookManualItemStaffOnlyMessage);
      }

      try {
        const updated = await updateGradebookManualItemRecord(dbHandle.db, {
          tenantId,
          courseId,
          gradebookManualItemId,
          gradebookCategoryId: input.gradebookCategoryId,
          title: input.title,
          description: input.description,
          maxScore: input.maxScore,
          dueAt: input.dueAt,
          position: input.position,
          status: input.status,
          extraCredit: input.extraCredit,
        });

        if (!updated) {
          throw new ApiError('not_found', gradebookManualItemNotFoundMessage);
        }

        return updated;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        if (isGradebookManualItemCategoryMissing(error)) {
          throw new ApiError('bad_request', gradebookManualItemCategoryMissingMessage);
        }

        if (isGradebookManualItemPositionDuplicate(error)) {
          throw new ApiError('conflict', gradebookManualItemDuplicatePositionMessage);
        }

        throw error;
      }
    },
    deleteGradebookManualItem: async (actorUserId, tenantId, courseId, gradebookManualItemId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', gradebookManualItemStaffOnlyMessage);
      }

      const deleted = await deleteGradebookManualItemRecord(dbHandle.db, {
        tenantId,
        courseId,
        gradebookManualItemId,
      });

      if (!deleted) {
        throw new ApiError('not_found', gradebookManualItemNotFoundMessage);
      }
    },
    listGradebookManualGrades: async (actorUserId, tenantId, courseId, gradebookManualItemId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllManualGrades = hasTenantStaffAccess || hasCourseStaffAccess;
      const item = await getGradebookManualItemForCourse(
        dbHandle.db,
        tenantId,
        courseId,
        gradebookManualItemId,
      );

      if (!item || (!canViewAllManualGrades && item.status !== 'active')) {
        throw new ApiError('not_found', manualGradebookItemNotFoundMessage);
      }

      return listGradebookManualGradesForItem(dbHandle.db, {
        tenantId,
        gradebookManualItemId,
        studentId: canViewAllManualGrades ? undefined : actorUserId,
        statuses: canViewAllManualGrades ? allGradeStatuses : studentVisibleGradeStatuses,
      });
    },
    saveGradebookManualGrade: async (
      actorUserId,
      tenantId,
      courseId,
      gradebookManualItemId,
      studentId,
      input,
    ) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );

      if (!hasTenantStaffAccess && !hasCourseStaffAccess) {
        throw new ApiError('forbidden', manualGradebookStaffOnlyMessage);
      }

      try {
        return await recordGradebookManualGrade(dbHandle.db, {
          tenantId: TenantId.parse(tenantId),
          courseId,
          gradebookManualItemId: GradebookManualItemId.parse(gradebookManualItemId),
          studentId: UserId.parse(studentId),
          score: input.score,
          status: input.status,
        });
      } catch (error) {
        if (error instanceof ManualGradebookItemUnavailableError) {
          throw new ApiError('not_found', manualGradebookItemNotFoundMessage);
        }

        if (error instanceof ManualGradebookStudentUnavailableError) {
          throw new ApiError('not_found', manualGradebookStudentNotFoundMessage);
        }

        if (error instanceof ManualGradebookScoreExceedsMaxScoreError) {
          throw new ApiError('bad_request', manualGradebookScoreTooHighMessage);
        }

        throw error;
      }
    },
    listGradebookCategories: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllCategories = hasTenantStaffAccess || hasCourseStaffAccess;

      return listGradebookCategoriesForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: canViewAllCategories ? allGradebookCategoryStatuses : ['active'],
      });
    },
    createGradebookCategory: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', gradebookCategoryStaffOnlyMessage);
      }

      try {
        return await createGradebookCategoryRecord(dbHandle.db, {
          tenantId,
          courseId,
          name: input.name,
          position: input.position,
          weightPercent: input.weightPercent,
          dropLowest: input.dropLowest,
          status: input.status,
        });
      } catch (error) {
        if (isGradebookCategoryCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        if (isGradebookCategoryPositionDuplicate(error)) {
          throw new ApiError('conflict', gradebookCategoryDuplicatePositionMessage);
        }

        throw error;
      }
    },
    updateGradebookCategory: async (
      actorUserId,
      tenantId,
      courseId,
      gradebookCategoryId,
      input,
    ) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', gradebookCategoryStaffOnlyMessage);
      }

      try {
        const updated = await updateGradebookCategoryRecord(dbHandle.db, {
          tenantId,
          courseId,
          gradebookCategoryId,
          name: input.name,
          position: input.position,
          weightPercent: input.weightPercent,
          dropLowest: input.dropLowest,
          status: input.status,
        });

        if (!updated) {
          throw new ApiError('not_found', gradebookCategoryNotFoundMessage);
        }

        return updated;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        if (isGradebookCategoryPositionDuplicate(error)) {
          throw new ApiError('conflict', gradebookCategoryDuplicatePositionMessage);
        }

        throw error;
      }
    },
    deleteGradebookCategory: async (actorUserId, tenantId, courseId, gradebookCategoryId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', gradebookCategoryStaffOnlyMessage);
      }

      const deleted = await deleteGradebookCategoryRecord(dbHandle.db, {
        tenantId,
        courseId,
        gradebookCategoryId,
      });

      if (!deleted) {
        throw new ApiError('not_found', gradebookCategoryNotFoundMessage);
      }
    },
    listCourseGradingSchemes: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllSchemes = hasTenantStaffAccess || hasCourseStaffAccess;

      return listCourseGradingSchemesForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: canViewAllSchemes ? allCourseGradingSchemeStatuses : ['active'],
      });
    },
    createCourseGradingScheme: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseGradingSchemeStaffOnlyMessage);
      }

      try {
        return await createCourseGradingSchemeRecord(dbHandle.db, {
          tenantId,
          courseId,
          name: input.name,
          status: input.status,
          entries: input.entries,
        });
      } catch (error) {
        if (isCourseGradingSchemeCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        if (isCourseGradingSchemeNameDuplicate(error)) {
          throw new ApiError('conflict', courseGradingSchemeDuplicateNameMessage);
        }

        throw error;
      }
    },
    listCourseExternalTools: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllTools = hasTenantStaffAccess || hasCourseStaffAccess;

      return listCourseExternalToolsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        statuses: canViewAllTools ? allCourseExternalToolStatuses : ['active'],
      });
    },
    getLti1p3JsonWebKeySet: async (tenantId) => {
      const keys = await listActiveLti1p3PlatformKeys(dbHandle.db, tenantId);

      return buildLti1p3JsonWebKeySet(keys);
    },
    launchCourseExternalToolLti1p3: async (actorUserId, tenantId, courseId, toolId) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      const tool = await getCourseExternalToolForCourse(dbHandle.db, tenantId, courseId, toolId);

      if (!tool) {
        throw new ApiError('not_found', courseExternalToolNotFoundMessage);
      }

      const connection = await getIntegrationConnectionById(
        dbHandle.db,
        tenantId,
        tool.integrationConnectionId,
      );

      if (!connection) {
        throw new ApiError('bad_request', courseExternalToolConnectionMissingMessage);
      }

      try {
        return createLti1p3OidcLoginInitiation({
          actorUserId,
          tenantId,
          courseId,
          tool,
          connection,
          launchType: 'resource_link',
        });
      } catch (error) {
        if (error instanceof Error) {
          throw new ApiError('bad_request', error.message);
        }

        throw error;
      }
    },
    launchCourseExternalToolLti1p3DeepLinking: async (actorUserId, tenantId, courseId, toolId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!access.hasTenantStaffAccess && !access.hasCourseStaffAccess) {
        throw new ApiError('forbidden', ltiDeepLinkingStaffOnlyMessage);
      }

      const tool = await getCourseExternalToolForCourse(dbHandle.db, tenantId, courseId, toolId);

      if (!tool) {
        throw new ApiError('not_found', courseExternalToolNotFoundMessage);
      }

      const connection = await getIntegrationConnectionById(
        dbHandle.db,
        tenantId,
        tool.integrationConnectionId,
      );

      if (!connection) {
        throw new ApiError('bad_request', courseExternalToolConnectionMissingMessage);
      }

      try {
        const session = await createLti1p3DeepLinkingSession(dbHandle.db, {
          actorUserId,
          tenantId,
          courseId,
          toolId,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });

        return createLti1p3OidcLoginInitiation({
          actorUserId,
          tenantId,
          courseId,
          tool,
          connection,
          launchType: 'deep_linking',
          deepLinkingSessionId: session.id,
        });
      } catch (error) {
        if (error instanceof Error) {
          throw new ApiError('bad_request', error.message);
        }

        throw error;
      }
    },
    createCourseExternalToolLti1p3LaunchAuthorizationResponse: async (
      actorUserId,
      tenantId,
      courseId,
      toolId,
      input,
    ) => createLti1p3LaunchResponseForCourseTool(actorUserId, tenantId, courseId, toolId, input),
    authorizeLti1p3OidcLaunch: async (sessionToken, input) => {
      const session = await getCoreSessionByToken(dbHandle.db, sessionToken);

      if (!session) {
        throw new ApiError('unauthorized', 'Session was not found. Sign in and retry the request.');
      }

      if (session.expiresAt.getTime() <= Date.now()) {
        throw new ApiError(
          'unauthorized',
          'Session has expired. Sign in again and retry the request.',
        );
      }

      let resolved: ReturnType<typeof resolveLti1p3OidcAuthorizationRequest>;

      try {
        resolved = resolveLti1p3OidcAuthorizationRequest(input);
      } catch (error) {
        if (error instanceof Error) {
          throw new ApiError('bad_request', error.message);
        }

        throw error;
      }

      if (session.userId !== resolved.actorUserId) {
        throw new ApiError('forbidden', ltiOidcSessionUserMismatchMessage);
      }

      if (session.activeTenantId !== resolved.tenantId) {
        throw new ApiError('forbidden', ltiOidcSessionTenantMismatchMessage);
      }

      if (resolved.launchType === 'deep_linking') {
        if (resolved.deepLinkingSessionId === undefined) {
          throw new ApiError(
            'bad_request',
            'LTI deep linking launch is missing its session id. Start deep linking again.',
          );
        }

        return createLti1p3DeepLinkingResponseForCourseTool(
          session.userId,
          resolved.tenantId,
          resolved.courseId,
          resolved.toolId,
          resolved.launchRequest,
          encodeLti1p3DeepLinkingSessionData({
            sessionId: Lti1p3DeepLinkingSessionId.parse(resolved.deepLinkingSessionId),
          }),
          resolved.clientId,
        );
      }

      return createLti1p3LaunchResponseForCourseTool(
        session.userId,
        resolved.tenantId,
        resolved.courseId,
        resolved.toolId,
        resolved.launchRequest,
        resolved.clientId,
      );
    },
    processLti1p3DeepLinkingReturn: (jwt) => processLti1p3DeepLinkingReturnForSession(jwt),
    createLti1p3ServiceAccessToken: (tenantId, input) =>
      createLti1p3ServiceAccessTokenForTool(tenantId, input),
    getLti1p3NamesRolesMemberships: (accessToken, tenantId, courseId, role) =>
      getLti1p3NamesRolesMembershipsForTool(accessToken, tenantId, courseId, role),
    publishLti1p3AgsScore: (accessToken, tenantId, courseId, assignmentId, toolId, score) =>
      publishLti1p3AgsScoreForTool(accessToken, tenantId, courseId, assignmentId, toolId, score),
    listLti1p3AgsResults: (accessToken, tenantId, courseId, assignmentId, toolId, userId) =>
      listLti1p3AgsResultsForTool(accessToken, tenantId, courseId, assignmentId, toolId, userId),
    createCourseExternalTool: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseExternalToolStaffOnlyMessage);
      }

      try {
        return await createCourseExternalToolRecord(dbHandle.db, {
          tenantId,
          courseId,
          integrationConnectionId: input.integrationConnectionId,
          name: input.name,
          description: input.description,
          launchUrl: input.launchUrl,
          placement: input.placement,
          status: input.status,
        });
      } catch (error) {
        if (isCourseExternalToolCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        if (isCourseExternalToolConnectionMissing(error)) {
          throw new ApiError('bad_request', courseExternalToolConnectionMissingMessage);
        }

        if (isCourseExternalToolNameDuplicate(error)) {
          throw new ApiError('conflict', courseExternalToolDuplicateNameMessage);
        }

        throw error;
      }
    },
    updateCourseExternalTool: async (actorUserId, tenantId, courseId, toolId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseExternalToolStaffOnlyMessage);
      }

      try {
        const updated = await updateCourseExternalToolRecord(dbHandle.db, {
          tenantId,
          courseId,
          toolId,
          integrationConnectionId: input.integrationConnectionId,
          name: input.name,
          description: input.description,
          launchUrl: input.launchUrl,
          placement: input.placement,
          status: input.status,
        });

        if (!updated) {
          throw new ApiError('not_found', courseExternalToolNotFoundMessage);
        }

        return updated;
      } catch (error) {
        if (isCourseExternalToolConnectionMissing(error)) {
          throw new ApiError('bad_request', courseExternalToolConnectionMissingMessage);
        }

        if (isCourseExternalToolNameDuplicate(error)) {
          throw new ApiError('conflict', courseExternalToolDuplicateNameMessage);
        }

        throw error;
      }
    },
    deleteCourseExternalTool: async (actorUserId, tenantId, courseId, toolId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseExternalToolStaffOnlyMessage);
      }

      const deleted = await deleteCourseExternalToolRecord(dbHandle.db, {
        tenantId,
        courseId,
        toolId,
      });

      if (!deleted) {
        throw new ApiError('not_found', courseExternalToolNotFoundMessage);
      }
    },
    recordCourseExternalToolOutcome: async (
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      input,
    ) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can record LTI outcomes. Ask an instructor for access.',
        );
      }

      try {
        return await recordCourseExternalToolOutcome(dbHandle.db, {
          tenantId,
          courseId,
          assignmentId,
          studentId: input.studentId,
          externalToolId: input.externalToolId,
          score: input.score,
          maxScore: input.maxScore,
          status: input.status,
          reportedAt: input.reportedAt,
        });
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error) {
          const code = (error as { code?: string }).code;
          if (code === '23503') {
            throw new ApiError(
              'bad_request',
              'Referenced assignment, student, or external tool is missing or not in scope.',
            );
          }
        }

        throw error;
      }
    },
    listCourseExternalToolOutcomes: async (actorUserId, tenantId, courseId, assignmentId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can list LTI outcomes. Ask an instructor for access.',
        );
      }

      return listCourseExternalToolOutcomesForAssignment(dbHandle.db, {
        tenantId,
        courseId,
        assignmentId,
      });
    },
    listCourseModules: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const modules = await listCourseModules(dbHandle.db, { tenantId, courseId });

      return modules.filter((module) => canViewCourseContentItem(module, canViewAllContent));
    },
    createCourseModule: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseModuleStaffOnlyMessage);
      }

      try {
        return await createCourseModuleRecord(dbHandle.db, {
          tenantId,
          courseId,
          title: input.title,
          summary: input.summary,
          visibility: input.visibility,
          accessPolicy: input.accessPolicy,
          position: input.position,
          learningObjectiveIds: input.learningObjectiveIds.map((id) =>
            LearningObjectiveId.parse(id),
          ),
        });
      } catch (error) {
        if (isCourseModuleCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        throw error;
      }
    },
    updateCourseModule: async (actorUserId, tenantId, courseId, courseModuleId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseModuleStaffOnlyMessage);
      }

      const updated = await updateCourseModuleRecord(dbHandle.db, {
        tenantId,
        courseId,
        courseModuleId,
        title: input.title,
        summary: input.summary,
        visibility: input.visibility,
        accessPolicy: input.accessPolicy,
        position: input.position,
        learningObjectiveIds: input.learningObjectiveIds.map((id) => LearningObjectiveId.parse(id)),
      });

      if (!updated) {
        throw new ApiError(
          'not_found',
          'Course module was not found in this course. Check the module id and retry the request.',
        );
      }

      return updated;
    },
    deleteCourseModule: async (actorUserId, tenantId, courseId, courseModuleId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseModuleStaffOnlyMessage);
      }

      const deleted = await deleteCourseModuleRecord(dbHandle.db, {
        tenantId,
        courseId,
        courseModuleId,
      });

      if (!deleted) {
        throw new ApiError(
          'not_found',
          'Course module was not found in this course. Check the module id and retry the request.',
        );
      }
    },
    listCourseUnits: async (actorUserId, tenantId, courseId, moduleId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const units = await listCourseUnits(dbHandle.db, { tenantId, courseId, moduleId });

      return units.filter((unit) => canViewCourseContentItem(unit, canViewAllContent));
    },
    createCourseUnit: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseUnitStaffOnlyMessage);
      }

      try {
        return await createCourseUnitRecord(dbHandle.db, {
          tenantId,
          courseId,
          moduleId: input.moduleId,
          title: input.title,
          summary: input.summary,
          visibility: input.visibility,
          accessPolicy: input.accessPolicy,
          position: input.position,
          learningObjectiveIds: input.learningObjectiveIds.map((id) =>
            LearningObjectiveId.parse(id),
          ),
        });
      } catch (error) {
        if (isCourseUnitCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        if (isCourseUnitModuleMissing(error)) {
          throw new ApiError('bad_request', courseUnitModuleMissingMessage);
        }

        throw error;
      }
    },
    updateCourseUnit: async (actorUserId, tenantId, courseId, courseUnitId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseUnitStaffOnlyMessage);
      }

      try {
        const updated = await updateCourseUnitRecord(dbHandle.db, {
          tenantId,
          courseId,
          courseUnitId,
          moduleId: input.moduleId,
          title: input.title,
          summary: input.summary,
          visibility: input.visibility,
          accessPolicy: input.accessPolicy,
          position: input.position,
          learningObjectiveIds: input.learningObjectiveIds.map((id) =>
            LearningObjectiveId.parse(id),
          ),
        });

        if (!updated) {
          throw new ApiError(
            'not_found',
            'Course unit was not found. Check the unit id and retry the request.',
          );
        }

        return updated;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        if (isCourseUnitModuleMissing(error)) {
          throw new ApiError('bad_request', courseUnitModuleMissingMessage);
        }

        throw error;
      }
    },
    deleteCourseUnit: async (actorUserId, tenantId, courseId, courseUnitId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseUnitStaffOnlyMessage);
      }

      const deleted = await deleteCourseUnitRecord(dbHandle.db, {
        tenantId,
        courseId,
        courseUnitId,
      });

      if (!deleted) {
        throw new ApiError(
          'not_found',
          'Course unit was not found. Check the unit id and retry the request.',
        );
      }
    },
    listCourseResources: async (actorUserId, tenantId, courseId, moduleId, unitId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const resources = await listCourseResources(dbHandle.db, {
        tenantId,
        courseId,
        moduleId,
        unitId,
      });
      const releaseVisibility = resources.some((resource) => resource.moduleId !== null)
        ? await readLearnerReleaseVisibilityIndex(
            actorUserId,
            tenantId,
            courseId,
            canViewAllContent,
          )
        : null;

      return resources.filter(
        (resource) =>
          canViewCourseContentItem(resource, canViewAllContent) &&
          canAccessReleasedModuleItem(resource, 'course_resource', releaseVisibility),
      );
    },
    createCourseResource: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseResourceStaffOnlyMessage);
      }

      try {
        return await createCourseResourceRecord(dbHandle.db, {
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
          position: input.position,
          learningObjectiveIds: input.learningObjectiveIds.map((id) =>
            LearningObjectiveId.parse(id),
          ),
        });
      } catch (error) {
        if (isCourseResourceCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        if (isCourseResourceModuleMissing(error)) {
          throw new ApiError('bad_request', courseUnitModuleMissingMessage);
        }

        if (isCourseResourceUnitMissing(error)) {
          throw new ApiError('bad_request', courseResourceUnitMissingMessage);
        }

        if (isCourseResourceModuleUnitMismatch(error)) {
          throw new ApiError('bad_request', courseResourceModuleUnitMismatchMessage);
        }

        throw error;
      }
    },
    updateCourseResource: async (actorUserId, tenantId, courseId, courseResourceId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseResourceStaffOnlyMessage);
      }

      try {
        const updated = await updateCourseResourceRecord(dbHandle.db, {
          tenantId,
          courseId,
          courseResourceId,
          moduleId: input.moduleId,
          unitId: input.unitId,
          resourceType: input.resourceType,
          title: input.title,
          body: input.body,
          sourceUri: input.sourceUri,
          visibility: input.visibility,
          accessPolicy: input.accessPolicy,
          position: input.position,
          learningObjectiveIds: input.learningObjectiveIds.map((id) =>
            LearningObjectiveId.parse(id),
          ),
        });

        if (!updated) {
          throw new ApiError(
            'not_found',
            'Course resource was not found. Check the resource id and retry the request.',
          );
        }

        return updated;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        if (isCourseResourceModuleMissing(error)) {
          throw new ApiError('bad_request', courseUnitModuleMissingMessage);
        }

        if (isCourseResourceUnitMissing(error)) {
          throw new ApiError('bad_request', courseResourceUnitMissingMessage);
        }

        if (isCourseResourceModuleUnitMismatch(error)) {
          throw new ApiError('bad_request', courseResourceModuleUnitMismatchMessage);
        }

        throw error;
      }
    },
    deleteCourseResource: async (actorUserId, tenantId, courseId, courseResourceId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseResourceStaffOnlyMessage);
      }

      const deleted = await deleteCourseResourceRecord(dbHandle.db, {
        tenantId,
        courseId,
        courseResourceId,
      });

      if (!deleted) {
        throw new ApiError(
          'not_found',
          'Course resource was not found. Check the resource id and retry the request.',
        );
      }
    },
    listLearningObjectives: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const learningObjectives = await listLearningObjectivesForCourse(dbHandle.db, {
        tenantId,
        courseId,
      });

      return learningObjectives.filter((objective) =>
        canViewLearningObjective(objective, canViewAllContent),
      );
    },
    getLearningObjectiveCoverage: async (actorUserId, tenantId, courseId, learningObjectiveId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can view learning-objective coverage. Ask an instructor for access.',
        );
      }

      const objective = await getLearningObjectiveById(dbHandle.db, tenantId, learningObjectiveId);

      if (!objective || objective.courseId !== courseId) {
        throw new ApiError(
          'not_found',
          'Learning objective was not found in this course. Check the id and retry the request.',
        );
      }

      return getLearningObjectiveCoverage(dbHandle.db, tenantId, courseId, learningObjectiveId);
    },
    createLearningObjective: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', learningObjectiveStaffOnlyMessage);
      }

      try {
        return await createLearningObjectiveRecord(dbHandle.db, {
          tenantId,
          courseId,
          code: input.code,
          title: input.title,
          description: input.description,
          status: input.status,
          position: input.position,
        });
      } catch (error) {
        if (isLearningObjectiveCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        if (isLearningObjectiveCodeDuplicate(error)) {
          throw new ApiError('conflict', learningObjectiveDuplicateCodeMessage);
        }

        throw error;
      }
    },
    updateLearningObjective: async (
      actorUserId,
      tenantId,
      courseId,
      learningObjectiveId,
      input,
    ) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', learningObjectiveStaffOnlyMessage);
      }

      try {
        const updated = await updateLearningObjectiveRecord(dbHandle.db, {
          tenantId,
          courseId,
          learningObjectiveId,
          code: input.code,
          title: input.title,
          description: input.description,
          status: input.status,
          position: input.position,
        });

        if (!updated) {
          throw new ApiError(
            'not_found',
            'Learning objective was not found. Check the objective id and retry the request.',
          );
        }

        return updated;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        if (isLearningObjectiveCodeDuplicate(error)) {
          throw new ApiError('conflict', learningObjectiveDuplicateCodeMessage);
        }

        throw error;
      }
    },
    deleteLearningObjective: async (actorUserId, tenantId, courseId, learningObjectiveId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', learningObjectiveStaffOnlyMessage);
      }

      const deleted = await deleteLearningObjectiveRecord(dbHandle.db, {
        tenantId,
        courseId,
        learningObjectiveId,
      });

      if (!deleted) {
        throw new ApiError(
          'not_found',
          'Learning objective was not found. Check the objective id and retry the request.',
        );
      }
    },
    listLearningObjectiveMastery: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllMastery = hasTenantStaffAccess || hasCourseStaffAccess;

      return listLearningObjectiveMasteryForCourse(dbHandle.db, {
        tenantId,
        courseId,
        studentId: canViewAllMastery ? undefined : actorUserId,
      });
    },
    listCoursePages: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const releaseVisibility = await readLearnerReleaseVisibilityIndex(
        actorUserId,
        tenantId,
        courseId,
        canViewAllContent,
      );
      const pages = await listCoursePagesForCourse(dbHandle.db, { tenantId, courseId });

      return pages.filter(
        (page) =>
          canViewCoursePage(page, canViewAllContent) &&
          canAccessReleasedCoursePage(page, releaseVisibility),
      );
    },
    createCoursePage: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', coursePageStaffOnlyMessage);
      }

      try {
        return await createCoursePageRecord(dbHandle.db, {
          tenantId,
          courseId,
          title: input.title,
          body: input.body,
          visibility: input.visibility,
          learningObjectiveIds: input.learningObjectiveIds.map((id) =>
            LearningObjectiveId.parse(id),
          ),
        });
      } catch (error) {
        if (isCoursePageCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        throw error;
      }
    },
    updateCoursePage: async (actorUserId, tenantId, courseId, coursePageId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', coursePageStaffOnlyMessage);
      }

      const updated = await updateCoursePageRecord(dbHandle.db, {
        tenantId,
        courseId,
        coursePageId,
        title: input.title,
        body: input.body,
        visibility: input.visibility,
        learningObjectiveIds: input.learningObjectiveIds.map((id) => LearningObjectiveId.parse(id)),
      });

      if (!updated) {
        throw new ApiError(
          'not_found',
          'Course page was not found. Check the page id and retry the request.',
        );
      }

      return updated;
    },
    deleteCoursePage: async (actorUserId, tenantId, courseId, coursePageId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', coursePageStaffOnlyMessage);
      }

      const deleted = await deleteCoursePageRecord(dbHandle.db, {
        tenantId,
        courseId,
        coursePageId,
      });

      if (!deleted) {
        throw new ApiError(
          'not_found',
          'Course page was not found. Check the page id and retry the request.',
        );
      }
    },
    getCourseSyllabus: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const syllabus = await getCourseSyllabusForCourse(dbHandle.db, { tenantId, courseId });

      if (!syllabus || !canViewCourseSyllabus(syllabus, canViewAllContent)) {
        throw new ApiError(
          'not_found',
          'Course syllabus was not found. Check the course id and retry the request.',
        );
      }

      return syllabus;
    },
    upsertCourseSyllabus: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseSyllabusStaffOnlyMessage);
      }

      try {
        return await upsertCourseSyllabusRecord(dbHandle.db, {
          tenantId,
          courseId,
          body: input.body,
          visibility: input.visibility,
        });
      } catch (error) {
        if (isCourseSyllabusCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        throw error;
      }
    },
    listDiscussionTopics: async (actorUserId, tenantId, courseId, moduleId, unitId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;

      return listDiscussionTopicsForCourse(dbHandle.db, {
        tenantId,
        courseId,
        visibilities: canViewAllContent ? allDiscussionTopicVisibilities : ['published'],
        moduleId,
        unitId,
      });
    },
    createDiscussionTopic: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', discussionTopicStaffOnlyMessage);
      }

      try {
        return await createDiscussionTopicRecord(dbHandle.db, {
          tenantId,
          courseId,
          moduleId: input.moduleId,
          unitId: input.unitId,
          title: input.title,
          prompt: input.prompt,
          visibility: input.visibility,
          position: input.position,
          gradingEnabled: input.gradingEnabled,
          pointsPossible: input.pointsPossible,
          rubricId: input.rubricId,
        });
      } catch (error) {
        if (isDiscussionTopicCourseMissing(error)) {
          throw new ApiError('bad_request', courseMissingMessage);
        }

        if (isDiscussionTopicPlacementMissing(error)) {
          throw new ApiError('bad_request', discussionTopicPlacementMissingMessage);
        }

        throw error;
      }
    },
    updateDiscussionTopic: async (actorUserId, tenantId, courseId, topicId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', discussionTopicStaffOnlyMessage);
      }

      const existingTopic = await getDiscussionTopicForCourse(
        dbHandle.db,
        tenantId,
        courseId,
        topicId,
      );
      if (!existingTopic) {
        throw new ApiError('not_found', discussionTopicNotFoundMessage);
      }

      try {
        const updated = await updateDiscussionTopicRecord(dbHandle.db, {
          tenantId,
          courseId,
          topicId,
          moduleId: input.moduleId,
          unitId: input.unitId,
          title: input.title,
          prompt: input.prompt,
          visibility: input.visibility,
          position: input.position,
          gradingEnabled: input.gradingEnabled ?? existingTopic.gradingEnabled,
          pointsPossible:
            input.pointsPossible !== undefined
              ? input.pointsPossible
              : existingTopic.pointsPossible,
          rubricId: input.rubricId !== undefined ? input.rubricId : existingTopic.rubricId,
        });

        if (!updated) {
          throw new ApiError('not_found', discussionTopicNotFoundMessage);
        }

        return updated;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        if (isDiscussionTopicPlacementMissing(error)) {
          throw new ApiError('bad_request', discussionTopicPlacementMissingMessage);
        }

        throw error;
      }
    },
    deleteDiscussionTopic: async (actorUserId, tenantId, courseId, topicId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', discussionTopicStaffOnlyMessage);
      }

      const deleted = await deleteDiscussionTopicRecord(dbHandle.db, {
        tenantId,
        courseId,
        topicId,
      });

      if (!deleted) {
        throw new ApiError('not_found', discussionTopicNotFoundMessage);
      }
    },
    listDiscussionPosts: async (actorUserId, tenantId, courseId, topicId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const topic = await getDiscussionTopicForCourse(dbHandle.db, tenantId, courseId, topicId);

      if (!topic || !canViewDiscussionTopic(topic, canViewAllContent)) {
        throw new ApiError(
          'not_found',
          'Discussion topic was not found in this course. Check the topic id and retry the request.',
        );
      }

      const posts = await listDiscussionPostsForTopic(dbHandle.db, {
        tenantId,
        topicId,
        statuses: canViewAllContent ? allDiscussionPostStatuses : ['published', 'draft'],
      });

      const visiblePosts = posts.filter((post) =>
        canViewDiscussionPost(post, canViewAllContent, actorUserId),
      );

      if (
        topic.requirePostBeforeSeeingOthers &&
        !canViewAllContent &&
        !visiblePosts.some((post) => post.authorId === actorUserId && post.status === 'published')
      ) {
        return visiblePosts.filter((post) => post.authorId === actorUserId);
      }

      return visiblePosts;
    },
    createDiscussionPost: async (actorUserId, tenantId, courseId, topicId, input) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const topic = await getDiscussionTopicForCourse(dbHandle.db, tenantId, courseId, topicId);

      if (!topic || !canViewDiscussionTopic(topic, canViewAllContent)) {
        throw new ApiError('not_found', discussionTopicNotFoundMessage);
      }

      try {
        return await dbHandle.db.transaction(async (tx) => {
          const parentPostId = input.parentPostId
            ? DiscussionPostId.parse(input.parentPostId)
            : null;
          const status = input.status ?? 'published';
          const post = await createDiscussionPostRecord(tx, {
            tenantId,
            topicId,
            authorId: UserId.parse(actorUserId),
            parentPostId,
            body: input.body,
            status,
          });

          await subscribeToDiscussionTopicRecord(tx, {
            tenantId,
            topicId,
            userId: actorUserId,
          });

          if (parentPostId !== null && status === 'published') {
            await saveOutboxEvent(
              tx,
              buildDiscussionReplyCreatedEvent({
                tenantId,
                courseId,
                topicId,
                postId: post.id,
                parentPostId,
                authorId: actorUserId,
              }),
            );
          }

          return post;
        });
      } catch (error) {
        if (isDiscussionParentPostMissing(error)) {
          throw new ApiError('not_found', discussionParentPostNotFoundMessage);
        }

        throw error;
      }
    },
    subscribeToDiscussionTopic: async (actorUserId, tenantId, courseId, topicId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const topic = await getDiscussionTopicForCourse(dbHandle.db, tenantId, courseId, topicId);

      if (!topic || !canViewDiscussionTopic(topic, canViewAllContent)) {
        throw new ApiError('not_found', discussionTopicNotFoundMessage);
      }

      return subscribeToDiscussionTopicRecord(dbHandle.db, {
        tenantId,
        topicId,
        userId: actorUserId,
      });
    },
    unsubscribeFromDiscussionTopic: async (actorUserId, tenantId, courseId, topicId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const topic = await getDiscussionTopicForCourse(dbHandle.db, tenantId, courseId, topicId);

      if (!topic || !canViewDiscussionTopic(topic, canViewAllContent)) {
        throw new ApiError('not_found', discussionTopicNotFoundMessage);
      }

      await unsubscribeFromDiscussionTopicRecord(dbHandle.db, {
        tenantId,
        topicId,
        userId: actorUserId,
      });
    },
    updateDiscussionPost: async (actorUserId, tenantId, courseId, topicId, postId, input) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const isCourseStaff = hasTenantStaffAccess || hasCourseStaffAccess;
      const topic = await getDiscussionTopicForCourse(dbHandle.db, tenantId, courseId, topicId);

      if (!topic || !canViewDiscussionTopic(topic, isCourseStaff)) {
        throw new ApiError('not_found', discussionTopicNotFoundMessage);
      }

      const existing = await getDiscussionPostForTopic(dbHandle.db, tenantId, topicId, postId);

      if (!existing) {
        throw new ApiError('not_found', discussionPostNotFoundMessage);
      }

      if (!isCourseStaff && existing.authorId !== actorUserId) {
        throw new ApiError('forbidden', discussionPostAuthorOrStaffOnlyMessage);
      }

      const status = input.status ?? existing.status;
      const updateInput = {
        tenantId,
        topicId,
        postId,
        body: input.body,
        status,
      };

      let updated: DiscussionPost | null;
      if (existing.status === 'draft' && status === 'published' && existing.parentPostId !== null) {
        const parentPostId = existing.parentPostId;

        updated = await dbHandle.db.transaction(async (tx) => {
          const updatedPost = await updateDiscussionPostRecord(tx, updateInput);
          if (!updatedPost) {
            return null;
          }

          await saveOutboxEvent(
            tx,
            buildDiscussionReplyCreatedEvent({
              tenantId,
              courseId,
              topicId,
              postId: updatedPost.id,
              parentPostId,
              authorId: updatedPost.authorId,
            }),
          );

          return updatedPost;
        });
      } else {
        updated = await updateDiscussionPostRecord(dbHandle.db, updateInput);
      }

      if (!updated) {
        throw new ApiError('not_found', discussionPostNotFoundMessage);
      }

      return updated;
    },
    deleteDiscussionPost: async (actorUserId, tenantId, courseId, topicId, postId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const isCourseStaff = hasTenantStaffAccess || hasCourseStaffAccess;
      const topic = await getDiscussionTopicForCourse(dbHandle.db, tenantId, courseId, topicId);

      if (!topic || !canViewDiscussionTopic(topic, isCourseStaff)) {
        throw new ApiError('not_found', discussionTopicNotFoundMessage);
      }

      const existing = await getDiscussionPostForTopic(dbHandle.db, tenantId, topicId, postId);

      if (!existing) {
        throw new ApiError('not_found', discussionPostNotFoundMessage);
      }

      if (!isCourseStaff && existing.authorId !== actorUserId) {
        throw new ApiError('forbidden', discussionPostAuthorOrStaffOnlyMessage);
      }

      const deleted = await deleteDiscussionPostRecord(dbHandle.db, {
        tenantId,
        topicId,
        postId,
      });

      if (!deleted) {
        throw new ApiError('not_found', discussionPostNotFoundMessage);
      }
    },
    listDiscussionPostGrades: async (actorUserId, tenantId, courseId, topicId, studentId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const isCourseStaff = hasTenantStaffAccess || hasCourseStaffAccess;
      const topic = await getDiscussionTopicForCourse(dbHandle.db, tenantId, courseId, topicId);

      if (!topic || !canViewDiscussionTopic(topic, isCourseStaff)) {
        throw new ApiError('not_found', discussionTopicNotFoundMessage);
      }

      const effectiveStudentId = isCourseStaff ? studentId : actorUserId;
      const grades = await listDiscussionPostGradesForTopic(dbHandle.db, { tenantId, topicId });
      if (effectiveStudentId === undefined) {
        return grades;
      }
      return grades.filter(
        (grade) =>
          grade.studentId === effectiveStudentId &&
          (isCourseStaff || grade.status === 'published' || grade.status === 'revised'),
      );
    },
    upsertDiscussionPostGrade: async (actorUserId, tenantId, courseId, topicId, postId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can record discussion post grades. Ask an instructor for access.',
        );
      }

      const topic = await getDiscussionTopicForCourse(dbHandle.db, tenantId, courseId, topicId);
      if (!topic) {
        throw new ApiError('not_found', discussionTopicNotFoundMessage);
      }
      if (!topic.gradingEnabled) {
        throw new ApiError(
          'bad_request',
          'Discussion grading is not enabled for this topic. Enable grading on the topic first.',
        );
      }

      const post = await getDiscussionPostForTopic(dbHandle.db, tenantId, topicId, postId);
      if (!post) {
        throw new ApiError('not_found', discussionPostNotFoundMessage);
      }

      if (topic.pointsPossible !== null && input.maxScore > topic.pointsPossible) {
        throw new ApiError(
          'bad_request',
          'Grade max score cannot exceed the topic pointsPossible.',
        );
      }

      return upsertDiscussionPostGrade(dbHandle.db, {
        tenantId,
        topicId,
        postId,
        studentId: post.authorId,
        score: input.score,
        maxScore: input.maxScore,
        status: input.status,
        comment: input.comment,
        gradedByUserId: actorUserId,
      });
    },
    listGlossaryEntries: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const statuses: GlossaryEntryStatus[] = canViewAllContent
        ? ['draft', 'published', 'archived']
        : ['published'];

      return listGlossaryEntriesForCourse(dbHandle.db, { tenantId, courseId, statuses });
    },
    createGlossaryEntry: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', glossaryEntryStaffOnlyMessage);
      }

      try {
        return await createGlossaryEntryRecord(dbHandle.db, {
          tenantId,
          courseId,
          term: input.term,
          definition: input.definition,
          status: input.status,
        });
      } catch (error) {
        if (isGlossaryEntryTermDuplicate(error)) {
          throw new ApiError('conflict', glossaryEntryDuplicateTermMessage);
        }

        throw error;
      }
    },
    updateGlossaryEntry: async (actorUserId, tenantId, courseId, glossaryEntryId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', glossaryEntryStaffOnlyMessage);
      }

      try {
        const updated = await updateGlossaryEntryRecord(dbHandle.db, {
          tenantId,
          courseId,
          glossaryEntryId,
          term: input.term,
          definition: input.definition,
          status: input.status,
        });

        if (!updated) {
          throw new ApiError('not_found', glossaryEntryNotFoundMessage);
        }

        return updated;
      } catch (error) {
        if (isGlossaryEntryTermDuplicate(error)) {
          throw new ApiError('conflict', glossaryEntryDuplicateTermMessage);
        }

        throw error;
      }
    },
    deleteGlossaryEntry: async (actorUserId, tenantId, courseId, glossaryEntryId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', glossaryEntryStaffOnlyMessage);
      }

      const deleted = await deleteGlossaryEntryRecord(dbHandle.db, {
        tenantId,
        courseId,
        glossaryEntryId,
      });

      if (!deleted) {
        throw new ApiError('not_found', glossaryEntryNotFoundMessage);
      }
    },
    listWikiPages: async (actorUserId, tenantId, courseId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const statuses: WikiPageStatus[] = canViewAllContent
        ? ['draft', 'published', 'archived']
        : ['published'];

      return listWikiPagesForCourse(dbHandle.db, { tenantId, courseId, statuses });
    },
    createWikiPage: async (actorUserId, tenantId, courseId, input) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      try {
        return await createWikiPageRecord(dbHandle.db, {
          tenantId,
          courseId,
          slug: input.slug,
          title: input.title,
          content: input.content,
          status: input.status,
          learningObjectiveIds: input.learningObjectiveIds ?? [],
          createdById: UserId.parse(actorUserId),
        });
      } catch (error) {
        if (isWikiPageSlugDuplicate(error)) {
          throw new ApiError('conflict', wikiPageDuplicateSlugMessage);
        }

        throw error;
      }
    },
    updateWikiPage: async (actorUserId, tenantId, courseId, wikiPageId, input) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      const result = await updateWikiPageRecord(dbHandle.db, {
        tenantId,
        courseId,
        wikiPageId,
        authorId: actorUserId,
        title: input.title,
        content: input.content,
        status: input.status,
        learningObjectiveIds: input.learningObjectiveIds ?? [],
        summary: input.summary,
      });

      if (!result) {
        throw new ApiError('not_found', wikiPageNotFoundMessage);
      }

      return result.page;
    },
    deleteWikiPage: async (actorUserId, tenantId, courseId, wikiPageId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError(
          'forbidden',
          'Only course staff can delete wiki pages. Ask an instructor for access.',
        );
      }

      const deleted = await deleteWikiPageRecord(dbHandle.db, {
        tenantId,
        courseId,
        wikiPageId,
      });

      if (!deleted) {
        throw new ApiError('not_found', wikiPageNotFoundMessage);
      }
    },
    listWikiPageRevisions: async (actorUserId, tenantId, courseId, wikiPageId) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      const page = await getWikiPageForCourse(dbHandle.db, tenantId, courseId, wikiPageId);

      if (!page) {
        throw new ApiError('not_found', wikiPageNotFoundMessage);
      }

      return listWikiPageRevisionsForPage(dbHandle.db, { tenantId, wikiPageId });
    },
    getWikiPageRevisionDiff: async (
      actorUserId,
      tenantId,
      courseId,
      wikiPageId,
      baseRevision,
      targetRevision,
    ) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      const page = await getWikiPageForCourse(dbHandle.db, tenantId, courseId, wikiPageId);

      if (!page) {
        throw new ApiError('not_found', wikiPageNotFoundMessage);
      }

      const diff = await getWikiPageRevisionDiffRecord(dbHandle.db, {
        tenantId,
        wikiPageId,
        baseRevision,
        targetRevision,
      });

      if (!diff) {
        throw new ApiError('not_found', wikiPageRevisionNotFoundMessage);
      }

      return diff;
    },
    restoreWikiPageRevision: async (
      actorUserId,
      tenantId,
      courseId,
      wikiPageId,
      revision,
      input,
    ) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      const result = await restoreWikiPageRevisionRecord(dbHandle.db, {
        tenantId,
        courseId,
        wikiPageId,
        revision,
        authorId: actorUserId,
        summary: input.summary,
      });

      if (!result) {
        throw new ApiError('not_found', wikiPageRevisionNotFoundMessage);
      }

      return result.page;
    },
    listSurveys: async (actorUserId, tenantId, courseId) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      return listSurveysForCourse(dbHandle.db, { tenantId, courseId });
    },
    createSurvey: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', surveyStaffOnlyMessage);
      }

      try {
        return await createSurveyRecord(dbHandle.db, {
          tenantId,
          courseId,
          title: input.title,
          description: input.description,
          status: input.status,
          opensAt: input.opensAt,
          closesAt: input.closesAt,
          allowsAnonymousResponses: input.allowsAnonymousResponses,
        });
      } catch (error) {
        if (isSurveyCourseMissing(error)) {
          throw new ApiError('bad_request', surveyCourseMissingMessage);
        }

        throw error;
      }
    },
    updateSurvey: async (actorUserId, tenantId, courseId, surveyId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', surveyStaffOnlyMessage);
      }

      const updated = await updateSurveyRecord(dbHandle.db, {
        tenantId,
        courseId,
        surveyId,
        title: input.title,
        description: input.description,
        status: input.status,
        opensAt: input.opensAt,
        closesAt: input.closesAt,
        allowsAnonymousResponses: input.allowsAnonymousResponses,
      });

      if (!updated) {
        throw new ApiError('not_found', surveyNotFoundMessage);
      }

      return updated;
    },
    deleteSurvey: async (actorUserId, tenantId, courseId, surveyId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', surveyStaffOnlyMessage);
      }

      const deleted = await deleteSurveyRecord(dbHandle.db, {
        tenantId,
        courseId,
        surveyId,
      });

      if (!deleted) {
        throw new ApiError('not_found', surveyNotFoundMessage);
      }
    },
    listSurveyQuestions: async (actorUserId, tenantId, courseId, surveyId) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      const surveyRow = await getSurveyForCourse(dbHandle.db, tenantId, courseId, surveyId);

      if (!surveyRow) {
        throw new ApiError('not_found', surveyNotFoundMessage);
      }

      return listSurveyQuestionsForSurvey(dbHandle.db, { tenantId, surveyId });
    },
    createSurveyQuestion: async (actorUserId, tenantId, courseId, surveyId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', surveyQuestionStaffOnlyMessage);
      }

      const surveyRow = await getSurveyForCourse(dbHandle.db, tenantId, courseId, surveyId);

      if (!surveyRow) {
        throw new ApiError('not_found', surveyNotFoundMessage);
      }

      try {
        return await createSurveyQuestionRecord(dbHandle.db, {
          tenantId,
          surveyId,
          position: input.position,
          questionType: input.questionType,
          prompt: input.prompt,
          required: input.required,
          choices: input.choices,
        });
      } catch (error) {
        if (isSurveyQuestionPositionDuplicate(error)) {
          throw new ApiError('conflict', surveyQuestionDuplicatePositionMessage);
        }

        throw error;
      }
    },
    listSurveyResponses: async (actorUserId, tenantId, courseId, surveyId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', surveyResponseStaffOnlyMessage);
      }

      const surveyRow = await getSurveyForCourse(dbHandle.db, tenantId, courseId, surveyId);

      if (!surveyRow) {
        throw new ApiError('not_found', surveyNotFoundMessage);
      }

      return listSurveyResponsesForSurvey(dbHandle.db, { tenantId, surveyId });
    },
    submitSurveyResponse: async (actorUserId, tenantId, courseId, surveyId, input) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      const surveyRow = await getSurveyForCourse(dbHandle.db, tenantId, courseId, surveyId);

      if (!surveyRow) {
        throw new ApiError('not_found', surveyNotFoundMessage);
      }

      const question = await getSurveyQuestionForSurvey(
        dbHandle.db,
        tenantId,
        surveyId,
        input.surveyQuestionId,
      );

      if (!question) {
        throw new ApiError('bad_request', surveyResponseQuestionMissingMessage);
      }

      const respondentId = surveyRow.allowsAnonymousResponses ? null : actorUserId;

      return createSurveyResponseRecord(dbHandle.db, {
        tenantId,
        surveyId,
        surveyQuestionId: input.surveyQuestionId,
        respondentId,
        answer: input.answer,
      });
    },
    getCoursePage: async (actorUserId, tenantId, courseId, pageId) => {
      const { hasTenantStaffAccess, hasCourseStaffAccess } = await readCourseAccessContext(
        actorUserId,
        tenantId,
        courseId,
      );
      const canViewAllContent = hasTenantStaffAccess || hasCourseStaffAccess;
      const page = await getCoursePageForCourse(dbHandle.db, {
        tenantId,
        courseId,
        coursePageId: pageId,
      });

      if (!page || !canViewCoursePage(page, canViewAllContent)) {
        throw new ApiError(
          'not_found',
          'Course page was not found. Check the page id and retry the request.',
        );
      }
      const releaseVisibility = await readLearnerReleaseVisibilityIndex(
        actorUserId,
        tenantId,
        courseId,
        canViewAllContent,
      );

      if (!canAccessReleasedCoursePage(page, releaseVisibility)) {
        throw new ApiError(
          'not_found',
          'Course page was not found. Check the page id and retry the request.',
        );
      }

      return page;
    },
    listCalendarItems: async (actorUserId, tenantId, from, to) => {
      await assertTenantMembership(actorUserId, tenantId);

      return listCalendarItemsForUser(dbHandle.db, {
        tenantId,
        userId: actorUserId,
        from,
        to,
      });
    },
    exportCalendarIcs: async (actorUserId, tenantId, from, to) => {
      await assertTenantMembership(actorUserId, tenantId);

      const items = await listCalendarItemsForUser(dbHandle.db, {
        tenantId,
        userId: actorUserId,
        from,
        to,
      });

      return serializeCalendarItemsAsIcs(items);
    },
    listCourseCalendarEvents: async (actorUserId, tenantId, courseId) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      return listCourseCalendarEventsForCourse(dbHandle.db, { tenantId, courseId });
    },
    listCourseCalendarEventOccurrences: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
      const canViewAllContent = access.hasTenantStaffAccess || access.hasCourseStaffAccess;

      const events = await listCourseCalendarEventsForCourse(dbHandle.db, { tenantId, courseId });
      const visibleEvents = canViewAllContent
        ? events
        : events.filter((event) => event.visibility === 'published');

      const occurrences: CourseCalendarEventOccurrence[] = [];
      try {
        for (const event of visibleEvents) {
          const expanded = expandRecurrence({
            baseStartsAt: event.startsAt,
            baseEndsAt: event.endsAt,
            recurrenceRule: event.recurrenceRule,
            windowStart: input.windowStart,
            windowEnd: input.windowEnd,
          });
          for (const occurrence of expanded) {
            occurrences.push({
              eventId: CourseCalendarEventId.parse(event.id),
              tenantId: TenantId.parse(event.tenantId),
              courseId: CourseId.parse(event.courseId),
              title: event.title,
              description: event.description,
              location: event.location,
              visibility: event.visibility,
              occurrenceStartsAt: occurrence.startsAt,
              occurrenceEndsAt: occurrence.endsAt,
            });
          }
        }
      } catch (error) {
        if (error instanceof InvalidRecurrenceRuleError) {
          throw new ApiError('bad_request', error.message);
        }

        throw error;
      }

      occurrences.sort((a, b) => a.occurrenceStartsAt.getTime() - b.occurrenceStartsAt.getTime());

      return occurrences;
    },
    createCourseCalendarEvent: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', calendarEventStaffOnlyMessage);
      }

      try {
        return await createCourseCalendarEventRecord(dbHandle.db, {
          tenantId,
          courseId,
          title: input.title,
          description: input.description,
          location: input.location,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          visibility: input.visibility,
          recurrenceRule: input.recurrenceRule,
        });
      } catch (error) {
        if (isCalendarEventCourseMissing(error)) {
          throw new ApiError('bad_request', calendarEventCourseMissingMessage);
        }

        throw error;
      }
    },
    updateCourseCalendarEvent: async (actorUserId, tenantId, courseId, eventId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', calendarEventStaffOnlyMessage);
      }

      const updated = await updateCourseCalendarEventRecord(dbHandle.db, {
        tenantId,
        courseId,
        eventId,
        title: input.title,
        description: input.description,
        location: input.location,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        visibility: input.visibility,
        recurrenceRule: input.recurrenceRule,
      });

      if (!updated) {
        throw new ApiError('not_found', calendarEventNotFoundMessage);
      }

      return updated;
    },
    deleteCourseCalendarEvent: async (actorUserId, tenantId, courseId, eventId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', calendarEventStaffOnlyMessage);
      }

      const deleted = await deleteCourseCalendarEventRecord(dbHandle.db, {
        tenantId,
        courseId,
        eventId,
      });

      if (!deleted) {
        throw new ApiError('not_found', calendarEventNotFoundMessage);
      }
    },
    listCourseMeetings: async (actorUserId, tenantId, courseId) => {
      await readCourseAccessContext(actorUserId, tenantId, courseId);

      return listCourseMeetingsForCourse(dbHandle.db, { tenantId, courseId });
    },
    createCourseMeeting: async (actorUserId, tenantId, courseId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseMeetingStaffOnlyMessage);
      }

      try {
        return await createCourseMeetingRecord(dbHandle.db, {
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
        });
      } catch (error) {
        if (isCourseMeetingCourseMissing(error)) {
          throw new ApiError('bad_request', courseMeetingCourseMissingMessage);
        }

        throw error;
      }
    },
    updateCourseMeeting: async (actorUserId, tenantId, courseId, meetingId, input) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseMeetingStaffOnlyMessage);
      }

      const updated = await updateCourseMeetingRecord(dbHandle.db, {
        tenantId,
        courseId,
        meetingId,
        title: input.title,
        description: input.description,
        provider: input.provider,
        externalUrl: input.externalUrl,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        recordingUrl: input.recordingUrl,
        playbackUrl: input.playbackUrl,
        status: input.status,
      });

      if (!updated) {
        throw new ApiError('not_found', courseMeetingNotFoundMessage);
      }

      return updated;
    },
    deleteCourseMeeting: async (actorUserId, tenantId, courseId, meetingId) => {
      const access = await readCourseAccessContext(actorUserId, tenantId, courseId);

      if (!canViewCourseRoster(access)) {
        throw new ApiError('forbidden', courseMeetingStaffOnlyMessage);
      }

      const deleted = await deleteCourseMeetingRecord(dbHandle.db, {
        tenantId,
        courseId,
        meetingId,
      });

      if (!deleted) {
        throw new ApiError('not_found', courseMeetingNotFoundMessage);
      }
    },
    listNotifications: async (actorUserId, tenantId) => {
      await assertTenantMembership(actorUserId, tenantId);

      return listNotificationsForRecipient(dbHandle.db, tenantId, actorUserId);
    },
    listNotificationPreferences: async (actorUserId, tenantId) => {
      await assertTenantMembership(actorUserId, tenantId);

      return listNotificationPreferencesForUser(dbHandle.db, {
        tenantId,
        userId: actorUserId,
      });
    },
    upsertNotificationPreference: async (actorUserId, tenantId, input) => {
      await assertTenantMembership(actorUserId, tenantId);

      return upsertNotificationPreferenceRecord(dbHandle.db, {
        tenantId,
        userId: actorUserId,
        category: input.category,
        channel: input.channel,
        frequency: input.frequency,
      });
    },
    listMyPushTokens: async (actorUserId, tenantId) => {
      await assertTenantMembership(actorUserId, tenantId);

      return listUserPushTokens(dbHandle.db, { tenantId, userId: actorUserId });
    },
    registerMyPushToken: async (actorUserId, tenantId, input) => {
      await assertTenantMembership(actorUserId, tenantId);

      return registerUserPushToken(dbHandle.db, {
        tenantId,
        userId: actorUserId,
        platform: input.platform,
        token: input.token,
        locale: input.locale,
        appVersion: input.appVersion,
        lastUsedAt: new Date(),
      });
    },
    revokeMyPushToken: async (actorUserId, tenantId, tokenId) => {
      await assertTenantMembership(actorUserId, tenantId);

      const deleted = await revokeUserPushToken(dbHandle.db, {
        tenantId,
        userId: actorUserId,
        tokenId,
      });

      if (!deleted) {
        throw new ApiError(
          'not_found',
          'Push token was not found. Check the token id and retry the request.',
        );
      }
    },
    listFiles: async (actorUserId, tenantId, courseId) => {
      await assertTenantMembership(actorUserId, tenantId);

      if (courseId) {
        const access = await readCourseAccessContext(actorUserId, tenantId, courseId);
        const files = await listFileResourcesForCourse(dbHandle.db, tenantId, courseId);
        return canViewCourseRoster(access)
          ? files.filter((file) => file.ownerId === actorUserId || file.visibility !== 'private')
          : files.filter((file) => file.visibility === 'course_member');
      }

      return listFileResourcesForOwner(dbHandle.db, tenantId, actorUserId);
    },
    getFile: async (actorUserId, tenantId, fileId) => {
      await assertTenantMembership(actorUserId, tenantId);

      const file = await getFileResourceById(dbHandle.db, tenantId, fileId);

      if (!file) {
        throw new ApiError(
          'not_found',
          'File metadata was not found. Check the file id and retry the request.',
        );
      }

      if (file.ownerId !== actorUserId) {
        if (file.courseId === null) {
          throw new ApiError('forbidden', 'Only the file owner can access this private file.');
        }

        const access = await readCourseAccessContext(actorUserId, tenantId, file.courseId);
        if (file.visibility === 'private') {
          throw new ApiError('forbidden', 'Only the file owner can access this private file.');
        }
        if (file.visibility !== 'course_member' && !canViewCourseRoster(access)) {
          throw new ApiError('forbidden', 'Only course staff can access this course file.');
        }
      }

      return file;
    },
    uploadFile: async (actorUserId, tenantId, input) => {
      await assertTenantMembership(actorUserId, tenantId);

      if (input.courseId !== null) {
        const access = await readCourseAccessContext(actorUserId, tenantId, input.courseId);
        if (!canViewCourseRoster(access)) {
          throw new ApiError(
            'forbidden',
            'Only course staff can upload files to the course library. Ask an instructor for access.',
          );
        }
      }

      const normalizedBase64 = input.contentBase64.replace(/\s/g, '');
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalizedBase64) || normalizedBase64.length % 4 !== 0) {
        throw new ApiError(
          'bad_request',
          'File content must be valid base64. Re-encode and retry.',
        );
      }
      const bytes = Buffer.from(normalizedBase64, 'base64');

      if (bytes.length === 0) {
        throw new ApiError('bad_request', 'File content is empty. Choose a non-empty file.');
      }

      const tenant = await getTenantById(dbHandle.db, tenantId);
      if (!tenant) {
        throw new ApiError(
          'not_found',
          'Tenant was not found. Check the tenant id and retry the request.',
        );
      }

      if (tenant.storageByteLimit !== null) {
        const usage = await getFileStorageUsage(dbHandle.db, { tenantId });
        if (wouldExceedFileStorageQuota(usage.totalBytes, bytes.length, tenant.storageByteLimit)) {
          throw new ApiError('forbidden', tenantFileStorageQuotaExceededMessage);
        }
      }

      if (tenant.defaultUserStorageByteLimit !== null) {
        const usage = await getFileStorageUsage(dbHandle.db, { tenantId, ownerId: actorUserId });
        if (
          wouldExceedFileStorageQuota(
            usage.totalBytes,
            bytes.length,
            tenant.defaultUserStorageByteLimit,
          )
        ) {
          throw new ApiError('forbidden', userFileStorageQuotaExceededMessage);
        }
      }

      const checksumSha256 = createHash('sha256').update(bytes).digest('hex');
      const fileId = createFileResourceId();
      const stored = await fileStorage.upload({
        tenantId,
        fileResourceId: fileId,
        bytes,
      });

      try {
        return await createFileResource(dbHandle.db, {
          tenantId,
          id: fileId,
          courseId: input.courseId,
          ownerId: actorUserId,
          storageProvider: stored.storageProvider,
          storageKey: stored.storageKey,
          filename: input.filename,
          mediaType: input.mediaType,
          byteSize: bytes.length,
          checksumSha256,
          visibility: input.visibility,
          altText: input.altText,
          transcriptText: input.transcriptText,
          license: input.license,
          copyrightHolder: input.copyrightHolder,
        });
      } catch (error) {
        await fileStorage.delete(stored.storageKey);
        throw error;
      }
    },
    downloadFile: async (actorUserId, tenantId, fileId) => {
      await assertTenantMembership(actorUserId, tenantId);

      const file = await getFileResourceById(dbHandle.db, tenantId, fileId);

      if (!file) {
        throw new ApiError(
          'not_found',
          'File metadata was not found. Check the file id and retry the request.',
        );
      }

      if (file.ownerId !== actorUserId) {
        if (file.courseId === null) {
          throw new ApiError('forbidden', 'Only the file owner can download this private file.');
        }

        const access = await readCourseAccessContext(actorUserId, tenantId, file.courseId);
        if (file.visibility === 'private') {
          throw new ApiError('forbidden', 'Only the file owner can download this private file.');
        }
        if (file.visibility !== 'course_member' && !canViewCourseRoster(access)) {
          throw new ApiError('forbidden', 'Only course staff can download this course file.');
        }
      }

      const bytes = await fileStorage.download(file.storageKey);
      return { file, bytes };
    },
    deleteFile: async (actorUserId, tenantId, fileId) => {
      await assertTenantMembership(actorUserId, tenantId);

      const file = await getFileResourceById(dbHandle.db, tenantId, fileId);

      if (!file) {
        throw new ApiError(
          'not_found',
          'File metadata was not found. Check the file id and retry the request.',
        );
      }

      if (file.ownerId !== actorUserId) {
        if (file.courseId === null) {
          throw new ApiError('forbidden', 'Only the file owner can delete this private file.');
        }

        const access = await readCourseAccessContext(actorUserId, tenantId, file.courseId);
        if (!canViewCourseRoster(access)) {
          throw new ApiError(
            'forbidden',
            'Only course staff can delete files from the course library.',
          );
        }
      }

      const deleted = await deleteFileResourceForOwner(dbHandle.db, {
        tenantId,
        ownerId: file.ownerId,
        fileResourceId: fileId,
      });

      if (!deleted) {
        throw new ApiError(
          'not_found',
          'File metadata was not found. Check the file id and retry the request.',
        );
      }

      await fileStorage.delete(file.storageKey);
    },
    markNotificationRead: async (actorUserId, tenantId, notificationId) => {
      await assertTenantMembership(actorUserId, tenantId);

      const notification = await markNotificationReadForRecipient(dbHandle.db, {
        tenantId,
        recipientId: actorUserId,
        notificationId,
        readAt: new Date(),
      });

      if (!notification) {
        throw new ApiError(
          'not_found',
          'Notification was not found. Check the notification id and retry the request.',
        );
      }

      return notification;
    },
    listModuleReleaseRules: async (
      actorUserId,
      tenantId,
      courseId,
      moduleId,
      targetType,
      targetId,
    ) => {
      await assertReleaseStaffPermission(actorUserId, tenantId, courseId);
      await assertModuleBelongsToCourse(dbHandle.db, tenantId, courseId, moduleId);
      return listReleaseRulesForModule(dbHandle.db, { tenantId, moduleId, targetType, targetId });
    },
    createModuleReleaseRule: async (actorUserId, tenantId, courseId, moduleId, input) => {
      await assertReleaseStaffPermission(actorUserId, tenantId, courseId);
      await assertModuleBelongsToCourse(dbHandle.db, tenantId, courseId, moduleId);
      await assertReleaseRuleTargetBelongsToModule(tenantId, courseId, moduleId, input);
      return createReleaseRule(dbHandle.db, {
        tenantId,
        courseId,
        moduleId,
        targetType: input.targetType,
        targetId: input.targetId,
        ruleType: input.ruleType,
        config: input.config,
        position: input.position,
        status: input.status,
      });
    },
    updateModuleReleaseRule: async (actorUserId, tenantId, courseId, moduleId, ruleId, input) => {
      await assertReleaseStaffPermission(actorUserId, tenantId, courseId);
      await assertModuleBelongsToCourse(dbHandle.db, tenantId, courseId, moduleId);
      await assertReleaseRuleTargetBelongsToModule(tenantId, courseId, moduleId, input);
      try {
        return await updateReleaseRule(dbHandle.db, {
          tenantId,
          courseId,
          moduleId,
          ruleId,
          targetType: input.targetType,
          targetId: input.targetId,
          ruleType: input.ruleType,
          config: input.config,
          position: input.position,
          status: input.status,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith('Module release rule could not be updated')
        ) {
          throw new ApiError(
            'not_found',
            'Release rule was not found. Check the rule id and retry the request.',
          );
        }
        throw error;
      }
    },
    deleteModuleReleaseRule: async (actorUserId, tenantId, courseId, moduleId, ruleId) => {
      await assertReleaseStaffPermission(actorUserId, tenantId, courseId);
      await assertModuleBelongsToCourse(dbHandle.db, tenantId, courseId, moduleId);
      const deleted = await deleteReleaseRule(dbHandle.db, {
        tenantId,
        courseId,
        moduleId,
        ruleId,
      });
      if (!deleted) {
        throw new ApiError(
          'not_found',
          'Release rule was not found. Check the rule id and retry the request.',
        );
      }
    },
    upsertModuleReleasePolicy: async (actorUserId, tenantId, courseId, moduleId, combinator) => {
      await assertReleaseStaffPermission(actorUserId, tenantId, courseId);
      await assertModuleBelongsToCourse(dbHandle.db, tenantId, courseId, moduleId);
      return upsertReleasePolicyRecord(dbHandle.db, {
        tenantId,
        courseId,
        moduleId,
        combinator,
      });
    },
    getModuleReleasePolicy: async (actorUserId, tenantId, courseId, moduleId) => {
      await assertReleaseStaffPermission(actorUserId, tenantId, courseId);
      await assertModuleBelongsToCourse(dbHandle.db, tenantId, courseId, moduleId);
      const policy = await getReleasePolicyRecord(dbHandle.db, { tenantId, moduleId });
      if (!policy) {
        throw new ApiError(
          'not_found',
          'No explicit release policy is set for this module. The default combinator is "all".',
        );
      }
      return policy;
    },
    listModuleReleaseOverrides: async (actorUserId, tenantId, courseId, moduleId) => {
      await assertReleaseStaffPermission(actorUserId, tenantId, courseId);
      await assertModuleBelongsToCourse(dbHandle.db, tenantId, courseId, moduleId);
      return listReleaseOverridesForModule(dbHandle.db, { tenantId, moduleId });
    },
    upsertModuleReleaseOverride: async (
      actorUserId,
      tenantId,
      courseId,
      moduleId,
      studentId,
      input,
    ) => {
      await assertReleaseStaffPermission(actorUserId, tenantId, courseId);
      await assertModuleBelongsToCourse(dbHandle.db, tenantId, courseId, moduleId);
      return upsertReleaseOverride(dbHandle.db, {
        tenantId,
        courseId,
        moduleId,
        studentId,
        state: input.state,
        reason: input.reason,
        grantedByUserId: actorUserId,
        expiresAt: input.expiresAt,
      });
    },
    removeModuleReleaseOverride: async (actorUserId, tenantId, courseId, moduleId, studentId) => {
      await assertReleaseStaffPermission(actorUserId, tenantId, courseId);
      await assertModuleBelongsToCourse(dbHandle.db, tenantId, courseId, moduleId);
      await removeReleaseOverride(dbHandle.db, { tenantId, courseId, moduleId, studentId });
    },
    getMyModuleReleaseStatus: async (actorUserId, tenantId, courseId) => {
      await assertReleaseViewPermission(actorUserId, tenantId, courseId, actorUserId);
      const dependencies = buildReleaseStatusDependencies();
      return evaluateCourseReleases(dependencies, {
        tenantId: tenantId as TenantId,
        courseId: courseId as CourseId,
        studentId: actorUserId as UserId,
        now: new Date(),
      });
    },
    getStudentModuleReleaseStatus: async (actorUserId, tenantId, courseId, studentId) => {
      await assertReleaseViewPermission(actorUserId, tenantId, courseId, studentId);
      const dependencies = buildReleaseStatusDependencies();
      return evaluateCourseReleases(dependencies, {
        tenantId: tenantId as TenantId,
        courseId: courseId as CourseId,
        studentId: studentId as UserId,
        now: new Date(),
      });
    },
    close: () => dbHandle.close(),
  };
};

const anonymousAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const stringHash = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return hash;
};

const formatAnonymousLabel = (sequence: number): string => {
  if (sequence < anonymousAlphabet.length) {
    return `Student ${anonymousAlphabet[sequence]}`;
  }
  const high = Math.floor(sequence / anonymousAlphabet.length) - 1;
  const low = sequence % anonymousAlphabet.length;
  return `Student ${anonymousAlphabet[high]}${anonymousAlphabet[low]}`;
};

const applyAnonymousLabels = <T extends { studentId: string; anonymousLabel: string | null }>(
  submissions: T[],
): AssignmentSubmissionListItem[] => {
  const ordered = [...submissions].sort((left, right) => {
    const leftHash = stringHash(left.studentId);
    const rightHash = stringHash(right.studentId);
    if (leftHash !== rightHash) return leftHash - rightHash;
    return left.studentId.localeCompare(right.studentId);
  });
  const labelByStudentId = new Map<string, string>();
  for (let index = 0; index < ordered.length; index += 1) {
    const submission = ordered[index];
    if (!submission || labelByStudentId.has(submission.studentId)) continue;
    labelByStudentId.set(submission.studentId, formatAnonymousLabel(labelByStudentId.size));
  }
  return submissions.map((submission) => ({
    ...submission,
    studentId: null,
    anonymousLabel: labelByStudentId.get(submission.studentId) ?? null,
  }));
};

const toProviderConfigSummary = (config: {
  id: string;
  tenantId: string;
  providerType: AiProviderType;
  baseUrl: string | null;
  modelPreferences: ModelPreferences;
  capabilities: ProviderCapabilities;
  quota: ProviderQuota;
  validationStatus: ProviderConfigSummary['validationStatus'];
  validationError: string | null;
  validatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ProviderConfigSummary =>
  ProviderConfigSummarySchema.parse({
    id: config.id,
    tenantId: config.tenantId,
    providerType: config.providerType,
    baseUrl: config.baseUrl,
    modelPreferences: config.modelPreferences,
    capabilities: config.capabilities,
    quota: config.quota,
    validationStatus: config.validationStatus,
    validationError: config.validationError,
    validatedAt: config.validatedAt,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  });

const assertModuleBelongsToCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  moduleId: string,
): Promise<void> => {
  const modules = await listCourseModules(db, { tenantId, courseId });
  if (!modules.some((module) => module.id === moduleId)) {
    throw new ApiError(
      'not_found',
      'Course module was not found. Check the module id and retry the request.',
    );
  }
};
