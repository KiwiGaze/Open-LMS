import { OpenAPIHono } from '@hono/zod-openapi';
import {
  type AuditCategory,
  FileMetadata,
  type FileMetadata as FileMetadataContract,
  type FileResource,
} from '@openlms/contracts';
import { buildScormRuntimeBridgeScript } from '@openlms/core';
import type { ApiDependencies } from './dependencies.ts';
import { ApiError, errorResponseBody, statusCodeForError } from './http-error.ts';
import {
  type OpenApiDocumentWithSchemas,
  applyBearerAuthSecurityScheme,
  applyDateTimeFormats,
  openApiDocumentBase,
} from './openapi-document.ts';
import { type HttpRateLimitOptions, createHttpRateLimitMiddleware } from './rate-limit.ts';
import {
  getAiUsageSummaryRoute,
  listAiActionsRoute,
  listAiUsageByActionRoute,
} from './routes/ai-usage.ts';
import {
  createCourseAnnouncementsRoute,
  deleteCourseAnnouncementRoute,
  listCourseAnnouncementsRoute,
  updateCourseAnnouncementRoute,
} from './routes/announcements.ts';
import {
  createAssignmentOverrideRoute,
  deleteAssignmentOverrideRoute,
  listAssignmentOverridesRoute,
  updateAssignmentOverrideRoute,
} from './routes/assignment-overrides.ts';
import {
  listAssignmentPeerReviewsRoute,
  listPeerReviewResponsesRoute,
  upsertPeerReviewResponseRoute,
} from './routes/assignment-peer-reviews.ts';
import { getAssignmentRubricRoute } from './routes/assignment-rubrics.ts';
import {
  listAssignmentSubmissionsRoute,
  saveAssignmentDraftRoute,
  submitAssignmentDraftRoute,
} from './routes/assignment-submissions.ts';
import {
  createAssignmentRoute,
  deleteAssignmentRoute,
  getAssignmentEffectiveScheduleRoute,
  listAssignmentsRoute,
  updateAssignmentRoute,
} from './routes/assignments.ts';
import {
  createAttendanceSessionRoute,
  listAttendanceRecordsRoute,
  listAttendanceSessionsRoute,
  recordAttendanceRecordRoute,
} from './routes/attendance.ts';
import { exportAuditLogsRoute, listAuditLogsRoute } from './routes/audit-logs.ts';
import { exportCalendarIcsRoute, listCalendarItemsRoute } from './routes/calendar-items.ts';
import { listCatalogCoursesRoute } from './routes/catalog.ts';
import {
  exportCourseCommonCartridgeRoute,
  importCourseCommonCartridgeRoute,
} from './routes/common-cartridge.ts';
import {
  createCompletionRequirementRoute,
  listCompletionProgressRoute,
  listCompletionRequirementsRoute,
} from './routes/completion.ts';
import { getCourseAnalyticsSummaryRoute } from './routes/course-analytics.ts';
import { exportCourseBackupRoute } from './routes/course-backup.ts';
import {
  createCourseCalendarEventRoute,
  deleteCourseCalendarEventRoute,
  listCourseCalendarEventOccurrencesRoute,
  listCourseCalendarEventsRoute,
  updateCourseCalendarEventRoute,
} from './routes/course-calendar-events.ts';
import {
  createCourseModuleRoute,
  createCoursePageRoute,
  createCourseResourceRoute,
  createCourseUnitRoute,
  createLearningObjectiveRoute,
  deleteCourseModuleRoute,
  deleteCoursePageRoute,
  deleteCourseResourceRoute,
  deleteCourseUnitRoute,
  deleteLearningObjectiveRoute,
  getCoursePageRoute,
  getCourseSyllabusRoute,
  getLearningObjectiveCoverageRoute,
  listCourseModulesRoute,
  listCoursePagesRoute,
  listCourseResourcesRoute,
  listCourseUnitsRoute,
  listLearningObjectiveMasteryRoute,
  listLearningObjectivesRoute,
  updateCourseModuleRoute,
  updateCoursePageRoute,
  updateCourseResourceRoute,
  updateCourseUnitRoute,
  updateLearningObjectiveRoute,
  upsertCourseSyllabusRoute,
} from './routes/course-content.ts';
import { copyCourseRoute } from './routes/course-copy.ts';
import {
  createCourseExternalToolLti1p3LaunchAuthorizationResponseRoute,
  createCourseExternalToolRoute,
  deleteCourseExternalToolRoute,
  launchCourseExternalToolLti1p3DeepLinkingRoute,
  launchCourseExternalToolLti1p3Route,
  listCourseExternalToolsRoute,
  updateCourseExternalToolRoute,
} from './routes/course-external-tools.ts';
import {
  favoriteCourseRoute,
  listCourseFavoritesRoute,
  unfavoriteCourseRoute,
} from './routes/course-favorites.ts';
import {
  createCourseMeetingRoute,
  deleteCourseMeetingRoute,
  listCourseMeetingsRoute,
  updateCourseMeetingRoute,
} from './routes/course-meetings.ts';
import {
  bulkDeleteCourseMembershipsRoute,
  bulkEnrollInCourseRoute,
  createCourseMembershipRoute,
  deleteCourseMembershipRoute,
  exportCourseRosterCsvRoute,
  importCourseRosterCsvRoute,
  listCourseMembershipsRoute,
  listMessageableUsersRoute,
  selfEnrollInCourseRoute,
  updateCourseMembershipRoute,
} from './routes/course-memberships.ts';
import { getCourseNextPositionRoute } from './routes/course-next-position.ts';
import { reorderCourseContentRoute } from './routes/course-reorder.ts';
import { restoreCourseBackupRoute } from './routes/course-restore.ts';
import {
  createCourseSectionRoute,
  deleteCourseSectionRoute,
  listCourseSectionsRoute,
  updateCourseSectionRoute,
} from './routes/course-sections.ts';
import {
  createCourseRoute,
  deleteCourseRoute,
  listCoursesRoute,
  restoreDeletedCourseRoute,
  updateCourseCatalogSettingsRoute,
  updateCourseRoute,
} from './routes/courses.ts';
import {
  createCourseCredentialRoute,
  createCredentialAwardRoute,
  deleteCourseCredentialRoute,
  listCredentialAwardsRoute,
  listCredentialsRoute,
  updateCourseCredentialRoute,
} from './routes/credentials.ts';
import {
  createDiscussionPostRoute,
  createDiscussionTopicRoute,
  deleteDiscussionPostRoute,
  deleteDiscussionTopicRoute,
  listDiscussionPostGradesRoute,
  listDiscussionPostsRoute,
  listDiscussionTopicsRoute,
  subscribeDiscussionTopicRoute,
  unsubscribeDiscussionTopicRoute,
  updateDiscussionPostRoute,
  updateDiscussionTopicRoute,
  upsertDiscussionPostGradeRoute,
} from './routes/discussions.ts';
import {
  deleteTenantFeatureFlagRoute,
  listTenantFeatureFlagsRoute,
  upsertTenantFeatureFlagRoute,
} from './routes/feature-flags.ts';
import {
  deleteFileRoute,
  downloadFileRoute,
  getFileRoute,
  listFilesRoute,
  uploadFileRoute,
} from './routes/files.ts';
import {
  createGlossaryEntryRoute,
  deleteGlossaryEntryRoute,
  listGlossaryEntriesRoute,
  updateGlossaryEntryRoute,
} from './routes/glossary.ts';
import {
  createCourseGradingSchemeRoute,
  createGradeAppealRoute,
  createGradebookCategoryRoute,
  createGradebookManualItemRoute,
  deleteGradebookCategoryRoute,
  deleteGradebookManualItemRoute,
  exportCourseFinalGradesRoute,
  exportDiscussionGradebookRoute,
  exportGradebookRoute,
  listCourseFinalGradesRoute,
  listCourseGradingSchemesRoute,
  listDiscussionGradebookEntriesRoute,
  listGradeAppealsRoute,
  listGradebookCategoriesRoute,
  listGradebookEntriesRoute,
  listGradebookManualGradesRoute,
  listGradebookManualItemsRoute,
  listSubmissionGradeHistoryRoute,
  saveGradebookManualGradeRoute,
  submitCourseFinalGradesToSisRoute,
  updateGradeAppealRoute,
  updateGradebookCategoryRoute,
  updateGradebookManualItemRoute,
} from './routes/gradebook.ts';
import {
  createCourseGroupMemberRoute,
  createCourseGroupRoute,
  createCourseGroupSetRoute,
  deleteCourseGroupRoute,
  deleteCourseGroupSetRoute,
  joinCourseGroupRoute,
  leaveCourseGroupRoute,
  listCourseGroupMembersRoute,
  listCourseGroupSetsRoute,
  listCourseGroupsRoute,
  updateCourseGroupRoute,
  updateCourseGroupSetRoute,
} from './routes/groups.ts';
import { healthRoute } from './routes/health.ts';
import {
  createUserLegalHoldRoute,
  listUserLegalHoldsRoute,
  releaseUserLegalHoldRoute,
} from './routes/legal-holds.ts';
import {
  listCourseExternalToolOutcomesRoute,
  recordCourseExternalToolOutcomeRoute,
} from './routes/lti-outcomes.ts';
import {
  authorizeLti1p3OidcLaunchRoute,
  createLti1p3ServiceAccessTokenRoute,
  getLti1p3JsonWebKeySetRoute,
  getLti1p3NamesRolesMembershipsRoute,
  listLti1p3AgsResultsRoute,
  processLti1p3DeepLinkingReturnRoute,
  publishLti1p3AgsScoreRoute,
} from './routes/lti.ts';
import {
  deleteCurrentUserRoute,
  getCurrentUserRoute,
  listMyCourseMembershipsRoute,
  listMyTenantMembershipsRoute,
  updateCurrentUserRoute,
} from './routes/me.ts';
import {
  createConversationMessageRoute,
  createConversationThreadRoute,
  createInboxThreadMessageRoute,
  createInboxThreadRoute,
  listConversationMessagesRoute,
  listConversationThreadsRoute,
  listInboxThreadMessagesRoute,
  listInboxThreadsRoute,
} from './routes/messaging.ts';
import {
  createModuleReleaseRuleRoute,
  deleteModuleReleaseRuleRoute,
  getModuleReleasePolicyRoute,
  getMyModuleReleaseStatusRoute,
  getStudentModuleReleaseStatusRoute,
  listModuleReleaseOverridesRoute,
  listModuleReleaseRulesRoute,
  removeModuleReleaseOverrideRoute,
  updateModuleReleaseRuleRoute,
  upsertModuleReleaseOverrideRoute,
  upsertModuleReleasePolicyRoute,
} from './routes/module-release.ts';
import {
  listNotificationPreferencesRoute,
  listNotificationsRoute,
  markNotificationReadRoute,
  upsertNotificationPreferenceRoute,
} from './routes/notifications.ts';
import { createInitialTenantRoute } from './routes/onboarding.ts';
import {
  listSubmissionPlagiarismReportsRoute,
  recordSubmissionPlagiarismReportRoute,
} from './routes/plagiarism.ts';
import { getProviderConfigRoute } from './routes/provider-configs.ts';
import {
  listMyPushTokensRoute,
  registerMyPushTokenRoute,
  revokeMyPushTokenRoute,
} from './routes/push-tokens.ts';
import {
  StartQuizAttemptBody,
  createQuestionBankQuestionRoute,
  createQuestionBankRoute,
  createQuizOverrideRoute,
  createQuizQuestionRoute,
  createQuizRoute,
  deleteQuestionBankRoute,
  deleteQuizOverrideRoute,
  deleteQuizRoute,
  exportQuizQtiItemsRoute,
  getQuizEffectiveSettingsRoute,
  importQuizQtiItemsRoute,
  listQuestionBankQuestionsRoute,
  listQuestionBanksRoute,
  listQuizAggregateGradesRoute,
  listQuizAttemptQuestionGradesRoute,
  listQuizAttemptResponsesRoute,
  listQuizAttemptsRoute,
  listQuizOverridesRoute,
  listQuizQuestionsRoute,
  listQuizzesRoute,
  recordQuizAttemptQuestionGradeRoute,
  regradeQuizAttemptRoute,
  saveQuizAttemptResponseRoute,
  startQuizAttemptRoute,
  submitQuizAttemptRoute,
  updateQuestionBankRoute,
  updateQuizOverrideRoute,
  updateQuizRoute,
} from './routes/quizzes.ts';
import { listResourceViewsRoute, recordResourceViewRoute } from './routes/resource-views.ts';
import {
  listRetentionPoliciesRoute,
  upsertRetentionPolicyRoute,
} from './routes/retention-policies.ts';
import {
  createRubricRoute,
  deleteRubricRoute,
  getRubricRoute,
  listRubricsRoute,
  updateRubricRoute,
} from './routes/rubrics.ts';
import {
  commitScormRuntimeRoute,
  createScormPackageRoute,
  finishScormRuntimeRoute,
  getScormRuntimeBridgeScriptRoute,
  initializeScormRuntimeRoute,
  listScormPackagesRoute,
  upsertScormAttemptRoute,
} from './routes/scorm.ts';
import {
  assignSectionInstructorRoute,
  assignSectionMemberRoute,
  listSectionInstructorsRoute,
  listSectionMembersRoute,
  removeSectionInstructorRoute,
  removeSectionMemberRoute,
} from './routes/section-members.ts';
import {
  createSubmissionAttachmentRoute,
  downloadSubmissionAttachmentRoute,
  listSubmissionAttachmentsRoute,
} from './routes/submission-attachments.ts';
import {
  createSubmissionCommentRoute,
  listSubmissionCommentsRoute,
} from './routes/submission-comments.ts';
import {
  batchUpsertSubmissionGradesRoute,
  importSubmissionGradesCsvRoute,
  upsertSubmissionGradeRoute,
} from './routes/submission-grades.ts';
import {
  createSurveyQuestionRoute,
  createSurveyRoute,
  deleteSurveyRoute,
  listSurveyQuestionsRoute,
  listSurveyResponsesRoute,
  listSurveysRoute,
  submitSurveyResponseRoute,
  updateSurveyRoute,
} from './routes/surveys.ts';
import {
  listTenantMembersRoute,
  listTenantMessageableUsersRoute,
  listTenantsRoute,
  updateTenantFileStorageQuotasRoute,
  updateTenantMembershipRoute,
} from './routes/tenants.ts';
import {
  createWebhookSubscriptionRoute,
  deleteWebhookSubscriptionRoute,
  listWebhookSubscriptionsRoute,
  updateWebhookSubscriptionRoute,
} from './routes/webhook-subscriptions.ts';
import {
  createWikiPageRoute,
  deleteWikiPageRoute,
  diffWikiPageRevisionsRoute,
  listWikiPageRevisionsRoute,
  listWikiPagesRoute,
  restoreWikiPageRevisionRoute,
  updateWikiPageRoute,
} from './routes/wiki.ts';
import { ingestXapiStatementRoute } from './routes/xapi.ts';

