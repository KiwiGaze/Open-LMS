import { createApiApp } from './app.ts';
import type { ApiDependencies } from './dependencies.ts';
import {
  type OpenApiDocumentWithSchemas,
  applyBearerAuthSecurityScheme,
  applyDateTimeFormats,
  openApiDocumentBase,
} from './openapi-document.ts';

const emptyDependencies: ApiDependencies = {
  authHandler: null,
  getSessionByToken: async () => null,
  createInitialTenant: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  getCurrentUser: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCurrentUser: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCurrentUser: async () => {},
  listMyTenantMemberships: async () => [],
  listMyCourseMemberships: async () => [],
  listTenants: async () => [],
  updateTenantFileStorageQuotas: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listTenantMembers: async () => [],
  listTenantMessageableUsers: async () => [],
  listTenantFeatureFlags: async () => [],
  listWebhookSubscriptions: async () => [],
  createWebhookSubscription: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateWebhookSubscription: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteWebhookSubscription: async () => {},
  listUserLegalHolds: async () => [],
  createUserLegalHold: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  releaseUserLegalHold: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listRetentionPolicies: async () => [],
  upsertRetentionPolicy: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  upsertTenantFeatureFlag: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteTenantFeatureFlag: async () => {},
  listAiActions: async () => [],
  listAuditLogs: async () => [],
  exportAuditLogsCsv: async () => '',
  ingestXapiStatement: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  getProviderConfig: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listMyConsents: async () => [],
  listMyCredentialAwards: async () => [],
  recordMyConsent: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  upsertProviderConfig: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteProviderConfig: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  getLti1p3JsonWebKeySet: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  authorizeLti1p3OidcLaunch: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  getAiUsageSummary: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listAiUsageByAction: async () => [],
  listAiUsageByActor: async () => [],
  updateTenantMembership: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCourseFavorites: async () => [],
  favoriteCourse: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  unfavoriteCourse: async () => {},
  listCourses: async () => [],
  listCatalogCourses: async () => [],
  getCourseNextPosition: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  reorderCourseContent: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  copyCourse: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  exportCourseBackup: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  exportCourseCommonCartridge: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  importCourseCommonCartridge: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  getCourseAnalyticsSummary: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  restoreCourseBackup: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCourseCatalogSettings: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  createCourse: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCourse: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCourse: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  restoreDeletedCourse: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listRubrics: async () => [],
  getRubric: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  createRubric: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateRubric: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteRubric: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCourseSections: async () => [],
  createCourseSection: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCourseSection: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCourseSection: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCourseAnnouncements: async () => [],
  createCourseAnnouncement: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCourseAnnouncement: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCourseAnnouncement: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCourseMemberships: async () => [],
  listMessageableUsers: async () => [],
  createCourseMembership: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCourseMembership: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCourseMembership: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  selfEnrollInCourse: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listAssignments: async () => [],
  createAssignment: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateAssignment: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteAssignment: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listAssignmentOverrides: async () => [],
  createAssignmentOverride: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteAssignmentOverride: async () => {},
  updateAssignmentOverride: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  getAssignmentEffectiveSchedule: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  getAssignmentRubric: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listQuizzes: async () => [],
  createQuiz: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateQuiz: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteQuiz: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listQuizQuestions: async () => [],
  createQuizQuestion: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  exportQuizQtiItems: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  importQuizQtiItems: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listQuizAttempts: async () => [],
  listQuizAggregateGrades: async () => [],
  listQuizOverrides: async () => [],
  createQuizOverride: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateQuizOverride: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteQuizOverride: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  getQuizEffectiveSettings: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listQuizAttemptQuestionGrades: async () => [],
  recordQuizAttemptQuestionGrade: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  regradeQuizAttempt: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  startQuizAttempt: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  submitQuizAttempt: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listQuizAttemptResponses: async () => [],
  saveQuizAttemptResponse: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listQuestionBanks: async () => [],
  createQuestionBank: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateQuestionBank: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteQuestionBank: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listQuestionBankQuestions: async () => [],
  createQuestionBankQuestion: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listAttendanceSessions: async () => [],
  createAttendanceSession: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listAttendanceRecords: async () => [],
  recordAttendanceRecord: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCompletionRequirements: async () => [],
  createCompletionRequirement: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCompletionProgress: async () => [],
  listCredentials: async () => [],
  createCourseCredential: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCourseCredential: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCourseCredential: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCredentialAwards: async () => [],
  createCredentialAward: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listConversationThreads: async () => [],
  createConversationThread: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listConversationMessages: async () => [],
  createConversationMessage: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCourseGroupSets: async () => [],
  createCourseGroupSet: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCourseGroupSet: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCourseGroupSet: async () => {},
  listCourseGroups: async () => [],
  createCourseGroup: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCourseGroup: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCourseGroup: async () => {},
  listCourseGroupMembers: async () => [],
  createCourseGroupMember: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  joinCourseGroup: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  leaveCourseGroup: async () => {},
  listAssignmentSubmissions: async () => [],
  upsertSubmissionGrade: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  saveAssignmentDraft: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  submitAssignmentDraft: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listAssignmentPeerReviews: async () => [],
  listSubmissionAttachments: async () => [],
  createSubmissionAttachment: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  downloadSubmissionAttachment: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listSubmissionComments: async () => [],
  createSubmissionComment: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listGradebookEntries: async () => [],
  exportGradebookCsv: async () => '',
  listCourseFinalGrades: async () => [],
  exportCourseFinalGradesCsv: async () => '',
  submitCourseFinalGradesToSis: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listSubmissionGradeHistory: async () => [],
  createGradeAppeal: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listGradeAppeals: async () => [],
  updateGradeAppeal: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listGradebookManualItems: async () => [],
  createGradebookManualItem: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateGradebookManualItem: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteGradebookManualItem: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listGradebookManualGrades: async () => [],
  saveGradebookManualGrade: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listGradebookCategories: async () => [],
  createGradebookCategory: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateGradebookCategory: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteGradebookCategory: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCourseGradingSchemes: async () => [],
  createCourseGradingScheme: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCourseExternalTools: async () => [],
  launchCourseExternalToolLti1p3: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  launchCourseExternalToolLti1p3DeepLinking: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  createCourseExternalToolLti1p3LaunchAuthorizationResponse: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  processLti1p3DeepLinkingReturn: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  createLti1p3ServiceAccessToken: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  getLti1p3NamesRolesMemberships: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  publishLti1p3AgsScore: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listLti1p3AgsResults: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  createCourseExternalTool: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCourseExternalTool: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCourseExternalTool: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  recordCourseExternalToolOutcome: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCourseExternalToolOutcomes: async () => [],
  recordSubmissionPlagiarismReport: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listSubmissionPlagiarismReports: async () => [],
  listMyPushTokens: async () => [],
  registerMyPushToken: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  revokeMyPushToken: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCourseModules: async () => [],
  createCourseModule: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCourseModule: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCourseModule: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCourseUnits: async () => [],
  createCourseUnit: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCourseUnit: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCourseUnit: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCourseResources: async () => [],
  createCourseResource: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCourseResource: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCourseResource: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listLearningObjectives: async () => [],
  getLearningObjectiveCoverage: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  createLearningObjective: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateLearningObjective: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteLearningObjective: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listLearningObjectiveMastery: async () => [],
  listCoursePages: async () => [],
  createCoursePage: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCoursePage: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCoursePage: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  getCourseSyllabus: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  upsertCourseSyllabus: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listDiscussionTopics: async () => [],
  createDiscussionTopic: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateDiscussionTopic: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteDiscussionTopic: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listDiscussionPosts: async () => [],
  createDiscussionPost: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  subscribeToDiscussionTopic: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  unsubscribeFromDiscussionTopic: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateDiscussionPost: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteDiscussionPost: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listGlossaryEntries: async () => [],
  createGlossaryEntry: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateGlossaryEntry: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteGlossaryEntry: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listWikiPages: async () => [],
  createWikiPage: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateWikiPage: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteWikiPage: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listWikiPageRevisions: async () => [],
  getWikiPageRevisionDiff: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  restoreWikiPageRevision: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listSurveys: async () => [],
  createSurvey: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateSurvey: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteSurvey: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listSurveyQuestions: async () => [],
  createSurveyQuestion: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listSurveyResponses: async () => [],
  submitSurveyResponse: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  getCoursePage: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCalendarItems: async () => [],
  exportCalendarIcs: async () => '',
  listCourseCalendarEvents: async () => [],
  listCourseCalendarEventOccurrences: async () => [],
  createCourseCalendarEvent: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCourseCalendarEvent: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCourseCalendarEvent: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listCourseMeetings: async () => [],
  createCourseMeeting: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateCourseMeeting: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteCourseMeeting: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listNotifications: async () => [],
  listNotificationPreferences: async () => [],
  upsertNotificationPreference: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listFiles: async () => [],
  getFile: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  uploadFile: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  downloadFile: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteFile: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  markNotificationRead: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
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
  createInboxThread: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listInboxThreadMessages: async () => [],
  createInboxThreadMessage: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  recordResourceView: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listResourceViews: async () => [],
  listScormPackages: async () => [],
  createScormPackage: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  upsertScormAttempt: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  initializeScormRuntime: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  commitScormRuntime: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  finishScormRuntime: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listPeerReviewResponses: async () => [],
  upsertPeerReviewResponse: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listSectionMembers: async () => [],
  listSectionInstructors: async () => [],
  assignSectionMember: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  assignSectionInstructor: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  removeSectionMember: async () => undefined,
  removeSectionInstructor: async () => undefined,
  listDiscussionPostGrades: async () => [],
  upsertDiscussionPostGrade: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listModuleReleaseRules: async () => [],
  createModuleReleaseRule: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  updateModuleReleaseRule: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  deleteModuleReleaseRule: async () => undefined,
  upsertModuleReleasePolicy: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  getModuleReleasePolicy: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  listModuleReleaseOverrides: async () => [],
  upsertModuleReleaseOverride: async () => {
    throw new Error('OpenAPI generation does not execute dependencies.');
  },
  removeModuleReleaseOverride: async () => undefined,
  getMyModuleReleaseStatus: async () => [],
  getStudentModuleReleaseStatus: async () => [],
  close: async () => undefined,
};

export type OpenLmsOpenApiDocument = ReturnType<
  ReturnType<typeof createApiApp>['getOpenAPIDocument']
>;

export const generateOpenApiDocument = (): OpenLmsOpenApiDocument => {
  const app = createApiApp({ dependencies: emptyDependencies });

  const document = app.getOpenAPIDocument(openApiDocumentBase);

  applyBearerAuthSecurityScheme(document as OpenApiDocumentWithSchemas);
  applyDateTimeFormats(document as OpenApiDocumentWithSchemas);

  return document;
};