export type ApiAppOptions = {
  dependencies: ApiDependencies;
  rateLimit?: Partial<HttpRateLimitOptions> | false;
};

const extractBearerToken = (authorizationHeader: string | undefined): string => {
  if (!authorizationHeader) {
    throw new ApiError(
      'unauthorized',
      'Authentication is required. Sign in and retry the request.',
    );
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token || authorizationHeader.split(' ').length !== 2) {
    throw new ApiError(
      'unauthorized',
      'Authorization must use a Bearer session token. Sign in and retry the request.',
    );
  }

  return token;
};

const requireAuthenticatedUser = async (
  dependencies: ApiDependencies,
  authorizationHeader: string | undefined,
): Promise<string> => {
  const sessionToken = extractBearerToken(authorizationHeader);
  const session = await dependencies.getSessionByToken(sessionToken);

  if (!session) {
    throw new ApiError('unauthorized', 'Session was not found. Sign in and retry the request.');
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    throw new ApiError('unauthorized', 'Session has expired. Sign in again and retry the request.');
  }

  return session.userId;
};

type AuditLogValidatedQuery = {
  category?: AuditCategory;
  action?: string;
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  from?: string;
  to?: string;
  limit?: string;
};

const toAuditLogQueryInput = (
  query: AuditLogValidatedQuery,
): Parameters<ApiDependencies['listAuditLogs']>[2] => ({
  category: query.category,
  action: query.action,
  actorId: query.actorId,
  resourceType: query.resourceType,
  resourceId: query.resourceId,
  from: query.from ? new Date(query.from) : undefined,
  to: query.to ? new Date(query.to) : undefined,
  limit: query.limit ? Number(query.limit) : 50,
});

const toFileMetadataResponse = (file: FileResource): FileMetadataContract =>
  FileMetadata.parse({
    id: file.id,
    tenantId: file.tenantId,
    courseId: file.courseId,
    ownerId: file.ownerId,
    filename: file.filename,
    mediaType: file.mediaType,
    byteSize: file.byteSize,
    checksumSha256: file.checksumSha256,
    visibility: file.visibility,
    altText: file.altText,
    transcriptText: file.transcriptText,
    license: file.license,
    copyrightHolder: file.copyrightHolder,
    createdAt: file.createdAt,
  });

export const createApiApp = (options: ApiAppOptions): OpenAPIHono => {
  const app = new OpenAPIHono({
    defaultHook: (result, context) => {
      if (!result.success) {
        return context.json(
          errorResponseBody(
            new ApiError(
              'bad_request',
              'Request validation failed. Check the request path, query, and body.',
            ),
          ),
          400,
        );
      }
    },
  });

  app.use('*', createHttpRateLimitMiddleware(options.rateLimit));

  // Mount Better Auth at /api/auth/* when configured. The frontend talks to
  // /api/auth/sign-in/email, /api/auth/sign-up/email, /api/auth/sign-out, and
  // /api/auth/get-session. When auth is not configured (e.g. OpenAPI generation
  // or unit-test composition), the mount is a no-op. OPTIONS is included so
  // CORS preflights succeed when the frontend talks to the API on a different
  // origin (the Next.js dev proxy avoids preflights, but production might not).
  app.on(['GET', 'POST', 'OPTIONS'], '/api/auth/*', (context) => {
    if (!options.dependencies.authHandler) {
      return context.json(
        errorResponseBody(
          new ApiError(
            'internal_error',
            'Authentication is not configured on this server. Set BETTER_AUTH_SECRET and BETTER_AUTH_URL.',
          ),
        ),
        500,
      );
    }
    return options.dependencies.authHandler(context.req.raw);
  });

  app.openapi(healthRoute, (context) =>
    context.json(
      {
        status: 'ok',
        service: 'open-lms-api',
      },
      200,
    ),
  );

  app.openapi(listTenantsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const tenants = await options.dependencies.listTenants(actorUserId);
    return context.json(tenants, 200);
  });

  app.openapi(createInitialTenantRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const body = context.req.valid('json');
    const tenant = await options.dependencies.createInitialTenant(actorUserId, body);
    return context.json(tenant, 201);
  });

  app.openapi(listTenantMembersRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const members = await options.dependencies.listTenantMembers(actorUserId, tenantId);
    return context.json(members, 200);
  });

  app.openapi(listTenantMessageableUsersRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const users = await options.dependencies.listTenantMessageableUsers(actorUserId, tenantId);
    return context.json(users, 200);
  });

  app.openapi(updateTenantFileStorageQuotasRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const body = context.req.valid('json');
    const tenant = await options.dependencies.updateTenantFileStorageQuotas(
      actorUserId,
      tenantId,
      body,
    );
    return context.json(tenant, 200);
  });

  app.openapi(listWebhookSubscriptionsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const subscriptions = await options.dependencies.listWebhookSubscriptions(
      actorUserId,
      tenantId,
    );
    return context.json(subscriptions, 200);
  });

  app.openapi(createWebhookSubscriptionRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const body = context.req.valid('json');
    const subscription = await options.dependencies.createWebhookSubscription(
      actorUserId,
      tenantId,
      body,
    );
    return context.json(subscription, 201);
  });

  app.openapi(updateWebhookSubscriptionRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, webhookSubscriptionId } = context.req.valid('param');
    const body = context.req.valid('json');
    const subscription = await options.dependencies.updateWebhookSubscription(
      actorUserId,
      tenantId,
      webhookSubscriptionId,
      body,
    );
    return context.json(subscription, 200);
  });

  app.openapi(deleteWebhookSubscriptionRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, webhookSubscriptionId } = context.req.valid('param');
    await options.dependencies.deleteWebhookSubscription(
      actorUserId,
      tenantId,
      webhookSubscriptionId,
    );
    return context.body(null, 204);
  });

  app.openapi(listTenantFeatureFlagsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const flags = await options.dependencies.listTenantFeatureFlags(actorUserId, tenantId);
    return context.json(flags, 200);
  });

  app.openapi(upsertTenantFeatureFlagRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, key } = context.req.valid('param');
    const body = context.req.valid('json');
    const flag = await options.dependencies.upsertTenantFeatureFlag(
      actorUserId,
      tenantId,
      key,
      body,
    );
    return context.json(flag, 200);
  });

  app.openapi(deleteTenantFeatureFlagRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, key } = context.req.valid('param');
    await options.dependencies.deleteTenantFeatureFlag(actorUserId, tenantId, key);
    return context.body(null, 204);
  });

  app.openapi(getAiUsageSummaryRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const { from, to } = context.req.valid('query');
    const summary = await options.dependencies.getAiUsageSummary(
      actorUserId,
      tenantId,
      new Date(from),
      new Date(to),
    );
    return context.json(summary, 200);
  });

  app.openapi(getProviderConfigRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const config = await options.dependencies.getProviderConfig(actorUserId, tenantId);
    return context.json(config, 200);
  });

  app.openapi(getLti1p3JsonWebKeySetRoute, async (context) => {
    const { tenantId } = context.req.valid('param');
    const jwks = await options.dependencies.getLti1p3JsonWebKeySet(tenantId);

    return context.json(jwks, 200);
  });

  app.openapi(authorizeLti1p3OidcLaunchRoute, async (context) => {
    const sessionToken = extractBearerToken(context.req.header('authorization'));
    const query = context.req.valid('query');
    const launch = await options.dependencies.authorizeLti1p3OidcLaunch(sessionToken, query);

    return context.json(launch, 200);
  });

  app.openapi(createLti1p3ServiceAccessTokenRoute, async (context) => {
    const { tenantId } = context.req.valid('param');
    const body = context.req.valid('form');
    const token = await options.dependencies.createLti1p3ServiceAccessToken(tenantId, body);

    return context.json(token, 200);
  });

  app.openapi(getLti1p3NamesRolesMembershipsRoute, async (context) => {
    const accessToken = extractBearerToken(context.req.header('authorization'));
    const { tenantId, courseId } = context.req.valid('param');
    const { role } = context.req.valid('query');
    const container = await options.dependencies.getLti1p3NamesRolesMemberships(
      accessToken,
      tenantId,
      courseId,
      role,
    );

    return context.json(container, 200, {
      'content-type': 'application/vnd.ims.lti-nrps.v2.membershipcontainer+json',
    });
  });

  app.openapi(publishLti1p3AgsScoreRoute, async (context) => {
    const accessToken = extractBearerToken(context.req.header('authorization'));
    const { tenantId, courseId, assignmentId, toolId } = context.req.valid('param');
    const score = context.req.valid('json');
    await options.dependencies.publishLti1p3AgsScore(
      accessToken,
      tenantId,
      courseId,
      assignmentId,
      toolId,
      score,
    );

    return context.body(null, 204);
  });

  app.openapi(listLti1p3AgsResultsRoute, async (context) => {
    const accessToken = extractBearerToken(context.req.header('authorization'));
    const { tenantId, courseId, assignmentId, toolId } = context.req.valid('param');
    const { user_id } = context.req.valid('query');
    const results = await options.dependencies.listLti1p3AgsResults(
      accessToken,
      tenantId,
      courseId,
      assignmentId,
      toolId,
      user_id,
    );

    return context.json(results, 200, {
      'content-type': 'application/vnd.ims.lis.v2.resultcontainer+json',
    });
  });

  app.openapi(processLti1p3DeepLinkingReturnRoute, async (context) => {
    const body = context.req.valid('form');
    const result = await options.dependencies.processLti1p3DeepLinkingReturn(body.JWT);

    return context.json(result, 200);
  });

  app.openapi(listAiActionsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const actions = await options.dependencies.listAiActions(actorUserId, tenantId);
    return context.json(actions, 200);
  });

  app.openapi(ingestXapiStatementRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const body = context.req.valid('json');
    const statement = await options.dependencies.ingestXapiStatement(actorUserId, tenantId, body);

    return context.json(statement, 201);
  });

  app.openapi(listAuditLogsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const query = context.req.valid('query');
    const logs = await options.dependencies.listAuditLogs(
      actorUserId,
      tenantId,
      toAuditLogQueryInput(query),
    );

    return context.json(logs, 200);
  });

  app.openapi(exportAuditLogsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const query = context.req.valid('query');
    const csv = await options.dependencies.exportAuditLogsCsv(
      actorUserId,
      tenantId,
      toAuditLogQueryInput(query),
    );

    return context.body(csv, 200, {
      'content-type': 'text/csv; charset=utf-8',
    });
  });

  app.openapi(listUserLegalHoldsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const query = context.req.valid('query');
    const holds = await options.dependencies.listUserLegalHolds(actorUserId, tenantId, query);
    return context.json(holds, 200);
  });

  app.openapi(createUserLegalHoldRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const body = context.req.valid('json');
    const hold = await options.dependencies.createUserLegalHold(actorUserId, tenantId, body);
    return context.json(hold, 201);
  });

  app.openapi(releaseUserLegalHoldRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, legalHoldId } = context.req.valid('param');
    const hold = await options.dependencies.releaseUserLegalHold(
      actorUserId,
      tenantId,
      legalHoldId,
    );
    return context.json(hold, 200);
  });

  app.openapi(listRetentionPoliciesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const policies = await options.dependencies.listRetentionPolicies(actorUserId, tenantId);
    return context.json(policies, 200);
  });

  app.openapi(upsertRetentionPolicyRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, targetType } = context.req.valid('param');
    const body = context.req.valid('json');
    const policy = await options.dependencies.upsertRetentionPolicy(
      actorUserId,
      tenantId,
      targetType,
      body,
    );
    return context.json(policy, 200);
  });

  app.openapi(listAiUsageByActionRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const { from, to } = context.req.valid('query');
    const rows = await options.dependencies.listAiUsageByAction(
      actorUserId,
      tenantId,
      new Date(from),
      new Date(to),
    );
    return context.json(rows, 200);
  });

  app.openapi(updateTenantMembershipRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, membershipId } = context.req.valid('param');
    const body = context.req.valid('json');
    const membership = await options.dependencies.updateTenantMembership(
      actorUserId,
      tenantId,
      membershipId,
      body,
    );
    return context.json(membership, 200);
  });

  app.openapi(getCurrentUserRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const user = await options.dependencies.getCurrentUser(actorUserId);
    return context.json(user, 200);
  });

  app.openapi(updateCurrentUserRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const body = context.req.valid('json');
    const user = await options.dependencies.updateCurrentUser(actorUserId, body);
    return context.json(user, 200);
  });

  app.openapi(deleteCurrentUserRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    await options.dependencies.deleteCurrentUser(actorUserId);
    return context.body(null, 204);
  });

  app.openapi(listMyTenantMembershipsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const memberships = await options.dependencies.listMyTenantMemberships(actorUserId);
    return context.json(memberships, 200);
  });

  app.openapi(listMyCourseMembershipsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const memberships = await options.dependencies.listMyCourseMemberships(actorUserId);
    return context.json(memberships, 200);
  });

  app.openapi(listCoursesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const courses = await options.dependencies.listCourses(actorUserId, tenantId);
    return context.json(courses, 200);
  });

  app.openapi(listCatalogCoursesRoute, async (context) => {
    const { tenantId } = context.req.valid('param');
    const { academicTerm, blueprint, catalogCategory } = context.req.valid('query');
    const courses = await options.dependencies.listCatalogCourses(tenantId, {
      isBlueprint: blueprint === undefined ? undefined : blueprint === 'true',
      catalogCategory,
      academicTerm,
    });
    return context.json(courses, 200);
  });

  app.openapi(listCourseFavoritesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const favorites = await options.dependencies.listCourseFavorites(actorUserId, tenantId);
    return context.json(favorites, 200);
  });

  app.openapi(favoriteCourseRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const favorite = await options.dependencies.favoriteCourse(actorUserId, tenantId, courseId);
    return context.json(favorite, 200);
  });

  app.openapi(unfavoriteCourseRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    await options.dependencies.unfavoriteCourse(actorUserId, tenantId, courseId);
    return context.body(null, 204);
  });

  app.openapi(getCourseNextPositionRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const { scope, moduleId } = context.req.valid('query');
    const result = await options.dependencies.getCourseNextPosition(
      actorUserId,
      tenantId,
      courseId,
      scope === 'course_unit' && moduleId
        ? { kind: 'course_unit', moduleId }
        : ({ kind: scope } as { kind: 'course_module' | 'course_section' | 'gradebook_category' }),
    );

    return context.json(result, 200);
  });

  app.openapi(reorderCourseContentRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const { scope, moduleId, orderedIds } = context.req.valid('json');
    const result = await options.dependencies.reorderCourseContent(
      actorUserId,
      tenantId,
      courseId,
      {
        scope:
          scope === 'course_unit' && moduleId
            ? { kind: 'course_unit', moduleId }
            : ({ kind: scope } as {
                kind: 'course_module' | 'course_section' | 'gradebook_category';
              }),
        orderedIds,
      },
    );

    return context.json(result, 200);
  });

  app.openapi(copyCourseRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const result = await options.dependencies.copyCourse(actorUserId, tenantId, courseId, {
      targetCourseId: body.targetCourseId,
    });

    return context.json(result, 200);
  });

  app.openapi(exportCourseBackupRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const backup = await options.dependencies.exportCourseBackup(actorUserId, tenantId, courseId);

    return context.json(backup, 200);
  });

  app.openapi(exportCourseCommonCartridgeRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const cartridge = await options.dependencies.exportCourseCommonCartridge(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(cartridge, 200);
  });

  app.openapi(getCourseAnalyticsSummaryRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const summary = await options.dependencies.getCourseAnalyticsSummary(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(summary, 200);
  });

  app.openapi(restoreCourseBackupRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const result = await options.dependencies.restoreCourseBackup(actorUserId, tenantId, courseId, {
      backup: body.backup,
    });

    return context.json(result, 200);
  });

  app.openapi(importCourseCommonCartridgeRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const result = await options.dependencies.importCourseCommonCartridge(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(result, 201);
  });

  app.openapi(createCourseRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const body = context.req.valid('json');
    const course = await options.dependencies.createCourse(actorUserId, tenantId, body);
    return context.json(course, 201);
  });

  app.openapi(updateCourseRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const updated = await options.dependencies.updateCourse(actorUserId, tenantId, courseId, {
      code: body.code,
      title: body.title,
      status: body.status,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      catalogCategory: body.catalogCategory,
      academicTerm: body.academicTerm,
      isBlueprint: body.isBlueprint,
    });
    return context.json(updated, 200);
  });

  app.openapi(deleteCourseRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    await options.dependencies.deleteCourse(actorUserId, tenantId, courseId);
    return context.body(null, 204);
  });

  app.openapi(restoreDeletedCourseRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const course = await options.dependencies.restoreDeletedCourse(actorUserId, tenantId, courseId);
    return context.json(course, 200);
  });

  app.openapi(updateCourseCatalogSettingsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const settings = await options.dependencies.updateCourseCatalogSettings(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(settings, 200);
  });

  app.openapi(listRubricsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const rubrics = await options.dependencies.listRubrics(actorUserId, tenantId);
    return context.json(rubrics, 200);
  });

  app.openapi(getRubricRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, rubricId } = context.req.valid('param');
    const rubric = await options.dependencies.getRubric(actorUserId, tenantId, rubricId);
    return context.json(rubric, 200);
  });

  app.openapi(createRubricRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const body = context.req.valid('json');
    const rubric = await options.dependencies.createRubric(actorUserId, tenantId, body);
    return context.json(rubric, 201);
  });

  app.openapi(updateRubricRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, rubricId } = context.req.valid('param');
    const body = context.req.valid('json');
    const rubric = await options.dependencies.updateRubric(actorUserId, tenantId, rubricId, body);

    return context.json(rubric, 200);
  });

  app.openapi(deleteRubricRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, rubricId } = context.req.valid('param');
    await options.dependencies.deleteRubric(actorUserId, tenantId, rubricId);

    return context.body(null, 204);
  });

  app.openapi(listCourseSectionsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const sections = await options.dependencies.listCourseSections(actorUserId, tenantId, courseId);

    return context.json(sections, 200);
  });

  app.openapi(createCourseSectionRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const section = await options.dependencies.createCourseSection(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(section, 201);
  });

  app.openapi(updateCourseSectionRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, courseSectionId } = context.req.valid('param');
    const body = context.req.valid('json');
    const section = await options.dependencies.updateCourseSection(
      actorUserId,
      tenantId,
      courseId,
      courseSectionId,
      body,
    );

    return context.json(section, 200);
  });

  app.openapi(deleteCourseSectionRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, courseSectionId } = context.req.valid('param');
    await options.dependencies.deleteCourseSection(
      actorUserId,
      tenantId,
      courseId,
      courseSectionId,
    );

    return context.body(null, 204);
  });

  app.openapi(listCourseAnnouncementsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const announcements = await options.dependencies.listCourseAnnouncements(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(announcements, 200);
  });

  app.openapi(createCourseAnnouncementsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const announcement = await options.dependencies.createCourseAnnouncement(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(announcement, 201);
  });

  app.openapi(updateCourseAnnouncementRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, announcementId } = context.req.valid('param');
    const body = context.req.valid('json');
    const announcement = await options.dependencies.updateCourseAnnouncement(
      actorUserId,
      tenantId,
      courseId,
      announcementId,
      body,
    );

    return context.json(announcement, 200);
  });

  app.openapi(deleteCourseAnnouncementRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, announcementId } = context.req.valid('param');
    await options.dependencies.deleteCourseAnnouncement(
      actorUserId,
      tenantId,
      courseId,
      announcementId,
    );

    return context.body(null, 204);
  });

  app.openapi(listCourseMembershipsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const { role, status } = context.req.valid('query');
    const memberships = await options.dependencies.listCourseMemberships(
      actorUserId,
      tenantId,
      courseId,
      role,
      status,
    );

    return context.json(memberships, 200);
  });

  app.openapi(listMessageableUsersRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const users = await options.dependencies.listMessageableUsers(actorUserId, tenantId, courseId);
    return context.json(users, 200);
  });

  app.openapi(createCourseMembershipRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const membership = await options.dependencies.createCourseMembership(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(membership, 201);
  });

  app.openapi(updateCourseMembershipRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, courseMembershipId } = context.req.valid('param');
    const body = context.req.valid('json');
    const membership = await options.dependencies.updateCourseMembership(
      actorUserId,
      tenantId,
      courseId,
      courseMembershipId,
      body,
    );

    return context.json(membership, 200);
  });

  app.openapi(deleteCourseMembershipRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, courseMembershipId } = context.req.valid('param');
    await options.dependencies.deleteCourseMembership(
      actorUserId,
      tenantId,
      courseId,
      courseMembershipId,
    );

    return context.body(null, 204);
  });

  app.openapi(selfEnrollInCourseRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const membership = await options.dependencies.selfEnrollInCourse(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(membership, 201);
  });

  app.openapi(bulkEnrollInCourseRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const summary = await options.dependencies.bulkEnrollInCourse(
      actorUserId,
      tenantId,
      courseId,
      body.items,
    );

    return context.json(summary, 200);
  });

  app.openapi(importCourseRosterCsvRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const csv = await context.req.text();
    const summary = await options.dependencies.importCourseRosterCsv(
      actorUserId,
      tenantId,
      courseId,
      csv,
    );

    return context.json(summary, 200);
  });

  app.openapi(exportCourseRosterCsvRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const csv = await options.dependencies.exportCourseRosterCsv(actorUserId, tenantId, courseId);

    return new Response(csv, {
      status: 200,
      headers: { 'content-type': 'text/csv; charset=utf-8' },
    });
  });

  app.openapi(bulkDeleteCourseMembershipsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const summary = await options.dependencies.bulkDeleteCourseMemberships(
      actorUserId,
      tenantId,
      courseId,
      body.courseMembershipIds,
    );

    return context.json(summary, 200);
  });

  app.openapi(listAssignmentsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const { moduleId, unitId } = context.req.valid('query');
    const assignments = await options.dependencies.listAssignments(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
      unitId,
    );

    return context.json(assignments, 200);
  });

  app.openapi(createAssignmentRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const assignment = await options.dependencies.createAssignment(
      actorUserId,
      tenantId,
      courseId,
      body,
    );
    return context.json(assignment, 201);
  });

  app.openapi(updateAssignmentRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId } = context.req.valid('param');
    const body = context.req.valid('json');
    const assignment = await options.dependencies.updateAssignment(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      body,
    );

    return context.json(assignment, 200);
  });

  app.openapi(deleteAssignmentRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId } = context.req.valid('param');
    await options.dependencies.deleteAssignment(actorUserId, tenantId, courseId, assignmentId);

    return context.body(null, 204);
  });

  app.openapi(getAssignmentEffectiveScheduleRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId } = context.req.valid('param');
    const schedule = await options.dependencies.getAssignmentEffectiveSchedule(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
    );

    return context.json(schedule, 200);
  });

  app.openapi(recordCourseExternalToolOutcomeRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId } = context.req.valid('param');
    const body = context.req.valid('json');
    const outcome = await options.dependencies.recordCourseExternalToolOutcome(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      {
        studentId: body.studentId,
        externalToolId: body.externalToolId,
        score: body.score,
        maxScore: body.maxScore,
        status: body.status,
        reportedAt: body.reportedAt,
      },
    );

    return context.json(outcome, 200);
  });

  app.openapi(listCourseExternalToolOutcomesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId } = context.req.valid('param');
    const outcomes = await options.dependencies.listCourseExternalToolOutcomes(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
    );

    return context.json(outcomes, 200);
  });

  app.openapi(recordSubmissionPlagiarismReportRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, submissionId } = context.req.valid('param');
    const body = context.req.valid('json');
    const report = await options.dependencies.recordSubmissionPlagiarismReport(
      actorUserId,
      tenantId,
      submissionId,
      {
        integrationConnectionId: body.integrationConnectionId,
        similarityPercent: body.similarityPercent,
        reportUrl: body.reportUrl,
        status: body.status,
        checkedAt: body.checkedAt,
      },
    );

    return context.json(report, 200);
  });

  app.openapi(listSubmissionPlagiarismReportsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, submissionId } = context.req.valid('param');
    const reports = await options.dependencies.listSubmissionPlagiarismReports(
      actorUserId,
      tenantId,
      submissionId,
    );

    return context.json(reports, 200);
  });

  app.openapi(listAssignmentOverridesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId } = context.req.valid('param');
    const overrides = await options.dependencies.listAssignmentOverrides(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
    );

    return context.json(overrides, 200);
  });

  app.openapi(createAssignmentOverrideRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId } = context.req.valid('param');
    const body = context.req.valid('json');
    const override = await options.dependencies.createAssignmentOverride(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      {
        targetType: body.targetType,
        targetId: body.targetId,
        opensAt: body.opensAt ? new Date(body.opensAt) : null,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        closesAt: body.closesAt ? new Date(body.closesAt) : null,
        status: body.status,
      },
    );

    return context.json(override, 201);
  });

  app.openapi(updateAssignmentOverrideRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId, overrideId } = context.req.valid('param');
    const body = context.req.valid('json');
    const override = await options.dependencies.updateAssignmentOverride(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      overrideId,
      {
        opensAt: body.opensAt ? new Date(body.opensAt) : null,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        closesAt: body.closesAt ? new Date(body.closesAt) : null,
        status: body.status,
      },
    );

    return context.json(override, 200);
  });

  app.openapi(deleteAssignmentOverrideRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId, overrideId } = context.req.valid('param');
    await options.dependencies.deleteAssignmentOverride(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      overrideId,
    );

    return context.body(null, 204);
  });

  app.openapi(getAssignmentRubricRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId } = context.req.valid('param');
    const rubric = await options.dependencies.getAssignmentRubric(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
    );

    return context.json(rubric, 200);
  });

  app.openapi(listQuizzesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const { moduleId, unitId } = context.req.valid('query');
    const quizzes = await options.dependencies.listQuizzes(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
      unitId,
    );

    return context.json(quizzes, 200);
  });

  app.openapi(createQuizRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const quiz = await options.dependencies.createQuiz(actorUserId, tenantId, courseId, body);
    return context.json(quiz, 201);
  });

  app.openapi(updateQuizRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId } = context.req.valid('param');
    const body = context.req.valid('json');
    const quiz = await options.dependencies.updateQuiz(
      actorUserId,
      tenantId,
      courseId,
      quizId,
      body,
    );

    return context.json(quiz, 200);
  });

  app.openapi(deleteQuizRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId } = context.req.valid('param');
    await options.dependencies.deleteQuiz(actorUserId, tenantId, courseId, quizId);

    return context.body(null, 204);
  });

  app.openapi(listQuizQuestionsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId } = context.req.valid('param');
    const questions = await options.dependencies.listQuizQuestions(
      actorUserId,
      tenantId,
      courseId,
      quizId,
    );

    return context.json(questions, 200);
  });

  app.openapi(createQuizQuestionRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId } = context.req.valid('param');
    const body = context.req.valid('json');
    const question = await options.dependencies.createQuizQuestion(
      actorUserId,
      tenantId,
      courseId,
      quizId,
      body,
    );

    return context.json(question, 201);
  });

  app.openapi(exportQuizQtiItemsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId } = context.req.valid('param');
    const bundle = await options.dependencies.exportQuizQtiItems(
      actorUserId,
      tenantId,
      courseId,
      quizId,
    );

    return context.json(bundle, 200);
  });

  app.openapi(importQuizQtiItemsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId } = context.req.valid('param');
    const body = context.req.valid('json');
    const result = await options.dependencies.importQuizQtiItems(
      actorUserId,
      tenantId,
      courseId,
      quizId,
      body,
    );

    return context.json(result, 201);
  });

  app.openapi(listQuizOverridesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId } = context.req.valid('param');
    const overrides = await options.dependencies.listQuizOverrides(
      actorUserId,
      tenantId,
      courseId,
      quizId,
    );

    return context.json(overrides, 200);
  });

  app.openapi(createQuizOverrideRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId } = context.req.valid('param');
    const body = context.req.valid('json');
    const override = await options.dependencies.createQuizOverride(
      actorUserId,
      tenantId,
      courseId,
      quizId,
      body,
    );

    return context.json(override, 201);
  });

  app.openapi(updateQuizOverrideRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId, overrideId } = context.req.valid('param');
    const body = context.req.valid('json');
    const override = await options.dependencies.updateQuizOverride(
      actorUserId,
      tenantId,
      courseId,
      quizId,
      overrideId,
      body,
    );

    return context.json(override, 200);
  });

  app.openapi(deleteQuizOverrideRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId, overrideId } = context.req.valid('param');
    await options.dependencies.deleteQuizOverride(
      actorUserId,
      tenantId,
      courseId,
      quizId,
      overrideId,
    );

    return context.body(null, 204);
  });

  app.openapi(getQuizEffectiveSettingsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId } = context.req.valid('param');
    const settings = await options.dependencies.getQuizEffectiveSettings(
      actorUserId,
      tenantId,
      courseId,
      quizId,
    );

    return context.json(settings, 200);
  });

  app.openapi(listQuizAttemptsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId } = context.req.valid('param');
    const attempts = await options.dependencies.listQuizAttempts(
      actorUserId,
      tenantId,
      courseId,
      quizId,
    );

    return context.json(attempts, 200);
  });

  app.openapi(listQuizAggregateGradesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId } = context.req.valid('param');
    const grades = await options.dependencies.listQuizAggregateGrades(
      actorUserId,
      tenantId,
      courseId,
      quizId,
    );

    return context.json(grades, 200);
  });

  app.openapi(listQuizAttemptQuestionGradesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId, attemptId } = context.req.valid('param');
    const grades = await options.dependencies.listQuizAttemptQuestionGrades(
      actorUserId,
      tenantId,
      courseId,
      quizId,
      attemptId,
    );

    return context.json(grades, 200);
  });

  app.openapi(recordQuizAttemptQuestionGradeRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId, attemptId, questionId } = context.req.valid('param');
    const body = context.req.valid('json');
    const grade = await options.dependencies.recordQuizAttemptQuestionGrade(
      actorUserId,
      tenantId,
      courseId,
      quizId,
      attemptId,
      questionId,
      body,
    );

    return context.json(grade, 200);
  });

  app.openapi(regradeQuizAttemptRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId, attemptId } = context.req.valid('param');
    const attempt = await options.dependencies.regradeQuizAttempt(
      actorUserId,
      tenantId,
      courseId,
      quizId,
      attemptId,
    );

    return context.json(attempt, 200);
  });

  app.openapi(startQuizAttemptRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId } = context.req.valid('param');
    const contentType = context.req.header('content-type') ?? '';
    let rawBody: unknown = {};

    if (contentType.includes('application/json')) {
      const requestBody = await context.req.text();

      if (requestBody.trim().length > 0) {
        try {
          rawBody = JSON.parse(requestBody) as unknown;
        } catch {
          throw new ApiError(
            'bad_request',
            'Quiz attempt start request is invalid. Check the access password and retry.',
          );
        }
      }
    }

    const body = StartQuizAttemptBody.safeParse(rawBody);

    if (!body.success) {
      throw new ApiError(
        'bad_request',
        'Quiz attempt start request is invalid. Check the access password and retry.',
      );
    }

    const clientIp =
      context.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      context.req.header('cf-connecting-ip')?.trim() ||
      context.req.header('x-real-ip')?.trim() ||
      null;
    const attempt = await options.dependencies.startQuizAttempt(
      actorUserId,
      tenantId,
      courseId,
      quizId,
      {
        accessPassword: body.data.accessPassword ?? null,
        clientIp,
      },
    );

    return context.json(attempt, 201);
  });

  app.openapi(submitQuizAttemptRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId, attemptId } = context.req.valid('param');
    const attempt = await options.dependencies.submitQuizAttempt(
      actorUserId,
      tenantId,
      courseId,
      quizId,
      attemptId,
    );

    return context.json(attempt, 200);
  });

  app.openapi(listQuizAttemptResponsesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId, attemptId } = context.req.valid('param');
    const responses = await options.dependencies.listQuizAttemptResponses(
      actorUserId,
      tenantId,
      courseId,
      quizId,
      attemptId,
    );

    return context.json(responses, 200);
  });

  app.openapi(saveQuizAttemptResponseRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, quizId, attemptId, questionId } = context.req.valid('param');
    const { answer } = context.req.valid('json');
    const response = await options.dependencies.saveQuizAttemptResponse(
      actorUserId,
      tenantId,
      courseId,
      quizId,
      attemptId,
      questionId,
      answer,
    );

    return context.json(response, 200);
  });

  app.openapi(listQuestionBanksRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const banks = await options.dependencies.listQuestionBanks(actorUserId, tenantId, courseId);

    return context.json(banks, 200);
  });

  app.openapi(createQuestionBankRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const bank = await options.dependencies.createQuestionBank(
      actorUserId,
      tenantId,
      courseId,
      body,
    );
    return context.json(bank, 201);
  });

  app.openapi(updateQuestionBankRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, questionBankId } = context.req.valid('param');
    const body = context.req.valid('json');
    const bank = await options.dependencies.updateQuestionBank(
      actorUserId,
      tenantId,
      courseId,
      questionBankId,
      body,
    );

    return context.json(bank, 200);
  });

  app.openapi(deleteQuestionBankRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, questionBankId } = context.req.valid('param');
    await options.dependencies.deleteQuestionBank(actorUserId, tenantId, courseId, questionBankId);

    return context.body(null, 204);
  });

  app.openapi(listQuestionBankQuestionsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, questionBankId } = context.req.valid('param');
    const questions = await options.dependencies.listQuestionBankQuestions(
      actorUserId,
      tenantId,
      courseId,
      questionBankId,
    );

    return context.json(questions, 200);
  });

  app.openapi(createQuestionBankQuestionRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, questionBankId } = context.req.valid('param');
    const body = context.req.valid('json');
    const question = await options.dependencies.createQuestionBankQuestion(
      actorUserId,
      tenantId,
      courseId,
      questionBankId,
      body,
    );
    return context.json(question, 201);
  });

  app.openapi(listAttendanceSessionsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const sessions = await options.dependencies.listAttendanceSessions(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(sessions, 200);
  });

  app.openapi(createAttendanceSessionRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const session = await options.dependencies.createAttendanceSession(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(session, 201);
  });

  app.openapi(listAttendanceRecordsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, sessionId } = context.req.valid('param');
    const records = await options.dependencies.listAttendanceRecords(
      actorUserId,
      tenantId,
      courseId,
      sessionId,
    );

    return context.json(records, 200);
  });

  app.openapi(recordAttendanceRecordRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, sessionId, studentId } = context.req.valid('param');
    const body = context.req.valid('json');
    const record = await options.dependencies.recordAttendanceRecord(
      actorUserId,
      tenantId,
      courseId,
      sessionId,
      studentId,
      {
        status: body.status,
        note: body.note ?? null,
      },
    );

    return context.json(record, 200);
  });

  app.openapi(listCompletionRequirementsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const { moduleId } = context.req.valid('query');
    const requirements = await options.dependencies.listCompletionRequirements(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
    );

    return context.json(requirements, 200);
  });

  app.openapi(createCompletionRequirementRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const requirement = await options.dependencies.createCompletionRequirement(
      actorUserId,
      tenantId,
      courseId,
      body,
    );
    return context.json(requirement, 201);
  });

  app.openapi(listCompletionProgressRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, requirementId } = context.req.valid('param');
    const progress = await options.dependencies.listCompletionProgress(
      actorUserId,
      tenantId,
      courseId,
      requirementId,
    );

    return context.json(progress, 200);
  });

  app.openapi(listCredentialsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const credentials = await options.dependencies.listCredentials(actorUserId, tenantId, courseId);

    return context.json(credentials, 200);
  });

  app.openapi(createCourseCredentialRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const credential = await options.dependencies.createCourseCredential(
      actorUserId,
      tenantId,
      courseId,
      body,
    );
    return context.json(credential, 201);
  });

  app.openapi(updateCourseCredentialRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, credentialId } = context.req.valid('param');
    const body = context.req.valid('json');
    const credential = await options.dependencies.updateCourseCredential(
      actorUserId,
      tenantId,
      courseId,
      credentialId,
      body,
    );

    return context.json(credential, 200);
  });

  app.openapi(deleteCourseCredentialRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, credentialId } = context.req.valid('param');
    await options.dependencies.deleteCourseCredential(
      actorUserId,
      tenantId,
      courseId,
      credentialId,
    );

    return context.body(null, 204);
  });

  app.openapi(listCredentialAwardsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, credentialId } = context.req.valid('param');
    const awards = await options.dependencies.listCredentialAwards(
      actorUserId,
      tenantId,
      courseId,
      credentialId,
    );

    return context.json(awards, 200);
  });

  app.openapi(createCredentialAwardRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, credentialId } = context.req.valid('param');
    const body = context.req.valid('json');
    const award = await options.dependencies.createCredentialAward(
      actorUserId,
      tenantId,
      courseId,
      credentialId,
      body,
    );
    return context.json(award, 201);
  });

  app.openapi(listConversationThreadsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const threads = await options.dependencies.listConversationThreads(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(threads, 200);
  });

  app.openapi(listInboxThreadsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const threads = await options.dependencies.listInboxThreads(actorUserId, tenantId);
    return context.json(threads, 200);
  });

  app.openapi(createInboxThreadRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const body = context.req.valid('json');
    const thread = await options.dependencies.createInboxThread(actorUserId, tenantId, {
      subject: body.subject,
      body: body.body,
      participantIds: body.participantIds,
      courseId: body.courseId,
    });
    return context.json(thread, 201);
  });

  app.openapi(listInboxThreadMessagesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, threadId } = context.req.valid('param');
    const messages = await options.dependencies.listInboxThreadMessages(
      actorUserId,
      tenantId,
      threadId,
    );
    return context.json(messages, 200);
  });

  app.openapi(createInboxThreadMessageRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, threadId } = context.req.valid('param');
    const body = context.req.valid('json');
    const message = await options.dependencies.createInboxThreadMessage(
      actorUserId,
      tenantId,
      threadId,
      { body: body.body },
    );
    return context.json(message, 201);
  });

  app.openapi(createConversationThreadRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const thread = await options.dependencies.createConversationThread(
      actorUserId,
      tenantId,
      courseId,
      {
        subject: body.subject,
        participantIds: body.participantIds,
        body: body.body,
      },
    );

    return context.json(thread, 201);
  });

  app.openapi(listConversationMessagesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, threadId } = context.req.valid('param');
    const messages = await options.dependencies.listConversationMessages(
      actorUserId,
      tenantId,
      courseId,
      threadId,
    );

    return context.json(messages, 200);
  });

  app.openapi(createConversationMessageRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, threadId } = context.req.valid('param');
    const body = context.req.valid('json');
    const message = await options.dependencies.createConversationMessage(
      actorUserId,
      tenantId,
      courseId,
      threadId,
      { body: body.body },
    );

    return context.json(message, 201);
  });

  app.openapi(listCourseGroupSetsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const groupSets = await options.dependencies.listCourseGroupSets(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(groupSets, 200);
  });

  app.openapi(createCourseGroupSetRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const groupSet = await options.dependencies.createCourseGroupSet(
      actorUserId,
      tenantId,
      courseId,
      body,
    );
    return context.json(groupSet, 201);
  });

  app.openapi(updateCourseGroupSetRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, groupSetId } = context.req.valid('param');
    const body = context.req.valid('json');
    const groupSet = await options.dependencies.updateCourseGroupSet(
      actorUserId,
      tenantId,
      courseId,
      groupSetId,
      body,
    );
    return context.json(groupSet, 200);
  });

  app.openapi(deleteCourseGroupSetRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, groupSetId } = context.req.valid('param');
    await options.dependencies.deleteCourseGroupSet(actorUserId, tenantId, courseId, groupSetId);
    return context.body(null, 204);
  });

  app.openapi(listCourseGroupsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const groups = await options.dependencies.listCourseGroups(actorUserId, tenantId, courseId);

    return context.json(groups, 200);
  });

  app.openapi(createCourseGroupRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const group = await options.dependencies.createCourseGroup(
      actorUserId,
      tenantId,
      courseId,
      body,
    );
    return context.json(group, 201);
  });

  app.openapi(updateCourseGroupRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, groupId } = context.req.valid('param');
    const body = context.req.valid('json');
    const group = await options.dependencies.updateCourseGroup(
      actorUserId,
      tenantId,
      courseId,
      groupId,
      body,
    );
    return context.json(group, 200);
  });

  app.openapi(deleteCourseGroupRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, groupId } = context.req.valid('param');
    await options.dependencies.deleteCourseGroup(actorUserId, tenantId, courseId, groupId);
    return context.body(null, 204);
  });

  app.openapi(listCourseGroupMembersRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, groupId } = context.req.valid('param');
    const members = await options.dependencies.listCourseGroupMembers(
      actorUserId,
      tenantId,
      courseId,
      groupId,
    );

    return context.json(members, 200);
  });

  app.openapi(createCourseGroupMemberRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, groupId } = context.req.valid('param');
    const body = context.req.valid('json');
    const member = await options.dependencies.createCourseGroupMember(
      actorUserId,
      tenantId,
      courseId,
      groupId,
      body,
    );
    return context.json(member, 201);
  });

  app.openapi(joinCourseGroupRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, groupId } = context.req.valid('param');
    const member = await options.dependencies.joinCourseGroup(
      actorUserId,
      tenantId,
      courseId,
      groupId,
    );
    return context.json(member, 201);
  });

  app.openapi(leaveCourseGroupRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, groupId } = context.req.valid('param');
    await options.dependencies.leaveCourseGroup(actorUserId, tenantId, courseId, groupId);
    return context.body(null, 204);
  });

  app.openapi(listAssignmentSubmissionsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId } = context.req.valid('param');
    const submissions = await options.dependencies.listAssignmentSubmissions(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
    );

    return context.json(submissions, 200);
  });

  app.openapi(saveAssignmentDraftRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId, draftId } = context.req.valid('param');
    const { blocks } = context.req.valid('json');
    const draft = await options.dependencies.saveAssignmentDraft(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      draftId,
      blocks,
    );

    return context.json(draft, 200);
  });

  app.openapi(submitAssignmentDraftRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId, draftId } = context.req.valid('param');
    const { blocks } = context.req.valid('json');
    const submission = await options.dependencies.submitAssignmentDraft(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      draftId,
      blocks,
    );

    return context.json(submission, 201);
  });

  app.openapi(listAssignmentPeerReviewsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId } = context.req.valid('param');
    const peerReviews = await options.dependencies.listAssignmentPeerReviews(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
    );

    return context.json(peerReviews, 200);
  });

  app.openapi(listSubmissionAttachmentsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId, submissionId } = context.req.valid('param');
    const attachments = await options.dependencies.listSubmissionAttachments(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
    );

    return context.json(attachments, 200);
  });

  app.openapi(createSubmissionAttachmentRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId, submissionId } = context.req.valid('param');
    const body = context.req.valid('json');
    const attachment = await options.dependencies.createSubmissionAttachment(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      body,
    );

    return context.json(attachment, 201);
  });

  app.openapi(downloadSubmissionAttachmentRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId, submissionId, attachmentId } =
      context.req.valid('param');
    const { file, bytes } = await options.dependencies.downloadSubmissionAttachment(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      attachmentId,
    );

    return new Response(bytes, {
      status: 200,
      headers: {
        'content-type': file.mediaType,
        'content-disposition': `attachment; filename="${file.filename.replaceAll('"', '')}"`,
      },
    });
  });

  app.openapi(listSubmissionCommentsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId, submissionId } = context.req.valid('param');
    const comments = await options.dependencies.listSubmissionComments(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
    );

    return context.json(comments, 200);
  });

  app.openapi(createSubmissionCommentRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId, submissionId } = context.req.valid('param');
    const body = context.req.valid('json');
    const comment = await options.dependencies.createSubmissionComment(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      body,
    );

    return context.json(comment, 201);
  });

  app.openapi(upsertSubmissionGradeRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId, submissionId } = context.req.valid('param');
    const body = context.req.valid('json');
    const grade = await options.dependencies.upsertSubmissionGrade(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      body,
    );

    return context.json(grade, 200);
  });

  app.openapi(batchUpsertSubmissionGradesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId } = context.req.valid('param');
    const body = context.req.valid('json');
    const summary = await options.dependencies.batchUpsertSubmissionGrades(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      body.grades,
    );

    return context.json(summary, 200);
  });

  app.openapi(importSubmissionGradesCsvRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId } = context.req.valid('param');
    const csv = await context.req.text();
    const summary = await options.dependencies.importSubmissionGradesCsv(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      csv,
    );

    return context.json(summary, 200);
  });

  app.openapi(listGradebookCategoriesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const categories = await options.dependencies.listGradebookCategories(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(categories, 200);
  });

  app.openapi(createGradebookCategoryRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const category = await options.dependencies.createGradebookCategory(
      actorUserId,
      tenantId,
      courseId,
      body,
    );
    return context.json(category, 201);
  });

  app.openapi(updateGradebookCategoryRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, gradebookCategoryId } = context.req.valid('param');
    const body = context.req.valid('json');
    const category = await options.dependencies.updateGradebookCategory(
      actorUserId,
      tenantId,
      courseId,
      gradebookCategoryId,
      body,
    );

    return context.json(category, 200);
  });

  app.openapi(deleteGradebookCategoryRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, gradebookCategoryId } = context.req.valid('param');
    await options.dependencies.deleteGradebookCategory(
      actorUserId,
      tenantId,
      courseId,
      gradebookCategoryId,
    );

    return context.body(null, 204);
  });

  app.openapi(listCourseGradingSchemesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const schemes = await options.dependencies.listCourseGradingSchemes(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(schemes, 200);
  });

  app.openapi(createCourseGradingSchemeRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const scheme = await options.dependencies.createCourseGradingScheme(
      actorUserId,
      tenantId,
      courseId,
      body,
    );
    return context.json(scheme, 201);
  });

  app.openapi(listGradebookEntriesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const gradebookEntries = await options.dependencies.listGradebookEntries(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(gradebookEntries, 200);
  });

  app.openapi(listCourseFinalGradesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const grades = await options.dependencies.listCourseFinalGrades(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(grades, 200);
  });

  app.openapi(exportCourseFinalGradesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const csv = await options.dependencies.exportCourseFinalGradesCsv(
      actorUserId,
      tenantId,
      courseId,
    );

    return new Response(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="final-grades-${courseId}.csv"`,
      },
    });
  });

  app.openapi(submitCourseFinalGradesToSisRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const submission = await options.dependencies.submitCourseFinalGradesToSis(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(submission, 201);
  });

  app.openapi(listSubmissionGradeHistoryRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId, submissionId } = context.req.valid('param');
    const history = await options.dependencies.listSubmissionGradeHistory(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
    );

    return context.json(history, 200);
  });

  app.openapi(createGradeAppealRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId, submissionId } = context.req.valid('param');
    const body = context.req.valid('json');
    const appeal = await options.dependencies.createGradeAppeal(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      body,
    );

    return context.json(appeal, 201);
  });

  app.openapi(listGradeAppealsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const appeals = await options.dependencies.listGradeAppeals(actorUserId, tenantId, courseId);

    return context.json(appeals, 200);
  });

  app.openapi(updateGradeAppealRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, gradeAppealId } = context.req.valid('param');
    const body = context.req.valid('json');
    const appeal = await options.dependencies.updateGradeAppeal(
      actorUserId,
      tenantId,
      courseId,
      gradeAppealId,
      body,
    );

    return context.json(appeal, 200);
  });

  app.openapi(listDiscussionGradebookEntriesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const entries = await options.dependencies.listDiscussionGradebookEntries(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(entries, 200);
  });

  app.openapi(exportDiscussionGradebookRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const csv = await options.dependencies.exportDiscussionGradebookCsv(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.body(csv, 200, {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="discussion-gradebook-${courseId}.csv"`,
    });
  });

  app.openapi(exportGradebookRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const csv = await options.dependencies.exportGradebookCsv(actorUserId, tenantId, courseId);

    return new Response(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="gradebook-${courseId}.csv"`,
      },
    });
  });

  app.openapi(listGradebookManualItemsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const items = await options.dependencies.listGradebookManualItems(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(items, 200);
  });

  app.openapi(createGradebookManualItemRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const item = await options.dependencies.createGradebookManualItem(
      actorUserId,
      tenantId,
      courseId,
      body,
    );
    return context.json(item, 201);
  });

  app.openapi(updateGradebookManualItemRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, manualItemId } = context.req.valid('param');
    const body = context.req.valid('json');
    const item = await options.dependencies.updateGradebookManualItem(
      actorUserId,
      tenantId,
      courseId,
      manualItemId,
      body,
    );

    return context.json(item, 200);
  });

  app.openapi(deleteGradebookManualItemRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, manualItemId } = context.req.valid('param');
    await options.dependencies.deleteGradebookManualItem(
      actorUserId,
      tenantId,
      courseId,
      manualItemId,
    );

    return context.body(null, 204);
  });

  app.openapi(listGradebookManualGradesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, manualItemId } = context.req.valid('param');
    const grades = await options.dependencies.listGradebookManualGrades(
      actorUserId,
      tenantId,
      courseId,
      manualItemId,
    );

    return context.json(grades, 200);
  });

  app.openapi(saveGradebookManualGradeRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, manualItemId, studentId } = context.req.valid('param');
    const body = context.req.valid('json');
    const grade = await options.dependencies.saveGradebookManualGrade(
      actorUserId,
      tenantId,
      courseId,
      manualItemId,
      studentId,
      body,
    );

    return context.json(grade, 200);
  });

  app.openapi(listCourseModulesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const modules = await options.dependencies.listCourseModules(actorUserId, tenantId, courseId);

    return context.json(modules, 200);
  });

  app.openapi(createCourseModuleRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const courseModule = await options.dependencies.createCourseModule(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(courseModule, 201);
  });

  app.openapi(updateCourseModuleRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, courseModuleId } = context.req.valid('param');
    const body = context.req.valid('json');
    const courseModule = await options.dependencies.updateCourseModule(
      actorUserId,
      tenantId,
      courseId,
      courseModuleId,
      body,
    );

    return context.json(courseModule, 200);
  });

  app.openapi(deleteCourseModuleRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, courseModuleId } = context.req.valid('param');
    await options.dependencies.deleteCourseModule(actorUserId, tenantId, courseId, courseModuleId);

    return context.body(null, 204);
  });

  app.openapi(listCourseUnitsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const { moduleId } = context.req.valid('query');
    const units = await options.dependencies.listCourseUnits(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
    );

    return context.json(units, 200);
  });

  app.openapi(createCourseUnitRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const courseUnit = await options.dependencies.createCourseUnit(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(courseUnit, 201);
  });

  app.openapi(updateCourseUnitRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, courseUnitId } = context.req.valid('param');
    const body = context.req.valid('json');
    const courseUnit = await options.dependencies.updateCourseUnit(
      actorUserId,
      tenantId,
      courseId,
      courseUnitId,
      body,
    );

    return context.json(courseUnit, 200);
  });

  app.openapi(deleteCourseUnitRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, courseUnitId } = context.req.valid('param');
    await options.dependencies.deleteCourseUnit(actorUserId, tenantId, courseId, courseUnitId);

    return context.body(null, 204);
  });

  app.openapi(listCourseResourcesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const { moduleId, unitId } = context.req.valid('query');
    const resources = await options.dependencies.listCourseResources(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
      unitId,
    );

    return context.json(resources, 200);
  });

  app.openapi(createCourseResourceRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const courseResource = await options.dependencies.createCourseResource(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(courseResource, 201);
  });

  app.openapi(updateCourseResourceRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, courseResourceId } = context.req.valid('param');
    const body = context.req.valid('json');
    const courseResource = await options.dependencies.updateCourseResource(
      actorUserId,
      tenantId,
      courseId,
      courseResourceId,
      body,
    );

    return context.json(courseResource, 200);
  });

  app.openapi(deleteCourseResourceRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, courseResourceId } = context.req.valid('param');
    await options.dependencies.deleteCourseResource(
      actorUserId,
      tenantId,
      courseId,
      courseResourceId,
    );

    return context.body(null, 204);
  });

  app.openapi(listLearningObjectivesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const learningObjectives = await options.dependencies.listLearningObjectives(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(learningObjectives, 200);
  });

  app.openapi(createLearningObjectiveRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const learningObjective = await options.dependencies.createLearningObjective(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(learningObjective, 201);
  });

  app.openapi(updateLearningObjectiveRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, learningObjectiveId } = context.req.valid('param');
    const body = context.req.valid('json');
    const learningObjective = await options.dependencies.updateLearningObjective(
      actorUserId,
      tenantId,
      courseId,
      learningObjectiveId,
      body,
    );

    return context.json(learningObjective, 200);
  });

  app.openapi(deleteLearningObjectiveRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, learningObjectiveId } = context.req.valid('param');
    await options.dependencies.deleteLearningObjective(
      actorUserId,
      tenantId,
      courseId,
      learningObjectiveId,
    );

    return context.body(null, 204);
  });

  app.openapi(getLearningObjectiveCoverageRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, learningObjectiveId } = context.req.valid('param');
    const coverage = await options.dependencies.getLearningObjectiveCoverage(
      actorUserId,
      tenantId,
      courseId,
      learningObjectiveId,
    );

    return context.json(coverage, 200);
  });

  app.openapi(listLearningObjectiveMasteryRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const mastery = await options.dependencies.listLearningObjectiveMastery(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(mastery, 200);
  });

  app.openapi(getCourseSyllabusRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const syllabus = await options.dependencies.getCourseSyllabus(actorUserId, tenantId, courseId);

    return context.json(syllabus, 200);
  });

  app.openapi(upsertCourseSyllabusRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const syllabus = await options.dependencies.upsertCourseSyllabus(
      actorUserId,
      tenantId,
      courseId,
      body,
    );
    return context.json(syllabus, 200);
  });

  app.openapi(listCoursePagesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const pages = await options.dependencies.listCoursePages(actorUserId, tenantId, courseId);

    return context.json(pages, 200);
  });

  app.openapi(createCoursePageRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const page = await options.dependencies.createCoursePage(actorUserId, tenantId, courseId, body);

    return context.json(page, 201);
  });

  app.openapi(updateCoursePageRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, pageId } = context.req.valid('param');
    const body = context.req.valid('json');
    const page = await options.dependencies.updateCoursePage(
      actorUserId,
      tenantId,
      courseId,
      pageId,
      body,
    );

    return context.json(page, 200);
  });

  app.openapi(deleteCoursePageRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, pageId } = context.req.valid('param');
    await options.dependencies.deleteCoursePage(actorUserId, tenantId, courseId, pageId);

    return context.body(null, 204);
  });

  app.openapi(getCoursePageRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, pageId } = context.req.valid('param');
    const page = await options.dependencies.getCoursePage(actorUserId, tenantId, courseId, pageId);

    return context.json(page, 200);
  });

  app.openapi(listCourseExternalToolsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const tools = await options.dependencies.listCourseExternalTools(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(tools, 200);
  });

  app.openapi(createCourseExternalToolRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const tool = await options.dependencies.createCourseExternalTool(
      actorUserId,
      tenantId,
      courseId,
      body,
    );
    return context.json(tool, 201);
  });

  app.openapi(launchCourseExternalToolLti1p3Route, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, toolId } = context.req.valid('param');
    const launch = await options.dependencies.launchCourseExternalToolLti1p3(
      actorUserId,
      tenantId,
      courseId,
      toolId,
    );

    return context.json(launch, 200);
  });

  app.openapi(launchCourseExternalToolLti1p3DeepLinkingRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, toolId } = context.req.valid('param');
    const launch = await options.dependencies.launchCourseExternalToolLti1p3DeepLinking(
      actorUserId,
      tenantId,
      courseId,
      toolId,
    );

    return context.json(launch, 200);
  });

  app.openapi(createCourseExternalToolLti1p3LaunchAuthorizationResponseRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, toolId } = context.req.valid('param');
    const body = context.req.valid('json');
    const launch =
      await options.dependencies.createCourseExternalToolLti1p3LaunchAuthorizationResponse(
        actorUserId,
        tenantId,
        courseId,
        toolId,
        body,
      );

    return context.json(launch, 200);
  });

  app.openapi(updateCourseExternalToolRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, toolId } = context.req.valid('param');
    const body = context.req.valid('json');
    const tool = await options.dependencies.updateCourseExternalTool(
      actorUserId,
      tenantId,
      courseId,
      toolId,
      body,
    );

    return context.json(tool, 200);
  });

  app.openapi(deleteCourseExternalToolRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, toolId } = context.req.valid('param');
    await options.dependencies.deleteCourseExternalTool(actorUserId, tenantId, courseId, toolId);

    return context.body(null, 204);
  });

  app.openapi(listDiscussionTopicsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const { moduleId, unitId } = context.req.valid('query');
    const topics = await options.dependencies.listDiscussionTopics(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
      unitId,
    );

    return context.json(topics, 200);
  });

  app.openapi(createDiscussionTopicRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const topic = await options.dependencies.createDiscussionTopic(
      actorUserId,
      tenantId,
      courseId,
      {
        moduleId: body.moduleId ?? null,
        unitId: body.unitId ?? null,
        title: body.title,
        prompt: body.prompt ?? null,
        visibility: body.visibility,
        position: body.position,
      },
    );

    return context.json(topic, 201);
  });

  app.openapi(updateDiscussionTopicRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, topicId } = context.req.valid('param');
    const body = context.req.valid('json');
    const topic = await options.dependencies.updateDiscussionTopic(
      actorUserId,
      tenantId,
      courseId,
      topicId,
      {
        moduleId: body.moduleId ?? null,
        unitId: body.unitId ?? null,
        title: body.title,
        prompt: body.prompt ?? null,
        visibility: body.visibility,
        position: body.position,
      },
    );

    return context.json(topic, 200);
  });

  app.openapi(deleteDiscussionTopicRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, topicId } = context.req.valid('param');
    await options.dependencies.deleteDiscussionTopic(actorUserId, tenantId, courseId, topicId);

    return context.body(null, 204);
  });

  app.openapi(subscribeDiscussionTopicRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, topicId } = context.req.valid('param');
    const subscription = await options.dependencies.subscribeToDiscussionTopic(
      actorUserId,
      tenantId,
      courseId,
      topicId,
    );

    return context.json(subscription, 200);
  });

  app.openapi(unsubscribeDiscussionTopicRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, topicId } = context.req.valid('param');
    await options.dependencies.unsubscribeFromDiscussionTopic(
      actorUserId,
      tenantId,
      courseId,
      topicId,
    );

    return context.body(null, 204);
  });

  app.openapi(listDiscussionPostsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, topicId } = context.req.valid('param');
    const posts = await options.dependencies.listDiscussionPosts(
      actorUserId,
      tenantId,
      courseId,
      topicId,
    );

    return context.json(posts, 200);
  });

  app.openapi(createDiscussionPostRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, topicId } = context.req.valid('param');
    const body = context.req.valid('json');
    const post = await options.dependencies.createDiscussionPost(
      actorUserId,
      tenantId,
      courseId,
      topicId,
      {
        body: body.body,
        parentPostId: body.parentPostId ?? null,
        status: body.status,
      },
    );

    return context.json(post, 201);
  });

  app.openapi(updateDiscussionPostRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, topicId, postId } = context.req.valid('param');
    const body = context.req.valid('json');
    const post = await options.dependencies.updateDiscussionPost(
      actorUserId,
      tenantId,
      courseId,
      topicId,
      postId,
      { body: body.body, status: body.status },
    );

    return context.json(post, 200);
  });

  app.openapi(deleteDiscussionPostRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, topicId, postId } = context.req.valid('param');
    await options.dependencies.deleteDiscussionPost(
      actorUserId,
      tenantId,
      courseId,
      topicId,
      postId,
    );

    return context.body(null, 204);
  });

  app.openapi(listDiscussionPostGradesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, topicId } = context.req.valid('param');
    const { studentId } = context.req.valid('query');
    const grades = await options.dependencies.listDiscussionPostGrades(
      actorUserId,
      tenantId,
      courseId,
      topicId,
      studentId,
    );

    return context.json(grades, 200);
  });

  app.openapi(upsertDiscussionPostGradeRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, topicId, postId } = context.req.valid('param');
    const body = context.req.valid('json');
    const grade = await options.dependencies.upsertDiscussionPostGrade(
      actorUserId,
      tenantId,
      courseId,
      topicId,
      postId,
      body,
    );

    return context.json(grade, 200);
  });

  app.openapi(listGlossaryEntriesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const entries = await options.dependencies.listGlossaryEntries(actorUserId, tenantId, courseId);

    return context.json(entries, 200);
  });

  app.openapi(createGlossaryEntryRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const entry = await options.dependencies.createGlossaryEntry(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(entry, 201);
  });

  app.openapi(updateGlossaryEntryRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, glossaryEntryId } = context.req.valid('param');
    const body = context.req.valid('json');
    const entry = await options.dependencies.updateGlossaryEntry(
      actorUserId,
      tenantId,
      courseId,
      glossaryEntryId,
      body,
    );

    return context.json(entry, 200);
  });

  app.openapi(deleteGlossaryEntryRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, glossaryEntryId } = context.req.valid('param');
    await options.dependencies.deleteGlossaryEntry(
      actorUserId,
      tenantId,
      courseId,
      glossaryEntryId,
    );

    return context.body(null, 204);
  });

  app.openapi(listWikiPagesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const pages = await options.dependencies.listWikiPages(actorUserId, tenantId, courseId);

    return context.json(pages, 200);
  });

  app.openapi(createWikiPageRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const page = await options.dependencies.createWikiPage(actorUserId, tenantId, courseId, body);

    return context.json(page, 201);
  });

  app.openapi(updateWikiPageRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, wikiPageId } = context.req.valid('param');
    const body = context.req.valid('json');
    const page = await options.dependencies.updateWikiPage(
      actorUserId,
      tenantId,
      courseId,
      wikiPageId,
      body,
    );

    return context.json(page, 200);
  });

  app.openapi(listWikiPageRevisionsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, wikiPageId } = context.req.valid('param');
    const revisions = await options.dependencies.listWikiPageRevisions(
      actorUserId,
      tenantId,
      courseId,
      wikiPageId,
    );

    return context.json(revisions, 200);
  });

  app.openapi(diffWikiPageRevisionsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, wikiPageId, baseRevision, targetRevision } =
      context.req.valid('param');
    const diff = await options.dependencies.getWikiPageRevisionDiff(
      actorUserId,
      tenantId,
      courseId,
      wikiPageId,
      baseRevision,
      targetRevision,
    );

    return context.json(diff, 200);
  });

  app.openapi(restoreWikiPageRevisionRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, wikiPageId, revision } = context.req.valid('param');
    const body = context.req.valid('json');
    const page = await options.dependencies.restoreWikiPageRevision(
      actorUserId,
      tenantId,
      courseId,
      wikiPageId,
      revision,
      body,
    );

    return context.json(page, 200);
  });

  app.openapi(deleteWikiPageRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, wikiPageId } = context.req.valid('param');
    await options.dependencies.deleteWikiPage(actorUserId, tenantId, courseId, wikiPageId);

    return context.body(null, 204);
  });

  app.openapi(listSurveysRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const surveys = await options.dependencies.listSurveys(actorUserId, tenantId, courseId);

    return context.json(surveys, 200);
  });

  app.openapi(createSurveyRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const survey = await options.dependencies.createSurvey(actorUserId, tenantId, courseId, body);

    return context.json(survey, 201);
  });

  app.openapi(updateSurveyRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, surveyId } = context.req.valid('param');
    const body = context.req.valid('json');
    const survey = await options.dependencies.updateSurvey(
      actorUserId,
      tenantId,
      courseId,
      surveyId,
      body,
    );

    return context.json(survey, 200);
  });

  app.openapi(deleteSurveyRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, surveyId } = context.req.valid('param');
    await options.dependencies.deleteSurvey(actorUserId, tenantId, courseId, surveyId);

    return context.body(null, 204);
  });

  app.openapi(listSurveyQuestionsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, surveyId } = context.req.valid('param');
    const questions = await options.dependencies.listSurveyQuestions(
      actorUserId,
      tenantId,
      courseId,
      surveyId,
    );

    return context.json(questions, 200);
  });

  app.openapi(createSurveyQuestionRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, surveyId } = context.req.valid('param');
    const body = context.req.valid('json');
    const question = await options.dependencies.createSurveyQuestion(
      actorUserId,
      tenantId,
      courseId,
      surveyId,
      body,
    );

    return context.json(question, 201);
  });

  app.openapi(listSurveyResponsesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, surveyId } = context.req.valid('param');
    const responses = await options.dependencies.listSurveyResponses(
      actorUserId,
      tenantId,
      courseId,
      surveyId,
    );

    return context.json(responses, 200);
  });

  app.openapi(submitSurveyResponseRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, surveyId } = context.req.valid('param');
    const body = context.req.valid('json');
    const response = await options.dependencies.submitSurveyResponse(
      actorUserId,
      tenantId,
      courseId,
      surveyId,
      body,
    );

    return context.json(response, 201);
  });

  app.openapi(listCourseCalendarEventsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const events = await options.dependencies.listCourseCalendarEvents(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(events, 200);
  });

  app.openapi(listCourseCalendarEventOccurrencesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const { windowStart, windowEnd } = context.req.valid('query');
    const occurrences = await options.dependencies.listCourseCalendarEventOccurrences(
      actorUserId,
      tenantId,
      courseId,
      { windowStart, windowEnd },
    );

    return context.json(occurrences, 200);
  });

  app.openapi(createCourseCalendarEventRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const event = await options.dependencies.createCourseCalendarEvent(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(event, 201);
  });

  app.openapi(updateCourseCalendarEventRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, eventId } = context.req.valid('param');
    const body = context.req.valid('json');
    const event = await options.dependencies.updateCourseCalendarEvent(
      actorUserId,
      tenantId,
      courseId,
      eventId,
      body,
    );

    return context.json(event, 200);
  });

  app.openapi(deleteCourseCalendarEventRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, eventId } = context.req.valid('param');
    await options.dependencies.deleteCourseCalendarEvent(actorUserId, tenantId, courseId, eventId);

    return context.body(null, 204);
  });

  app.openapi(listCourseMeetingsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const meetings = await options.dependencies.listCourseMeetings(actorUserId, tenantId, courseId);

    return context.json(meetings, 200);
  });

  app.openapi(createCourseMeetingRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const meeting = await options.dependencies.createCourseMeeting(
      actorUserId,
      tenantId,
      courseId,
      body,
    );

    return context.json(meeting, 201);
  });

  app.openapi(updateCourseMeetingRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, meetingId } = context.req.valid('param');
    const body = context.req.valid('json');
    const meeting = await options.dependencies.updateCourseMeeting(
      actorUserId,
      tenantId,
      courseId,
      meetingId,
      body,
    );

    return context.json(meeting, 200);
  });

  app.openapi(deleteCourseMeetingRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, meetingId } = context.req.valid('param');
    await options.dependencies.deleteCourseMeeting(actorUserId, tenantId, courseId, meetingId);

    return context.body(null, 204);
  });

  app.openapi(listCalendarItemsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const { from, to } = context.req.valid('query');
    const calendarItems = await options.dependencies.listCalendarItems(
      actorUserId,
      tenantId,
      new Date(from),
      new Date(to),
    );

    return context.json(calendarItems, 200);
  });

  app.openapi(exportCalendarIcsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const { from, to } = context.req.valid('query');
    const ics = await options.dependencies.exportCalendarIcs(
      actorUserId,
      tenantId,
      new Date(from),
      new Date(to),
    );

    return new Response(ics, {
      status: 200,
      headers: {
        'content-type': 'text/calendar; charset=utf-8',
        'content-disposition': `attachment; filename="calendar-${tenantId}.ics"`,
      },
    });
  });

  app.openapi(listNotificationsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const notifications = await options.dependencies.listNotifications(actorUserId, tenantId);

    return context.json(notifications, 200);
  });

  app.openapi(listNotificationPreferencesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const preferences = await options.dependencies.listNotificationPreferences(
      actorUserId,
      tenantId,
    );

    return context.json(preferences, 200);
  });

  app.openapi(upsertNotificationPreferenceRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const body = context.req.valid('json');
    const preference = await options.dependencies.upsertNotificationPreference(
      actorUserId,
      tenantId,
      body,
    );

    return context.json(preference, 200);
  });

  app.openapi(markNotificationReadRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, notificationId } = context.req.valid('param');
    const notification = await options.dependencies.markNotificationRead(
      actorUserId,
      tenantId,
      notificationId,
    );

    return context.json(notification, 200);
  });

  app.openapi(listMyPushTokensRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const tokens = await options.dependencies.listMyPushTokens(actorUserId, tenantId);

    return context.json(tokens, 200);
  });

  app.openapi(registerMyPushTokenRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const body = context.req.valid('json');
    const token = await options.dependencies.registerMyPushToken(actorUserId, tenantId, {
      platform: body.platform,
      token: body.token,
      locale: body.locale,
      appVersion: body.appVersion,
    });

    return context.json(token, 200);
  });

  app.openapi(revokeMyPushTokenRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, tokenId } = context.req.valid('param');
    await options.dependencies.revokeMyPushToken(actorUserId, tenantId, tokenId);

    return context.body(null, 204);
  });

  app.openapi(listFilesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const { courseId } = context.req.valid('query');
    const files = await options.dependencies.listFiles(actorUserId, tenantId, courseId);

    return context.json(files.map(toFileMetadataResponse), 200);
  });

  app.openapi(uploadFileRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId } = context.req.valid('param');
    const input = context.req.valid('json');
    const file = await options.dependencies.uploadFile(actorUserId, tenantId, input);

    return context.json(toFileMetadataResponse(file), 201);
  });

  app.openapi(getFileRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, fileId } = context.req.valid('param');
    const file = await options.dependencies.getFile(actorUserId, tenantId, fileId);

    return context.json(toFileMetadataResponse(file), 200);
  });

  app.openapi(downloadFileRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, fileId } = context.req.valid('param');
    const { file, bytes } = await options.dependencies.downloadFile(actorUserId, tenantId, fileId);

    return new Response(bytes, {
      status: 200,
      headers: {
        'content-type': file.mediaType,
        'content-disposition': `attachment; filename="${file.filename.replaceAll('"', '')}"`,
      },
    });
  });

  app.openapi(deleteFileRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, fileId } = context.req.valid('param');
    await options.dependencies.deleteFile(actorUserId, tenantId, fileId);

    return context.body(null, 204);
  });

  app.openapi(listModuleReleaseRulesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, moduleId } = context.req.valid('param');
    const { targetType, targetId } = context.req.valid('query');
    const rules = await options.dependencies.listModuleReleaseRules(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
      targetType,
      targetId,
    );

    return context.json(rules, 200);
  });

  app.openapi(createModuleReleaseRuleRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, moduleId } = context.req.valid('param');
    const body = context.req.valid('json');
    const rule = await options.dependencies.createModuleReleaseRule(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
      body,
    );

    return context.json(rule, 201);
  });

  app.openapi(updateModuleReleaseRuleRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, moduleId, ruleId } = context.req.valid('param');
    const body = context.req.valid('json');
    const rule = await options.dependencies.updateModuleReleaseRule(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
      ruleId,
      body,
    );

    return context.json(rule, 200);
  });

  app.openapi(deleteModuleReleaseRuleRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, moduleId, ruleId } = context.req.valid('param');
    await options.dependencies.deleteModuleReleaseRule(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
      ruleId,
    );

    return context.body(null, 204);
  });

  app.openapi(upsertModuleReleasePolicyRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, moduleId } = context.req.valid('param');
    const body = context.req.valid('json');
    const policy = await options.dependencies.upsertModuleReleasePolicy(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
      body.combinator,
    );

    return context.json(policy, 200);
  });

  app.openapi(getModuleReleasePolicyRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, moduleId } = context.req.valid('param');
    const policy = await options.dependencies.getModuleReleasePolicy(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
    );

    return context.json(policy, 200);
  });

  app.openapi(listModuleReleaseOverridesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, moduleId } = context.req.valid('param');
    const overrides = await options.dependencies.listModuleReleaseOverrides(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
    );

    return context.json(overrides, 200);
  });

  app.openapi(upsertModuleReleaseOverrideRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, moduleId, studentId } = context.req.valid('param');
    const body = context.req.valid('json');
    const override = await options.dependencies.upsertModuleReleaseOverride(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
      studentId,
      body,
    );

    return context.json(override, 200);
  });

  app.openapi(removeModuleReleaseOverrideRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, moduleId, studentId } = context.req.valid('param');
    await options.dependencies.removeModuleReleaseOverride(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
      studentId,
    );

    return context.body(null, 204);
  });

  app.openapi(getMyModuleReleaseStatusRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const decisions = await options.dependencies.getMyModuleReleaseStatus(
      actorUserId,
      tenantId,
      courseId,
    );

    return context.json(decisions, 200);
  });

  app.openapi(getStudentModuleReleaseStatusRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, studentId } = context.req.valid('param');
    const decisions = await options.dependencies.getStudentModuleReleaseStatus(
      actorUserId,
      tenantId,
      courseId,
      studentId,
    );

    return context.json(decisions, 200);
  });

  app.openapi(recordResourceViewRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, resourceId } = context.req.valid('param');
    const event = await options.dependencies.recordResourceView(
      actorUserId,
      tenantId,
      courseId,
      resourceId,
    );
    return context.json(event, 201);
  });

  app.openapi(listResourceViewsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, resourceId } = context.req.valid('param');
    const events = await options.dependencies.listResourceViews(
      actorUserId,
      tenantId,
      courseId,
      resourceId,
    );
    return context.json(events, 200);
  });

  app.openapi(listScormPackagesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const packages = await options.dependencies.listScormPackages(actorUserId, tenantId, courseId);
    return context.json(packages, 200);
  });

  app.openapi(createScormPackageRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId } = context.req.valid('param');
    const body = context.req.valid('json');
    const created = await options.dependencies.createScormPackage(
      actorUserId,
      tenantId,
      courseId,
      body,
    );
    return context.json(created, 201);
  });

  app.openapi(upsertScormAttemptRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, scormPackageId } = context.req.valid('param');
    const body = context.req.valid('json');
    const attempt = await options.dependencies.upsertScormAttempt(
      actorUserId,
      tenantId,
      courseId,
      scormPackageId,
      body,
    );
    return context.json(attempt, 200);
  });

  app.openapi(getScormRuntimeBridgeScriptRoute, (context) => {
    const { tenantId, courseId, scormPackageId } = context.req.valid('param');
    const runtimeBaseUrl = `/api/v1/tenants/${tenantId}/courses/${courseId}/scorm-packages/${scormPackageId}/runtime`;
    const script = buildScormRuntimeBridgeScript({
      initializeUrl: `${runtimeBaseUrl}/initialize`,
      commitUrl: `${runtimeBaseUrl}/commit`,
      finishUrl: `${runtimeBaseUrl}/finish`,
    });

    return context.body(script, 200, {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store',
    });
  });

  app.openapi(initializeScormRuntimeRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, scormPackageId } = context.req.valid('param');
    const state = await options.dependencies.initializeScormRuntime(
      actorUserId,
      tenantId,
      courseId,
      scormPackageId,
    );
    return context.json(state, 200);
  });

  app.openapi(commitScormRuntimeRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, scormPackageId } = context.req.valid('param');
    const body = context.req.valid('json');
    const state = await options.dependencies.commitScormRuntime(
      actorUserId,
      tenantId,
      courseId,
      scormPackageId,
      body,
    );
    return context.json(state, 200);
  });

  app.openapi(finishScormRuntimeRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, scormPackageId } = context.req.valid('param');
    const body = context.req.valid('json');
    const state = await options.dependencies.finishScormRuntime(
      actorUserId,
      tenantId,
      courseId,
      scormPackageId,
      body,
    );
    return context.json(state, 200);
  });

  app.openapi(listPeerReviewResponsesRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId, peerReviewId } = context.req.valid('param');
    const responses = await options.dependencies.listPeerReviewResponses(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      peerReviewId,
    );
    return context.json(responses, 200);
  });

  app.openapi(upsertPeerReviewResponseRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, assignmentId, peerReviewId, criterionId } =
      context.req.valid('param');
    const body = context.req.valid('json');
    const stored = await options.dependencies.upsertPeerReviewResponse(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      peerReviewId,
      criterionId,
      body,
    );
    return context.json(stored, 200);
  });

  app.openapi(listSectionMembersRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, sectionId } = context.req.valid('param');
    const members = await options.dependencies.listSectionMembers(
      actorUserId,
      tenantId,
      courseId,
      sectionId,
    );
    return context.json(members, 200);
  });

  app.openapi(assignSectionMemberRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, sectionId } = context.req.valid('param');
    const { studentId } = context.req.valid('json');
    const assigned = await options.dependencies.assignSectionMember(
      actorUserId,
      tenantId,
      courseId,
      sectionId,
      studentId,
    );
    return context.json(assigned, 201);
  });

  app.openapi(removeSectionMemberRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, sectionId, studentId } = context.req.valid('param');
    await options.dependencies.removeSectionMember(
      actorUserId,
      tenantId,
      courseId,
      sectionId,
      studentId,
    );
    return context.body(null, 204);
  });

  app.openapi(listSectionInstructorsRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, sectionId } = context.req.valid('param');
    const instructors = await options.dependencies.listSectionInstructors(
      actorUserId,
      tenantId,
      courseId,
      sectionId,
    );
    return context.json(instructors, 200);
  });

  app.openapi(assignSectionInstructorRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, sectionId } = context.req.valid('param');
    const { instructorId } = context.req.valid('json');
    const assigned = await options.dependencies.assignSectionInstructor(
      actorUserId,
      tenantId,
      courseId,
      sectionId,
      instructorId,
    );
    return context.json(assigned, 201);
  });

  app.openapi(removeSectionInstructorRoute, async (context) => {
    const actorUserId = await requireAuthenticatedUser(
      options.dependencies,
      context.req.header('authorization'),
    );
    const { tenantId, courseId, sectionId, instructorId } = context.req.valid('param');
    await options.dependencies.removeSectionInstructor(
      actorUserId,
      tenantId,
      courseId,
      sectionId,
      instructorId,
    );
    return context.body(null, 204);
  });

  app.get('/api/v1/openapi.json', (context) => {
    const document = app.getOpenAPIDocument(openApiDocumentBase);

    applyBearerAuthSecurityScheme(document as OpenApiDocumentWithSchemas);
    applyDateTimeFormats(document as OpenApiDocumentWithSchemas);

    return context.json(document, 200);
  });

  app.onError((error, context) => {
    const status = statusCodeForError(error);
    return context.json(errorResponseBody(error), status);
  });

  return app;
};
